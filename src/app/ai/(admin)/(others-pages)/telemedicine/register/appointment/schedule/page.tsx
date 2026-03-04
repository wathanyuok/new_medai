"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { getUserIdFromToken } from "@/utils/checkAuthen";

// ==================== API Configuration ====================
const BASE_URL = process.env.NEXT_PUBLIC_APPOINT_API_URL || "https://shop.api-apsx.co";
const SHOP_ID = parseInt(process.env.NEXT_PUBLIC_SHOP_ID || "949");

const API_KEYS = {
  public_key: process.env.NEXT_PUBLIC_API_PUBLIC_KEY || "",
  private_key: process.env.NEXT_PUBLIC_API_PRIVATE_KEY || "",
};

const AUTH_TOKEN = process.env.NEXT_PUBLIC_API_AUTH_TOKEN || "";

// Token Cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

interface AuthResponse {
  status: boolean;
  data: { access_token: string };
  message: string;
}

const getAccessToken = async (): Promise<string | null> => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/oauth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(API_KEYS),
    });
    const data: AuthResponse = await response.json();
    if (data.status && data.data?.access_token) {
      cachedToken = data.data.access_token;
      tokenExpiry = Date.now() + 50 * 60 * 1000;
      return cachedToken;
    }
    return null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

// ==================== Working Schedule Interface ====================
interface WorkingSlot {
  id: number;
  day_id: number;
  date_string: string;
  time_string: string;
  is_available: boolean;
}

interface WorkingScheduleResponse {
  status: boolean;
  message: string;
  data: WorkingSlot[];
}

// เก็บข้อมูลเวลาพร้อมสถานะว่าง/ไม่ว่าง
interface TimeSlotWithStatus {
  time: string;
  isAvailable: boolean;
}

// ดึงตารางเวลาว่างของหมอ
const fetchDoctorWorking = async (doctorId: number): Promise<WorkingSlot[]> => {
  try {
    const token = await getAccessToken();
    if (!token) return [];

    const response = await fetch(
      `${BASE_URL}/user/working/${doctorId}?shop_id=${SHOP_ID}&days=30`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return [];

    const data: WorkingScheduleResponse = await response.json();
    if (data.status && data.data) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching doctor working:", error);
    return [];
  }
};

// ==================== Appointment API ====================
interface AppointmentAddRequest {
  user_id: number;
  customer_id: number;
  ap_type: number;
  ap_topic: string;
  ap_tel: string;
  ap_datetime: { datetime: string }[];
  ap_note: string;
  ap_comment: string;
  ap_color: string;
  ap_confirm: number;
  ap_status_id: number;
  ap_status_sms: number;
  ap_status_line: number;
  ap_is_gcalendar: number;
  ap_user_id: number;
  ap_opd_type: number;
  ap_is_tele: number;
}

interface AppointmentAddResponse {
  status: boolean;
  message: string;
  data: number;
}

const createAppointment = async (
  appointmentData: AppointmentAddRequest
): Promise<AppointmentAddResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { status: false, message: "ไม่สามารถขอ Token ได้", data: 0 };
    }

    console.log("Creating appointment:", appointmentData);

    const response = await fetch(`${BASE_URL}/appointment/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(appointmentData),
    });
    const data = await response.json();
    console.log("Appointment Response:", data);
    return data;
  } catch (error) {
    console.error("Error creating appointment:", error);
    return { status: false, message: "เกิดข้อผิดพลาดในการสร้างนัดหมาย", data: 0 };
  }
};

// ==================== Helper Functions ====================
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const THAI_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const THAI_DAYS_FULL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

const toBuddhistYear = (year: number) => year + 543;

// แปลงเวลาเป็น format "2025-01-30 11:00:00"
const formatDateTime = (date: Date, time: string): string => {
  const timeMatch = time.match(/(\d{2}):(\d{2})/);
  if (!timeMatch) return "";

  const hours = timeMatch[1];
  const minutes = timeMatch[2];

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:00`;
};

// ==================== Component ====================
const SchedulePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params from previous pages
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctorName, setDoctorName] = useState<string>("");
  const [symptomId, setSymptomId] = useState<string | null>(null);
  const [symptomLabel, setSymptomLabel] = useState<string | null>(null);

  // Working schedule
  const [workingSlots, setWorkingSlots] = useState<WorkingSlot[]>([]);
  const [allDates, setAllDates] = useState<Set<string>>(new Set()); // ทุกวันที่มีตาราง
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set()); // วันที่มีเวลาว่างอย่างน้อย 1 slot
  const [timeSlotsByDate, setTimeSlotsByDate] = useState<Map<string, TimeSlotWithStatus[]>>(new Map());

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [timeSlotsForDate, setTimeSlotsForDate] = useState<TimeSlotWithStatus[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [error, setError] = useState("");

  // Load params
  useEffect(() => {
    const id = searchParams.get("doctorId");
    const name = searchParams.get("doctorName");
    setDoctorId(id ? parseInt(id) : null);
    setDoctorName(name || "");
    setSymptomId(searchParams.get("symptomId"));
    setSymptomLabel(searchParams.get("symptomLabel"));
  }, [searchParams]);

  // Load doctor working schedule
  useEffect(() => {
    let isMounted = true;

    const loadWorkingSchedule = async () => {
      if (!doctorId) return;

      const slots = await fetchDoctorWorking(doctorId);
      
      if (!isMounted) return;

      setWorkingSlots(slots);

      // สร้าง Set ของทุกวันที่ และ วันที่มีเวลาว่าง
      const allDatesSet = new Set<string>();
      const availableDatesSet = new Set<string>();
      const timesByDate = new Map<string, TimeSlotWithStatus[]>();

      slots.forEach((slot) => {
        if (slot.date_string) {
          // เก็บทุกวันที่
          allDatesSet.add(slot.date_string);

          // เก็บเวลาพร้อมสถานะ
          const times = timesByDate.get(slot.date_string) || [];
          if (slot.time_string) {
            times.push({
              time: slot.time_string,
              isAvailable: slot.is_available,
            });
          }
          timesByDate.set(slot.date_string, times);

          // ถ้ามีเวลาว่างอย่างน้อย 1 slot → วันนี้เลือกได้
          if (slot.is_available) {
            availableDatesSet.add(slot.date_string);
          }
        }
      });

      setAllDates(allDatesSet);
      setAvailableDates(availableDatesSet);
      setTimeSlotsByDate(timesByDate);
      setIsLoading(false);
    };

    loadWorkingSchedule();

    return () => {
      isMounted = false;
    };
  }, [doctorId]);

  // Update times when date is selected
  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const slots = timeSlotsByDate.get(dateStr) || [];
      setTimeSlotsForDate(slots);
      
      // เลือกเวลาแรกที่ว่างอัตโนมัติ
      const firstAvailable = slots.find(s => s.isAvailable);
      setSelectedTime(firstAvailable?.time || "");
    }
  }, [selectedDate, timeSlotsByDate]);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Check if date is in schedule (มีในตารางหมอ)
  const isDateInSchedule = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    const dateStr = date.toISOString().split("T")[0];
    return allDates.has(dateStr);
  };

  // Check if date has available slots (มีเวลาว่างอย่างน้อย 1 slot)
  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availableDates.has(dateStr);
  };

  const handleDateSelect = (date: Date) => {
    // เลือกได้เฉพาะวันที่มีเวลาว่างอย่างน้อย 1 slot
    if (isDateInSchedule(date) && isDateAvailable(date)) {
      setSelectedDate(date);
      setShowTimeDropdown(false);
    }
  };

  const formatThaiDate = (date: Date) => {
    const dayName = THAI_DAYS_FULL[date.getDay()];
    const day = date.getDate();
    const monthName = THAI_MONTHS[date.getMonth()];
    const buddhistYear = toBuddhistYear(date.getFullYear());
    return `วัน${dayName}ที่ ${day} ${monthName} ${buddhistYear}`;
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !doctorId) return;

    setIsSubmitting(true);
    setError("");

    try {
      // ดึง customerId จาก localStorage
      const customerId = localStorage.getItem("userCustomerId");
      const loginUserId = getUserIdFromToken() || 0;

      if (!customerId) {
        setError("ไม่พบข้อมูลผู้ป่วย กรุณาลงทะเบียนใหม่");
        setIsSubmitting(false);
        return;
      }

      const appointmentData: AppointmentAddRequest = {
        user_id: doctorId,              // รหัสแพทย์ที่เลือก
        customer_id: parseInt(customerId),
        ap_type: 2,                     // 2 = แบบระบุตัวตน
        ap_topic: "นัด Telemedicine",
        ap_tel: "",
        ap_datetime: [{ datetime: formatDateTime(selectedDate, selectedTime) }],
        ap_note: "",
        ap_comment: symptomLabel || "",
        ap_color: "#4CB4F8",
        ap_confirm: 0,
        ap_status_id: 1,
        ap_status_sms: 1,
        ap_status_line: 1,
        ap_is_gcalendar: 0,
        ap_user_id: loginUserId,
        ap_opd_type: 1,
        ap_is_tele: 1,
      };

      const response = await createAppointment(appointmentData);

      if (response.status) {
        // สำเร็จ -> ไปหน้ายืนยัน
        router.push(
          `/ai/telemedicine/register/appointment/confirm?appointmentId=${response.data}&date=${selectedDate.toISOString()}&time=${encodeURIComponent(selectedTime)}&doctorName=${encodeURIComponent(doctorName)}`
        );
      } else {
        setError(response.message || "เกิดข้อผิดพลาดในการสร้างนัดหมาย");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F8FE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-500">กำลังโหลดตารางเวลา...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F8FE] p-4">
      {/* Doctor Info */}
      {doctorName && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-gray-500 text-sm">แพทย์ที่เลือก</p>
          <p className="text-gray-800 font-medium">{doctorName}</p>
        </div>
      )}

      {/* Calendar Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="mb-4">
          <p className="text-pink-500 text-sm mb-1">เลือกวันนัดหมาย</p>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {THAI_MONTHS[month]} พ.ศ.{toBuddhistYear(year)}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {THAI_DAYS.map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm py-2 ${
                index === 0 || index === 6 ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-10" />;
            }

            const inSchedule = isDateInSchedule(date);
            const hasAvailableSlot = isDateAvailable(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const isToday = new Date().toDateString() === date.toDateString();
            
            // วันที่อยู่ในตารางแต่ไม่มีเวลาว่าง → สีเทา
            const isFullyBooked = inSchedule && !hasAvailableSlot;

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateSelect(date)}
                disabled={!hasAvailableSlot}
                className={`h-10 w-10 mx-auto rounded-full flex items-center justify-center text-sm transition-all ${
                  isSelected
                    ? "bg-[#4CB4F8] text-white font-medium"
                    : hasAvailableSlot
                    ? "text-gray-700 hover:bg-blue-50"
                    : isFullyBooked
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"  // สีเทา - มีตารางแต่เต็ม
                    : "text-gray-300 cursor-not-allowed"              // ไม่มีตาราง
                } ${isToday && !isSelected ? "ring-2 ring-blue-200" : ""}`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mt-4">
          <h3 className="text-gray-800 font-medium mb-3">
            {formatThaiDate(selectedDate)}
          </h3>

          <p className="text-gray-600 text-sm mb-2">เลือกเวลาเริ่มปรึกษา</p>

          {timeSlotsForDate.length > 0 ? (
            <div className="relative">
              <button
                onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 flex items-center justify-between focus:outline-none focus:border-blue-400"
              >
                <span>{selectedTime || "เลือกเวลา"}</span>
                <FiChevronDown
                  className={`text-gray-400 transition-transform ${
                    showTimeDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showTimeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {timeSlotsForDate.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => {
                        if (slot.isAvailable) {
                          setSelectedTime(slot.time);
                          setShowTimeDropdown(false);
                        }
                      }}
                      disabled={!slot.isAvailable}
                      className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${
                        !slot.isAvailable
                          ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                          : selectedTime === slot.time
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-blue-50"
                      }`}
                    >
                      <span>{slot.time}</span>
                      {!slot.isAvailable && (
                        <span className="text-xs text-gray-400">(ไม่ว่าง)</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">ไม่มีตารางเวลาในวันนี้</p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm text-center mt-4 bg-red-50 p-3 rounded-lg">
          {error}
        </p>
      )}

      {/* Confirm Button */}
      {selectedDate && selectedTime && (
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className={`w-full py-4 rounded-xl font-medium transition-all duration-300 mt-6 ${
            isSubmitting
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#4CB4F8] text-white hover:bg-[#3BA3E7] shadow-md"
          }`}
        >
          {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันนัดหมาย"}
        </button>
      )}
    </div>
  );
};

export default SchedulePage;