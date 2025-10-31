"use client";
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
export default function UserAddressCard({ customer }: { customer: Customer }) {
  return (
    <>
      <div className="space-y-4 text-sm md:text-base">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          ข้อมูลสิทธิ์ผู้ใช้บริการคลินิก
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
          <span className="text-gray-400 w-28 sm:w-32 shrink-0">สิทธิ์หลัก</span>
          <span className="text-gray-800">{customer.rt_name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
          <span className="text-gray-400 w-28 sm:w-32 shrink-0">สิทธิ์ย่อย</span>
          <span className="text-gray-800">{customer.rt_name_en}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
          <span className="text-gray-400 w-28 sm:w-32 shrink-0">วันเริ่มใช้สิทธิ์</span>
          {new Date(customer.ctm_create).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    </>
  );
}
