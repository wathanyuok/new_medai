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

  const isAndroidDevice = () => {
    return /Android/i.test(navigator.userAgent);
  };

  // ✅ Android Back Button Fix
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Android/iOS: กด back → ปิด preview + cleanup
      if (showPreview && previewUrl) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setShowPreview(false);
        setPreviewUrl(null);
        // แสดง loading หรือหน้าหลัก
        setStatus('กำลังโหลด...');
        setLoading(true);
      }
    };

    // ✅ Android Chrome ต้องใช้ visibilitychange ด้วย
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && showPreview && previewUrl) {
        // กรณี Android กลับจาก PDF viewer
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setShowPreview(false);
        setPreviewUrl(null);
        setLoading(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showPreview, previewUrl]);

  // detect devices
  useEffect(() => {
    setIsMobile(isMobileDevice());
    setIsIOS(isIOSDevice());
    setIsAndroid(isAndroidDevice());
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
    const autoProcessPDF = async () => {
      if (
        dataLoaded &&
        !autoProcessed &&
        printData &&
        Object.keys(printData).length > 0
      ) {
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
        `${
          process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'
        }/queue/check/lab/${queue_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const shop_image = await fetchS3Image(
        'shop/S9d95a914-8929-4738-9693-81e133b8f03b.jpg'
      );
      setImage(shop_image!);
      return res.data.data;
    } catch (error) {
      console.error('Error fetching lab result', error);
      return null;
    }
  };

  const getFileType = (url: string): 'pdf' | 'image' | 'unknown' => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || ''))
      return 'image';
    return 'unknown';
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertImageToPDF = async (imageUrl: string, fileName: string) => {
    // ... (โค้ดเดิมไม่เปลี่ยน)
  };

  const createJsPDF = () => {
    // ... (โค้ดเดิมไม่เปลี่ยน)
  };

  // ✅ แก้ไข mergePDFs สำหรับ Android + iOS Preview
  const mergePDFs = async () => {
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const jsPdfDoc = createJsPDF();
      const filename = `Lab-Result-${printData?.customer?.ctm_fname || 'Unknown'}_${printData?.customer?.ctm_lname || 'User'}.pdf`;
      setProgress(10);

      if (s3Urls.length === 0) {
        const pdfBlob = jsPdfDoc.output('blob');
        
        // ✅ Mobile: Download + Preview iframe
        if (isMobile && (isIOS || isAndroid)) {
          triggerDownload(pdfBlob, filename);
          const url = URL.createObjectURL(pdfBlob);
          setPreviewUrl(url);
          setShowPreview(true);
          setLoading(false);
          
          // ✅ Android: replaceState แทน pushState
          window.history.replaceState({ pdfPreview: true }, '', window.location.href);
          setProgress(100);
          return;
        }

        // Desktop
        const url = URL.createObjectURL(pdfBlob);
        setPreviewUrl(url);
        setShowPreview(true);
        setLoading(false);
        return;
      }

      // Merge logic...
      const mergedPdf = await PDFDocument.create();
      // ... (โค้ด merge เดิม)
      
      setProgress(90);
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], {
        type: 'application/pdf',
      });

      // ✅ Mobile: Download + Preview iframe (iOS/Android เดียวกัน)
      if (isMobile && (isIOS || isAndroid)) {
        triggerDownload(blob, filename);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setShowPreview(true);
        setLoading(false);
        setProgress(100);
        
        // ✅ Android Fix: replaceState ไม่ push history ใหม่
        window.history.replaceState({ pdfPreview: true }, '', window.location.href);
        return;
      }

      // Desktop
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
      setLoading(false);
      setProgress(100);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      setStatus('เกิดข้อผิดพลาด');
      setLoading(false);
    }
  };

  const previewJsPDFOnly = () => {
    const doc = createJsPDF();
    const pdfBlob = doc.output('blob');
    const filename = `Lab-Report-${printData?.customer?.ctm_fname || 'Unknown'}_${printData?.customer?.ctm_lname || 'User'}.pdf`;
    
    if (isMobile && (isIOS || isAndroid)) {
      triggerDownload(pdfBlob, filename);
      const url = URL.createObjectURL(pdfBlob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setShowPreview(true);
      
      // ✅ Android Fix
      window.history.replaceState({ pdfPreview: true }, '', window.location.href);
      return;
    }
    
    const url = URL.createObjectURL(pdfBlob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const downloadPDF = () => {
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = `Lab-Result-${
        printData?.customer?.ctm_fname || 'Unknown'
      }_${printData?.customer?.ctm_lname || 'User'}.pdf`;
      a.click();
    }
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
              className="border-0 h-[80vh] md:h-[800px]"
              title="PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
