import React from "react";
import reportStyle from "../report.module.css";

export default function pageFooter({ labData }) {
  let tempData = labData;
  let direction_detail = "";
  let labList = tempData.checks;
  labList.sort(
    (a, b) =>
      new Date(b.chk_datetime).toISOString() -
      new Date(a.chk_datetime).toISOString()
  );
  if (labList) {
    direction_detail = labList[0].direction_detail;
  }
  return (
    <>
      <div
        className={` flex flex-col items-start ${reportStyle.textNormal}`}
        style={{ height: "15em" }}
      >
        <span className={reportStyle.textOverBox}>
          <a className={reportStyle.textNormalBold}>คำแนะนำการดูแลตนเอง: </a>
         {direction_detail}
        </span>
      </div>
    </>
  );
}
