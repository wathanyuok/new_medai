import React from "react";
import reportStyle from "../report.module.css";
import localStyle from "./localStyle.module.css"

export default function pageFooter({ prop }) {
  return (
    <>
      <div
        className={`w-full py-2 grid grid-cols-12 ${localStyle.textNormal}`}
      >
        <div className={`col-span-5 ${localStyle.textNormalBold}`}></div>
        <div className={`text-right ${localStyle.textNormalBold}`}>ลงชื่อ</div>
        <div className={`col-span-3 ${reportStyle.borderBottomDot}`}></div>
        <div className={`col-span-3 ${localStyle.textNormalBold}`}>
          แพทย์ผู้ตรวจร่างกาย
        </div>
      </div>
      <div
        className={`w-full h-[200px] grid grid-cols-12 pt-2 ${localStyle.textNormal}`}
      >
        <div className={`text-left ${localStyle.textNormalBold}`}>
          หมายเหตุ
        </div>

        <div
          className={`col-span-11 text-left h-48 flex flex-column ${localStyle.textNormalItalic}`}
        >
          <span>
            (1) ต้องเป็นแพทย์ซึ่งได้ขึ้นทะเบียนรับใบอนุญาตประกอบวิชาชีพเวชกรรม
          </span>
          <span>
            (2) ให้แสดงว่าเป็นผู้มีร่างกายสมบูรณ์เพียงใด
            ใบรับรองแพทย์ฉบับนี้ให้ใช้ได้ 1 เดือนนับแต่วันที่ตรวจร่างกาย
          </span>
          <span>(3) คำรับรองนี้เป็นการตรวจวินิจฉัยเบื้องต้น</span>
          <span>
            แบบฟอร์มนี้ได้รับการรับรองจากมติคณะกรรมการแพทยสภาในการประชุมครั้งที่
            4/2561 วันที่ 19 เมษายน 2561
          </span>
        </div>
      </div>
    </>
  );
}
