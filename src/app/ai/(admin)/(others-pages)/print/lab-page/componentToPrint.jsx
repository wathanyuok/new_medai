'use client';

import React, { useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import reportStyle from "../report.module.css";
import PagePaper from "./pagePaper";
import { useReactToPrint } from "react-to-print";

const ComponentToSavePDF = ({ labData }) => {
  const componentRef = useRef(null);
  
  // Configure react-to-print
  const handlePrint = useReactToPrint({ contentRef: componentRef });
  
  // Remove auto print on load - commented out
  // setTimeout(() => handlePrint(), 100);
  
  const dataList = labData.checks;
  const itemInPaper = 25;

  let paperNum = dataList.length / itemInPaper;
  let paperPage = parseInt(paperNum.toString());
  if (paperNum % itemInPaper !== 0) {
    paperPage++;
  }

  let itemStart = 0;
  let paperList = [];
  for (let i = 0; i < paperPage; i++) {
    let cList = [];
    for (let j = 0; j < itemInPaper; j++) {
      if (itemStart + j < dataList.length) {
        cList.push(dataList[itemStart + j]);
      }
    }
    let paper = { index: i + 1, list: cList };
    paperList.push(paper);
    itemStart += itemInPaper;
  }

  const generateAndUploadPDF = async () => {
    if (!componentRef.current) return;

    const pages = componentRef.current.querySelectorAll('.page'); 
    const pdf = new jsPDF('p', 'mm', 'a4');

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const canvas = await html2canvas(page, { scale: 2, useCORS: true});
      const imgData = canvas.toDataURL('image/png');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      if (i !== 0) {
        pdf.addPage(); // add หน้าใหม่
      }
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    const pdfBlob = pdf.output('blob');

    // อัปโหลดไฟล์ PDF
    const formData = new FormData();
    formData.append('file', pdfBlob, 'lab-report.pdf');

    // const res = await fetch('/api/upload', {
    //   method: 'POST',
    //   body: formData,
    // });

    // const result = await res.json();
    // if (result.url) {
    //   console.log('Uploaded PDF URL:', result.url);
    //   alert('อัปโหลดสำเร็จ: ' + result.url);
    // }
  };

  // Auto generate PDF on load
  useEffect(() => {
    setTimeout(() => generateAndUploadPDF(), 1000);
  }, []);

  return (
    <div>
      {/* Print and PDF Buttons */}
      <div className="flex justify-start gap-4 mb-6 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-[#FF68F5]  text-white px-6 py-2 rounded-lg flex items-center justify-start gap-2 transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" 
            />
          </svg>
          บันทึกรายงาน
        </button>
        
        {/* <button
          onClick={generateAndUploadPDF}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          สร้าง PDF
        </button> */}
      </div>

      <div className="flex justify-center">
        <div ref={componentRef} className={reportStyle.pageLaout}>
          {paperList.map((item, index) => (
            <div key={index} className="page w-[794px] pl-44 sm:pl-0 h-[1123px] bg-white m-0 p-0 overflow-hidden">
              {/* ต้องมี className="page" เพื่อจับแต่ละหน้า */}
              <PagePaper
                indexPaper={index}
                list={item.list}
                labData={labData}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComponentToSavePDF;