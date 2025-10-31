import React from "react";
import reportStyle from "../report.module.css";
import ComFormat from "../../common/comFormat";
import Image from "next/image";
import logo from "/public/images/icons/apsx_logo.png";
import notImg from "/public/images/icons/no-pictures.png";

export default function HeaderPage({ prop }) {
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
        <div className="flex" style={{ width: "75%" }}>
          <div className="flex items-center" style={{ width: 120 }}>
           <img alt="logo" src={shop.shop_image || notImg} />
          </div>
          <div className="flex flex-col px-2">
            <span className={reportStyle.textNormalBold14}>
              {shop.shop_name}
            </span>
            <span className={reportStyle.textNormal}>{addressStr}</span>
            <span className={reportStyle.textNormal}>
              โทร {shop.shop_phone}
            </span>
          </div>
        </div>
        <div className={`flex flex-col items-start ${reportStyle.textNormal}`}>
          <span>
            <a className={reportStyle.textNormalBold}>วันที่:</a>{" "}
            <ComFormat
              type={"date"}
              input={new Date().toISOString()}
              mode={"F1"}
            ></ComFormat>
          </span>
          <span>
            <a className={reportStyle.textNormalBold}>ใบเลขที่อนุญาติ: </a>
            {shop.shop_license}
          </span>
        </div>
      </div>

      {/* Patient Information Section */}
      <div className={`py-4 ${reportStyle.textNormal}`}>
        <h1 className="text-center text-lg font-bold mb-4">
          ใบผล X-RAY
        </h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <p>
              <span className="font-bold">ชื่อ-สกุล:</span> {name}
            </p>
            <p>
              <span className="font-bold">เพศ:</span> {customer.ctm_gender}
              <span className="ml-4 font-bold">อายุ:</span>{" "}
              {/* <ComFormat
                type={"age"}
                input={new Date(customer.ctm_birthdate).toISOString()}
                mode={"F2"}
              ></ComFormat> */}
            </p>
            <p>
              <span className="font-bold">เบอร์โทร:</span> {customer.ctm_tel}
            </p>
            <p>
              <span className="font-bold">โรคประจำตัว:</span>{" "}
              {customer.ctm_disease || "-"}
            </p>
          </div>

          <div className={`space-y-2 items-start `}>
            <p>
              <span className="font-bold">HN:</span> {customer.ctm_id}
            </p>
            <p>
              <span className="font-bold">กรุ๊ปเลือด:</span>{" "}
              {customer.ctm_blood}
            </p>
            <div className={`w-full flex text-start ${reportStyle.textNormal}`}>
              <div>
                <span className="font-bold">ที่อยู่: </span>
                {cusAddressStr}
              </div>
              {/* <div className={`w-2/4 ${reportStyle.textOverBox}`}>
                
              </div> */}
            </div>
          </div>

          <div className={`space-y-2 text-left `}>
            <p>
              <span className="font-bold">VN:</span> {tempData.que_code}
            </p>

            <p>
              <span className="font-bold">แพ้ยา:</span>{" "}
              {customer.ctm_allergic || "-"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
