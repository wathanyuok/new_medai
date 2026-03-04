'use client';
import React, { useState, useEffect } from 'react';
import CitizenIdSync from "@/components/auth/CitizenIdSync";
import Register from "@/components/pages/Register";

interface NoSyncedComponentProps {
  title?: string;
  description?: string;
  buttonText?: string;
  imageSrc?: string;
  imageAlt?: string;
  onSyncSuccess?: () => void;
  showTermsCheckbox?: boolean;
  className?: string;
}

const NoSyncedComponent: React.FC<NoSyncedComponentProps> = ({
  title = "เอกสารผลตรวจจากคลินิก",
  description = "กรุณาเชื่อมต่อข้อมูลด้วยเลขบัตรประชาชนเพื่อดูเอกสารผลตรวจจากคลินิก",
  buttonText = "เชื่อมต่อข้อมูลด้วยเลขบัตรประชาชน",
  imageSrc = "/images/no-sync.png",
  imageAlt = "ไม่ได้เชื่อมต่อข้อมูล",
  onSyncSuccess,
  showTermsCheckbox = true,
  className = ""
}) => {
  // ✅ State สำหรับ CitizenIdSync Modal
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // State สำหรับ Register Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [pendingCid, setPendingCid] = useState("");

  // ✅ เปิด Modal อัตโนมัติเมื่อ component mount
  useEffect(() => {
    setIsSyncModalOpen(true);
  }, []);

  // Handler เมื่อ Sync สำเร็จ
  const handleSyncSuccess = (hasHN: boolean) => {
    setIsSyncModalOpen(false);
    onSyncSuccess?.();
    // Reload เพื่อดึงข้อมูลใหม่
    window.location.reload();
  };

  // Handler เมื่อเกิด error
  const handleSyncError = (error: string) => {
    console.error("Sync error:", error);
  };

  // Handler เมื่อต้องการไป Register (ไม่มี HN)
  const handleNeedRegister = (cid: string) => {
    setIsSyncModalOpen(false);
    setPendingCid(cid);
    setIsRegisterOpen(true);
  };

  // Handler เมื่อ Register สำเร็จ -> กลับไปทำ Sync/OTP
  const handleRegisterSuccess = (cid: string) => {
    setIsRegisterOpen(false);
    setPendingCid(cid);
    // เปิด CitizenIdSync อีกครั้งเพื่อทำ OTP flow
    setIsSyncModalOpen(true);
  };

  // Handler เมื่อปิด Register Modal
  const handleRegisterClose = () => {
    setIsRegisterOpen(false);
    setPendingCid("");
  };

  // Handler เมื่อปิด Sync Modal
  const handleCloseSyncModal = () => {
    setIsSyncModalOpen(false);
  };

  return (
    <>
      <div className={`flex flex-col items-center sm:items-start justify-center sm:justify-start min-h-[400px] ${className}`}>
        <div className="w-full text-center sm:text-start">
          <p className="text-gray-600 mb-6 leading-relaxed font-bold">
            {description}
          </p>

          {/* ❌ ลบปุ่ม "คลิก ยืนยันเลขบัตรประชาชน" - ใช้ Modal อัตโนมัติแทน */}
          {/* <div className="space-y-4 flex flex-col items-center sm:items-start">
            <div
              className="p-[2px] rounded-[45px] w-full max-w-sm"
              style={{
                background: 'linear-gradient(90deg, rgba(0,162,255,1) 0%, rgba(255,48,221,1) 100%)'
              }}
            >
              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="flex flex-row justify-center items-center py-4 gap-2 bg-white rounded-[45px] w-full hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold">คลิก</span>
                ยืนยันเลขบัตรประชาชนเพื่อดูผลตรวจสุขภาพ
              </button>
            </div>
          </div> */}
        </div>
      </div>

      {/* ✅ CitizenIdSync Modal - เปิดอัตโนมัติ */}
      <CitizenIdSync
        isOpen={isSyncModalOpen}
        onClose={handleCloseSyncModal}
        onSyncSuccess={handleSyncSuccess}
        onSyncError={handleSyncError}
        showTermsCheckbox={showTermsCheckbox}
      />

      {/* Register Modal */}
      <Register
        isOpen={isRegisterOpen}
        onClose={handleRegisterClose}
        defaultCitizenId={pendingCid}
        onRegisterSuccess={handleRegisterSuccess}
        showTermsCheckbox={showTermsCheckbox}
      />
    </>
  );
};

export default NoSyncedComponent;