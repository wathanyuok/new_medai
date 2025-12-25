'use client';

import React from 'react';
import Image from 'next/image';
import CitizenIdSync from "@/components/pages/CitizenIdSync";
import { useCitizenSync } from "@/hooks/useCitizenSync";
import { LiaIdCardSolid } from 'react-icons/lia';

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
  // Use the citizen sync hook
  const {
    isSyncModalOpen,
    openSyncModal,
    closeSyncModal,
    handleSyncSuccess,
    handleSyncError,
  } = useCitizenSync();

  // Handle sync success
  const onSyncSuccessHandler = () => {
    handleSyncSuccess();
    onSyncSuccess?.();
  };

  return (
    <>
      <div className={`flex flex-col items-center sm:items-start justify-center sm:justify-start min-h-[400px]  ${className}`}>
        <div className="w-full text-center sm:text-start ">
          
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
                {/* <LiaIdCardSolid size={25} className="text-[#4385EF]" /> */}
                <span className="font-bold">คลิก</span>ยืนยันเลขบัตรประชาชนเพื่อดูผลตรวจสุขภาพ 
                
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
      />
    </>
  );
};

export default NoSyncedComponent;