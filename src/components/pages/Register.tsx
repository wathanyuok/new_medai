'use client';

import React, { useEffect, useState } from 'react';
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Checkbox from "../form/input/Checkbox";
import Link from "next/link";
import { toast } from "react-toastify";

interface RegisterProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCitizenId?: string;
  onSyncSuccess?: () => void;
  onSyncError?: (error: string) => void;
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

const Register: React.FC<RegisterProps> = ({
  isOpen,
  onClose,
  defaultCitizenId,
  onSyncSuccess,
  onSyncError,
  showTermsCheckbox = true,
  shopId,
  apiUrl
}) => {
  const [cid, setCid] = useState('');
  const [otp, setOtp] = useState('');
  const [blindPhone, setBlindPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [isAccept, setIsAccept] = useState(false);

  const getApiUrl = () => apiUrl || process.env.NEXT_PUBLIC_API_URL;
  const getShopId = () => shopId || parseInt(process.env.NEXT_PUBLIC_SHOP_ID || "950");

  // ✅ Prefill CID เฉพาะตอนเปิด modal (หรือ defaultCitizenId เปลี่ยน)
  useEffect(() => {
    if (!isOpen) return;
    setCid(defaultCitizenId || '');
    setOtp('');
    setBlindPhone('');
    setError('');
    setLoading(false);
    setPageIndex(0);
    setIsAccept(false);
  }, [isOpen, defaultCitizenId]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmitCitizenId = async () => {
    if (!cid.trim()) {
      setError("กรุณากรอกหมายเลขบัตรประชาชน");
      return;
    }

    setLoading(true);
    setError('');

    try {
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
        body: JSON.stringify({ co_citizen_id: cid }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const json: SyncResponse = await response.json();

      if (json.status) {
        const formattedTel = json.co_tel?.replace(/(\d{3})\d{3}(\d{4})/, 'xxx-xxx-$2') || '';
        setBlindPhone(formattedTel);
        setPageIndex(1);
        setError("");
      } else {
        setError("รหัสบัตรประชาชนไม่ถูกต้องหรือถูกเชื่อมต่อข้อมูลไปแล้ว");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      setError(errorMessage);
      onSyncError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
        if (data.data?.access_token) {
          localStorage.setItem("token", data.data.access_token);
        }
        localStorage.setItem("is_online_data_sync", "true");

        setError("");
        handleClose();
        onSyncSuccess?.();

        toast.success("เชื่อมต่อข้อมูลสำเร็จ");
        window.location.reload();
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

  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCid(value);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) setOtp(value);
  };

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
            ลงทะเบียน/กรอกข้อมูลก่อนเชื่อมต่อ
          </h4>
        </div>

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
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
                  <div>
                    <Label>หมายเลขบัตรประชาชน</Label>
                    <Input
                      key={cid}              // ✅ สำคัญ: ทำให้ defaultValue อัปเดตเมื่อ cid ถูก set จาก parent
                      disabled={loading}
                      type="text"
                      defaultValue={cid}     // ✅ แทน value (InputField ของคุณไม่รองรับ value)
                      onChange={handleCitizenIdChange}
                      placeholder="x-xxxx-xxxx-xx-x"
                      max="13"
                    />
                  </div>

                  {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
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
      </div>
    </Modal>
  );
};

export default Register;
