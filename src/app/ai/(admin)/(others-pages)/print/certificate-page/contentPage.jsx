import React from "react";
import localStyle from "./localStyle.module.css";
import reportStyle from "../report.module.css";
import checkIcon from "/public/images/icons/check.png";
import Image from "next/image";
import ComFormat from "../../common/comFormat";

export default function contentPage({ prop }) {
  let tempData = prop;
  let shop = tempData.shop;
  let customer = tempData.customer;
  const addressStr = `${shop.shop_company_name} ${shop.shop_address} ${
    shop.shop_district
  } \n ${shop.shop_amphoe} ${shop.shop_province}  ${shop.shop_zipcode} โทร ${
    shop.shop_phone || "-"
  }`;
  const historyStr = `${tempData.opd_hpi}`;
  const lapStr = `${tempData.opd_dx}`;
  let name = ` ${customer.ctm_prefix == "ไม่ระบุ" ? "" : customer.ctm_prefix} ${
    customer.ctm_fname
  } ${customer.ctm_lname} `;
  let hosAddress = {
    line1: "",
    line2: "",
  };

  let historyLine = {
    line1: "",
    line2: "",
    line3: "",
  };

  let lapLine = {
    line1: "",
    line2: "",
    line3: "",
  };

  function textSplit(text, code) {
    let addList = text.split("\n");
    switch (code) {
      case "hospital":
        addList.forEach((element, index) => {
          if (index == 0) {
            hosAddress.line1 = element;
          } else if (index == 1) {
            hosAddress.line2 = element;
          }
        });
        break;
      case "history":
        addList.forEach((element, index) => {
          if (index == 0) {
            historyLine.line1 = element;
          } else if (index == 1) {
            historyLine.line2 = element;
          } else if (index == 2) {
            historyLine.line3 = element;
          }
        });
        break;
      case "lap":
        addList.forEach((element, index) => {
          if (index == 0) {
            lapLine.line1 = element;
          } else if (index == 1) {
            lapLine.line2 = element;
          } else if (index == 2) {
            lapLine.line3 = element;
          }
        });
        break;
      default:
        hosAddress = {
          line1: "",
          line2: "",
        };
        break;
    }
  }

  textSplit(addressStr, "hospital");
  textSplit(historyStr, "history");
  textSplit(lapStr, "lap");
  return (
    <>
      <div className={`w-full pb-4 ${reportStyle.textNormal}`}>
        <div
          className={`w-full grid grid-cols-12 ${reportStyle.textNormalBold}`}
        >
          <div className="col-span-7"></div>
          <div className={`col-span-2 text-right`}>เลขที่</div>
          <div className={`col-span-3 pl-2 ${reportStyle.borderBottomDot}`}>
            {tempData.opd_code}
          </div>
        </div>
      </div>

      <div className={`w-full pb-2 text-left ${reportStyle.textNormalBold}`}>
        สถานพยาบาล
      </div>
      <div className={`w-full pb-6 text-left ${reportStyle.textNormal}`}>
        <span className={`h-5 ${reportStyle.underlineDot}`}>
          {hosAddress.line1}
        </span>
        <span className={`h-5 ${reportStyle.underlineDot}`}>
          {hosAddress.line2}
        </span>
      </div>
      <div
        className={`w-full pb-2 ${localStyle.gridCol18} ${reportStyle.textNormal}`}
      >
        <div>ข้าพเจ้า</div>
        <div
          className={`pl-2 ${localStyle.gridColSpan7} ${reportStyle.borderBottomDot}`}
        >
          {tempData.user_fullname}
        </div>
        <div className={` text-center ${localStyle.gridColSpan6}`}>
          ใบอนุญาติประกอบวิชาเวชกรรมเลขที่
        </div>
        <div
          className={`${localStyle.gridColSpan4} ${reportStyle.borderBottomDot}`}
        >
          {tempData.user_license}
        </div>
      </div>
      <div
        className={`w-full pb-2 ${localStyle.gridCol18} ${reportStyle.textNormal}`}
      >
        <div className={`${localStyle.gridColSpan4} `}>ได้ตรวจร่างกาย ของ</div>
        <div
          className={`${localStyle.gridColSpan10} ${reportStyle.borderBottomDot}`}
        >
          {name}
        </div>
        <div className={`text-center ${localStyle.gridColSpan1}`}>อายุ</div>
        <div
          className={`${localStyle.gridColSpan3} ${reportStyle.borderBottomDot}`}
        >
          <ComFormat
            type={"age"}
            input={new Date(customer.ctm_birthdate).toISOString()}
            mode={"F2"}
          ></ComFormat>
        </div>
      </div>
      <div
        className={`w-full pb-2 ${localStyle.gridCol18} ${reportStyle.textNormal}`}
      >
        <div className={`${localStyle.gridColSpan5} `}>
          เลขที่บัตรประจำตัวประชาชน
        </div>
        <div
          className={`${localStyle.gridColSpan9} ${reportStyle.borderBottomDot}`}
        >
          {customer.ctm_citizen_id}
        </div>
      </div>
      <div
        className={`w-full pb-2 h-5 ${localStyle.gridCol18} ${reportStyle.textNormal}`}
      >
        <div
          className={`text-right ${localStyle.gridColSpan5} ${reportStyle.textNormalBold}`}
        >
          ประวัติ / อาการสำคัญ
        </div>
        <div
          className={`pl-2 ${localStyle.gridColSpan13} ${reportStyle.borderBottomDot}`}
        >
          {historyLine.line1}
        </div>
      </div>
      <div className={`w-full pb-6 text-left ${reportStyle.textNormal}`}>
        <span className={`h-5 ${reportStyle.underlineDot}`}>
          {historyLine.line2}
        </span>
        <span className={`h-5 ${reportStyle.underlineDot}`}>
          {historyLine.line3}
        </span>
      </div>
      <div
        className={`w-full pb-2 h-5 ${localStyle.gridCol18} ${reportStyle.textNormal}`}
      >
        <div
          className={`text-right ${localStyle.gridColSpan4} ${reportStyle.textNormalBold}`}
        >
          ผลการวินิจฉัย
        </div>
        <div
          className={`pl-2 ${localStyle.gridColSpan14} ${reportStyle.borderBottomDot}`}
        >
          {lapLine.line1}
        </div>
      </div>
      <div className={`w-full pb-6 text-left ${reportStyle.textNormal}`}>
        <span className={`h-5 ${reportStyle.underlineDot}`}>
          {lapLine.line2}
        </span>
        <span className={`h-5 ${reportStyle.underlineDot}`}>
          {lapLine.line3}
        </span>
      </div>

      <div className={`w-full pb-6 text-left ${reportStyle.textNormalBold}`}>
        มีความเห็น
      </div>

      <div
        className={`w-full pb-6 h-5 ${localStyle.gridCol18} ${reportStyle.textNormal}`}
      >
        <div className={`text-right ${localStyle.gridColSpan1} `}></div>
        <div
          className={`flex items-center justify-around ${localStyle.gridColSpan2} ${reportStyle.textNormalBold}`}
        >
          (
          {tempData.opd_sick_air == 2 ? (
            <Image
              src={checkIcon}
              alt="check"
              width={20}
              height={20}
              className="img-fluid"
            />
          ) : (
            <div></div>
          )}
          )
        </div>
        <div
          className={`text-center ${localStyle.gridColSpan3} ${reportStyle.textNormalBold}`}
        >
          ได้รับการตรวจจริง
        </div>
        <div className={`text-center ${localStyle.gridColSpan1} `}>วันที่</div>
        <div
          className={`pl-2 text-center  ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_sick_air == 2 ? (
            <ComFormat
              type={"date_th"}
              input={new Date(tempData.opd_date).toISOString()}
              mode={"D"}
            ></ComFormat>
          ) : (
            <div></div>
          )}
        </div>
        <div className={`text-center ${localStyle.gridColSpan1} `}>เดือน</div>
        <div
          className={`pl-2 text-center  ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_sick_air == 2 ? (
            <ComFormat
              type={"date_th"}
              input={new Date(tempData.opd_date).toISOString()}
              mode={"M"}
            ></ComFormat>
          ) : (
            <div></div>
          )}
        </div>
        <div className={`text-center ${localStyle.gridColSpan1} `}>พ.ศ. </div>
        <div
          className={`pl-2 text-center  ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_sick_air == 2 ? (
            <ComFormat
              type={"date_th"}
              input={new Date(tempData.opd_date).toISOString()}
              mode={"Y"}
            ></ComFormat>
          ) : (
            <div></div>
          )}
        </div>
      </div>
      <div
        className={`w-full pb-6 h-5 ${localStyle.gridCol18} ${reportStyle.textNormal}`}
      >
        <div className={`text-right ${localStyle.gridColSpan1} `}></div>
        <div
          className={`flex items-center justify-around ${localStyle.gridColSpan2} ${reportStyle.textNormalBold}`}
        >
          (
          {tempData.opd_sick_notrest == 2 ? (
            <Image
              src={checkIcon}
              alt="check"
              width={20}
              height={20}
              className="img-fluid"
            />
          ) : (
            <div></div>
          )}
          )
        </div>
        <div
          className={`text-center ${localStyle.gridColSpan3} ${reportStyle.textNormalBold}`}
        >
          เห็นควรให้หยุดพัก
        </div>
        <div className={`text-center ${localStyle.gridColSpan1} `}>วันที่</div>
        <div
          className={`pl-2 text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_sick_notrest == 2 ? (
            <ComFormat
              type={"date_th"}
              input={new Date(tempData.opd_sick_startdate).toISOString()}
              mode={"D"}
            ></ComFormat>
          ) : (
            <div></div>
          )}
        </div>
        <div className={`text-center ${localStyle.gridColSpan1} `}>เดือน</div>
        <div
          className={`pl-2 text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_sick_notrest == 2 ? (
            <ComFormat
              type={"date_th"}
              input={new Date(tempData.opd_sick_startdate).toISOString()}
              mode={"M"}
            ></ComFormat>
          ) : (
            <div></div>
          )}
        </div>
        <div className={`text-center ${localStyle.gridColSpan1} `}>พ.ศ. </div>
        <div
          className={`pl-2 text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_sick_notrest == 2 ? (
            <ComFormat
              type={"date_th"}
              input={new Date(tempData.opd_sick_startdate).toISOString()}
              mode={"Y"}
            ></ComFormat>
          ) : (
            <div></div>
          )}
        </div>
        <div className={`text-center ${localStyle.gridColSpan1} `}>ถึง </div>
      </div>
      <div
        className={`w-full pb-6 h-5 ${localStyle.gridCol18} ${reportStyle.textNormal}`}
      >
        <div className={`text-center ${localStyle.gridColSpan6} `}></div>

        <div className={`text-center ${localStyle.gridColSpan1} `}>วันที่</div>
        <div
          className={`pl-2 text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_sick_notrest == 2 ? (
            <ComFormat
              type={"date_th"}
              input={new Date(tempData.opd_sick_enddate).toISOString()}
              mode={"D"}
            ></ComFormat>
          ) : (
            <div></div>
          )}
        </div>
        <div className={`text-center ${localStyle.gridColSpan1} `}>เดือน</div>
        <div
          className={`pl-2 text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_sick_notrest == 2 ? (
            <ComFormat
              type={"date_th"}
              input={new Date(tempData.opd_sick_enddate).toISOString()}
              mode={"M"}
            ></ComFormat>
          ) : (
            <div></div>
          )}
        </div>
        <div className={`text-center ${localStyle.gridColSpan1} `}>พ.ศ. </div>
        <div
          className={`pl-2 text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_sick_notrest == 2 ? (
            <ComFormat
              type={"date_th"}
              input={new Date(tempData.opd_sick_enddate).toISOString()}
              mode={"Y"}
            ></ComFormat>
          ) : (
            <div></div>
          )}
        </div>
        <div className={`text-center ${localStyle.gridColSpan1} `}></div>
      </div>
      <div
        className={`w-full pb-10 h-5 ${localStyle.gridCol18} ${reportStyle.textNormal}`}
      >
        <div className={`text-center ${localStyle.gridColSpan6} `}></div>

        <div className={`text-center ${localStyle.gridColSpan1} `}>รวม</div>
        <div
          className={`pl-2 text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_sick_notrest == 2 ? (
            <ComFormat
              type={"compareDates"}
              startDate={new Date(tempData.opd_sick_startdate).toISOString()}
              endDate={new Date(tempData.opd_sick_enddate).toISOString()}
              mode={"D"}
            ></ComFormat>
          ) : (
            <div></div>
          )}
        </div>
        <div className={`text-center ${localStyle.gridColSpan1} `}>วัน</div>
      </div>
    </>
  );
}
