"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";
import CitizenIdSync from "@/components/auth/CitizenIdSync";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function TelemedicinePage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const customerId = localStorage.getItem("userCustomerId");
    const isOtpVerified =
      localStorage.getItem("is_online_data_sync") === "true";

    if (customerId && isOtpVerified) {
      router.replace("/ai/telemedicine/register/appointment");
      return;
    }

    setIsChecking(false);
  }, [router]);

  const handleSyncSuccess = (hasHN: boolean) => {
    setOpen(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#F2F8FE] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-pink-100" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#F639BD] animate-spin" />
          </div>
          <p className="text-gray-400 text-sm">กำลังตรวจสอบข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Title — ตำแหน่งเดิม */}
      <PageBreadcrumb
        size="text-3xl"
        oi={false}
        text="text-[#F639BD]"
        pageTitle="หาหมอออนไลน์"
      />

      {/* Content */}
      <div className="px-4 pb-8">
        {/* Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm ring-1 ring-black/[0.05]">
            <svg
              className="w-4 h-4 text-[#F639BD]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <span className="text-xs font-medium text-gray-600">
              Video Consultation Available
            </span>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-center text-gray-400 text-sm mb-6">
          ปรึกษาแพทย์ผ่านวิดีโอคอล สะดวก ปลอดภัย ทุกที่ทุกเวลา
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              ),
              titleTh: "แพทย์ผู้เชี่ยวชาญ",
              titleEn: "Licensed Doctors",
              desc: "แพทย์มีใบอนุญาตอย่างถูกต้อง",
              iconColor: "text-pink-500",
              iconBg: "bg-pink-50",
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              titleTh: "ไม่ต้องรอคิว",
              titleEn: "No Waiting",
              desc: "ไม่ต้องรอคิว เข้าปรึกษาได้ทันที",
              iconColor: "text-violet-500",
              iconBg: "bg-violet-50",
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              ),
              titleTh: "ปลอดภัย",
              titleEn: "Secure",
              desc: "ข้อมูลปลอดภัย เข้ารหัสทุกการสนทนา",
              iconColor: "text-blue-500",
              iconBg: "bg-blue-50",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-3.5 shadow-sm ring-1 ring-black/[0.04]"
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center mb-3`}
              >
                {item.icon}
              </div>

              {/* Titles */}
              <p className="text-[13px] font-bold text-gray-800 leading-tight mb-0.5">
                {item.titleTh}
              </p>
              <p className="text-[10px] text-gray-400 mb-1.5">
                {item.titleEn}
              </p>

              {/* Description */}
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setOpen(true)}
            className="group px-8 py-3 rounded-full text-white text-sm font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 active:scale-[0.97] transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: "linear-gradient(to right, #8B5CF6, #D946EF, #EC4899)",
            }}
          >
            เริ่มต้นใช้งาน
            <FiArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* CitizenIdSync Modal */}
      <CitizenIdSync
        isOpen={open}
        onClose={() => setOpen(false)}
        redirectPath="/ai/telemedicine/register/appointment"
        registerPath="/ai/telemedicine/register"
        onSyncSuccess={handleSyncSuccess}
      />
    </>
  );
}