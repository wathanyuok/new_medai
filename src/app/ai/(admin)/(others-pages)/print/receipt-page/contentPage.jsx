import React from "react";
import localStyle from "./localStyle.module.css";
import reportStyle from "../report.module.css";

export default function contentPage({ indexPaper, list }) {
  const obj = {
    id: "",
    recd_name: "",
    recd_qty: "",
    recd_price: "",
    recd_unit: "",
    recd_discount: "",
    recd_total: "",
  };

  const itemInPaper = 20;

  let newList = [];

  let dataList = list;
  let indexNumber = "";

  dataList.forEach((element) => {
    newList.push(element);
  });
  // console.log(newList.length);
  if (newList.length < itemInPaper) {
    let num = itemInPaper - newList.length;
    for (let i = 0; i < num; i++) {
      // console.log(i);
      newList.push(obj);
    }
  }

  dataList = newList;

  return (
    <>
      <div className="w-full ">
        <table className="w-full">
          <thead>
            <tr
              className={`w-full ${reportStyle.gridCol18} ${localStyle.colHeader}`}
              style={{ fontSize: "9px" }}
            >
              <th
                className={` ${reportStyle.gridColSpan7} ${localStyle.colTitle} ${localStyle.colHeaderBorder}`}
              >
                <div>รายละเอียด</div>
              </th>
              <th
                className={`${reportStyle.gridColSpan1} ${localStyle.colTitle} ${localStyle.colHeaderBorder}`}
              >
                <div>จำนวน</div>
              </th>
              <th
                className={`${reportStyle.gridColSpan2} ${localStyle.colTitle} ${localStyle.colHeaderBorder}`}
              >
                <div>ราคา/หน่วย</div>
              </th>
              <th
                className={`${reportStyle.gridColSpan2} ${localStyle.colTitle} ${localStyle.colHeaderBorder}`}
              >
                <div>หน่วย</div>
              </th>
              <th
                className={`${reportStyle.gridColSpan3} ${localStyle.colTitle} ${localStyle.colHeaderBorder}`}
              >
                <div>ส่วนลด/หน่วย</div>
              </th>
              <th
                className={`${reportStyle.gridColSpan3} ${localStyle.colTitle}`}
              >
                <div>ยอดรวม</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {dataList.map((item, index) => {
              if (item.id != "") {
                indexNumber = `${
                  index + 1 + ((indexPaper + 1) * itemInPaper - itemInPaper)
                })`;
              } else {
                indexNumber = "";
              }

              return (
                <tr
                  key={index + 1}
                  className={`w-full ${reportStyle.gridCol18} ${reportStyle.textNormal}`}
                >
                  <td
                    className={`${reportStyle.gridColSpan7} ${localStyle.colRowLeft} ${localStyle.colBorderStart}`}
                  >
                    <div className="pl-2">
                      {indexNumber} {item.recd_name}
                    </div>
                  </td>
                  <td
                    className={`${localStyle.colRowCenter} ${localStyle.colBorder}`}
                  >
                    <div>{item.recd_qty.toLocaleString()}</div>
                  </td>
                  <td
                    className={`${reportStyle.gridColSpan2} ${localStyle.colRowRight} ${localStyle.colBorder}`}
                  >
                    <div>
                      {indexNumber == ""
                        ? ""
                        : `${item.recd_price.toLocaleString()} ฿`}
                    </div>
                  </td>
                  <td
                    className={`${reportStyle.gridColSpan2} ${localStyle.colRowCenter} ${localStyle.colBorder}`}
                  >
                    <div className="pr-2">{item.recd_unit}</div>
                  </td>
                  <td
                    className={`${reportStyle.gridColSpan3} ${localStyle.colRowRight} ${localStyle.colBorder}`}
                  >
                    <div className="pl-2">
                      {indexNumber == ""
                        ? ""
                        : `${item.recd_discount.toLocaleString()} ฿`}
                    </div>
                  </td>
                  <td
                    className={`${reportStyle.gridColSpan3} ${localStyle.colRowRight} ${localStyle.colBorder}`}
                  >
                    <div className="pl-2">
                      {indexNumber == ""
                        ? ""
                        : `${item.recd_total.toLocaleString()} ฿`}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
