import React from "react";
import reportStyle from "../report.module.css";
import localStyle from "./localStyle.module.css";
import ComFormat from "../../common/comFormat";

export default function pageFooter({ prop }) {
  let tempData = prop;
  let customer = tempData.customer;
  let name = ` ${customer.ctm_prefix == "ไม่ระบุ" ? "" : customer.ctm_prefix} ${
    customer.ctm_fname
  } ${customer.ctm_lname} `;

  return (
    <>
      <table className="w-full">
        <tbody>
          <tr
            className={`text-right ${reportStyle.textNormal} ${reportStyle.gridCol18} ${localStyle.colBorderFooter}`}
          >
            <td
              className={`${reportStyle.textNormalBold} ${reportStyle.gridColSpan7} ${localStyle.colBorderStart}`}
            >
              <div className="pr-2">รวมส่วนลด:</div>
            </td>
            <td
              className={` ${reportStyle.gridColSpan3} ${localStyle.colBorder}`}
            >
              <div className="pr-2">
                {tempData.rec_discount.toLocaleString()} ฿
              </div>
            </td>
            <td
              className={` ${reportStyle.textNormalBold} ${reportStyle.gridColSpan5} ${localStyle.colBorder}`}
            >
              <div className="pr-2">ยอดรวม:</div>
            </td>
            <td
              className={`${reportStyle.gridColSpan3} ${localStyle.colBorder}`}
            >
              <div className="pr-2">
                {tempData.rec_total_price.toLocaleString()} ฿
              </div>
            </td>
          </tr>
          <tr
            className={`text-right ${reportStyle.textNormal} ${reportStyle.gridCol18}`}
          >
            <td
              className={`${reportStyle.textNormalBold} ${reportStyle.gridColSpan7} ${localStyle.colBorderStart}`}
            >
              <div className="pr-2">ประเภทภาษี (ไม่มีภาษี):</div>
            </td>
            <td
              className={` ${reportStyle.gridColSpan3} ${localStyle.colBorder}`}
            >
              <div className="pr-2">{tempData.rec_vat.toLocaleString()} ฿</div>
            </td>
            <td
              className={` ${reportStyle.textNormalBold} ${reportStyle.gridColSpan5} ${localStyle.colBorder}`}
            >
              <div className="pr-2">รวมสุทธิ:</div>
            </td>
            <td
              className={`${reportStyle.gridColSpan3} ${localStyle.colBorder}`}
            >
              <div className="pr-2">
                {tempData.rec_total.toLocaleString()} ฿
              </div>
            </td>
          </tr>
          <tr
            className={`text-right ${reportStyle.textNormal} ${reportStyle.gridCol18}`}
          >
            <td
              className={`text-center  ${reportStyle.textNormalBold} ${reportStyle.gridColSpan18} ${localStyle.colBorderStart}`}
              style={{ backgroundColor: "rgb(229 231 235)" }}
            >
              <div>
                (
                <ComFormat
                  type={"numToString-th"}
                  input={tempData.rec_pay_total}
                  mode={""}
                ></ComFormat>
                )
              </div>
            </td>
          </tr>
          <tr
            className={`text-center pt-2 ${reportStyle.textNormalBold} ${reportStyle.gridCol18}`}
          >
            <td className={`text-left ${reportStyle.gridColSpan4}  `}>
              <div>สถานะการชำระ:</div>
            </td>
            <td className={` ${reportStyle.gridColSpan7} `}>
              <div>(ผู้รับบริการ)</div>
            </td>
            <td className={`${reportStyle.gridColSpan7} `}>
              <div>(ผู้รับเงิน)</div>
            </td>
          </tr>
          <tr
            className={`text-center  ${reportStyle.textNormal} ${reportStyle.gridCol18}`}
          >
            <td className={`flex text-left ${reportStyle.gridColSpan6}  `}>
              <div className={reportStyle.textNormalBold}>ช่องทางชำระเงิน:</div>
              <div className="pl-2">{tempData.rec_payment_type_th}</div>
            </td>
          </tr>
          <tr
            className={`text-center ${reportStyle.textNormal} ${reportStyle.gridCol18}`}
          >
            <td
              className={`flex justify-between ${reportStyle.gridColSpan4}  `}
            >
              <div className={reportStyle.textNormalBold}>
                งวดที่ {tempData.rec_period}
              </div>
              <div className="pl-2 text-right">
                {tempData.rec_pay_total.toLocaleString()} ฿
              </div>
            </td>
            <td className={reportStyle.gridColSpan1}></td>
            <td
              className={`${reportStyle.gridColSpan5} ${reportStyle.borderBottom}`}
            ></td>
            <td className={reportStyle.gridColSpan2}></td>
            <td
              className={`${reportStyle.gridColSpan5} ${reportStyle.borderBottom}`}
            ></td>
            <td className={reportStyle.gridColSpan1}></td>
          </tr>
          <tr
            className={`text-center  ${reportStyle.textNormal} ${reportStyle.gridCol18}`}
          >
            <td
              className={`flex justify-between ${reportStyle.gridColSpan4}  `}
            >
              <div className={reportStyle.textNormalBold}>คงเหลือ:</div>
              <div className="pl-2">
                {tempData.rec_balance.toLocaleString()} ฿
              </div>
            </td>
            <td className={reportStyle.gridColSpan1}>(</td>
            <td
              className={`${reportStyle.gridColSpan5} ${reportStyle.borderBottom}`}
            >
              {name}
            </td>
            <td className={reportStyle.gridColSpan2}>) (</td>
            <td
              className={`${reportStyle.gridColSpan5} ${reportStyle.borderBottom}`}
            >
              {tempData.rec_user_fullname}
            </td>
            <td className={reportStyle.gridColSpan1}>)</td>
          </tr>
          <tr
            className={`text-center pt-2 ${reportStyle.textNormal} ${reportStyle.gridCol18}`}
          >
            <td className={`${reportStyle.gridColSpan4}  `}></td>
            <td className={reportStyle.gridColSpan2}></td>
            <td
              className={`${reportStyle.gridColSpan3} ${reportStyle.borderBottom}`}
            >
              <ComFormat
                type={"date"}
                input={new Date().toISOString()}
                mode={"F1"}
              ></ComFormat>
            </td>
            <td className={reportStyle.gridColSpan4}></td>
            <td
              className={`${reportStyle.gridColSpan3} ${reportStyle.borderBottom}`}
            >
              <ComFormat
                type={"date"}
                input={new Date().toISOString()}
                mode={"F1"}
              ></ComFormat>
            </td>
            <td className={reportStyle.gridColSpan2}></td>
          </tr>
          <tr
            className={`text-center pt-2 ${reportStyle.textNormal} ${reportStyle.gridCol18}`}
          >
            <td className={`flex text-left h-28 ${reportStyle.gridColSpan18} `}>
              <span className={` w-full  ${reportStyle.textOverBox}`}>
                <a href="#" className={`pr-2 ${reportStyle.textNormalBold}`}>
                  หมายเหตุ:
                </a>
                {tempData.rec_comment}
              </span>
            </td>
          </tr>
          <tr
            className={`text-center ${reportStyle.textNormal} ${reportStyle.gridCol18}`}
          >
            <td
              className={`${reportStyle.gridColSpan18} flex justify-end w-full`}
            >
              <div className="pr-2">พิมพ์เมื่อ</div>
              <ComFormat
                type={"date"}
                input={new Date().toISOString()}
                mode={"F2"}
              ></ComFormat>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
