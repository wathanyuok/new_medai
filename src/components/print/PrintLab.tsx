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

  useEffect(() => {
    const queueId = parseInt(queue_id.queue_id);

    const sessionKey = `lab-pdf-auto-${queueId}`;
    const autoBack = sessionStorage.getItem(sessionKey);

    if (isAndroid && autoBack === 'back') {
      sessionStorage.removeItem(sessionKey);
      window.history.back();
    }
  }, [isAndroid, queue_id.queue_id]);

  useEffect(() => {
    const load = async () => {
      try {
        const queueId = parseInt(queue_id.queue_id);
        const data = await GetQueue(queueId);
        setPrintData(data);

        const s3 = data.queue_file.map((f: any) => f.quef_path);
        setS3Urls(s3);

        setDataLoaded(true);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };

    load();
  }, []);

  const GetQueue = async (queue_id: number) => {
    const token = localStorage.getItem('token');
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/queue/check/lab/${queue_id}`,
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

  const convertImageToPDF = async (url: string) => {
    const { PDFDocument } = await import('pdf-lib');

    try {
      const res = await fetch(url);
      const bytes = await res.arrayBuffer();

      const pdf = await PDFDocument.create();
      const ext = url.toLowerCase().split('.').pop();
      const img =
        ext === 'png'
          ? await pdf.embedPng(bytes)
          : await pdf.embedJpg(bytes);

      const page = pdf.addPage([595.276, 841.89]);

      const dims = img.scale(1);
      const scale = Math.min(
        520 / dims.width,
        760 / dims.height,
      );

      page.drawImage(img, {
        x: (595.276 - dims.width * scale) / 2,
        y: (841.89 - dims.height * scale) / 2,
        width: dims.width * scale,
        height: dims.height * scale,
      });

      return pdf;
    } catch {
      const pdf = await PDFDocument.create();
      pdf.addPage();
      return pdf;
    }
  };

  const createJsPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    doc.addFileToVFS('TH-Niramit.ttf', font.data);
    doc.addFileToVFS('TH-Niramit-Bold.ttf', fontBold.data);
    doc.addFont('TH-Niramit.ttf', 'TH-Niramit', 'normal');
    doc.addFont('TH-Niramit-Bold.ttf', 'TH-Niramit', 'bold');

    doc.setFont('TH-Niramit', 'bold');

    let y = 10;

    doc.addImage(image, 'JPEG', 10, y, 25, 25);
    doc.text(printData.shop.shop_name, 50, y + 5);

    doc.setFontSize(22);
    doc.text('LABORATORY REPORT', 200, y + 5, { align: 'right' });

    return doc;
  };

  const mergePDFs = async () => {
    try {
      const { PDFDocument } = await import('pdf-lib');

      const baseDoc = createJsPDF();
      const baseBytes = baseDoc.output('arraybuffer');

      const merged = await PDFDocument.create();

      // ✅ กำหนดเป็น tuple ให้ตรง type ของ addPage
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
          const bytes = await res.arrayBuffer();

          const pdf = await PDFDocument.load(bytes);
          for (let p of pdf.getPages()) await embedPage(p);

        } else if (type === 'image') {
          const imgPdf = await convertImageToPDF(url);
          for (let p of imgPdf.getPages()) await embedPage(p);
        }
      }

      const finalBytes = await merged.save();

      const arrayBuffer = finalBytes.buffer.slice(0);
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (isMobile && isIOS) {
        window.location.replace(url);
        return;
      }

      if (isMobile && isAndroid) {
        // Android → เปิดใน iframe
        // เพื่อไม่ให้กด back 2 ครั้ง
        setPreviewUrl(url);
        setShowPreview(true);
        setLoading(false);

        const key = `lab-pdf-auto-${queue_id.queue_id}`;
        sessionStorage.setItem(key, 'back');

        return;
      }

      // Desktop + others
      setPreviewUrl(url);
      setShowPreview(true);
      setLoading(false);

    } catch (err) {
      console.error(err);
      setStatus('เกิดข้อผิดพลาด');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataLoaded && !autoProcessed && printData && Object.keys(printData).length > 0) {
      setAutoProcessed(true);
      mergePDFs();
    }
  }, [dataLoaded, autoProcessed, printData]);

  const downloadPDF = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = 'Lab-Result.pdf';
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        {status}...
      </div>
    );
  }

  return (
    <div className="p-5">
      {showPreview && previewUrl && (
        <div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={downloadPDF}
          >
            ดาวน์โหลด PDF
          </button>

          <div className="mt-5 border h-[90vh]">
            <iframe
              src={previewUrl}
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
