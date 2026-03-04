import React from "react";
import reportStyle from "../report.module.css";
import logo from "/public/images/icons/apsx_logo.png";
import Image from "next/image";
import notImg from "/public/images/icons/no-pictures.png";

export default function headerPage({ prop }) {
  return (
    <>
      {/* Header */}
      <div className={`w-full flex items-start justify-start`}>
        <div className="d-flex" style={{ width: "75%" }}>
          <Image alt="logo" src={logo || notImg} width={120} />
        </div>
      </div>
      <div
        className={`w-full text-center pb-2 ${reportStyle.textNormalBold16}`}
      >
        {prop.mdct_th}
      </div>
    </>
  );
}
