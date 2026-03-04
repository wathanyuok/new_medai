import React from "react";
import reportStyle from "../report.module.css";
import localStyle from "./localStyle.module.css"

export default function headerPage({ prop }) {
  let tempData = prop;
  return (
    <>
      {/* Header */}
      <div
        className={`w-full text-center pb-2 ${localStyle.textNormalBold16}`}
      >
        {prop.mdct_th}
      </div>
      <div className={`w-full d-flex items-center justify-between ${localStyle.textNormal}`}>
        <div className="w-44 flex">
          <div className="w-8">เล่มที่</div>
          <div className={`w-24 h-6 ${reportStyle.borderBottomDot}`}></div>
        </div>
        <div className="w-44 flex">
          <div className="w-8">เลขที่</div>
          <div className={`w-24 h-6 pl-2 ${reportStyle.borderBottomDot}`}>{tempData.opd_code}</div>
        </div>
      </div>
    </>
  );
}
