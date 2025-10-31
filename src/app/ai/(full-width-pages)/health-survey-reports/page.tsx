"use client";
import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/navigation";

const Page = () => {
  const [step, setStep] = useState(1); // 1 = citizen ID, 2 = OTP verification
  const [citizenId, setCitizenId] = useState("");
  const [otp, setOtp] = useState("");
  const [tel,setTel] = useState("");
  const [otpKey, setOtpKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // Format Thai citizen ID (X-XXXX-XXXXX-XX-X)
  const formatCitizenId = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 13 digits
    const limitedDigits = digits.slice(0, 13);
    
    // Apply formatting
    if (limitedDigits.length <= 1) return limitedDigits;
    if (limitedDigits.length <= 5) return `${limitedDigits.slice(0, 1)}-${limitedDigits.slice(1)}`;
    if (limitedDigits.length <= 10) return `${limitedDigits.slice(0, 1)}-${limitedDigits.slice(1, 5)}-${limitedDigits.slice(5)}`;
    if (limitedDigits.length <= 12) return `${limitedDigits.slice(0, 1)}-${limitedDigits.slice(1, 5)}-${limitedDigits.slice(5, 10)}-${limitedDigits.slice(10)}`;
    return `${limitedDigits.slice(0, 1)}-${limitedDigits.slice(1, 5)}-${limitedDigits.slice(5, 10)}-${limitedDigits.slice(10, 12)}-${limitedDigits.slice(12)}`;
  };

  // Get raw digits for API call
  const getRawCitizenId = () => {
    return citizenId.replace(/\D/g, '');
  };

  // Format phone number to show only last 4 digits
  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 4) return cleaned;
    const lastFour = cleaned.slice(-4);
    const masked = '*'.repeat(cleaned.length - 4);
    return `${masked}${lastFour}`;
  };

  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCitizenId(e.target.value);
    setCitizenId(formatted);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Allow only digits, max 6
    setOtp(value);
  };

  const handleStep1Submit = async () => {
    const rawCitizenId = getRawCitizenId();
    if (!rawCitizenId || rawCitizenId.length !== 13) {
      toast.error('กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก');
      return;
    }

    setIsLoading(true);

    try {
      const token = process.env.NEXT_PUBLIC_TK_PUBLIC_KEY;
      if (!token) {
        toast.error('Token is missing. Please check your environment variables.');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/checkhealthsurvey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ co_citizen_id: rawCitizenId })
      });

      const result = await res.json();
      if (result.status === true) {
        setTel(result.data.co_tel);
        toast.success('OTP ส่งไปยังหมายเลขโทรศัพท์ที่ผูกกับบัตรประชาชนแล้ว');
        setStep(2); // Move to OTP verification step
      } else {
        toast.warning('ไม่พบเลขบัตรประชาชนในระบบ');
      }
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('กรุณากรอก OTP ให้ครบ 6 หลัก');
      return;
    }

    setIsLoading(true);
const rawCitizenId = getRawCitizenId();
    try {
      const token = process.env.NEXT_PUBLIC_TK_PUBLIC_KEY;
      if (!token) {
        toast.error('Token is missing. Please check your environment variables.');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/otphealthsurvey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          co_citizen_id: rawCitizenId,
          co_otp: otp ,
          shop_id: parseInt(process.env.NEXT_PUBLIC_HEALTH_SURVEY_ID!),
        })
      });

      const result = await res.json();
      if (result.status === true) {
        toast.success('ยืนยัน OTP สำเร็จ');
        // Store any necessary data and redirect
        localStorage.setItem('hs_acc_token', result.data?.access_token || '');
        router.push('/health-survey-reports/detail'); // Or wherever you want to redirect after successful OTP
      } else {
        toast.error('OTP ไม่ถูกต้อง กรุณาลองอีกครั้ง');
      }
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setOtp('');
    setOtpKey('');
  };

  const renderStep1 = () => (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">รายงานผลตรวจสุขภาพ</h1>
        <p className="text-gray-600"></p>
      </div>

      {/* Main Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="p-6" style={{background: `linear-gradient(to right, #f639bd, #e935a8)`}}>
          <div className="flex items-center justify-center space-x-2 text-white">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <h2 className="text-xl font-semibold">ระบุเลขบัตรประชาชน</h2>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Citizen ID Input */}
          <div className="space-y-2">
            <label htmlFor="citizenId" className="block text-sm font-medium text-gray-700">
              เลขบัตรประชาชน (Citizen ID Number)
            </label>
            <div className="relative">
              <input
                disabled={isLoading}
                id="citizenId"
                type="text"
                value={citizenId}
                onChange={handleCitizenIdChange}
                placeholder="X-XXXX-XXXXX-XX-X"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl transition-all duration-200 bg-gray-50 hover:bg-white"
                style={{
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f639bd';
                  e.target.style.boxShadow = `0 0 0 2px rgba(246, 57, 189, 0.2)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                maxLength={17}
                required
              />
              <div className="absolute right-3 top-3 text-sm text-gray-400">
                {getRawCitizenId().length}/13
              </div>
            </div>
            {citizenId && getRawCitizenId().length < 13 && (
              <p className="text-sm text-red-500">กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleStep1Submit}
            disabled={!citizenId || getRawCitizenId().length !== 13 || isLoading}
            className="w-full text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            style={{
              background: `linear-gradient(to right, #f639bd, #e935a8)`,
              opacity: (!citizenId || getRawCitizenId().length !== 13 || isLoading) ? 0.5 : 1
            }}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>ตรวจสอบ</span>
                
              </>
            )}
          </button>

        
          
        </div>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">OTP Verification</h1>
      </div>

      {/* Main Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="p-6" style={{background: `linear-gradient(to right, #f639bd, #e935a8)`}}>
          <div className="flex items-center justify-center space-x-2 text-white">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <h2 className="text-xl font-semibold">Verify OTP</h2>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Citizen ID Display */}
          <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-pink-500">
            <p className="text-sm text-gray-600 justify-center flex">รหัสยืนยันตัวตนถูกส่งไปยังหมายเลขโทรศัพท์</p>
            <p className="font-mono text-lg font-semibold text-gray-800 justify-center flex">{formatPhoneNumber(tel)}</p>
          </div>

          {/* OTP Input */}
          <div className="space-y-2">
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              รหัส OTP (6 หลัก)
            </label>
            <div className="relative">
              <input
                disabled={isLoading}
                id="otp"
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl transition-all duration-200 bg-gray-50 hover:bg-white text-center text-2xl font-mono tracking-widest"
                style={{
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f639bd';
                  e.target.style.boxShadow = `0 0 0 2px rgba(246, 57, 189, 0.2)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                maxLength={6}
                required
              />
              <div className="absolute right-3 top-3 text-sm text-gray-400">
                {otp.length}/6
              </div>
            </div>
            {otp && otp.length < 6 && (
              <p className="text-sm text-red-500">กรุณากรอกรหัส OTP ให้ครบ 6 หลัก</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleStep2Submit}
              disabled={!otp || otp.length !== 6 || isLoading}
              className="w-full text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              style={{
                background: `linear-gradient(to right, #f639bd, #e935a8)`,
                opacity: (!otp || otp.length !== 6 || isLoading) ? 0.5 : 1
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>ตรวจสอบรหัส</span>
                  
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBackToStep1}
              disabled={isLoading}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
            
              <span>กลับ</span>
            </button>
          </div>

          {/* Resend OTP */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleStep1Submit}
              disabled={isLoading}
              className="text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{color: '#f639bd'}}
              onMouseEnter={(e) => !isLoading && ((e.target as HTMLElement).style.color = '#e935a8')}
              onMouseLeave={(e) => !isLoading && ((e.target as HTMLElement).style.color = '#f639bd')}
            >
             ไม่ได้รับรหัส ? รับรหัส OTP ใหม่
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full blur-xl" style={{backgroundColor: '#f639bd'}}></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-500 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-10 w-28 h-28 rounded-full blur-xl" style={{backgroundColor: '#f639bd'}}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
              step >= 1 ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300 text-gray-400'
            }`}>
              {step > 1 ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-bold">1</span>
              )}
            </div>
            <div className={`w-16 h-1 rounded-full transition-all duration-300 ${
              step >= 2 ? 'bg-pink-500' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
              step >= 2 ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300 text-gray-400'
            }`}>
              <span className="text-sm font-bold">2</span>
            </div>
          </div>
        </div>

        {/* Render Current Step */}
        {step === 1 ? renderStep1() : renderStep2()}

        {/* Footer Links */}
        <div className="text-center mt-10 space-y-2">
          
          <p className="text-sm text-gray-600">
            <a href="#" className="font-medium" style={{color: '#f639bd'}}
               onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#e935a8'}
               onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#f639bd'}>
              Privacy Policy
            </a>{" "}
            •{" "}
            <a href="#" className="font-medium ml-1" style={{color: '#f639bd'}}
               onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#e935a8'}
               onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#f639bd'}>
              Terms of Service
            </a>
          </p>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 99999 }}
      />
    </div>
  );
};

export default Page;