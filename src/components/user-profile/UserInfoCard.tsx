"use client";
import Image from "next/image";
import React from "react";
// import { useModal } from "../../hooks/useModal";
// import { Modal } from "../ui/modal";
// import Button from "../ui/button/Button";
// import Input from "../form/input/InputField";
// import Label from "../form/Label";
interface Customer {
  id: number;
  shop_id: number;
  customer_group_id: number;
  user_id: number;
  ctm_id: string;
  ctm_citizen_id: string;
  ctm_passport_id: string;
  ctm_prefix: string;
  ctm_fname: string;
  ctm_lname: string;
  ctm_nname: string;
  ctm_fname_en: string;
  ctm_lname_en: string;
  ctm_tel_2: string;
  ctm_email: string;
  ctm_tel: string;
  ctm_gender: string;
  ctm_nation: string;
  ctm_religion: string;
  ctm_edu_level: string;
  ctm_marital_status: string;
  ctm_blood: string;
  ctm_birthdate: string;
  ctm_address: string;
  ctm_district: string;
  ctm_amphoe: string;
  ctm_province: string;
  ctm_zipcode: string;
  ctm_comment: string;
  ctm_weight: number;
  ctm_height: number;
  ctm_waistline: number;
  ctm_chest: number;
  ctm_treatment_type: number;
  right_treatment_id: number;
  ctm_allergic: string;
  ctm_mental_health: string;
  ctm_disease: string;
  ctm_health_comment: string;
  ctm_image: string;
  ctm_image_size: number;
  ctm_point: number;
  ctm_coin: number;
  line_token: string;
  line_send: number;
  line_send_date: string;
  facebook_id: string;
  company_name: string;
  company_tax: string;
  company_tel: string;
  company_email: string;
  company_address: string;
  company_district: string;
  company_amphoe: string;
  company_province: string;
  company_zipcode: string;
  ctm_subscribe_opd: number;
  ctm_subscribe_lab: number;
  ctm_subscribe_cert: number;
  ctm_subscribe_receipt: number;
  ctm_subscribe_appoint: number;
  ctm_is_active: number;
  ctm_is_del: number;
  ctm_create: string;
  ctm_update: string;
  ctm_subscribe_pdpa_token: string;
  ctm_subscribe_pdpa_image: string;
  cg_name: string;
  cg_save_type: number;
  cg_save: number;
  rt_code: string;
  rt_name: string;
  rt_name_en: string;
}

export default function UserInfoCard({ customer }: { customer: Customer }) {
  return (
    <>
      {/* หัวข้อ */}
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        บัตรประจำตัวผู้ใช้บริการคลินิก
      </h3>

      {/* กล่องข้อมูลหลัก */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 bg-blue-50 rounded-xl p-4 sm:p-6 mb-6 w-full">
        {/* รูปโปรไฟล์ */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden">
          <Image
            src={customer.ctm_image || "/images/user/owner.jpg"}
            alt="User profile"
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        </div>

        {/* รายละเอียด */}
        <div className="text-center sm:text-left space-y-0.5">
          <p className="font-semibold text-gray-800 text-base sm:text-lg leading-tight">
            {customer.ctm_fname} {customer.ctm_lname}
          </p>
          <p className="font-medium text-sm text-brand-700">HN {customer.ctm_id}</p>
          <p className="text-sm text-gray-600">ติดต่อ {customer.ctm_tel}</p>
        </div>
      </div>

      {/* ข้อมูลส่วนตัว */}
      <div className="space-y-4 text-sm md:text-base">
        {/* ชื่อ–สกุล */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
          <span className="text-gray-400 w-[100px] sm:w-[120px] shrink-0">ชื่อ–สกุล</span>
          <span className="text-gray-800">
            {customer.ctm_fname} {customer.ctm_lname}
          </span>
        </div>

        {/* วันเกิด */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
          <span className="text-gray-400 w-[100px] sm:w-[120px] shrink-0">เกิดวันที่</span>
          {new Date(customer.ctm_birthdate).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>

        {/* เลขบัตรประชาชน */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
          <span className="text-gray-400 w-[100px] sm:w-[120px] shrink-0">เลขบัตรประชาชน</span>
          <span className="text-gray-800 break-words">{customer.ctm_citizen_id}</span>
        </div>

        {/* ที่อยู่ */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
          <span className="text-gray-400 w-[100px] sm:w-[120px] shrink-0">ที่อยู่</span>
          <span className="text-gray-800">
            {customer.ctm_address} ต.{customer.ctm_district} อ.{customer.ctm_amphoe} จ.
            {customer.ctm_province} {customer.ctm_zipcode}
          </span>
        </div>
      </div>
    </>
  );
}
