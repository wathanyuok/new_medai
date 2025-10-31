"use client";
import React from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { TbPencilMinus } from "react-icons/tb";

// import Image from "next/image";




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

export default function UserMetaCard({ customer }: { customer: Customer }) {
  const customers = customer
  console.log("UserMetaCard data:", customers);
  const { isOpen, openModal, closeModal } = useModal();
  const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeModal();
  };
  return (
    <>
      <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-3">
        บัญชีผู้ใช้
      </h3>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="space-y-2 text-sm md:text-base text-gray-700 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-10.5">
  <span className="text-gray-400 w-[100px]">ชื่อผู้ใช้</span>
  {customers ? (
    <span className="font-medium text-gray-800 break-words">
      {customers.ctm_fname || '-'} {customers.ctm_lname || '-'}
    </span>
  ) : (
    <div className="h-5 w-40 rounded bg-gray-300 animate-pulse"></div>
  )}
</div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-10.5">
  <span className="text-gray-400 w-[100px]">อีเมล</span>
  {customers ? (
    <span className="text-gray-800 break-words">
      {customers.ctm_email || '-'}
    </span>
  ) : (
    <div className="h-5 w-60 rounded bg-gray-300 animate-pulse"></div>
  )}
</div>
        </div>

        <button
          onClick={openModal}
          className="mt-2 sm:mt-0 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-sm text-gray-800 px-3 py-1.5 rounded-full transition"
        >
          <TbPencilMinus />
          <span className="font-medium">แก้ไข</span>
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-6">
            <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              แก้ไขข้อมูลผู้ใช้บริการ
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              ปรับปรุงข้อมูลให้เป็นปัจจุบันเพื่อการให้บริการที่ดีที่สุด
            </p>
          </div>

          <form className="flex flex-col">
            <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3 space-y-8">
              {/* 🧍‍♀️ ข้อมูลส่วนตัว */}
              <div>
                <h5 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">
                  ข้อมูลส่วนตัว
                </h5>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <Label>ชื่อ</Label>
                    <Input type="text" defaultValue="อธิชา" />
                  </div>
                  <div>
                    <Label>นามสกุล</Label>
                    <Input type="text" defaultValue="ศุกต์อุดากร" />
                  </div>
                  <div>
                    <Label>อีเมล</Label>
                    <Input type="email" defaultValue="athicha.supa@gmail.com" />
                  </div>
                  <div>
                    <Label>เบอร์โทร</Label>
                    <Input type="tel" defaultValue="0832717766" />
                  </div>
                  <div className="lg:col-span-2">
                    <Label>ที่อยู่</Label>
                    <Input
                      type="text"
                      defaultValue="88/76 ซอย 9/1 หมู่บ้านเดอะ เซ็นโทร รัตนาธิเบศร์ ต.บางเลน อ.บางใหญ่ จ.นนทบุรี"
                    />
                  </div>
                </div>
              </div>

              {/* 🌐 โซเชียลลิงก์ */}
              <div>
                <h5 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">
                  ลิงก์โซเชียล (ถ้ามี)
                </h5>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <Label>Facebook</Label>
                    <Input type="text" defaultValue="https://facebook.com/..." />
                  </div>
                  <div>
                    <Label>Instagram</Label>
                    <Input type="text" defaultValue="https://instagram.com/..." />
                  </div>
                  <div>
                    <Label>X.com</Label>
                    <Input type="text" defaultValue="https://x.com/..." />
                  </div>
                  <div>
                    <Label>LinkedIn</Label>
                    <Input type="text" defaultValue="https://linkedin.com/..." />
                  </div>
                </div>
              </div>
            </div>

            {/* ปุ่ม */}
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                ยกเลิก
              </Button>
              <Button size="sm" onClick={handleSave}>
                บันทึกข้อมูล
              </Button>
            </div>
          </form>
        </div>
      </Modal>

    </>
  );
}
