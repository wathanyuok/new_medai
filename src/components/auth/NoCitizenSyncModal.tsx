'use client';

import React, { useState } from 'react';
import CitizenIdSync from "@/components/pages/CitizenIdSync";
import Register from "@/components/pages/Register";
import { useCitizenSync } from "@/hooks/useCitizenSync";

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
  title = "ยังไม่ได้เชื่อมต่อข้อมูลกับสถานพยาบาล",
  description = "กรุณาเชื่อมต่อข้อมูลด้วยเลขบัตรประชาชนเพื่อดูผลตรวจสุขภาพจากคลินิก",
  buttonText = "เชื่อมต่อข้อมูลด้วยเลขบัตรประชาชน",
  imageSrc = "/images/no-sync.png",
  imageAlt = "ไม่ได้เชื่อมต่อข้อมูล",
  onSyncSuccess,
  showTermsCheckbox = true,
  className = ""
}) => {
  const {
    isSyncModalOpen,
    openSyncModal,
    closeSyncModal,
    handleSyncSuccess,
    handleSyncError,
  } = useCitizenSync();

  // State สำหรับ Register Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [pendingCid, setPendingCid] = useState("");

  // Handler เมื่อ Sync สำเร็จ
  const onSyncSuccessHandler = () => {
    handleSyncSuccess();
    onSyncSuccess?.();
  };

  // Handler เมื่อต้องการไป Register (ไม่มี HN)
  const handleNeedRegister = (cid: string) => {
    closeSyncModal();
    setPendingCid(cid);
    setIsRegisterOpen(true);
  };

  // Handler เมื่อ Register สำเร็จ -> กลับไปทำ Sync/OTP
  const handleRegisterSuccess = (cid: string) => {
    setIsRegisterOpen(false);
    setPendingCid(cid);
    // เปิด CitizenIdSync อีกครั้งเพื่อทำ OTP flow
    openSyncModal();
  };

  // Handler เมื่อปิด Register Modal
  const handleRegisterClose = () => {
    setIsRegisterOpen(false);
    setPendingCid("");
  };

  return (
    <>
      <div className={`flex flex-col items-center sm:items-start justify-center sm:justify-start min-h-[400px] ${className}`}>
        <div className="w-full text-center sm:text-start">
          <p className="text-gray-600 mb-6 leading-relaxed font-bold">
            {description}
          </p>

          <div className="space-y-4 flex flex-col items-center sm:items-start">
            <div
              className="p-[2px] rounded-[45px] w-full max-w-sm"
              style={{
                background: 'linear-gradient(90deg, rgba(0,162,255,1) 0%, rgba(255,48,221,1) 100%)'
              }}
            >
              <button
                onClick={openSyncModal}
                className="flex flex-row justify-center items-center py-4 gap-2 bg-white rounded-[45px] w-full hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold">คลิก</span>
                ยืนยันเลขบัตรประชาชนเพื่อดูผลตรวจสุขภาพ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Citizen ID Sync Modal */}
      <CitizenIdSync
        isOpen={isSyncModalOpen}
        onClose={closeSyncModal}
        onSyncSuccess={onSyncSuccessHandler}
        onSyncError={handleSyncError}
        showTermsCheckbox={showTermsCheckbox}
        onNeedRegister={handleNeedRegister}
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