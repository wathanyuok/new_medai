import React from "react";
import reportStyle from "../report.module.css";
import ComFormat from "../../common/comFormat";
import Image from "next/image";
import logo from "/public/images/icons/apsx_logo.png";
import notImg from "/public/images/icons/no-pictures.png";

export default function headerPage({ maxPaper, indexPaper, prop }) {
  let tempData = prop;
  let shop = tempData.shop;
  let customer = tempData.customer;

  const addressStr = `${shop.shop_address} ${shop.shop_district} ${shop.shop_amphoe} ${shop.shop_province}  ${shop.shop_zipcode}`;
  const cusAddressStr = ` ${customer.ctm_address} ตำบล/แขวง ${customer.ctm_district}  อำเภอ/เขต ${customer.ctm_amphoe} จังหวัด ${customer.ctm_province}  ${customer.ctm_zipcode} `;
  let name = ` ${customer.ctm_prefix == "ไม่ระบุ" ? "" : customer.ctm_prefix} ${
    customer.ctm_fname
  } ${customer.ctm_lname} `;

  return (
    <>
      {/* Header */}
      <div
        className={`pb-2 w-full flex items-start justify-between ${reportStyle.borderBottom}`}
      >
        <div className="d-flex" style={{ width: "70%" }}>
          <div className="flex items-center" style={{ width: 120 }}>
            <Image alt="logo" src={logo || notImg} />
          </div>
          <div className="flex flex-column px-2">
            <span className={reportStyle.textNormalBold14}>
              {shop.shop_name}
            </span>
            <span className={reportStyle.textNormal}>{addressStr}</span>
            <span className={reportStyle.textNormal}>
              โทร {shop.shop_phone} อีเมล {shop.shop_email}
            </span>
            <span className={reportStyle.textNormal}>
              เลขที่ใบอนุญาต {shop.shop_license}
            </span>
            <span className={reportStyle.textNormal}>
              เลขประจำตัวผู้เสียภาษี {shop.shop_company_tax}
            </span>
          </div>
        </div>
        <div className={`flex flex-col items-end ${reportStyle.textNormal}`}>
          <a href="#" className={`${reportStyle.textNormal}`}>
            หน้า {indexPaper + 1}/{maxPaper}
          </a>
          <a href="#" className={reportStyle.textNormalBold}>
            ใบเสร็จรับเงิน
          </a>
          <span>
            <a className={`pr-2 ${reportStyle.textNormalBold}`}>
              เลขที่เอกสาร:
            </a>
            {tempData.rec_code}
          </span>
          <span>
            <a className={`pr-2 ${reportStyle.textNormalBold}`}>
              เอกสารอ้างอิง:
            </a>
            {tempData.inv_code}
          </span>
          <span>
            <a className={`pr-2 ${reportStyle.textNormalBold}`}>วันที่:</a>
            <ComFormat
              type={"date"}
              input={new Date().toISOString()}
              mode={"F1"}
            ></ComFormat>
          </span>
        </div>
      </div>
      <div>
        <div className="d-flex pt-2">
          <div className="flex flex-column">
            <span className={reportStyle.textNormalBold}>
              ผู้รับบริการ {name} รหัสลูกค้า {customer.ctm_id}
            </span>
          </div>
        </div>
        <div className="flex justify-between pb-1">
          <div className={`w-1/2 ${reportStyle.textNormal}`}>
            <div>{cusAddressStr}</div>
            <div>
              โทร {customer.ctm_tel} อีเมล {customer.ctm_email}
            </div>
          </div>
          <div style={{ width: "50%" }}>
            <div className={`flex justify-end ${reportStyle.textNormal}`}>
              <a href="#" className={`pr-2 ${reportStyle.textNormalBold}`}>
                เลขที่บัตรประชาชน
              </a>
              {customer.ctm_citizen_id}
            </div>
            <div className={`flex justify-end ${reportStyle.textNormal}`}>
              <div className="w-36 flex justify-between pr-2">
                <div className={reportStyle.textNormalBold}>แต้มคงเหลือ:</div>
                <div>{customer.ctm_point.toLocaleString()}</div>
              </div>
              <div className="w-48 flex justify-between">
                <div className={reportStyle.textNormalBold}>วงเงินคงเหลือ:</div>
                <div>{customer.ctm_coin.toLocaleString()} ฿</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
