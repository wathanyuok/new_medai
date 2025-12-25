'use client';

import React, { useState } from 'react';
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Checkbox from "../form/input/Checkbox";
import Link from "next/link";
import { toast } from "react-toastify";

interface CitizenIdSyncProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
  onSyncError?: (error: string) => void;
  onNeedRegister?: (cid: string) => void;
  showTermsCheckbox?: boolean;
  shopId?: number;
  apiUrl?: string;
}

interface SyncResponse {
  status: boolean;
  co_tel?: string;
  data?: {
    access_token: string;
  };
}

const CitizenIdSync: React.FC<CitizenIdSyncProps> = ({
  isOpen,
  onClose,
  onSyncSuccess,
  onSyncError,
  onNeedRegister,
  showTermsCheckbox = true,
  shopId,
  apiUrl
}) => {
  // States
  // 0 = citizen id input
  // 1 = OTP verification
  // 2 = success page
  const [cid, setCid] = useState('');
  const [otp, setOtp] = useState('');
  const [blindPhone, setBlindPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [isAccept, setIsAccept] = useState(false);

  // Get configuration values
  const getApiUrl = () => apiUrl || process.env.NEXT_PUBLIC_API_URL;
  const getShopId = () => shopId || parseInt(process.env.NEXT_PUBLIC_SHOP_ID || "950");

  // Reset component state
  const resetState = () => {
    setCid('');
    setOtp('');
    setBlindPhone('');
    setError('');
    setLoading(false);
    setPageIndex(0);
    setIsAccept(false);
  };

  // Handle modal close
  const handleClose = () => {
    resetState();
    onClose();
  };

  // Step 1: Submit citizen ID
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
      const email = localStorage.getItem("email");
      const phone_number = localStorage.getItem("co_tel");
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("ไม่พบ token การเข้าสู่ระบบ");
      }

      const response = await fetch(`${getApiUrl()}/auth/onlinesyncexa`, {
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

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const json: SyncResponse = await response.json();

      if (json.status) {
        // มี HN แล้ว -> ไปหน้า OTP
        const formattedTel = json.co_tel?.replace(/(\d{3})\d{3}(\d{4})/, 'xxx-xxx-$2') || '';
        setBlindPhone(formattedTel);
        setPageIndex(1);
        setError("");
      } else {
        // ไม่มี HN -> ไปหน้า Register
        onNeedRegister?.(cid);
        handleClose();
        return;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      setError(errorMessage);
      onSyncError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP verification
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
        // Update localStorage
        if (data.data?.access_token) {
          localStorage.setItem("token", data.data.access_token);
        }
        localStorage.setItem("is_online_data_sync", "true");

        setError("");
        
        // ไปหน้า Success แทนการปิด modal ทันที
        setPageIndex(2);
        
        toast.success("เชื่อมต่อข้อมูลสำเร็จ");
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

  // Handle success close - reload page
  const handleSuccessClose = () => {
    onSyncSuccess?.();
    handleClose();
    // Reload page to reflect changes
    window.location.reload();
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
                {loading ? <LoadingSpinner /> : "เชื่อมต่อข้อมูล"}
              </Button>
            </div>
          </>
        )}

        {/* Step 1: OTP Verification */}
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
          </>
        )}

        {/* Step 2: Success Page */}
        {pageIndex === 2 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            {/* Success Icon */}
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

            {/* Success Text */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              เชื่อมต่อข้อมูลสำเร็จ
            </h2>
            <p className="text-gray-500 text-center mb-8">
              ข้อมูลของคุณถูกเชื่อมต่อกับสถานพยาบาลเรียบร้อยแล้ว
            </p>

            {/* Close Button */}
            <button
              onClick={handleSuccessClose}
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