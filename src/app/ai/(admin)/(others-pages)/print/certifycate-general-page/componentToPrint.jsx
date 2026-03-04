'use client';

import React, { useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import reportStyle from "../report.module.css";
import PagePaper from "./pagePaper";

const ComponentToSavePDF = ({ prop }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  let tempData = prop;

  const generateAndUploadPDF = async () => {
    if (!componentRef.current) return;

    // 1. แปลง div เป็น canvas
    const canvas = await html2canvas(componentRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    // 2. สร้าง PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const pdfBlob = pdf.output('blob');

    // 3. ส่ง pdfBlob ไปอัปโหลด (ไป API)
    const formData = new FormData();
    formData.append('file', pdfBlob, 'report.pdf');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    if (result.url) {
      console.log('Uploaded PDF URL:', result.url);
      alert('ไฟล์อัปโหลดสำเร็จ: ' + result.url);
    }
  };

  useEffect(() => {
    // เริ่มทำงานทันทีหลัง mount
    setTimeout(() => generateAndUploadPDF(), 1000);
  }, []);

  return (
    <div className="flex justify-center" style={{ zoom: 1 }}>
      <div ref={componentRef} className={reportStyle.pageLaout}>
        <PagePaper prop={tempData} />
      </div>
    </div>
  );
};

export default ComponentToSavePDF;
