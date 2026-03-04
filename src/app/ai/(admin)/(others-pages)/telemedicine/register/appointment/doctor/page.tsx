"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

// ==================== API Configuration ====================
const BASE_URL = process.env.NEXT_PUBLIC_APPOINT_API_URL || "https://shop.api-apsx.co";

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

// Get OAuth access token (with cache)
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

    if (!response.ok) return null;

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

// ==================== Doctor Interface ====================
interface Doctor {
  id: number;
  user_email: string;
  user_fullname: string;
  user_fullname_en: string;
  user_tel: string;
  user_image: string;
  specialty?: string; // เพิ่มเอง (อาจดึงจาก field อื่น)
}

interface DoctorListResponse {
  status: boolean;
  message: string;
  data: Doctor[];
}

// ==================== API Functions ====================
const fetchDoctors = async (): Promise<Doctor[]> => {
  try {
    const token = await getAccessToken();
    if (!token) return [];

    const response = await fetch(`${BASE_URL}/appointment/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return [];

    const data: DoctorListResponse = await response.json();
    if (data.status && data.data) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return [];
  }
};

// ==================== Component ====================
const DoctorSelectPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [error, setError] = useState("");

  // รับ params จากหน้า appointment
  const symptomId = searchParams.get("symptomId");
  const symptomLabel = searchParams.get("symptomLabel");

  // โหลดรายชื่อหมอ
  useEffect(() => {
    let isMounted = true;

    const loadDoctors = async () => {
      const doctorList = await fetchDoctors();
      if (isMounted) {
        setDoctors(doctorList);
        setIsLoading(false);
      }
    };
    
    loadDoctors();

    return () => {
      isMounted = false;
    };
  }, []);

  // จำนวนหมอที่แสดง (3 หรือทั้งหมด)
  const displayedDoctors = showAllDoctors ? doctors : doctors.slice(0, 3);

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    
    // ไปหน้า schedule พร้อมส่ง doctorId
    router.push(
      `/ai/telemedicine/register/appointment/schedule?doctorId=${doctor.id}&doctorName=${encodeURIComponent(doctor.user_fullname)}&symptomId=${symptomId}&symptomLabel=${encodeURIComponent(symptomLabel || "")}`
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F8FE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-500">กำลังโหลดรายชื่อแพทย์...</p>
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
        <h2 className="text-gray-700 font-medium mb-4">เลือกจากรายชื่อแพทย์</h2>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg mb-4">
            {error}
          </p>
        )}

        {/* Doctor List */}
        <div className="space-y-3">
          {displayedDoctors.map((doctor) => (
            <div
              key={doctor.id}
              onClick={() => handleDoctorSelect(doctor)}
              className={`flex items-center gap-4 p-4 bg-white rounded-xl cursor-pointer transition-all hover:shadow-md ${
                selectedDoctor?.id === doctor.id
                  ? "ring-2 ring-blue-400"
                  : "border border-gray-100"
              }`}
            >
              {/* Doctor Image */}
              <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {doctor.user_image ? (
                  <img
                    src={doctor.user_image}
                    alt={doctor.user_fullname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                    👨‍⚕️
                  </div>
                )}
              </div>

              {/* Doctor Info */}
              <div className="flex-1">
                <h3 className="text-gray-800 font-medium">
                  {doctor.user_fullname || doctor.user_fullname_en}
                </h3>
                <p className="text-gray-500 text-sm">
                  {doctor.specialty || "เฉพาะทางด้านอายุรกรรม เบาหวาน"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Show All / Show Less Button */}
        {doctors.length > 3 && (
          <button
            onClick={() => setShowAllDoctors(!showAllDoctors)}
            className="w-full mt-4 py-3 text-[#4CB4F8] font-medium flex items-center justify-center gap-2"
          >
            {showAllDoctors ? (
              <>
                แสดงน้อยลง <FiChevronUp className="w-5 h-5" />
              </>
            ) : (
              <>
                รายชื่อแพทย์ทั้งหมด <FiChevronDown className="w-5 h-5" />
              </>
            )}
          </button>
        )}

        {/* Empty State */}
        {doctors.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">ไม่พบรายชื่อแพทย์</p>
          </div>
        )}
      </div>
    </div>
  );
};

import { Suspense } from "react";

const DoctorSelectPageWrapper = () => (
  <Suspense fallback={<div className="min-h-screen bg-[#F2F8FE] flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}>
    <DoctorSelectPage />
  </Suspense>
);

export default DoctorSelectPageWrapper;