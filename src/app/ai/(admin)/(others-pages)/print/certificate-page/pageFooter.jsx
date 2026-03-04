import React from "react";
import reportStyle from "../report.module.css";
import ComFormat from "../../common/comFormat";

export default function pageFooter({ prop }) {
  let tempData = prop;
  let customer = tempData.customer;
  let name = ` ${customer.ctm_prefix == "ไม่ระบุ" ? "" : customer.ctm_prefix} ${
    customer.ctm_fname
  } ${customer.ctm_lname} `;

  return (
    <>
      <div className={`w-full grid grid-cols-12 ${reportStyle.textNormal}`}>
        <div className={`text-right ${reportStyle.textNormalBold}`}>ลงชื่อ</div>
        <div className={`col-span-3 ${reportStyle.borderBottomDot}`}></div>
        <div className={`col-span-1 ${reportStyle.textNormalBold}`}>
          ผู้ป่วย
        </div>
        <div className={`text-right ${reportStyle.textNormalBold}`}>ลงชื่อ</div>
        <div className={`col-span-3 ${reportStyle.borderBottomDot}`}></div>
        <div className={`col-span-3 ${reportStyle.textNormalBold}`}>
          แพทย์ผู้ตรวจร่างกาย
        </div>
      </div>
      <div
        className={`w-full h-[320px] grid grid-cols-12 pt-2 ${reportStyle.textNormal}`}
      >
        <div className="text-right">(</div>
        <div className="col-span-3 text-center">{name}</div>
        <div className="text-left">)</div>
        <div className="text-right">(</div>
        <div className="col-span-3 text-center">{tempData.user_fullname}</div>
        <div className="text-left">)</div>
      </div>
      <div
        className={`w-full grid grid-cols-12 pt-2  ${reportStyle.textNormal}`}
      >
        <div className="col-span-8 text-right"></div>

        <div className={`col-span-4 text-right flex justify-end ${reportStyle.textNormal}`}>
          <div className="pr-2">พิมพ์เมื่อ</div>
          <ComFormat
            type={"date"}
            input={new Date().toISOString()}
            mode={"F2"}
          ></ComFormat>
        </div>
      </div>
    </>
  );
}
