"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiCheckCircle, FiCalendar, FiClock } from "react-icons/fi";

// ==================== Helper Functions ====================
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
const THAI_DAYS_FULL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

const toBuddhistYear = (year: number) => year + 543;

const formatThaiDate = (date: Date) => {
  const dayName = THAI_DAYS_FULL[date.getDay()];
  const day = date.getDate();
  const monthName = THAI_MONTHS[date.getMonth()];
  const buddhistYear = toBuddhistYear(date.getFullYear());
  return `วัน${dayName}ที่ ${day} ${monthName} ${buddhistYear}`;
};

// ==================== Component ====================
const ConfirmPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [appointmentData, setAppointmentData] = useState<{
    customerId: string | null;
    appointmentId: string | null;
    date: Date | null;
    time: string | null;
    doctorName: string | null;
  }>({
    customerId: null,
    appointmentId: null,
    date: null,
    time: null,
    doctorName: null,
  });

  useEffect(() => {
    const dateStr = searchParams.get("date");
    setAppointmentData({
      customerId: searchParams.get("customerId"),
      appointmentId: searchParams.get("appointmentId"),
      date: dateStr ? new Date(dateStr) : null,
      time: searchParams.get("time"),
      doctorName: searchParams.get("doctorName"),
    });
  }, [searchParams]);

  // ✅ แก้ path ให้ไปหน้า /ai/appointment
  const handleBackToHome = () => {
    router.push("/ai/appointment");
  };

  return (
    <div className="min-h-screen bg-[#F2F8FE] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <FiCheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          นัดหมายสำเร็จ!
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          ระบบได้บันทึกการนัดหมายของคุณเรียบร้อยแล้ว
        </p>

        {/* Appointment Details */}
        <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-left">
          <h2 className="text-gray-700 font-medium mb-3">รายละเอียดการนัดหมาย</h2>
          
          {appointmentData.appointmentId && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-500 text-sm">หมายเลขนัดหมาย:</span>
              <span className="text-gray-800 font-medium">#{appointmentData.appointmentId}</span>
            </div>
          )}

          {appointmentData.doctorName && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-500 text-sm">แพทย์:</span>
              <span className="text-gray-800 font-medium">{appointmentData.doctorName}</span>
            </div>
          )}

          {appointmentData.date && (
            <div className="flex items-center gap-2 mb-2">
              <FiCalendar className="text-blue-500" />
              <span className="text-gray-700">{formatThaiDate(appointmentData.date)}</span>
            </div>
          )}

          {appointmentData.time && (
            <div className="flex items-center gap-2">
              <FiClock className="text-blue-500" />
              <span className="text-gray-700">{appointmentData.time}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-yellow-50 rounded-xl p-3 mb-6">
          <p className="text-yellow-700 text-sm">
            📱 กรุณารอการติดต่อกลับจากเจ้าหน้าที่เพื่อยืนยันการนัดหมาย
          </p>
        </div>

        {/* Button */}
        <button
          onClick={handleBackToHome}
          className="w-full py-4 rounded-xl font-medium bg-[#4CB4F8] text-white hover:bg-[#3BA3E7] transition-all duration-300 shadow-md"
        >
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
};

import { Suspense } from "react";

const PageWrapper = () => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}>
    <ConfirmPage />
  </Suspense>
);

export default PageWrapper;