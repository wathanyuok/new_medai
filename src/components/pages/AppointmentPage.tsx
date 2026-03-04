'use client';

import React, { useEffect, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Image from 'next/image';
import { FiClock, FiTag, FiCheckCircle } from 'react-icons/fi';
import { checkAccessToken } from '@/utils/checkAuthen';
import { toast, ToastContainer } from 'react-toastify';
import CitizenIdSync from '@/components/auth/CitizenIdSync';
import NoAccessModal from '@/components/auth/NoAccessModal';

// ==================== API ====================
const BASE_URL = process.env.NEXT_PUBLIC_APPOINT_API_URL || "https://shop.api-apsx.co";

const API_KEYS = {
  public_key: process.env.NEXT_PUBLIC_API_PUBLIC_KEY || "",
  private_key: process.env.NEXT_PUBLIC_API_PRIVATE_KEY || "",
};

const AUTH_TOKEN = process.env.NEXT_PUBLIC_API_AUTH_TOKEN || "";

interface AuthResponse {
  status: boolean;
  data: { access_token: string };
  message: string;
}

const getAccessToken = async (): Promise<string | null> => {
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
      return data.data.access_token;
    }
    return null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

// ==================== Interfaces ====================
export interface Appointment {
  id: number;
  shop_id: number;
  user_id: number;
  user_image: string;
  user_fullname: string;
  user_fullname_en: string;
  role_name_th: string;
  role_name_en: string;
  customer_id: number;
  customer_fullname: string;
  ctm_fname: string;
  ctm_lname: string;
  ctm_fname_en: string;
  ctm_lname_en: string;
  ap_type: number;
  ap_topic: string;
  ap_tel: string;
  ap_datetime: string;
  ap_note: string;
  ap_comment: string;
  ap_color: string;
  ap_confirm: number;
  ap_status_id: number;
  ap_status_sms: number;
  ap_status_line: number;
  ap_sms: string;
  ap_is_gcalendar: number;
  ap_gid: string;
  ap_user_id: number;
  ap_is_del: number;
  ap_create: string;
  ap_update: string;
  shop_name: string;
}

interface AppointmentSearchResponse {
  status: boolean;
  message: string;
  data: {
    result_data: Appointment[];
    count_of_page: number;
    count_all: number;
  };
  is_tele: number;
}

interface SearchParams {
  user_id: number;
  search: string;
  date: string;
  type: string;
  opd_type: string;
  is_active: string;
  active_page: number;
  per_page: number;
}

// ==================== API Function ====================
const searchAppointments = async (
  params: SearchParams
): Promise<AppointmentSearchResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) {
      return {
        status: false,
        message: "ไม่สามารถขอ Token ได้",
        data: { result_data: [], count_of_page: 0, count_all: 0 },
        is_tele: 0,
      };
    }

    const response = await fetch(`${BASE_URL}/appointment/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    console.log("Appointment Search Response:", data);
    return data;
  } catch (error) {
    console.error("Error searching appointments:", error);
    return {
      status: false,
      message: "เกิดข้อผิดพลาด",
      data: { result_data: [], count_of_page: 0, count_all: 0 },
      is_tele: 0,
    };
  }
};

// ==================== Helper Functions ====================
const formatThaiDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getStatusInfo = (statusId: number): { label: string; color: string; bgColor: string } => {
  switch (statusId) {
    case 1:
      return { label: "รอดำเนินการ", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    case 2:
      return { label: "รอยืนยัน", color: "text-blue-600", bgColor: "bg-blue-100" };
    case 3:
      return { label: "เสร็จสิ้น", color: "text-green-600", bgColor: "bg-green-100" };
    case 4:
      return { label: "ยกเลิก", color: "text-red-600", bgColor: "bg-red-100" };
    default:
      return { label: "ไม่ทราบ", color: "text-gray-600", bgColor: "bg-gray-100" };
  }
};

const getTypeLabel = (type: number): { label: string; color: string; bgColor: string } => {
  switch (type) {
    case 1:
      return { label: "นัดหมาย", color: "text-purple-600", bgColor: "bg-purple-100" };
    case 2:
      return { label: "ติดตามผล", color: "text-teal-600", bgColor: "bg-teal-100" };
    default:
      return { label: "อื่นๆ", color: "text-gray-600", bgColor: "bg-gray-100" };
  }
};

// ==================== Component ====================
export default function AppointmentPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isDataSync, setIsDataSync] = useState<boolean | null>(null); // null = ยังไม่โหลด

  // ✅ State สำหรับ CitizenIdSync Modal
  const [showCitizenSync, setShowCitizenSync] = useState(false);

  useEffect(() => {
    // เช็ค login
    if (!checkAccessToken()) {
      setIsLogin(false);
      setLoading(false);
      return;
    }
    setIsLogin(true);
    
    // ✅ เช็ค sync status
    const syncStatus = localStorage.getItem("is_online_data_sync") === "true";
    setIsDataSync(syncStatus);
    
    if (syncStatus) {
      fetchAppointments();
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ เปิด Modal อัตโนมัติเมื่อยังไม่ได้ sync
  useEffect(() => {
    if (isLogin && isDataSync === false) {
      setShowCitizenSync(true);
    }
  }, [isLogin, isDataSync]);

  // ✅ Handler เมื่อ Sync สำเร็จ
  const handleSyncSuccess = (hasHN: boolean) => {
    setShowCitizenSync(false);
    toast.success("เชื่อมต่อข้อมูลสำเร็จ");
    // Reload เพื่อดึงข้อมูลใหม่
    window.location.reload();
  };

  const fetchAppointments = async () => {
    setLoading(true);

    try {
      // ✅ ดึง HN จาก localStorage เพื่อ filter เฉพาะนัดหมายของ user นี้
      const userHN = localStorage.getItem("userHN") || "";
      
      const params: SearchParams = {
        user_id: -1,              // ใช้ -1 เพื่อดึงทุกแพทย์
        search: userHN,           // ✅ ใช้ HN เพื่อ filter เฉพาะนัดหมายของ user นี้
        date: "",
        type: "",
        opd_type: "",
        is_active: "",
        active_page: 1,
        per_page: 50,
      };

      const response = await searchAppointments(params);

      if (response.status && response.data?.result_data) {
        const allAppointments = response.data.result_data;
        setTotalCount(response.data.count_all || allAppointments.length);

        // หานัดหมายครั้งต่อไป (วันที่ในอนาคตที่ใกล้ที่สุด)
        const now = new Date();
        const futureAppointments = allAppointments
          .filter((apt) => new Date(apt.ap_datetime) >= now && apt.ap_status_id !== 4)
          .sort((a, b) => new Date(a.ap_datetime).getTime() - new Date(b.ap_datetime).getTime());

        if (futureAppointments.length > 0) {
          setNextAppointment(futureAppointments[0]);
        }

        setItems(allAppointments);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isLogin ? (
        <NoAccessModal />
      ) : (
        <>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            style={{ zIndex: 99999 }}
          />

          <PageBreadcrumb
            size="text-3xl"
            oi={false}
            text="text-[#F639BD]"
            pageTitle="นัดหมายของคุณ"
          />

          <div className="grid grid-cols-1 gap-6 p-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Loading State */}
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-sm p-4 animate-pulse"
                  >
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))
              ) : isDataSync === true ? (
                <>
                  {/* Next Appointment Card */}
                  {nextAppointment && (
                    <div className="bg-white rounded-xl shadow-sm p-5">
                      <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        นัดหมายครั้งต่อไป
                      </h2>
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="font-medium text-gray-700">
                          {nextAppointment.ap_topic}
                        </span>
                        <span className="text-gray-600">
                          {formatThaiDate(nextAppointment.ap_datetime)}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            getTypeLabel(nextAppointment.ap_type).bgColor
                          } ${getTypeLabel(nextAppointment.ap_type).color}`}
                        >
                          {getTypeLabel(nextAppointment.ap_type).label}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Appointments Table */}
                  {items.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="col-span-1 text-sm font-medium text-gray-500">
                          #
                        </div>
                        <div className="col-span-4 text-sm font-medium text-gray-500">
                          รายการนัดหมาย
                        </div>
                        <div className="col-span-2 text-sm font-medium text-gray-500 flex items-center gap-1">
                          <FiTag size={14} /> ประเภทนัดหมาย
                        </div>
                        <div className="col-span-3 text-sm font-medium text-gray-500 flex items-center gap-1">
                          <FiClock size={14} /> เวลานัด
                        </div>
                        <div className="col-span-2 text-sm font-medium text-gray-500 flex items-center gap-1">
                          <FiCheckCircle size={14} /> สถานะ
                        </div>
                      </div>

                      {/* Table Rows */}
                      <div className="divide-y divide-gray-100">
                        {items.map((item, idx) => {
                          const typeInfo = getTypeLabel(item.ap_type);
                          const statusInfo = getStatusInfo(item.ap_status_id);

                          return (
                            <div
                              key={item.id}
                              className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                            >
                              {/* # */}
                              <div className="col-span-1 text-gray-500">
                                {idx + 1}
                              </div>

                              {/* รายการนัดหมาย */}
                              <div className="col-span-4">
                                <p className="text-gray-800 font-medium">
                                  {item.ap_topic}
                                </p>
                                {item.ap_comment && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {item.ap_comment}
                                  </p>
                                )}
                              </div>

                              {/* ประเภทนัดหมาย */}
                              <div className="col-span-2">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-sm ${typeInfo.bgColor} ${typeInfo.color}`}
                                >
                                  {typeInfo.label}
                                </span>
                              </div>

                              {/* เวลานัด */}
                              <div className="col-span-3 text-gray-600">
                                {formatThaiDate(item.ap_datetime)}
                              </div>

                              {/* สถานะ */}
                              <div className="col-span-2">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-sm ${statusInfo.bgColor} ${statusInfo.color}`}
                                >
                                  {statusInfo.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500 mt-10">
                      <Image
                        src="/images/no-data.png"
                        alt="ไม่มีข้อมูล"
                        width={200}
                        height={200}
                        className="mb-4"
                      />
                      <p className="text-lg font-semibold">ไม่มีข้อมูลการนัดหมายในระบบ</p>
                    </div>
                  )}

                  {/* Total Count */}
                  {items.length > 0 && (
                    <p className="text-center text-gray-500 text-sm">
                      แสดง {items.length} จาก {totalCount} รายการ
                    </p>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* ✅ CitizenIdSync Modal - เปิดอัตโนมัติเมื่อยังไม่ sync */}
          <CitizenIdSync
            isOpen={showCitizenSync}
            onClose={() => setShowCitizenSync(false)}
            onSyncSuccess={handleSyncSuccess}
          />
        </>
      )}
    </>
  );
}