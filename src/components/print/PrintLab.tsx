'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import axios from 'axios';
import font from '@/font/font.json';
import fontBold from '@/font/fontBold.json';
import { fetchS3Image } from '@/utils/getS3file';

export default function MultiPDFMergePage(queue_id: any) {
  const [loading, setLoading] = useState(false);
  const [s3Urls, setS3Urls] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [printData, setPrintData] = useState<any>({});
  const [image, setImage] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  // Cleanup URL object เมื่อ component unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    setIsMobile(isMobileDevice());
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

        setStatus('โหลดข้อมูลเสร็จสิ้น');
        setCurrentStep('');
      } catch (error) {
        console.error('Error fetching queue:', error);
        setStatus('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setCurrentStep('');
      }
    };

    fetchQueue();
  }, [queue_id]);

  const GetQueue = async (queue_id: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/queue/check/lab/${queue_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const presignImg = res.data.data.shop.shop_image;
      const parts = presignImg.split('.com/');
      const filename = parts.pop();
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
      const A4_WIDTH = 595.276;
      const A4_HEIGHT = 841.89;
      const MARGIN = 40;

      let embeddedImage: any;
      const extension = imageUrl.toLowerCase().split('.').pop();

      try {
        if (extension === 'png') {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else if (['jpg', 'jpeg'].includes(extension || '')) {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }
      } catch (embedError) {
        if (extension === 'png') {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        }
      }

      const imgDims = embeddedImage.scale(1);
      const imgWidth = imgDims.width;
      const imgHeight = imgDims.height;

      const availableWidth = A4_WIDTH - MARGIN * 2;
      const availableHeight = A4_HEIGHT - MARGIN * 2 - 30;

      const scaleX = availableWidth / imgWidth;
      const scaleY = availableHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY, 1);

      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      const x = (A4_WIDTH - scaledWidth) / 2;
      const y = (A4_HEIGHT - scaledHeight) / 2;

      const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      page.drawRectangle({ x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT, color: rgb(1, 1, 1) });
      page.drawImage(embeddedImage, { x, y, width: scaledWidth, height: scaledHeight });

      page.drawText(`${fileName} (Image converted to PDF)`, {
        x: 10,
        y: A4_HEIGHT - 15,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText(
        `Original: ${Math.round(imgWidth)} x ${Math.round(imgHeight)} | Scale: ${Math.round(scale * 100)}%`,
        { x: 10, y: 15, size: 8, color: rgb(0.5, 0.5, 0.5) }
      );

      return pdfDoc;
    } catch (error: any) {
      console.error(`Error converting image ${fileName}:`, error);
      const { PDFDocument, rgb } = await import('pdf-lib');
      const errorDoc = await PDFDocument.create();
      const page = errorDoc.addPage([595.276, 841.89]);
      page.drawRectangle({ x: 0, y: 0, width: 595.276, height: 841.89, color: rgb(1, 1, 1) });
      page.drawText(`Error converting image: ${fileName}`, {
        x: 50,
        y: 400,
        size: 16,
        color: rgb(0.8, 0, 0),
      });
      return errorDoc;
    }
  };

  const createJsPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.addFileToVFS('TH-Niramit-AS-normal.ttf', font.data);
    doc.addFileToVFS('TH-Niramit-AS-Bold-bold.ttf', fontBold.data);
    doc.addFont('TH-Niramit-AS-normal.ttf', 'TH-Niramit', 'normal');
    doc.addFont('TH-Niramit-AS-Bold-bold.ttf', 'TH-Niramit', 'bold');
    doc.setFont('TH-Niramit', 'bold');

    let mappedArray =
      printData?.checks?.map((check: any) => ({
        id: check.id,
        checking_code: check.chk_code,
        specimen_name_en: check.specimen_name_en,
        checking_name: check.chk_name,
        chk_value: check.chk_type_id == 3 ? check.fetchedImageValue || '-' : check.chk_value || '-',
        chk_direction_detail: check.chk_direction_detail || '-',
        chk_flag: check.chk_flag || '-',
        chk_old: check.chk_old || '-',
        chk_unit: check.chk_unit || '-',
        chk_type_id: check.chk_type_id || null,
        chk_method: check.chk_method || null,
        subs: null,
      })) || [];

    const rows: any[] = [];
    mappedArray.forEach((item: any, index: number) => {
      rows.push([
        [`${index + 1}.) ${item.checking_name}`],
        [item.specimen_name_en || '-'],
        [item.chk_method || '-'],
        [item.chk_value || '-'],
        [item.chk_flag],
        [item.chk_unit],
        [item.chk_direction_detail],
        [item.chk_old],
      ]);
    });

    let currentY = 5;
    const spacer = 6;
    const font_header = 16;
    const font_body = 14;

    const printHeader = (doc: jsPDF, currentY: number) => {
      const birthDate = new Date(printData.customer.ctm_birthdate);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      let months = today.getMonth() - birthDate.getMonth();
      let days = today.getDate() - birthDate.getDate();

      if (days < 0) {
        months--;
        const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        days = previousMonth + days;
      }
      if (months < 0) {
        years--;
        months = 12 + months;
      }
      const age = `${years} ปี ${months} เดือน ${days} วัน`;

      doc.setFontSize(font_header);
      if (image) doc.addImage(String(image), 'JPEG', 10, 5, 23, 23);
      currentY += 8;
      doc.text(printData.shop.shop_name, 40, currentY);
      doc.setFontSize(25);
      doc.text('LABORATORY REPORT', 205, currentY, { align: 'right' });
      currentY += spacer;
      doc.setFontSize(10);
      doc.setFont('TH-Niramit', 'normal');
      doc.text(
        `${printData.shop.shop_address} แขวง${printData.shop.shop_district} เขต${printData.shop.shop_amphoe} ${printData.shop.shop_province} ${printData.shop.shop_zipcode}`,
        40,
        currentY
      );
      currentY += spacer;
      doc.text(`${printData.shop.shop_phone}`, 40, currentY);
      currentY += spacer;
      doc.setFont('TH-Niramit', 'bold');
      doc.setFontSize(font_body);
      doc.text(
        `Name : ${printData.customer.ctm_prefix == 'ไม่ระบุ' ? '' : printData.customer.ctm_prefix} ${printData.customer.ctm_fname} ${printData.customer.ctm_lname}`,
        25,
        currentY
      );
      doc.text(`Sex : ${printData.customer.ctm_gender}`, 120, currentY);
      doc.text(`Age : ${age}`, 150, currentY);
      currentY += spacer;
      doc.text(`HN : ${printData.customer.ctm_id}`, 25, currentY);
      doc.text(`Lab No. : ${printData.que_code}`, 75, currentY);
      doc.text(
        `Request Date. : ${new Date(printData.que_datetime).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`,
        120,
        currentY
      );

      printFooter(doc);
      return currentY;
    };

    const printTable = (doc: jsPDF, currentY: number) => {
      autoTable(doc, {
        startY: currentY,
        theme: 'striped',
        margin: { left: 5, right: 5, top: 72, bottom: 35 },
        styles: {
          font: 'TH-Niramit',
          fontSize: 13,
          fontStyle: 'bold',
          textColor: 'black',
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: 'black',
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          lineWidth: 0,
        },
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
        head: [
          [
            'TEST NAME',
            'SPECIMEN',
            'METHOD',
            'RESULT',
            'FLAG',
            'UNIT',
            'REFERENCE RANGE',
            'PREVIOUS RESULT',
          ],
        ],
        body: rows,
      });
      return currentY;
    };

    const printFooter = (doc: jsPDF) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor('#DDDAD0');
      doc.setTextColor('#7A7A73');
      doc.setLineWidth(0.5);
      doc.line(5, pageHeight - 21, doc.internal.pageSize.getWidth() - 5, pageHeight - 21);
      doc.line(5, pageHeight - 9, doc.internal.pageSize.getWidth() - 5, pageHeight - 9);
      doc.setFontSize(10);
      doc.text(
        `Reported by: ${printData.que_lab_analyst},${printData.que_lab_analyst_license}`,
        10,
        pageHeight - 17
      );
      doc.text(
        `Authorized by: ${printData.que_lab_inspector},${printData.que_lab_inspector_license}`,
        10,
        pageHeight - 14
      );
      doc.text(
        `This report has been approved electronically. Infomation contained in this document is CONFIDENTIAL. Copyright: Issued by Bangkok Be Health`,
        10,
        pageHeight - 11
      );
      doc.text(
        `Print Date and Time: ${new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`,
        120,
        pageHeight - 14
      );
    };

    currentY = printHeader(doc, currentY);
    currentY += spacer;
    currentY = printTable(doc, currentY);
    doc.setFontSize(16);
    return doc;
  };

  // ✅ สร้าง PDF และแสดงใน iframe (ทั้ง mobile และ desktop)
  const viewPDF = async () => {
    console.log('📄 viewPDF called');
    
    if (s3Urls.length === 0) {
      // สร้างเฉพาะ jsPDF
      console.log('Creating jsPDF only...');
      const jsPdfDoc = createJsPDF();
      const pdfBlob = jsPdfDoc.output('blob');
      const url = URL.createObjectURL(pdfBlob);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setShowPreview(true);
      setStatus('✅ แสดง PDF สำเร็จ');
      return;
    }

    // มีไฟล์แนบ - รวม PDF
    const fileTypes = s3Urls.map((url) => ({ url, type: getFileType(url) }));
    const pdfCount = fileTypes.filter((f) => f.type === 'pdf').length;
    const imageCount = fileTypes.filter((f) => f.type === 'image').length;

    setLoading(true);
    setProgress(0);
    setStatus(`กำลังประมวลผล ${s3Urls.length} ไฟล์...`);

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');

      const jsPdfDoc = createJsPDF();
      const jsPdfBytes = jsPdfDoc.output('arraybuffer');
      setProgress(10);

      const mergedPdf = await PDFDocument.create();
      const A4_WIDTH = 595.276;
      const A4_HEIGHT = 841.89;

      const jsPdfDocument = await PDFDocument.load(jsPdfBytes);
      const jsPdfPages = await mergedPdf.copyPages(jsPdfDocument, jsPdfDocument.getPageIndices());
      jsPdfPages.forEach((page) => mergedPdf.addPage(page));
      setProgress(20);

      const progressPerFile = 70 / s3Urls.length;

      for (let urlIndex = 0; urlIndex < s3Urls.length; urlIndex++) {
        const url = s3Urls[urlIndex];
        const fileType = getFileType(url);
        setCurrentStep(`กำลังประมวลผลไฟล์ที่ ${urlIndex + 1}/${s3Urls.length}...`);

        try {
          if (fileType === 'pdf') {
            const response = await fetch(url);
            const s3PdfBytes = await response.arrayBuffer();
            const s3PdfDocument = await PDFDocument.load(s3PdfBytes);
            const pages = await mergedPdf.copyPages(s3PdfDocument, s3PdfDocument.getPageIndices());
            pages.forEach((page) => mergedPdf.addPage(page));
          } else if (fileType === 'image') {
            const imagePdf = await convertImageToPDF(url, `Image${urlIndex + 1}`);
            const pages = await mergedPdf.copyPages(imagePdf, imagePdf.getPageIndices());
            pages.forEach((page) => mergedPdf.addPage(page));
          }
          setProgress(Math.round(20 + (urlIndex + 1) * progressPerFile));
        } catch (error) {
          console.error(`Error processing file ${urlIndex + 1}:`, error);
        }
      }

      setProgress(90);
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setShowPreview(true);
      setProgress(100);
      setStatus(`✅ สร้าง PDF สำเร็จ!`);
    } catch (error: any) {
      console.error('Error:', error);
      setStatus(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  const downloadPDF = () => {
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = `Lab-Result-${printData?.customer?.ctm_fname}_${printData?.customer?.ctm_lname}.pdf`;
      a.click();
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-full">
      {/* ปุ่มดูผลตรวจ */}
      {dataLoaded && !showPreview && !loading && (
        <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">ผลตรวจพร้อมแล้ว</h2>
            <p className="text-gray-600 mb-6">
              ชื่อ: {printData?.customer?.ctm_fname} {printData?.customer?.ctm_lname}
              <br />
              Lab No: {printData?.que_code}
            </p>
            <button
              onClick={viewPDF}
              className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-lg"
            >
              <span className="inline-block mr-2">📄</span>
              ดูผลตรวจ
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
          <div className="text-center">
            <div className="text-lg text-gray-800 mb-4">
              <span className="inline-block mr-2">⏳</span>
              {status}
            </div>
            {progress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2 max-w-md mx-auto">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {currentStep && <div className="text-xs text-gray-500 mt-2">{currentStep}</div>}
          </div>
        </div>
      )}

      {/* PDF Viewer - แสดงทั้ง Mobile และ Desktop */}
      {showPreview && previewUrl && (
        <div className="bg-white shadow-lg rounded-lg p-3 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">ผลตรวจ Lab</h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={downloadPDF}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                📥 ดาวน์โหลด PDF
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewUrl(null);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                🔙 กลับ
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            {mounted && (
              <iframe
                src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit`}
                className="w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] border-0"
                title="PDF Preview"
              />
            )}
          </div>

          {/* คำแนะนำ */}
          <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-gray-700">
            💡 <strong>เคล็ดลับ:</strong>{' '}
            {isMobile
              ? 'ใช้นิ้วปัดซ้าย-ขวาเพื่อเปลี่ยนหน้า และหยิกเพื่อซูม'
              : 'ใช้เมาส์ wheel เพื่อเลื่อนดู หรือใช้เครื่องมือด้านบน PDF เพื่อ zoom/พิมพ์'}
          </div>
        </div>
      )}
    </div>
  );
}