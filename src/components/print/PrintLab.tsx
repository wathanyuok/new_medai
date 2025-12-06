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
  const [image, setImage] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [autoProcessed, setAutoProcessed] = useState(false);

  // platform flags
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  const detectPlatform = () => {
    const ua = navigator.userAgent || "";
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    setIsAndroid(/Android/i.test(ua));
  };

  useEffect(() => {
    detectPlatform();
  }, []);

  useEffect(() => {
    const queueId = parseInt(queue_id.queue_id);
    const fetchQueue = async () => {
      try {
        setStatus('กำลังโหลดข้อมูล...');
        const lab = await GetQueue(queueId);
        setPrintData(lab);

        const s3Array = lab.queue_file.map((file: any) => file.quef_path);
        setS3Urls(s3Array);

        setDataLoaded(true);
        setStatus('กำลังสร้าง PDF...');
      } catch (error) {
        console.error('Error fetching queue:', error);
        setStatus('เกิดข้อผิดพลาด');
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  useEffect(() => {
    const auto = async () => {
      if (dataLoaded && !autoProcessed && printData && Object.keys(printData).length > 0) {
        setAutoProcessed(true);
        await mergePDFs();
      }
    };

    auto();
  }, [dataLoaded, printData, autoProcessed]);

  const GetQueue = async (queue_id: number) => {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL || "https://shop.api-apsx.co/crm"}/queue/check/lab/${queue_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const shop_image = await fetchS3Image("shop/S9d95a914-8929-4738-9693-81e133b8f03b.jpg");
    setImage(shop_image!);
    return res.data.data;
  };

  const getFileType = (url: string): "pdf" | "image" | "unknown" => {
    const ext = url.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext || "")) return "image";
    return "unknown";
  };

  const convertImageToPDF = async (imageUrl: string, fileName: string) => {
    const { PDFDocument, rgb } = await import("pdf-lib");
    try {
      const response = await fetch(imageUrl);

      const imageBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.create();

      const A4_WIDTH = 595.276;
      const A4_HEIGHT = 841.89;
      const MARGIN = 40;

      let embeddedImage;
      try {
        embeddedImage = imageUrl.endsWith(".png")
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);
      } catch {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      }

      const imgDims = embeddedImage.scale(1);
      const scale = Math.min(
        (A4_WIDTH - MARGIN * 2) / imgDims.width,
        (A4_HEIGHT - MARGIN * 2) / imgDims.height,
        1
      );

      const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      page.drawImage(embeddedImage, {
        x: (A4_WIDTH - imgDims.width * scale) / 2,
        y: (A4_HEIGHT - imgDims.height * scale) / 2,
        width: imgDims.width * scale,
        height: imgDims.height * scale,
      });

      return pdfDoc;
    } catch (error) {
      const { PDFDocument, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.276, 841.89]);
      page.drawText(`Error loading image ${fileName}`, { x: 50, y: 500 });
      return doc;
    }
  };

  const createJsPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.addFileToVFS("TH-Niramit-AS-normal.ttf", font.data);
    doc.addFileToVFS("TH-Niramit-AS-Bold-bold.ttf", fontBold.data);
    doc.addFont("TH-Niramit-AS-normal.ttf", "TH-Niramit", "normal");
    doc.addFont("TH-Niramit-AS-Bold-bold.ttf", "TH-Niramit", "bold");

    doc.setFont("TH-Niramit", "bold");

    const rows = printData.checks.map((item: any, i: number) => [
      [`${i + 1}.) ${item.chk_name}`],
      [item.specimen_name_en || "-"],
      [item.chk_method || "-"],
      [item.chk_type_id === 3 ? item.fetchedImageValue || "-" : item.chk_value || "-"],
      [item.chk_flag || "-"],
      [item.chk_unit || "-"],
      [item.chk_direction_detail || "-"],
      [item.chk_old || "-"],
    ]);

    let Y = 20;

    doc.addImage(String(image), "JPEG", 10, 10, 25, 25);
    doc.text(printData.shop.shop_name, 40, 20);

    autoTable(doc, {
      startY: 40,
      head: [["TEST", "SPECIMEN", "METHOD", "RESULT", "FLAG", "UNIT", "REF", "PREVIOUS"]],
      body: rows,
    });

    return doc;
  };

  const mergePDFs = async () => {
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");

      const jsDoc = createJsPDF();
      const jsPdfBytes = jsDoc.output("arraybuffer");

      setProgress(10);

      const mergedPdf = await PDFDocument.create();
      const A4_WIDTH = 595.276;
      const A4_HEIGHT = 841.89;

      const convertPage = async (pg: any) => {
        const p = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
        const embed = await mergedPdf.embedPage(pg);
        const scale = Math.min(A4_WIDTH / embed.width, A4_HEIGHT / embed.height);
        p.drawPage(embed, { x: 0, y: 0, width: embed.width * scale, height: embed.height * scale });
      };

      // add main jsPDF pages
      const jsPdfDoc = await PDFDocument.load(jsPdfBytes);
      for (let i = 0; i < jsPdfDoc.getPageCount(); i++) {
        await convertPage(jsPdfDoc.getPage(i));
      }

      setProgress(30);

      // merge S3 files
      for (let i = 0; i < s3Urls.length; i++) {
        const url = s3Urls[i];
        const type = getFileType(url);

        if (type === "pdf") {
          const bytes = await (await fetch(url)).arrayBuffer();
          const pdf = await PDFDocument.load(bytes);
          for (let j = 0; j < pdf.getPageCount(); j++) {
            await convertPage(pdf.getPage(j));
          }
        } else if (type === "image") {
          const imgPdf = await convertImageToPDF(url, url.split("/").pop() || "image");
          for (let j = 0; j < imgPdf.getPageCount(); j++) {
            await convertPage(imgPdf.getPage(j));
          }
        }
      }

      setProgress(90);

      const finalBytes = await mergedPdf.save();
      const blob = new Blob([finalBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // -------- iOS: FULLSCREEN PDF via redirect  ---------
      if (isIOS) {
        window.location.href = url;
        return;
      }

      // -------- Android: SHOW IN IFRAME (fix back button) ---------
      if (isAndroid) {
        setPreviewUrl(url);
        setShowPreview(true);
        setLoading(false);
        return;
      }

      // Desktop default: preview
      setPreviewUrl(url);
      setShowPreview(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setStatus("เกิดข้อผิดพลาด");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>
          <div className="animate-spin h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4">{status}</p>
          <p className="text-center text-sm text-gray-500">{progress}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {showPreview && previewUrl && (
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-bold mb-3">PDF Preview</h2>
          <iframe
            src={`${previewUrl}#toolbar=1&zoom=page-fit`}
            className="w-full h-[800px] border"
          />
        </div>
      )}
    </div>
  );
}
