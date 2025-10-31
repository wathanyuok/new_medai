"use client";
import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
// import Menubar from "../../../components/Menubar";
// import HeaderTap from "../../../components/HeaderTap";
// import localStyle from "./localStyle.module.css";
import reportStyle from "../report.module.css";
import PagePaper from "./pagePaper";
const ComponentToPrint = ({ prop }) => {
  const componentRef = useRef(null);

  // Configure react-to-print
  const handlePrint = useReactToPrint({ contentRef: componentRef });
  // setTimeout(() => handlePrint(), 1000);
  return (
    <>
    
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
        
  
      <div className="page w-[794px]  sm:pl-0 h-[1123px] bg-white m-0 p-0 overflow-hidden" style={{ zoom: 1 }}>
        <div ref={componentRef} className={reportStyle.pageLaout}>
          <PagePaper prop={prop}></PagePaper>
        </div>
      </div>
    
    </>
  );
};

export default ComponentToPrint;
