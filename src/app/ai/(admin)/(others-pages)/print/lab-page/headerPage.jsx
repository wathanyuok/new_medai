"use client";
import React from "react";
import reportStyle from "../report.module.css";
import ComFormat from "../../common/comFormat";
import Image from "next/image";
import logo from "/public/images/icons/apsx_logo.png";
import notImg from "/public/images/icons/no-pictures.png";

export default function headerPage({ labData }) {
  let tempData = labData;
  let shop = tempData.shop;
  let customer = tempData.customer;
  let labList = tempData.checks;
  let lastLabDate = "";

  let shopAddress = `${shop.shop_address} ${shop.shop_district} ${shop.shop_amphoe} ${shop.shop_province} ${shop.shop_zipcode}`;

  const formatDate = (string) => {
    if (string != null) {
      const date = new Date(string); // Parse the date string

      // Extract year, month, and day in the desired format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");

      // Combine into the desired format: yyyy-MM-dd
      return `${day}/${month}/${year}`;
    } else {
      return string; // Return as is if null or undefined
    }
  };

  labList.sort((a, b) => new Date(b.chk_datetime) - new Date(a.chk_datetime));
  if (labList) {
    lastLabDate = `${formatDate(
      new Date(labList[0].chk_datetime).toISOString()
    )}`;
  }
  return (
    <>
      {/* Header */}
      <div
        className={`pb-2 w-full flex items-start justify-between ${reportStyle.borderBottom} ${reportStyle.textNormal}`}
      >
        <div className="flex" style={{ width: "75%" }}>
          <div className="flex items-center" style={{ width: 120 }}>
            <img alt="logo" src={labData.shop.shop_image || notImg} />
          </div>

          <div className="flex flex-col px-2">
            <span className={reportStyle.textNormalBold14}>
              {labData ? labData.shop.shop_name : ""}
            </span>
            <span className={reportStyle.textNormal}>{shopAddress}</span>
            <span className={reportStyle.textNormal}>
              โทร {shop?.shop_phone} อีเมล {shop.shop_email}
            </span>
            <span className={reportStyle.textNormal}>
              เลขที่ใบอนุญาต {shop.shop_license} เลขประจำตัวผู้เสียภาษี
              {` ${shop.shop_company_tax}`}
            </span>
          </div>
        </div>
        <div className={`flex flex-col items-start ${reportStyle.textNormal}`}>
          <a href="#" className={reportStyle.textNormalBold}>
            ใบผลตรวจแล็บ(Lab)
          </a>
          <span>
            <a className={`pr-2 ${reportStyle.textNormalBold}`}>เลขที่:</a>
            {tempData.que_code}
          </span>
          <span>
            <a className={`pr-2 ${reportStyle.textNormalBold}`}>พิมพ์วันที่:</a>
            <ComFormat
              type={"date"}
              input={new Date().toISOString()}
              mode={"F1"}
            ></ComFormat>
          </span>
        </div>
      </div>
      <div>
        <div className="flex py-2">
          <div className="flex flex-col">
            <span className={reportStyle.textNormal}>
              HN:{` ${customer.ctm_id}`}
            </span>
            <div className={`flex justify-start ${reportStyle.textNormal}`}>
              <div className="w-56">
                ชื่อ-สกุล
                {` ${
                  customer.ctm_prefix == "ไม่ระบุ" ? "" : customer.ctm_prefix
                } ${customer.ctm_fname} ${customer.ctm_lname} `}
              </div>
              <div className="w-36">
                <span className="pr-2">อายุ</span>
                <ComFormat
                  type={"age"}
                  input={new Date(customer.ctm_birthdate).toISOString()}
                  mode={"F1"}
                ></ComFormat>
              </div>
              <div className="w-36"> กรุ๊ปเลือด {customer.ctm_blood}</div>
            </div>
            <div className={`flex justify-start ${reportStyle.textNormal}`}>
              <div className="w-56">โรคประจำตัว {customer.ctm_disease}</div>
              <div className="w-48">แพ้ยา {customer.ctm_allergic}</div>
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <div>
            <span className={reportStyle.textNormalBold}>
              รายงานผลการตรวจทางห้องปฎิบัติการ
            </span>
          </div>
          <div>
            <span className={reportStyle.textNormal}>
              วันเข้ารับการตรวจ : {lastLabDate}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
