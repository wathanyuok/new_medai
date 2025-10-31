import React from "react";
import localStyle from "./localStyle.module.css";
import reportStyle from "../report.module.css";
import checkBoxEmptyIcon from "/public/images/icons/check-box-empty.png";
import checkBoxIcon from "/public/images/icons/check-box.png";
import Image from "next/image";
import ComFormat from "../../common/comFormat";

export default function contentPage({ prop }) {
  let tempData = prop;
  let shop = tempData.shop;
  let customer = tempData.customer;
  const addressStr = `${shop.shop_address} ${shop.shop_district} \n ${
    shop.shop_amphoe
  } ${shop.shop_province}  ${shop.shop_zipcode} โทร ${shop.shop_phone || "-"}`;
  const cusAddressStr = ` ${customer.ctm_address} ตำบล/แขวง ${
    customer.ctm_district
  }  อำเภอ/เขต ${customer.ctm_amphoe} จังหวัด ${customer.ctm_province}  ${
    customer.ctm_zipcode
  } \n โทร ${customer.ctm_tel || "-"}`;
  const historyStr = `${tempData.opd_hpi}`;
  const lapStr = `${tempData.opd_dx}`;
  let name = ` ${customer.ctm_prefix == "ไม่ระบุ" ? "" : customer.ctm_prefix} ${
    customer.ctm_fname
  } ${customer.ctm_lname} `;
  let hosAddress = {
    line1: "",
    line2: "",
  };

  let customerLine = {
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
      case "cusAddr":
        addList.forEach((element, index) => {
          if (index == 0) {
            customerLine.line1 = element;
          } else if (index == 1) {
            customerLine.line2 = element;
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
  textSplit(cusAddressStr, "cusAddr");
  return (
    <>
      {/* path 1 */}
      <div className={`flex pt-1 ${localStyle.textNormalBold14}`}>
        <div className={`px-2  ${reportStyle.headerCardGray}`}>ส่วนที่ 1</div>
        <div className="flex items-center pl-2">ของผู้ขอรับใบรับรองสุขภาพ</div>
      </div>
      <div
        className={`w-full pt-1 ${localStyle.gridCol18} ${localStyle.textNormal}`}
      >
        <div className={` ${localStyle.gridColSpan5} flex`}>
          <div className="pr-2">ข้าพเจ้า </div>
          <div className="line-through decoration-gray-400 ">
            นาย/นาง/นางสาว
          </div>
        </div>
        <div
          className={` ${localStyle.gridColSpan13} ${reportStyle.borderBottomDot}`}
        >
          {name}
        </div>
      </div>
      <div
        className={`w-full pt-1 ${reportStyle.gridCol24} ${localStyle.textNormal}`}
      >
        <div className={` ${reportStyle.gridColSpan7} flex`}>
          <div>สถานที่อยู่ (ที่สามารถติดต่อได้) </div>
        </div>
        <div
          className={`${reportStyle.gridColSpan17} ${reportStyle.borderBottomDot}`}
        >
          {customerLine.line1}
        </div>
      </div>
      <div
        className={`w-full pt-1 ${localStyle.gridCol18} ${localStyle.textNormal}`}
      >
        <div
          className={`pl-2 ${localStyle.gridColSpan18} ${reportStyle.borderBottomDot}`}
        >
          {customerLine.line2}
        </div>
      </div>
      <div className={`pt-1 ${localStyle.textNormal}`}>
        เลขที่บัตรประจำตัวประชาชน {customer.ctm_citizen_id}
      </div>
      <div className={`pt-1 ${localStyle.textNormal}`}>
        ข้าพเจ้าขอใบรับรองสุขภาพ โดยมีประวัติสุขภาพดังนี้
      </div>
      <div
        className={`pt-1 ${localStyle.textNormal} ${reportStyle.gridCol24} `}
      >
        <div>1.</div>
        <div className={`${reportStyle.gridColSpan8}`}>โรคประจำตัว</div>
        <div className={`flex ${reportStyle.gridColSpan2}`}>
          <div className="pr-2">
            <Image
              src={
                customer.ctm_disease == "" ? checkBoxIcon : checkBoxEmptyIcon
              }
              alt="check"
              width={16}
              height={16}
              className="img-fluid"
            />
          </div>
          <div>ไม่มี</div>
        </div>
        <div className={`flex ${reportStyle.gridColSpan2}`}>
          <div className="pr-2">
            <Image
              src={
                customer.ctm_disease == "" ? checkBoxEmptyIcon : checkBoxIcon
              }
              alt="check"
              width={16}
              height={16}
              className="img-fluid"
            />
          </div>
          <div>มี</div>
        </div>
        <div>(ระบุ)</div>
        <div
          className={`pl-2 ${localStyle.gridColSpan10} ${reportStyle.borderBottomDot}`}
        >
          {customer.ctm_disease}
        </div>
      </div>
      <div
        className={`pt-1 ${localStyle.textNormal} ${reportStyle.gridCol24} `}
      >
        <div>2.</div>
        <div className={`${reportStyle.gridColSpan8}`}>
          อุบัติเหตุ และ ผ่าตัด
        </div>
        <div className={`flex ${reportStyle.gridColSpan2}`}>
          <div className="pr-2">
            <Image
              src={checkBoxEmptyIcon}
              alt="check"
              width={16}
              height={16}
              className="img-fluid"
            />
          </div>
          <div>ไม่มี</div>
        </div>
        <div className={`flex ${reportStyle.gridColSpan2}`}>
          <div className="pr-2">
            <Image
              src={checkBoxEmptyIcon}
              alt="check"
              width={16}
              height={16}
              className="img-fluid"
            />
          </div>
          <div>มี</div>
        </div>
        <div>(ระบุ)</div>
        <div
          className={`pl-2 ${localStyle.gridColSpan10} ${reportStyle.borderBottomDot}`}
        ></div>
      </div>
      <div
        className={`pt-1 ${localStyle.textNormal} ${reportStyle.gridCol24} `}
      >
        <div>3.</div>
        <div className={`${reportStyle.gridColSpan8}`}>
          เคยเข้ารับการรักษาในโรงพยาบาล
        </div>
        <div className={`flex ${reportStyle.gridColSpan2}`}>
          <div className="pr-2">
            <Image
              src={checkBoxEmptyIcon}
              alt="check"
              width={16}
              height={16}
              className="img-fluid"
            />
          </div>
          <div>ไม่มี</div>
        </div>
        <div className={`flex ${reportStyle.gridColSpan2}`}>
          <div className="pr-2">
            <Image
              src={checkBoxEmptyIcon}
              alt="check"
              width={16}
              height={16}
              className="img-fluid"
            />
          </div>
          <div>มี</div>
        </div>
        <div>(ระบุ)</div>
        <div
          className={`pl-2 ${localStyle.gridColSpan10} ${reportStyle.borderBottomDot}`}
        ></div>
      </div>
      <div
        className={`pt-1 ${localStyle.textNormal} ${reportStyle.gridCol24} `}
      >
        <div>4.</div>
        <div className={`${reportStyle.gridColSpan4}`}>ประวัติอื่นที่สำคัญ</div>
        <div
          className={`pl-2 ${reportStyle.gridColSpan19} ${reportStyle.borderBottomDot}`}
        >
          {customer.ctm_health_comment}
        </div>
      </div>
      <div className={`pt-2 ${reportStyle.gridCol24} ${localStyle.textNormal}`}>
        <div className={`text-right ${reportStyle.gridColSpan8}`}>ลงชื่อ</div>
        <div
          className={`${localStyle.gridColSpan6} ${reportStyle.borderBottomDot}`}
        ></div>
        <div className={`flex items-center`}>วันที่</div>
        <div
          className={`text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          <ComFormat
            type={"date_th"}
            input={new Date().toISOString()}
            mode={"D"}
          ></ComFormat>
        </div>
        <div className={`flex items-center`}>เดือน</div>
        <div
          className={`text-center ${localStyle.gridColSpan3} ${reportStyle.borderBottomDot}`}
        >
          <ComFormat
            type={"date_th"}
            input={new Date().toISOString()}
            mode={"M"}
          ></ComFormat>
        </div>
        <div className={`flex items-center`}>พ.ศ.</div>
        <div
          className={`text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          <ComFormat
            type={"date_th"}
            input={new Date().toISOString()}
            mode={"Y"}
          ></ComFormat>
        </div>
      </div>
      <div className={`w-full text-right pt-1 ${localStyle.textNormalItalic}`}>
        ในกรณีเด็กที่ไม่สามารถรับรองตนเองได้ ให้ผู้ปกครองลงนามรับรองแทนได้
      </div>
      {/* Path 2 */}
      <div className={`flex pt-1 ${localStyle.textNormalBold14}`}>
        <div className={`px-2  ${reportStyle.headerCardGray}`}>ส่วนที่ 2</div>
        <div className="flex items-center pl-2">ของแพทย์</div>
      </div>
      <div className={`pt-1 ${reportStyle.gridCol24} ${localStyle.textNormal}`}>
        <div className={`text-left ${reportStyle.gridColSpan3}`}>
          สถานที่ตรวจ
        </div>
        <div
          className={`${localStyle.gridColSpan11} ${reportStyle.borderBottomDot}`}
        >
          {shop.shop_name}
        </div>
        <div className={`flex items-center`}>วันที่</div>
        <div
          className={`text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          <ComFormat
            type={"date_th"}
            input={new Date().toISOString()}
            mode={"D"}
          ></ComFormat>
        </div>
        <div className={`flex items-center`}>เดือน</div>
        <div
          className={`text-center ${localStyle.gridColSpan3} ${reportStyle.borderBottomDot}`}
        >
          <ComFormat
            type={"date_th"}
            input={new Date().toISOString()}
            mode={"M"}
          ></ComFormat>
        </div>
        <div className={`flex items-center`}>พ.ศ.</div>
        <div
          className={`text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          <ComFormat
            type={"date_th"}
            input={new Date().toISOString()}
            mode={"Y"}
          ></ComFormat>
        </div>
      </div>
      <div
        className={`w-full pt-1 ${localStyle.gridCol18} ${localStyle.textNormal}`}
      >
        <div className={` ${localStyle.gridColSpan6} flex`}>
          <div className="pr-2">(1) ข้าพเจ้า </div>
          <div>นายแพทย์/แพทย์หญิง</div>
        </div>
        <div
          className={`pl-2 ${localStyle.gridColSpan12} ${reportStyle.borderBottomDot}`}
        >
          {tempData.user_fullname}
        </div>
      </div>
      <div className={`pt-1 ${reportStyle.gridCol24} ${localStyle.textNormal}`}>
        <div className={`text-left ${reportStyle.gridColSpan8}`}>
          ใบอนุญาติประกอบวิชาชีพเวชกรรมเลขที่
        </div>
        <div
          className={`pl-2 ${localStyle.gridColSpan5} ${reportStyle.borderBottomDot}`}
        >
          {tempData.user_license}
        </div>
        <div
          className={`w-full flex items-center justify-center ${localStyle.gridColSpan4}`}
        >
          สถานพยาบาลชื่อ
        </div>
        <div
          className={`pl-2 ${localStyle.gridColSpan7} ${reportStyle.borderBottomDot}`}
        >
          {shop.shop_name}
        </div>
      </div>
      <div
        className={`w-full pt-1 ${reportStyle.gridCol24} ${localStyle.textNormal}`}
      >
        <div className={` ${reportStyle.gridColSpan1}`}>ที่อยู่</div>
        <div
          className={`pl-2 ${reportStyle.gridColSpan23} ${reportStyle.borderBottomDot}`}
        >
          {hosAddress.line1}
        </div>
      </div>
      <div
        className={`w-full pt-1 h-6 ${reportStyle.borderBottomDot} ${localStyle.textNormal}`}
      >
        {hosAddress.line2}
      </div>
      <div
        className={`w-full pt-1 ${localStyle.gridCol18} ${localStyle.textNormal}`}
      >
        <div className={` ${localStyle.gridColSpan6} flex`}>
          <div className="pr-2">ได้ตรวจร่างกาย </div>
          <div className="line-through decoration-gray-400 ">
            นาย/นาง/นางสาว
          </div>
        </div>
        <div
          className={`pl-2 ${localStyle.gridColSpan12} ${reportStyle.borderBottomDot}`}
        >
          {name}
        </div>
      </div>
      <div className={`pt-1 ${reportStyle.gridCol24} ${localStyle.textNormal}`}>
        <div className={`flex items-center ${localStyle.gridColSpan3}`}>
          แล้วเมื่อวันที่
        </div>
        <div
          className={`text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          <ComFormat
            type={"date_th"}
            input={new Date().toISOString()}
            mode={"D"}
          ></ComFormat>
        </div>
        <div className={`flex items-center`}>เดือน</div>
        <div
          className={`text-center ${localStyle.gridColSpan3} ${reportStyle.borderBottomDot}`}
        >
          <ComFormat
            type={"date_th"}
            input={new Date().toISOString()}
            mode={"M"}
          ></ComFormat>
        </div>
        <div className={`flex items-center`}>พ.ศ.</div>
        <div
          className={`text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          <ComFormat
            type={"date_th"}
            input={new Date().toISOString()}
            mode={"Y"}
          ></ComFormat>
        </div>
        <div className={`flex items-center ${localStyle.gridColSpan4}`}>
          มีรายละเอียดดังนี้
        </div>
      </div>
      <div className={`pt-1 ${reportStyle.gridCol24} ${localStyle.textNormal}`}>
        <div className={`flex items-center ${localStyle.gridColSpan2}`}>
          น้ำหนักตัว
        </div>
        <div
          className={`text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_bw}
        </div>
        <div
          className={`flex items-center justify-center ${localStyle.gridColSpan3}`}
        >
          กก. ความสูง
        </div>
        <div
          className={`text-center ${localStyle.gridColSpan3} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_ht}
        </div>
        <div
          className={`flex items-center justify-center  ${localStyle.gridColSpan4}`}
        >
          ซม. ความดันโลหิต
        </div>
        <div
          className={`text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_bp}
        </div>
        <div
          className={`flex items-center justify-center  ${localStyle.gridColSpan4}`}
        >
          มม. ปรอทชีพจร
        </div>
        <div
          className={`text-center ${localStyle.gridColSpan2} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_pr}
        </div>
        <div
          className={`flex items-center justify-center  ${localStyle.gridColSpan2}`}
        >
          ครั้ง/นาที
        </div>
      </div>
      <div
        className={`pt-1 ${localStyle.textNormal} ${reportStyle.gridCol24} `}
      >
        <div className={`${reportStyle.gridColSpan6}`}>
          สภาพร่างการทั่วไปในเกณฑ์
        </div>
        <div className={`flex ${reportStyle.gridColSpan2}`}>
          <div className="pr-2">
            <Image
              src={checkBoxEmptyIcon}
              alt="check"
              width={16}
              height={16}
              className="img-fluid"
            />
          </div>
          <div>ปกติ</div>
        </div>
        <div className={`flex ${reportStyle.gridColSpan3}`}>
          <div className="pr-2">
            <Image
              src={checkBoxEmptyIcon}
              alt="check"
              width={16}
              height={16}
              className="img-fluid"
            />
          </div>
          <div>ผิดปกติ</div>
        </div>
        <div>(ระบุ)</div>
        <div
          className={`pl-2 ${localStyle.gridColSpan12} ${reportStyle.borderBottomDot}`}
        ></div>
      </div>
      <div
        className={`pt-1 ${localStyle.textNormal} ${reportStyle.gridCol24} `}
      >
        <div></div>
        <div className={`pt-1  ${reportStyle.gridColSpan23} `}>
          ขอรับรองว่า บุคคลดังกล่าว
          ไม่เป็นผู้มีร่างกายทุพพลภาพจนไม่สามารถปฏิบัติหน้าที่ได้
          ไม่ปรากฎอาการของโรคจิต
        </div>
      </div>
      <div className={` ${localStyle.textNormal}`}>
        หรือจิตฟั่นเฟือน หรือปัญญาอ่อน ไม่ปรากฏอาการของการติดยาเสพติดให้โทษ
        และอาการของโรคพิษสุราเรื้อรัง และไม่ปรากฏอาการและอาการแสดงของโรคต่อไปนี้
      </div>
      <div className={` ${localStyle.textNormal} ${reportStyle.gridCol24} `}>
        <div className={`text-right ${reportStyle.gridColSpan1}`}>(1)</div>
        <div className={`pl-2 ${reportStyle.gridColSpan20}`}>
          โรคเรื้อนในระยะติดต่อ หรือในระยะที่ปรากฏอาการเป็นที่รังเกียจแก่สังคม
        </div>
      </div>
      <div className={`${localStyle.textNormal} ${reportStyle.gridCol24} `}>
        <div className={`text-right ${reportStyle.gridColSpan1}`}>(2)</div>
        <div className={`pl-2 ${reportStyle.gridColSpan20}`}>
          วัณโรคในระยะอันตราย
        </div>
      </div>
      <div className={`${localStyle.textNormal} ${reportStyle.gridCol24} `}>
        <div className={`text-right ${reportStyle.gridColSpan1}`}>(3)</div>
        <div className={`pl-2 ${reportStyle.gridColSpan20}`}>
          โรคเท้าช้างในระยะที่ปรากฏอาการเป็นที่รังเกียจแก่สังคม
        </div>
      </div>
      <div className={` ${localStyle.textNormal} ${reportStyle.gridCol24} `}>
        <div className={`text-right ${reportStyle.gridColSpan1}`}>(4)</div>
        <div className={`pl-2 ${reportStyle.gridColSpan3}`}>อื่น ๆ (ถ้ามี)</div>
        <div
          className={`pl-2 ${reportStyle.gridColSpan20} ${reportStyle.borderBottomDot}`}
        ></div>
      </div>
      <div
        className={`pt-1 ${localStyle.textNormal} ${reportStyle.gridCol24} `}
      >
        <div className={`text-left ${reportStyle.gridColSpan8}`}>
          (2) สรุปความเห็นและข้อแนะนำของแพทย์
        </div>
        <div
          className={`pl-2 ${reportStyle.gridColSpan16} ${reportStyle.borderBottomDot}`}
        >
          {tempData.opd_note}
        </div>
      </div>
      <div className={`pl-2 w-full h-6 ${reportStyle.borderBottomDot}`}></div>
    </>
  );
}
