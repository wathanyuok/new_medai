"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ==================== Component ====================
const SYMPTOMS = [
  { id: 1, label: "ไข้, ปวดหัว, อ่อนเพลีย, เวียนศีรษะ" },
  { id: 2, label: "โควิด หรือ ไข้หวัดใหญ่" },
  { id: 3, label: "ท้องเสีย, ท้องอืด, อาหารเป็นพิษ" },
  { id: 4, label: "ไอ, เจ็บคอ, น้ำมูกไหล" },
  { id: 5, label: "ผื่นคัน, ผิวหนังอักเสบ, ลมพิษ" },
  { id: 6, label: "อื่นๆ (ระบุ)" },
];

const AppointmentPage: React.FC = () => {
  const router = useRouter();
  const [selectedSymptom, setSelectedSymptom] = useState<number | null>(1);
  const [otherSymptom, setOtherSymptom] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // ✅ เช็คว่ามี HN หรือยัง (ต้องผ่านการลงทะเบียนก่อน)
  useEffect(() => {
    const customerId = localStorage.getItem("userCustomerId");
    const isOtpVerified = localStorage.getItem("is_online_data_sync") === "true";

    if (!customerId || !isOtpVerified) {
      // ยังไม่มี HN หรือยังไม่ได้ยืนยัน OTP → กลับไปหน้า register
      router.replace("/ai/telemedicine/register");
      return;
    }

    setIsChecking(false);
  }, [router]);

  const handleNext = () => {
    if (!selectedSymptom) return;

    setIsLoading(true);

    // หา label ของอาการที่เลือก
    const symptomLabel =
      selectedSymptom === 6
        ? otherSymptom
        : SYMPTOMS.find((s) => s.id === selectedSymptom)?.label || "";

    console.log("Symptom Data:", {
      symptomId: selectedSymptom,
      symptomLabel,
    });

    // ✅ ไปหน้าเลือกหมอ (doctor) แทน schedule
    router.push(
      `/ai/telemedicine/register/appointment/doctor?symptomId=${selectedSymptom}&symptomLabel=${encodeURIComponent(symptomLabel)}`
    );
  };

  const isNextDisabled =
    !selectedSymptom || (selectedSymptom === 6 && !otherSymptom.trim());

  // Loading ขณะเช็ค HN
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#F2F8FE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-500">กำลังตรวจสอบข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F8FE]">
      {/* Header */}
      <div className="bg-[#4CB4F8] py-3 px-4">
        <h1 className="text-white text-lg font-medium">หาหมอออนไลน์</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <h2 className="text-gray-700 font-medium mb-4">
          แจ้งอาการป่วยที่ต้องการปรึกษา
        </h2>

        <div className="space-y-3">
          {SYMPTOMS.map((symptom) => (
            <label
              key={symptom.id}
              className={`flex items-center gap-3 p-4 bg-white rounded-xl cursor-pointer transition-all ${
                selectedSymptom === symptom.id
                  ? "ring-2 ring-blue-400"
                  : "border border-gray-100"
              }`}
            >
              <input
                type="radio"
                name="symptom"
                checked={selectedSymptom === symptom.id}
                onChange={() => setSelectedSymptom(symptom.id)}
                className="w-5 h-5 text-blue-500 accent-blue-500"
              />
              <span className="text-gray-700">{symptom.label}</span>
            </label>
          ))}

          {/* Input สำหรับ "อื่นๆ" */}
          {selectedSymptom === 6 && (
            <div className="mt-2">
              <input
                type="text"
                value={otherSymptom}
                onChange={(e) => setOtherSymptom(e.target.value)}
                placeholder="กรุณาระบุอาการ"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-blue-400"
              />
            </div>
          )}
        </div>

        {/* Button */}
        <button
          onClick={handleNext}
          disabled={isNextDisabled || isLoading}
          className={`w-full py-4 rounded-xl font-medium transition-all duration-300 mt-8 ${
            isNextDisabled || isLoading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#4CB4F8] text-white hover:bg-[#3BA3E7] shadow-md"
          }`}
        >
          {isLoading ? "กำลังดำเนินการ..." : "ถัดไป"}
        </button>
      </div>
    </div>
  );
};

export default AppointmentPage;