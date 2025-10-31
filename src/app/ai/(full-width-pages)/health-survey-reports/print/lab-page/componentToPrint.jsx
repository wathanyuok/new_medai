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
  setTimeout(() => handlePrint(), 100);
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

  useEffect(() => {
    setTimeout(() => generateAndUploadPDF(), 1000);
  }, []);

  return (
    <div>
      <div className="flex justify-center">
        <div ref={componentRef} className={reportStyle.pageLaout}>
          {paperList.map((item, index) => (
            <div key={index} className="page w-[794px] h-[1123px] bg-white m-0 p-0">
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
