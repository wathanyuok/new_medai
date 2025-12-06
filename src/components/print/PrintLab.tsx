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
  const [progress, setProgress] = useState(0);
  const [printData, setPrintData] = useState<any>({});
  const [image, setImage] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [autoProcessed, setAutoProcessed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  // ---- device detection ----
  const detectDevices = () => {
    const ua = navigator.userAgent || '';

    return {
      mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
      ios:
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
      android: /Android/i.test(ua),
    };
  };

  useEffect(() => {
    const d = detectDevices();
    setIsMobile(d.mobile);
    setIsIOS(d.ios);
    setIsAndroid(d.android);
  }, []);

  // logic auto-back Android เดิม (ถ้าเคย set ค่าว่า back ไว้)
  useEffect(() => {
    const queueId = parseInt(queue_id.queue_id);
    const sessionKey = `lab-pdf-auto-${queueId}`;
    const autoBack = typeof window !== 'undefined'
      ? sessionStorage.getItem(sessionKey)
      : null;

    if (isAndroid && autoBack === 'back') {
      sessionStorage.removeItem(sessionKey);
      window.history.back();
    }
  }, [isAndroid, queue_id.queue_id]);

  // ---- load queue ----
  useEffect(() => {
    const load = async () => {
      try {
        const queueId = parseInt(queue_id.queue_id);
        setStatus('กำลังโหลดข้อมูล...');
        const data = await GetQueue(queueId);
        setPrintData(data);

        const s3 = data.queue_file.map((f: any) => f.quef_path);
        setS3Urls(s3);

        setDataLoaded(true);
        setStatus('กำลังสร้าง PDF...');
      } catch (e) {
        console.error(e);
        setStatus('เกิดข้อผิดพลาด');
        setLoading(false);
      }
    };

    load();
  }, [queue_id.queue_id]);

  // ---- auto merge เมื่อข้อมูลพร้อม ----
  useEffect(() => {
    if (dataLoaded && !autoProcessed && printData && Object.keys(printData).length > 0) {
      setAutoProcessed(true);
      mergePDFs();
    }
  }, [dataLoaded, autoProcessed, printData]);

  const GetQueue = async (queue_id: number) => {
    const token = localStorage.getItem('token');
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/queue/check/lab/${queue_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const img = await fetchS3Image('shop/S9d95a914-8929-4738-9693-81e133b8f03b.jpg');
    setImage(img!);

    return res.data.data;
  };

  const getFileType = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) return 'image';
    return 'unknown';
  };

  const convertImageToPDF = async (url: string, fileName: string) => {
    const { PDFDocument, rgb } = await import('pdf-lib');

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const bytes = await res.arrayBuffer();

      const pdf = await PDFDocument.create();
      const A4_WIDTH = 595.276;
      const A4_HEIGHT = 841.89;
      const MARGIN = 40;

      let imgEmbed;
      const ext = url.toLowerCase().split('.').pop();
      try {
        imgEmbed =
          ext === 'png'
            ? await pdf.embedPng(bytes)
            : await pdf.embedJpg(bytes);
      } catch {
        imgEmbed =
          ext === 'png'
            ? await pdf.embedJpg(bytes)
            : await pdf.embedPng(bytes);
      }

      const dims = imgEmbed.scale(1);
      const scale = Math.min(
        (A4_WIDTH - MARGIN * 2) / dims.width,
        (A4_HEIGHT - MARGIN * 2 - 30) / dims.height,
        1
      );

      const width = dims.width * scale;
      const height = dims.height * scale;
      const x = (A4_WIDTH - width) / 2;
      const y = (A4_HEIGHT - height) / 2;

      const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: A4_WIDTH,
        height: A4_HEIGHT,
        color: rgb(1, 1, 1),
      });
      page.drawImage(imgEmbed, { x, y, width, height });

      return pdf;
    } catch (err) {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595.276, 841.89]);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: 595.276,
        height: 841.89,
        color: rgb(1, 1, 1),
      });
      page.drawText(`Error: ${fileName}`, {
        x: 50,
        y: 400,
        size: 16,
        color: rgb(0.8, 0, 0),
      });
      return pdf;
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
      chk_value:
        check.chk_type_id == 3
          ? check.fetchedImageValue || '-'
          : check.chk_value || '-',
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
      [item.chk_old],
    ]);

    const spacer = 6;
    let currentY = 5;

    const birthDate = new Date(printData.customer.ctm_birthdate);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
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
    doc.text(
      `${printData.shop.shop_address} แขวง${printData.shop.shop_district} เขต${printData.shop.shop_amphoe} ${printData.shop.shop_province} ${printData.shop.shop_zipcode}`,
      40,
      currentY
    );
    currentY += spacer;
    doc.text(`${printData.shop.shop_phone}`, 40, currentY);
    currentY += spacer;
    doc.setFont('TH-Niramit', 'bold');
    doc.setFontSize(14);
    doc.text(
      `Name : ${
        printData.customer.ctm_prefix == 'ไม่ระบุ'
          ? ''
          : printData.customer.ctm_prefix
      } ${printData.customer.ctm_fname} ${printData.customer.ctm_lname}`,
      25,
      currentY
    );
    doc.text(`Sex : ${printData.customer.ctm_gender}`, 120, currentY);
    doc.text(`Age : ${age}`, 150, currentY);
    currentY += spacer;
    doc.text(`HN : ${printData.customer.ctm_id}`, 25, currentY);
    doc.text(`Lab No. : ${printData.que_code}`, 75, currentY);
    doc.text(
      `Request Date. : ${new Date(
        printData.que_datetime
      ).toLocaleString('en-GB', {
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

    const printFooter = () => {
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

    printFooter();
    currentY += spacer;

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

    return doc;
  };

  const mergePDFs = async () => {
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');

      const baseDoc = createJsPDF();
      const baseBytes = baseDoc.output('arraybuffer');

      const merged = await PDFDocument.create();
      const A4: [number, number] = [595.276, 841.89];

      const embedPage = async (srcPage: any) => {
        const pg = merged.addPage(A4);
        const embed = await merged.embedPage(srcPage);

        const { width, height } = embed;
        const scale = Math.min(A4[0] / width, A4[1] / height);

        pg.drawPage(embed, {
          x: (A4[0] - width * scale) / 2,
          y: (A4[1] - height * scale) / 2,
          width: width * scale,
          height: height * scale,
        });
      };

      const pdf1 = await PDFDocument.load(baseBytes);
      for (let p of pdf1.getPages()) await embedPage(p);

      for (const url of s3Urls) {
        const type = getFileType(url);

        if (type === 'pdf') {
          const res = await fetch(url);
          if (!res.ok) continue;
          const bytes = await res.arrayBuffer();
          const pdf = await PDFDocument.load(bytes);
          for (let p of pdf.getPages()) await embedPage(p);

        } else if (type === 'image') {
          const imgPdf = await convertImageToPDF(url, url.split('/').pop() || 'image');
          for (let p of imgPdf.getPages()) await embedPage(p);
        }
      }

      const finalBytes = await merged.save();
      const arrayBuffer = finalBytes.buffer.slice(0);
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // ---- แยกตาม device ----
      if (isMobile && isIOS) {
        // iOS → เปิด PDF เต็มจอ
        window.location.replace(url);
        return;
      }

      if (isMobile && isAndroid) {
        // Android → แสดงใน iframe ในหน้านี้ (ไม่ออกจากหน้านี้เลย)
        setPreviewUrl(url);
        setShowPreview(true);
        setLoading(false);

        const key = `lab-pdf-auto-${queue_id.queue_id}`;
        sessionStorage.setItem(key, 'back'); // เผื่อใช้ auto back pattern เดิมถ้าต้อง
        return;
      }

      // Desktop + others → preview ใน iframe
      setPreviewUrl(url);
      setShowPreview(true);
      setLoading(false);

    } catch (err) {
      console.error(err);
      setStatus('เกิดข้อผิดพลาด');
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Lab-Result-${
      printData?.customer?.ctm_fname || 'Unknown'
    }_${printData?.customer?.ctm_lname || 'User'}.pdf`;
    a.click();
  };

  const previewJsPDFOnly = () => {
    const doc = createJsPDF();
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (isMobile && isIOS) {
      window.location.replace(url);
      return;
    }

    if (isMobile && isAndroid) {
      setPreviewUrl(url);
      setShowPreview(true);
      return;
    }

    setPreviewUrl(url);
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{status}</p>
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

  // Android / Desktop แสดง preview เหมือนกัน (ไม่มีข้อความพิเศษ)
  return (
    <div className="container mx-auto p-6 max-w-full">
      {showPreview && previewUrl && (
        <div className="bg-white shadow-lg rounded-lg p-0">
          <div className="flex justify-end items-center mb-2 px-4 pt-4">
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ดาวน์โหลด PDF
            </button>
          </div>

          <div className="border-0 rounded-none overflow-hidden">
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit`}
              width="100%"
              className="border-0 h-[100vh]"
              title="PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
