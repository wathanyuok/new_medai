'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import axios from 'axios';
import font from '@/font/font.json';
import fontBold from '@/font/fontBold.json';
import { fetchS3Image } from '@/utils/getS3file';

export default function MultiPDFMergePage(queue_id: any) {
  const [loading, setLoading] = useState(true);
  const [s3Urls, setS3Urls] = useState<string[]>([]);
  const [status, setStatus] = useState('กำลังโหลด...');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [printData, setPrintData] = useState<any>({});
  const [image, setImage] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [autoProcessed, setAutoProcessed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPreview, setShowIOSPreview] = useState(false);

  const isIOSDevice = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  };

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setIsIOS(isIOSDevice());
  }, []);

  useEffect(() => {
    const queueId = parseInt(queue_id.queue_id);
    const fetchQueue = async () => {
      try {
        setStatus('กำลังโหลดข้อมูล...');
        setCurrentStep('กำลังดึงข้อมูลจากฐานข้อมูล...');

        const lab = await GetQueue(queueId);
        setPrintData(lab);
        const s3Array = lab.queue_file.map((file: any) => file.quef_path);
        setS3Urls(s3Array);
        setDataLoaded(true);

        setStatus('กำลังสร้าง PDF...');
        setCurrentStep('');
      } catch (error) {
        console.error('Error fetching queue:', error);
        setStatus('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setCurrentStep('');
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  useEffect(() => {
    const autoProcessPDF = async () => {
      if (dataLoaded && !autoProcessed && printData && Object.keys(printData).length > 0) {
        setAutoProcessed(true);
        await mergePDFs();
      }
    };

    autoProcessPDF();
  }, [dataLoaded, printData, autoProcessed]);

  const GetQueue = async (queue_id: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/queue/check/lab/${queue_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const shop_image = await fetchS3Image('shop/S9d95a914-8929-4738-9693-81e133b8f03b.jpg');
      setImage(shop_image!);
      return res.data.data;
    } catch (error) {
      console.error('Error fetching lab result', error);
      return null;
    }
  };

  const getFileType = (url: string): 'pdf' | 'image' | 'unknown' => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'image';
    return 'unknown';
  };

  const convertImageToPDF = async (imageUrl: string, fileName: string) => {
    const { PDFDocument, rgb } = await import('pdf-lib');
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      const imageBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.create();
      const A4_WIDTH = 595.276, A4_HEIGHT = 841.89, MARGIN = 40;

      let embeddedImage;
      const extension = imageUrl.toLowerCase().split('.').pop();
      try {
        embeddedImage = extension === 'png' ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
      } catch {
        embeddedImage = extension === 'png' ? await pdfDoc.embedJpg(imageBytes) : await pdfDoc.embedPng(imageBytes);
      }
      if (!embeddedImage) throw new Error('Failed to embed image');

      const imgDims = embeddedImage.scale(1);
      const scale = Math.min((A4_WIDTH - MARGIN * 2) / imgDims.width, (A4_HEIGHT - MARGIN * 2 - 30) / imgDims.height, 1);
      const scaledW = imgDims.width * scale, scaledH = imgDims.height * scale;
      const x = (A4_WIDTH - scaledW) / 2, y = (A4_HEIGHT - scaledH) / 2;

      const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      page.drawRectangle({ x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT, color: rgb(1, 1, 1) });
      page.drawImage(embeddedImage, { x, y, width: scaledW, height: scaledH });
      return pdfDoc;
    } catch (error) {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.276, 841.89]);
      page.drawRectangle({ x: 0, y: 0, width: 595.276, height: 841.89, color: rgb(1, 1, 1) });
      page.drawText(`Error: ${fileName}`, { x: 50, y: 400, size: 16, color: rgb(0.8, 0, 0) });
      return doc;
    }
  };

  const createJsPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.addFileToVFS('TH-Niramit-AS-normal.ttf', font.data);
    doc.addFileToVFS('TH-Niramit-AS-Bold-bold.ttf', fontBold.data);
    doc.addFont('TH-Niramit-AS-normal.ttf', 'TH-Niramit', 'normal');
    doc.addFont('TH-Niramit-AS-Bold-bold.ttf', 'TH-Niramit', 'bold');
    doc.setFont('TH-Niramit', 'bold');

    const mappedArray = printData.checks.map((check: any) => ({
      checking_name: check.chk_name,
      specimen_name_en: check.specimen_name_en,
      chk_value: check.chk_type_id == 3 ? check.fetchedImageValue || '-' : check.chk_value || '-',
      chk_direction_detail: check.chk_direction_detail || '-',
      chk_flag: check.chk_flag || '-',
      chk_old: check.chk_old || '-',
      chk_unit: check.chk_unit || '-',
      chk_method: check.chk_method || null,
    }));

    const rows = mappedArray.map((item: any, i: number) => [
      [`${i + 1}.) ${item.checking_name}`],
      [item.specimen_name_en || '-'],
      [item.chk_method || '-'],
      [item.chk_value || '-'],
      [item.chk_flag],
      [item.chk_unit],
      [item.chk_direction_detail],
      [item.chk_old]
    ]);

    const spacer = 6;
    let currentY = 5;

    const birthDate = new Date(printData.customer.ctm_birthdate);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    const age = `${years} ปี ${months} เดือน ${days} วัน`;

    doc.setFontSize(16);
    doc.addImage(String(image), 'JPEG', 10, 5, 23, 23);
    currentY += 8;
    doc.text(printData.shop.shop_name, 40, currentY);
    doc.setFontSize(25);
    doc.text('LABORATORY REPORT', 205, currentY, { align: 'right' });
    currentY += spacer;
    doc.setFontSize(10);
    doc.setFont('TH-Niramit', 'normal');
    doc.text(`${printData.shop.shop_address} แขวง${printData.shop.shop_district} เขต${printData.shop.shop_amphoe} ${printData.shop.shop_province} ${printData.shop.shop_zipcode}`, 40, currentY);
    currentY += spacer;
    doc.text(`${printData.shop.shop_phone}`, 40, currentY);
    currentY += spacer;
    doc.setFont('TH-Niramit', 'bold');
    doc.setFontSize(14);
    doc.text(`Name : ${printData.customer.ctm_prefix == 'ไม่ระบุ' ? '' : printData.customer.ctm_prefix} ${printData.customer.ctm_fname} ${printData.customer.ctm_lname}`, 25, currentY);
    doc.text(`Sex : ${printData.customer.ctm_gender}`, 120, currentY);
    doc.text(`Age : ${age}`, 150, currentY);
    currentY += spacer;
    doc.text(`HN : ${printData.customer.ctm_id}`, 25, currentY);
    doc.text(`Lab No. : ${printData.que_code}`, 75, currentY);
    doc.text(`Request Date. : ${new Date(printData.que_datetime).toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}`, 120, currentY);

    const printFooter = () => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor("#DDDAD0");
      doc.setTextColor("#7A7A73");
      doc.setLineWidth(0.5);
      doc.line(5, pageHeight - 21, doc.internal.pageSize.getWidth() - 5, pageHeight - 21);
      doc.line(5, pageHeight - 9, doc.internal.pageSize.getWidth() - 5, pageHeight - 9);
      doc.setFontSize(10);
      doc.text(`Reported by: ${printData.que_lab_analyst},${printData.que_lab_analyst_license}`, 10, pageHeight - 17);
      doc.text(`Authorized by: ${printData.que_lab_inspector},${printData.que_lab_inspector_license}`, 10, pageHeight - 14);
      doc.text(`This report has been approved electronically. Infomation contained in this document is CONFIDENTIAL. Copyright: Issued by Bangkok Be Health`, 10, pageHeight - 11);
      doc.text(`Print Date and Time: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}`, 120, pageHeight - 14);
    };

    printFooter();
    currentY += spacer;

    autoTable(doc, {
      startY: currentY,
      theme: 'striped',
      margin: { left: 5, right: 5, top: 72, bottom: 35 },
      styles: { font: "TH-Niramit", fontSize: 13, fontStyle: "bold", textColor: "black" },
      headStyles: { fillColor: [255, 255, 255], textColor: "black", fontStyle: "bold", halign: 'center', valign: 'middle', lineWidth: 0 },
      columnStyles: {
        0: { halign: 'left', cellWidth: 25, fontSize: 10, valign: 'middle' },
        1: { halign: 'center', cellWidth: 20, fontSize: 9, valign: 'middle' },
        2: { halign: 'center', cellWidth: 20, fontSize: 10, valign: 'middle' },
        3: { halign: 'center', cellWidth: 15, fontSize: 10, valign: 'middle' },
        4: { halign: 'center', cellWidth: 25, fontSize: 10 },
        5: { halign: 'center', cellWidth: 20, fontSize: 10, valign: 'middle' },
        6: { halign: 'center', cellWidth: 35, fontSize: 10, valign: 'middle' },
        7: { halign: 'center', cellWidth: 40, fontSize: 10, valign: 'middle' },
      },
      head: [['TEST NAME', 'SPECIMEN', 'METHOD', 'RESULT', 'FLAG', 'UNIT', 'REFERENCE RANGE', 'PREVIOUS RESULT']],
      body: rows,
    });

    return doc;
  };

  // ฟังก์ชันกลับหน้าก่อนหน้า (สำหรับ iOS)
  const handleGoBack = () => {
    if (window.opener) {
      window.close();
    } else {
      window.history.back();
    }
  };

  const mergePDFs = async () => {
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const jsPdfDoc = createJsPDF();
      const jsPdfBytes = jsPdfDoc.output('arraybuffer');
      setProgress(10);

      if (s3Urls.length === 0) {
        const pdfBlob = jsPdfDoc.output('blob');
        const url = URL.createObjectURL(pdfBlob);

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);

        if (isMobile) {
          if (isIOS) {
            // iOS: แสดง PDF ในหน้าเดิมพร้อมปุ่ม back
            setShowIOSPreview(true);
            setLoading(false);
            return;
          } else {
            // Android: เปิด tab ใหม่
            window.open(url, '_blank');
            setLoading(false);
            return;
          }
        }

        setShowPreview(true);
        setLoading(false);
        return;
      }

      const mergedPdf = await PDFDocument.create();
      const A4_WIDTH = 595.276, A4_HEIGHT = 841.89;

      const convertPageToA4 = async (sourcePage: any, title: string, pageNumber: number) => {
        const newPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
        newPage.drawRectangle({ x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT, color: rgb(1, 1, 1) });
        try {
          const embeddedPage = await mergedPdf.embedPage(sourcePage);
          const { width: origW, height: origH } = embeddedPage;
          const scale = Math.min(A4_WIDTH / origW, A4_HEIGHT / origH);
          const scaledW = origW * scale, scaledH = origH * scale;
          const x = (A4_WIDTH - scaledW) / 2, y = (A4_HEIGHT - scaledH) / 2;
          newPage.drawPage(embeddedPage, { x, y, width: scaledW, height: scaledH });
        } catch {
          newPage.drawText(`${title} - Page ${pageNumber}`, { x: A4_WIDTH / 2 - 60, y: A4_HEIGHT / 2, size: 14, color: rgb(0, 0, 0) });
        }
      };

      setCurrentStep('กำลังเพิ่มหน้าจาก Lab Report...');
      const jsPdfDocument = await PDFDocument.load(jsPdfBytes);
      for (let i = 0; i < jsPdfDocument.getPageCount(); i++) {
        await convertPageToA4(jsPdfDocument.getPage(i), 'Lab Report', i + 1);
      }
      setProgress(20);

      const progressPerFile = 70 / s3Urls.length;

      for (let urlIndex = 0; urlIndex < s3Urls.length; urlIndex++) {
        const url = s3Urls[urlIndex];
        const fileNumber = urlIndex + 1;
        const fileType = getFileType(url);
        const fileName = url.split('/').pop() || `File${fileNumber}`;

        setCurrentStep(`กำลังประมวลผลไฟล์ที่ ${fileNumber}/${s3Urls.length}...`);

        try {
          if (fileType === 'pdf') {
            const response = await fetch(url);
            if (response.ok) {
              const s3PdfBytes = await response.arrayBuffer();
              const s3PdfDocument = await PDFDocument.load(s3PdfBytes);
              for (let i = 0; i < s3PdfDocument.getPageCount(); i++) {
                await convertPageToA4(s3PdfDocument.getPage(i), `PDF ${fileNumber}`, i + 1);
              }
            }
          } else if (fileType === 'image') {
            const imagePdf = await convertImageToPDF(url, fileName);
            for (let i = 0; i < imagePdf.getPageCount(); i++) {
              await convertPageToA4(imagePdf.getPage(i), `Image ${fileNumber}`, i + 1);
            }
          }
        } catch (error) {
          console.error(`Error processing file ${fileNumber}:`, error);
        }

        setProgress(Math.round(20 + (urlIndex + 1) * progressPerFile));
      }

      setCurrentStep('กำลังสร้างไฟล์ PDF...');
      setProgress(90);

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);

      if (isMobile) {
        if (isIOS) {
          // iOS: แสดง PDF ในหน้าเดิมพร้อมปุ่ม back
          setShowIOSPreview(true);
          setLoading(false);
          return;
        } else {
          // Android: เปิด tab ใหม่
          window.open(url, '_blank');
          setLoading(false);
          return;
        }
      }

      setShowPreview(true);
      setLoading(false);
      setProgress(100);

    } catch (error) {
      console.error('Error merging PDFs:', error);
      setStatus('เกิดข้อผิดพลาด');
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = `Lab-Result-${printData?.customer?.ctm_fname || 'Unknown'}_${printData?.customer?.ctm_lname || 'User'}.pdf`;
      a.click();
    }
  };

  const previewJsPDFOnly = () => {
    const doc = createJsPDF();
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    setShowPreview(true);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{status}</p>
          {currentStep && <p className="text-gray-500 text-sm mt-2">{currentStep}</p>}
          {progress > 0 && (
            <div className="mt-4 w-64 mx-auto">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{progress}%</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // iOS: แสดง PDF เต็มจอพร้อมปุ่มกลับ
  if (isIOS && showIOSPreview && previewUrl) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header พร้อมปุ่มกลับ */}
        <div 
          className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b shadow-sm"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
        >
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium active:bg-blue-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            กลับ
          </button>
          
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium active:bg-green-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ดาวน์โหลด
          </button>
        </div>

        {/* PDF Viewer เต็มจอ */}
        <div className="flex-1 overflow-hidden">
          <object
            data={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            type="application/pdf"
            className="w-full h-full"
          >
            <iframe
              src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          </object>
        </div>
      </div>
    );
  }

  // Desktop: แสดง Preview
  return (
    <div className="container mx-auto p-6 max-w-full">
      {showPreview && previewUrl && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">PDF Preview</h2>
            <div className="flex space-x-2">
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                📥 ดาวน์โหลด PDF
              </button>
              <button
                onClick={previewJsPDFOnly}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                📄 ดู Lab Report เท่านั้น
              </button>
            </div>
          </div>

          <div className="border-2 rounded-lg overflow-hidden">
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit`}
              width="100%"
              className="border-0 h-[800px]"
              title="PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}