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
  setTimeout(() => handlePrint(), 1000);
  return (
    <>
      <div className="flex justify-center" style={{ zoom: 1 }}>
        <div ref={componentRef} className={reportStyle.pageLaout}>
          <PagePaper prop={prop}></PagePaper>
        </div>
      </div>
      {/* <div>
        <div className="relative ">
          <header className="header header-fixed">
            <div className="container">
              <HeaderTap />
            </div>
          </header>
        </div>
        <div className={localStyle.contentPosition}>
          <div style={{ marginTop: "18%" }}>
            <div className="flex justify-between my-4">
              <button className={localStyle.buttonBack}>
                <a href="/xray" className="text-apsx d-flex align-items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-apsx "
                    width="20px"
                    height="20px"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M14.5 17L9.5 12L14.5 7"
                      stroke="#00AD98"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Back
                </a>
              </button>
              <button
                className={localStyle.buttonPrint}
                onClick={() => handlePrint()}
              >
                Print
              </button>
            </div>
            <div className="flex justify-center" style={{ zoom: 0.5 }}>
              <div ref={componentRef} className={reportStyle.pageLaout}>
                <PagePaper prop={prop}></PagePaper>
              </div>
            </div>
          </div>
        </div>
        <Menubar />
      </div> */}
    </>
  );
};

export default ComponentToPrint;
