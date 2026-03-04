import React from "react";

import notImg from "/public/images/icons/no-pictures.png";
// import notImg from "/public/images/icons/no-pictures.png";
import reportStyle from "../report.module.css";

export default function contentPage({ prop }) {
  let tempData = prop;
  let checkList = tempData.checks;
  let xrayImgBefore = "";
  let xrayImgAfter = "";
  let rec_user_fullname = "";
  if (checkList.length > 0) {
    checkList.sort((a, b) => {
      let da = new Date(a.chk_datetime),
        db = new Date(b.chk_datetime);
      return db - da;
    });
    xrayImgBefore = checkList[0].chk_old;
    xrayImgAfter = checkList[0].chk_upload;
    rec_user_fullname = checkList[0].rec_user_fullname;
    // if (checkList.length > 1) {
    //   xrayImgBefore = checkList[1].chk_upload;
    // }
  }

  return (
    <>
      <div className={`w-full mb-4 ${reportStyle.textNormal}`}>
        <div className="grid grid-cols-2 .gap-4 border border-black">
          <div className="flex flex-col items-center border-r border-black">
            <h2
              className={`text-center font-semibold text-lg py-2 ${reportStyle.textNormalBold}`}
            >
              ก่อน
            </h2>
            {xrayImgBefore != '' ? (
              <img alt="logo" width={400}
                height={400} src={xrayImgBefore || notImg} />
              // <Image
              //   src={xrayImgBefore}
              //   alt="before"
              //   className="w-full"
              //   width={400}
              //   height={400}
              // />
            ) :
              (<div className="w-[300px] h-[300px]"></div>)}
            <div
              className={`flex justify-center items-center mt-2 ${reportStyle.textNormalBold}`}
            >

            </div>
            {/* <p className="mt-4 border-t border-black w-full pt-2 text-left px-4">
              <span className={reportStyle.textNormalBold}>หมายเหตุ:</span>{" "}
              {tempData.que_note}
            </p> */}
          </div>

          <div className="flex flex-col items-center">
            <h2
              className={`text-center font-semibold text-lg py-2 ${reportStyle.textNormalBold}`}
            >
              หลัง
            </h2>
            {xrayImgAfter != '' ? (
              <img alt="logo" width={400}
                height={400} src={xrayImgAfter || notImg} />
            ) : (<div className="w-[300px] h-[300px]"></div>)}
            {/* <Image
              src={xrayImgAfter || notImg}
              alt="after"
              className="w-full"
              width={400}
              height={400}
            /> */}
            <div
              className={`flex justify-center items-center mt-2 ${reportStyle.textNormalBold}`}
            >

            </div>
            <p className="mt-4 border-t border-black w-full pt-2 text-left px-4">
              <span className={reportStyle.textNormalBold}>
                แพทย์ (ผู้ดำเนินการ):
              </span>{" "}
              {tempData.que_xray_analyst} {" ,"} {tempData.que_xray_analyst_license}
            </p>
          </div>
        </div>
      </div>
      <div
        className={`w-full h-[200px] grid grid-cols-12 pt-2 ${reportStyle.textNormal}`}
      >
        <div className={`text-left ${reportStyle.textNormalBold}`}>
          หมายเหตุ
        </div>

        <div
          className={`col-span-11 text-left h-48 flex flex-column ${reportStyle.textNormal} ${reportStyle.textOverBox}`}
        >
          {tempData.que_note}
        </div>
      </div>
    </>
  );
}
