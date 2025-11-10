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
  const [showPreview, setShowPreview] = useState(true);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [printData, setPrintData] = useState<any>({});
  const [image, setImage] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [autoProcessed, setAutoProcessed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  const openPdfSafe = (pdfUrl: string) => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

        setStatus('โหลดข้อมูลเสร็จสิ้น กำลังเตรียมสร้าง PDF...');
        setCurrentStep('');
      } catch (error) {
        console.error('Error fetching queue:', error);
        setStatus('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setCurrentStep('');
      }
    };

    fetchQueue();
  }, [queue_id]);

  // Auto process PDF when data is loaded (แสดง preview ทันที)
  useEffect(() => {
    const autoProcessPDF = async () => {
      if (dataLoaded && !autoProcessed && printData && Object.keys(printData).length > 0) {
        setAutoProcessed(true);
        setStatus('เริ่มสร้าง PDF อัตโนมัติ...');

        // รอให้ UI อัปเดตเล็กน้อย
        await new Promise((resolve) => setTimeout(resolve, 500));

        await mergePDFs(); // จะ set previewUrl และ showPreview ให้เห็นทันที
      }
    };

    autoProcessPDF();
  }, [dataLoaded, printData, autoProcessed]);

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

  // ตรวจสอบประเภทไฟล์
  const getFileType = (url: string): 'pdf' | 'image' | 'unknown' => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'image';
    return 'unknown';
  };

  // แปลงรูปภาพเป็น PDF (A4)
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

      page.drawText(`URL: ${imageUrl.substring(0, 60)}${imageUrl.length > 60 ? '...' : ''}`, {
        x: 50,
        y: 370,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        x: 50,
        y: 340,
        size: 10,
        color: rgb(0.8, 0, 0),
      });

      return errorDoc;
    }
  };

  // สร้าง PDF Report ด้วย jsPDF (A4)
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

  // แปลง textarea → array ของ URLs (คงไว้เพื่อรองรับ)
  const parseUrlsFromText = (urlsText: string): string[] => {
    return urlsText
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0 && url.startsWith('http'));
  };

  // เมื่อแก้ textarea
  const handleUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const urlsText = e.target.value;
    const urlsArray = parseUrlsFromText(urlsText);
    setS3Urls(urlsArray);
    setAutoProcessed(false);
  };

  // รวม PDF + Image และแสดง preview ทันที
  const mergePDFs = async () => {
    if (s3Urls.length === 0) {
      // ถ้าไม่มีไฟล์แนบ S3 ให้สร้างเฉพาะ jsPDF
      const jsPdfDoc = createJsPDF();
      const pdfBlob = jsPdfDoc.output('blob');
      const url = URL.createObjectURL(pdfBlob);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);

      // มือถือ redirect เพื่อเปิดด้วย viewer ของระบบ / Desktop แสดง iframe เหมือนเดิม
      if (isMobile) {
        window.location.href = url;
        return;
      }
      setShowPreview(true);
      setStatus('สร้าง Lab Report PDF เสร็จสมบูรณ์');
      return;
    }

    const fileTypes = s3Urls.map((url) => ({ url, type: getFileType(url) }));
    const pdfCount = fileTypes.filter((f) => f.type === 'pdf').length;
    const imageCount = fileTypes.filter((f) => f.type === 'image').length;
    const unknownCount = fileTypes.filter((f) => f.type === 'unknown').length;

    setLoading(true);
    setProgress(0);
    setStatus(
      `พบไฟล์ ${s3Urls.length} ไฟล์ (PDF: ${pdfCount}, รูปภาพ: ${imageCount}${
        unknownCount > 0 ? `, ไม่ทราบประเภท: ${unknownCount}` : ''
      }) - เริ่มประมวลผล...`
    );

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');

      setCurrentStep('กำลังสร้าง PDF ด้วย jsPDF...');
      const jsPdfDoc = createJsPDF();
      const jsPdfBytes = jsPdfDoc.output('arraybuffer');
      setProgress(10);

      const mergedPdf = await PDFDocument.create();
      const A4_WIDTH = 595.276;
      const A4_HEIGHT = 841.89;
      const MARGIN = 0;

      const convertPageToA4 = async (sourcePage: any, _sourceDoc: any, title: string, pageNumber: number) => {
        const newPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);

        newPage.drawRectangle({
          x: 0,
          y: 0,
          width: A4_WIDTH,
          height: A4_HEIGHT,
          color: rgb(1, 1, 1),
        });

        try {
          const embeddedPage = await mergedPdf.embedPage(sourcePage);
          const { width: origWidth, height: origHeight } = embeddedPage;

          const availableWidth = A4_WIDTH - MARGIN;
          const availableHeight = A4_HEIGHT - MARGIN;

          const scaleX = availableWidth / origWidth;
          const scaleY = availableHeight / origHeight;
          const scale = Math.min(scaleX, scaleY);

          const scaledWidth = origWidth * scale;
          const scaledHeight = origHeight * scale;

          const x = (A4_WIDTH - scaledWidth) / 2;
          const y = (A4_HEIGHT - scaledHeight) / 2;

          newPage.drawPage(embeddedPage, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
          });
        } catch (embedError) {
          console.warn(`Cannot embed page ${pageNumber} from ${title}:`, embedError);

          newPage.drawText(`${title} - Page ${pageNumber}`, {
            x: A4_WIDTH / 2 - 60,
            y: A4_HEIGHT / 2 + 10,
            size: 14,
            color: rgb(0, 0, 0),
          });

          newPage.drawText('(Unable to convert to A4)', {
            x: A4_WIDTH / 2 - 70,
            y: A4_HEIGHT / 2 - 10,
            size: 10,
            color: rgb(0.8, 0, 0),
          });
        }
      };

      // เพิ่มหน้าจาก jsPDF
      setCurrentStep('กำลังเพิ่มหน้าจาก jsPDF...');
      const jsPdfDocument = await PDFDocument.load(jsPdfBytes);
      const jsPdfPageCount = jsPdfDocument.getPageCount();

      for (let i = 0; i < jsPdfPageCount; i++) {
        const sourcePage = jsPdfDocument.getPage(i);
        await convertPageToA4(sourcePage, jsPdfDocument, 'jsPDF', i + 1);
      }
      setProgress(20);

      let totalPagesProcessed = 0;
      const progressPerFile = 70 / s3Urls.length;

      for (let urlIndex = 0; urlIndex < s3Urls.length; urlIndex++) {
        const url = s3Urls[urlIndex];
        const fileNumber = urlIndex + 1;
        const fileType = getFileType(url);
        const fileName = url.split('/').pop() || `File${fileNumber}`;

        setCurrentStep(`กำลังประมวลผลไฟล์ที่ ${fileNumber}/${s3Urls.length} (${fileType.toUpperCase()})...`);

        try {
          if (fileType === 'pdf') {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for PDF file ${fileNumber}`);

            const s3PdfBytes = await response.arrayBuffer();
            const s3PdfDocument = await PDFDocument.load(s3PdfBytes);
            const s3PageCount = s3PdfDocument.getPageCount();

            setCurrentStep(`กำลังแปลง PDF ไฟล์ที่ ${fileNumber} (${s3PageCount} หน้า) เป็น A4...`);

            for (let i = 0; i < s3PageCount; i++) {
              const sourcePage = s3PdfDocument.getPage(i);
              await convertPageToA4(sourcePage, s3PdfDocument, `PDF File ${fileNumber}`, i + 1);
              totalPagesProcessed++;
            }
          } else if (fileType === 'image') {
            setCurrentStep(`กำลังแปลงรูปภาพที่ ${fileNumber} เป็น PDF...`);

            const imagePdf = await convertImageToPDF(url, fileName);
            const imagePageCount = imagePdf.getPageCount();

            for (let i = 0; i < imagePageCount; i++) {
              const sourcePage = imagePdf.getPage(i);
              await convertPageToA4(sourcePage, imagePdf, `Image File ${fileNumber}`, i + 1);
              totalPagesProcessed++;
            }
          } else {
            throw new Error(`Unsupported file type for file ${fileNumber}`);
          }

          const currentProgress = 20 + (urlIndex + 1) * progressPerFile;
          setProgress(Math.round(currentProgress));
        } catch (error: any) {
          console.error(`Error processing file ${fileNumber} (${fileType}):`, error);

          const errorPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
          errorPage.drawRectangle({
            x: 0,
            y: 0,
            width: A4_WIDTH,
            height: A4_HEIGHT,
            color: rgb(1, 1, 1),
          });

          errorPage.drawText(`Error loading ${fileType.toUpperCase()} File ${fileNumber}`, {
            x: A4_WIDTH / 2 - 100,
            y: A4_HEIGHT / 2 + 20,
            size: 16,
            color: rgb(0.8, 0, 0),
          });

          errorPage.drawText(`File: ${fileName}`, {
            x: 50,
            y: A4_HEIGHT / 2 - 10,
            size: 10,
            color: rgb(0.5, 0.5, 0.5),
          });

          errorPage.drawText(`URL: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`, {
            x: 50,
            y: A4_HEIGHT / 2 - 30,
            size: 10,
            color: rgb(0.5, 0.5, 0.5),
          });

          errorPage.drawText(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
            x: 50,
            y: A4_HEIGHT / 2 - 50,
            size: 10,
            color: rgb(0.8, 0, 0),
          });
        }
      }

      setCurrentStep('กำลังสร้างไฟล์ A4 ที่รวมแล้ว...');
      setProgress(90);

      mergedPdf.setTitle(
        `Merged PDF - ${s3Urls.length} Files (${pdfCount} PDFs + ${imageCount} Images) Converted to A4`
      );
      mergedPdf.setCreator('Multi PDF & Image A4 Converter Tool');
      mergedPdf.setProducer('jsPDF + PDF-lib A4 Converter');
      mergedPdf.setCreationDate(new Date());

      const mergedPdfBytes = await mergedPdf.save();
      const arrayBuffer = mergedPdfBytes.buffer.slice(
        mergedPdfBytes.byteOffset,
        mergedPdfBytes.byteOffset + mergedPdfBytes.byteLength
      );
      const blob = new Blob([arrayBuffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);

      // มือถือ redirect เพื่อเปิดด้วย viewer ของระบบ / Desktop แสดง iframe เหมือนเดิม
      if (isMobile) {
        window.location.href = url;
        return;
      }

      setShowPreview(true);
      setProgress(100);
      setStatus(
        `สำเร็จ! รวม ${s3Urls.length} ไฟล์เป็น A4 แล้ว (${pdfCount} PDFs + ${imageCount} Images)`
      );
    } catch (error: any) {
      console.error('Error merging files:', error);
      setStatus(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setCurrentStep('');
      setProgress(0);
    }
  };

  const previewJsPDFOnly = () => {
    const doc = createJsPDF();
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPreviewUrl(url);

    // Desktop preview คงเดิม, Mobile redirect
    if (isMobile) {
      window.location.href = url;
      return;
    }
    setShowPreview(true);
    setStatus('แสดงตัวอย่าง jsPDF (A4) ด้านล่าง');
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setShowPreview(false);
    setStatus('');
  };

  const downloadPreviewedPDF = () => {
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = `Lab-Result-${printData?.customer?.ctm_fname || 'Unknown'}_${
        printData?.customer?.ctm_lname || 'User'
      }-${new Date(printData?.que_datetime || new Date()).toLocaleString('th-TH-u-ca-gregory', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}.pdf`;
      a.click();
      setStatus('กำลังดาวน์โหลด PDF...');
    }
  };

  // (แสดงผล) — Desktop preview เหมือนเดิมทุกอย่าง + ปุ่ม Download อยู่หน้าเดียวกัน
  const urlCount = s3Urls.length;
  const fileTypesArr = s3Urls.map((url) => getFileType(url));
  const pdfCount = fileTypesArr.filter((type) => type === 'pdf').length;
  const imageCount = fileTypesArr.filter((type) => type === 'image').length;

  return (
    <div className="container mx-auto p-6 max-w-full">
      {/* PDF Preview Section */}
      {showPreview && previewUrl && (
        <div className="bg-white shadow-lg rounded-lg p-3 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 text-center sm:text-left"></h2>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {/* ปุ่มดาวน์โหลด (อยู่ในหน้า preview เลย) */}
              <button
                onClick={downloadPreviewedPDF}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <span className="inline-block mr-1">📥</span>
                <span className="hidden xs:inline">ดาวน์โหลด PDF</span>
                <span className="xs:hidden">Download1</span>
              </button>

              {/* Mobile: ปุ่มเปิดแท็บใหม่ (Desktop ไม่เปลี่ยนพฤติกรรม) */}
              {/* {isMobile && previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-block text-center px-3 sm:px-4 py-2 bg-purple-600 text-white text-sm sm:text-base rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  <span className="inline-block mr-1">🔗</span>
                  <span className="hidden xs:inline">เปิดใน Tab ใหม่</span>
                  <span className="xs:hidden">Download2</span>
                </a>
              )} */}

              {/* ปุ่ม “ดู Lab Report เท่านั้น” ยังคงไว้ เผื่อใช้งาน manual */}
              <button
                onClick={previewJsPDFOnly}
                disabled={loading || !printData || Object.keys(printData).length === 0}
                className="w-full sm:w-auto py-2 px-3 sm:px-4 bg-green-600 text-white text-sm sm:text-base rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 transition-colors"
              >
                <span className="inline-block mr-1">📄</span>
                <span className="hidden xs:inline">ดู Lab Report เท่านั้น</span>
                <span className="xs:hidden">Lab Only</span>
              </button>
            </div>
          </div>

          {/* Mobile คำแนะนำ (Desktop ไม่เปลี่ยน) */}
          {isMobile && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <span className="text-amber-500 text-lg">⚠️</span>
                <div className="text-amber-800 text-sm">
                  <strong>📱 Mobile Device Detected:</strong>
                  <p className="mt-1">
                    PDF viewer controls อาจถูกจำกัดบนเบราว์เซอร์มือถือ
                    แนะนำให้ใช้ <strong>"เปิดใน Tab ใหม่"</strong> หรือ <strong>"ดาวน์โหลด PDF"</strong> เพื่อเปิดด้วยแอป PDF
                  </p>
                </div>
              </div>
            </div>
          )}

{/* PDF Viewer */}
{/* <div className="border border-gray-200 sm:border-2 rounded-lg overflow-hidden"> */}

  {/* 🔴 ส่วนนี้คือ mobile viewer เดิม (มีพื้นหลังเทาและปุ่มเปิด)
      ถ้าไม่ต้องการให้แสดง — คอมเมนต์ออกทั้งบล็อกนี้ */}
  {/*
  {isMobile ? (
    <div className="relative">
      <object
        data={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
        type="application/pdf"
        width="100%"
        height="100%"
      >
        <iframe
          src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
          width="100%"
          height="100%"
        >
          This browser does not support PDFs. Please download the PDF to view it:
          <a href={previewUrl}>Download PDF</a>
        </iframe>
      </object>
    </div>
  ) : (
  */}
  
  {/* ✅ ใช้ iframe แบบเดียวกันสำหรับทุกอุปกรณ์ */}
  <iframe
    src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit`}
    width="100%"
    height="100%"
    className="border-0 sm:h-[600px] md:h-[700px] lg:h-[800px]"
    title="PDF Preview"
  />
  {/* ) */}
{/* </div> */}


          {/* Instructions */}
          <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded text-xs sm:text-sm text-gray-600">
            <strong className="block sm:inline">การใช้งาน PDF Viewer:</strong>
            <span className="block sm:inline sm:ml-1">
              {isMobile ? (
                <>
                  <span className="block mt-1 text-blue-600">
                    📱 <strong>Mobile:</strong> ปัดซ้าย-ขวาเพื่อเปลี่ยนหน้า, หยิกเพื่อซูม
                  </span>
                  <span className="block mt-1 text-purple-600">
                    🔗 <strong>เคล็ดลับ:</strong> กด "เปิดใน Tab ใหม่" เพื่อใช้งาน PDF ได้เต็มรูปแบบ
                  </span>
                </>
              ) : (
                'ใช้แถบเครื่องมือด้านบนของ viewer เพื่อ zoom, เปลี่ยนหน้า, พิมพ์ หรือดาวน์โหลด'
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
