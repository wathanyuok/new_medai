'use client';

import React, { useState } from 'react';
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Checkbox from "@/components/form/input/Checkbox";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface CitizenIdSyncProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: (hasHN: boolean) => void;
  onSyncError?: (error: string) => void;
  showTermsCheckbox?: boolean;
  shopId?: number;
  apiUrl?: string;
  redirectPath?: string; // path หลังยืนยัน OTP สำเร็จ (สำหรับ found: true)
  registerPath?: string; // path สำหรับ found: false (ไปหน้า register)
}

interface SyncResponse {
  status: boolean;
  co_tel?: string;
  message?: string;
  data?: {
    access_token: string;
  };
}

interface CitizenCheckResponse {
  status: boolean;
  found: boolean;
  data?: string;
}

interface CustomerData {
  id: number;
  ctm_id: string;
  ctm_citizen_id: string;
  ctm_prefix: string;
  ctm_fname: string;
  ctm_lname: string;
  ctm_tel: string;
  ctm_email: string;
  ctm_birthdate: string;
  ctm_address: string;
  ctm_district: string;
  ctm_amphoe: string;
  ctm_province: string;
  ctm_zipcode: string;
}

const CitizenIdSync: React.FC<CitizenIdSyncProps> = ({
  isOpen,
  onClose,
  onSyncSuccess,
  onSyncError,
  showTermsCheckbox = true,
  shopId,
  apiUrl,
  redirectPath,
  registerPath = "/ai/telemedicine/register"
}) => {
  const router = useRouter();
  
  // States
  // 0 = citizen id input
  // 1 = OTP verification (only for found: true)
  // 2 = success page (only for found: true)
  const [cid, setCid] = useState('');
  const [otp, setOtp] = useState('');
  const [blindPhone, setBlindPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [isAccept, setIsAccept] = useState(false);
  
  // เก็บสถานะว่ามี HN หรือไม่
  const [hasExistingHN, setHasExistingHN] = useState(false);

  // Get configuration values
  const getApiUrl = () => apiUrl || process.env.NEXT_PUBLIC_API_URL;
  const getShopId = () => shopId || parseInt(process.env.NEXT_PUBLIC_SHOP_ID || "949");

  // Reset component state
  const resetState = () => {
    setCid('');
    setOtp('');
    setBlindPhone('');
    setError('');
    setLoading(false);
    setPageIndex(0);
    setIsAccept(false);
    setHasExistingHN(false);
  };

  // Handle modal close
  const handleClose = () => {
    resetState();
    onClose();
  };

  // Step 1: Check if citizen ID has HN
  const handleSubmitCitizenId = async () => {
    if (!cid.trim()) {
      setError("กรุณากรอกหมายเลขบัตรประชาชน");
      return;
    }

    if (cid.length !== 13) {
      setError("หมายเลขบัตรประชาชนต้องมี 13 หลัก");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("ไม่พบ token การเข้าสู่ระบบ");
      }

      // ===== Step 1: เช็คว่ามี HN ใน shop นี้หรือยัง =====
      const checkResponse = await fetch(`${getApiUrl()}/customer/exa/check-citizen-id`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          citizen_id: cid,
          shop_id: getShopId()
        }),
      });

      if (!checkResponse.ok) {
        throw new Error(`Check citizen failed with status ${checkResponse.status}`);
      }

      const checkResult: CitizenCheckResponse = await checkResponse.json();
      
      // เก็บสถานะว่ามี HN หรือไม่
      setHasExistingHN(checkResult.found);
      
      // เก็บ citizenId ไว้ใน localStorage
      localStorage.setItem("citizenId", cid);
      localStorage.setItem("hasExistingHN", checkResult.found ? "true" : "false");

      // ===== แยก Flow ตาม found =====
      if (checkResult.found) {
        // ✅ found: true → มี HN แล้ว → ส่ง OTP เพื่อ sync (Flow 1)
        await handleSendOTP();
      } else {
        // ✅ found: false → ไม่มี HN → ไปหน้า Register (Flow 2)
        toast.info("กรุณากรอกข้อมูลเพื่อลงทะเบียน");
        
        // ลบข้อมูล prefill ถ้ามี
        localStorage.removeItem("prefillCustomerData");
        
        // ปิด Modal และ redirect ไปหน้า Register
        handleClose();
        router.push(registerPath);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      setError(errorMessage);
      onSyncError?.(errorMessage);
      setLoading(false);
    }
  };

  // ✅ Send OTP (only for found: true - Flow 1)
  const handleSendOTP = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("ไม่พบ token การเข้าสู่ระบบ");
      }

      const email = localStorage.getItem("email") || "";
      const phone_number = localStorage.getItem("co_tel") || "";

      const syncResponse = await fetch(`${getApiUrl()}/auth/onlinesyncexa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          co_citizen_id: cid,
          co_email: email,
          co_tel: phone_number
        }),
      });

      if (!syncResponse.ok) {
        throw new Error(`Sync request failed with status ${syncResponse.status}`);
      }

      const syncResult: SyncResponse = await syncResponse.json();

      if (syncResult.status) {
        // ✅ ส่ง OTP สำเร็จ → เก็บเบอร์โทรไว้ใช้
        if (syncResult.co_tel) {
          localStorage.setItem("co_tel", syncResult.co_tel);
        }
        
        const formattedTel = syncResult.co_tel?.replace(/(\d{3})\d{3}(\d{4})/, 'xxx-xxx-$2') || '';
        setBlindPhone(formattedTel);
        setPageIndex(1);
        setError("");
      } else {
        // ไม่สามารถส่ง OTP ได้
        setError(syncResult.message || "ไม่สามารถส่งรหัส OTP ได้");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่ง OTP";
      setError(errorMessage);
      onSyncError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 2: Submit OTP verification (only for found: true - Flow 1)
  const handleSubmitOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError("กรุณากรอกรหัส OTP 6 หลัก");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("ไม่พบ token การเข้าสู่ระบบ");
      }

      const response = await fetch(`${getApiUrl()}/auth/otponlinesyncexa-lock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cid: cid,
          otp: otp,
          shop_id: getShopId()
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data: SyncResponse = await response.json();

      if (data.status) {
        // Update localStorage with new token
        if (data.data?.access_token) {
          localStorage.setItem("token", data.data.access_token);
        }
        localStorage.setItem("is_online_data_sync", "true");
        localStorage.setItem("hasExistingHN", "true");  // ✅ เพิ่มสำหรับ Flow 1

        setError("");

        // ===== มี HN แล้ว → ดึงข้อมูล customer มาเก็บไว้ =====
        toast.success("พบข้อมูลในระบบ กำลังโหลดข้อมูล...");
        
        const customerData = await fetchCustomerData(data.data?.access_token || token);
        
        if (customerData) {
          // เก็บข้อมูล customer ไว้ใน localStorage เพื่อให้หน้าฟอร์มดึงไปแสดง
          localStorage.setItem("prefillCustomerData", JSON.stringify(customerData));
          localStorage.setItem("userHN", customerData.ctm_id || "");
          localStorage.setItem("userCustomerId", customerData.id?.toString() || "");
        }

        // ไปหน้า Success
        setPageIndex(2);
        
      } else {
        setError("รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการยืนยัน OTP";
      setError(errorMessage);
      onSyncError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch customer data after OTP success (for existing HN - Flow 1)
  const fetchCustomerData = async (token: string): Promise<CustomerData | null> => {
    try {
      const response = await fetch(`${getApiUrl()}/customer`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      
      if (data.status && data.data?.customer) {
        return data.data.customer;
      }
      return null;
    } catch (error) {
      console.error("Error fetching customer data:", error);
      return null;
    }
  };

  // ✅ Handle success button click (only for found: true - Flow 1)
  const handleSuccessClick = () => {
    console.log("=== handleSuccessClick ===");
    console.log("registerPath:", registerPath);
    console.log("localStorage before redirect:");
    console.log("- hasExistingHN:", localStorage.getItem("hasExistingHN"));
    console.log("- is_online_data_sync:", localStorage.getItem("is_online_data_sync"));
    console.log("- citizenId:", localStorage.getItem("citizenId"));
    console.log("- token:", localStorage.getItem("token") ? "มี" : "ไม่มี");
    
    // Flow 1: ไปหน้า register เพื่อแสดงข้อมูล + จัดการที่อยู่จัดส่ง
    // ไม่เรียก onSyncSuccess ก่อน เพราะอาจ trigger การ clear localStorage
    router.push(registerPath);
  };

  // Format citizen ID input
  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCid(value);
  };

  // Format OTP input
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center gap-2">
      <svg width="40" height="20" viewBox="0 0 120 30">
        <circle cx="30" cy="15" r="10" fill="#60A5FA">
          <animate attributeName="cy" from="15" to="15" dur="0.6s" begin="0s" repeatCount="indefinite" values="15;5;15" keyTimes="0;0.5;1"></animate>
        </circle>
        <circle cx="60" cy="15" r="10" fill="#60A5FA">
          <animate attributeName="cy" from="15" to="15" dur="0.6s" begin="0.2s" repeatCount="indefinite" values="15;5;15" keyTimes="0;0.5;1"></animate>
        </circle>
        <circle cx="90" cy="15" r="10" fill="#60A5FA">
          <animate attributeName="cy" from="15" to="15" dur="0.6s" begin="0.4s" repeatCount="indefinite" values="15;5;15" keyTimes="0;0.5;1"></animate>
        </circle>
      </svg>
      <span>กำลังโหลด...</span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[700px] m-4 z-99">
      <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        <div className="px-2 pr-6">
          <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            เชื่อมต่อข้อมูลกับสถานพยาบาล
          </h4>
        </div>

        {/* Step 0: Citizen ID Input */}
        {pageIndex === 0 && (
          <>
            <form
              className="flex flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitCitizenId();
              }}
            >
              <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3 space-y-8">
                <div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
                    <div>
                      <Label>หมายเลขบัตรประชาชน</Label>
                      <Input
                        disabled={loading}
                        type="text"
                        value={cid}
                        onChange={handleCitizenIdChange}
                        placeholder="x-xxxx-xxxx-xx-x"
                        maxLength={13}
                      />
                    </div>
                    {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
                  </div>
                </div>
              </div>

              {showTermsCheckbox && (
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="mt-1 w-5 h-5"
                    checked={isAccept}
                    onChange={() => setIsAccept(!isAccept)}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    การสร้างบัญชีแสดงว่าคุณยอมรับ{' '}
                    <span className="text-brand-500 hover:text-brand-600 dark:text-white/90 font-medium">
                      <Link target="_blank" href="">
                        ข้อตกลงการใช้บริการ
                      </Link>
                    </span>{' '}
                    และ{' '}
                    <span className="text-brand-500 hover:text-brand-600 dark:text-white/90 font-medium">
                      <Link target="_blank" href="">
                        นโยบายความเป็นส่วนตัว
                      </Link>
                    </span>{' '}
                    ของเรา
                  </p>
                </div>
              )}
            </form>

            <div className="flex items-center justify-center w-full gap-3 px-2 mt-6">
              <Button
                disabled={(!isAccept && showTermsCheckbox) || loading || !cid.trim()}
                onClick={handleSubmitCitizenId}
                className="flex justify-center"
                size="sm"
              >
                {loading ? <LoadingSpinner /> : "ถัดไป"}
              </Button>
            </div>
          </>
        )}

        {/* ✅ Step 1: OTP Verification Page (for found: true - Flow 1) */}
        {pageIndex === 1 && (
          <>
            <form
              className="flex flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitOtp();
              }}
            >
              <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3 space-y-8">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
                  <p className="text-md flex text-center justify-center text-gray-500 dark:text-gray-400">
                    หมายเลขบัตรประชาชนที่ใช้เชื่อมต่อ
                  </p>
                  <p className="text-md flex justify-center text-pink-400 dark:text-gray-400">
                    {cid}
                  </p>
                  <p className="text-md flex text-center justify-center text-gray-500 dark:text-gray-400">
                    กรุณากรอกรหัสยืนยันที่เราส่งไปยังหมายเลขโทรศัพท์ของคุณ
                  </p>
                  <p className="text-md flex justify-center text-pink-400 dark:text-gray-400">
                    {blindPhone}
                  </p>

                  <div className="flex justify-center">
                    <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-600">
                      ✓ พบข้อมูลในระบบ
                    </span>
                  </div>

                  <div className="flex justify-center">
                    <input
                      disabled={loading}
                      placeholder="รหัสยืนยัน"
                      className="text-center text-lg w-full sm:w-4/12 border border-gray-400 bg-white py-4 rounded-md"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={handleOtpChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSubmitOtp();
                        }
                      }}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 dark:text-red-400 text-center">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            </form>

            <div className="flex items-center justify-center w-full gap-3 px-2">
              <Button
                onClick={handleSubmitOtp}
                className="flex justify-center"
                size="sm"
                disabled={loading || otp.length !== 6}
              >
                {loading ? <LoadingSpinner /> : "ยืนยัน"}
              </Button>
            </div>

            <div className="flex items-center justify-center w-full gap-3 px-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setPageIndex(0);
                  setOtp('');
                  setError('');
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← กลับไปแก้ไขเลขบัตร
              </button>
            </div>
          </>
        )}

        {/* ✅ Step 2: Success Page (for found: true - Flow 1) */}
        {pageIndex === 2 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-32 h-32 mb-6 relative">
              <div className="absolute inset-0 bg-pink-100 rounded-full"></div>
              <div className="absolute inset-2 bg-pink-200 rounded-full flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-pink-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              พบข้อมูลในระบบ
            </h2>
            <p className="text-gray-500 text-center mb-8">
              ข้อมูลของคุณถูกเชื่อมต่อกับสถานพยาบาลเรียบร้อยแล้ว
            </p>

            <button
              onClick={handleSuccessClick}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
            >
              ดำเนินการต่อ
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CitizenIdSync;