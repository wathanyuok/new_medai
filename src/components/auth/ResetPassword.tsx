"use client";
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';

const ResetPassword: React.FC = () => {
    const [step, setStep] = useState<'email' | 'otp' | 'reset-password' | 'success'>('email');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [blind, setBind] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [renewToken, setRenewToken] = useState("")

    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('กรุณากรอกอีเมล');
            return;
        }
        if (!phoneNumber) {
            toast.error('กรุณากรอกเบอร์โทรศัพท์');
            return;
        }

        // Basic phone number validation (Thai format)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phoneNumber.replace(/[-\s]/g, ''))) {
            toast.error('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)');
            return;
        }

        setIsLoading(true);
        try {
            // Simulate API call to send OTP
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgotpassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`,
                },
                body: JSON.stringify({
                    co_tel: phoneNumber,
                    co_email: email,
                }),
            });
            const data = await res.json();
            if (data.status === true) {
                const formattedTel = phoneNumber!.replace(/(\d{3})\d{3}(\d{4})/, 'xxx-xxx-$2');
                setBind(formattedTel)
                toast.success('ส่งรหัส OTP ไปยังอีเมลและเบอร์โทรศัพท์ของคุณแล้ว');
                setStep('otp');
                setCountdown(1);
            } else {
                toast.error('ไม่พบบัญชีที่ตรงกับอีเมล์และหมายเลขโทรศัพท์');
            }
        } catch (error) {
            toast.error('ไม่พบบัญชีที่ตรงกับอีเมล์และหมายเลขโทรศัพท์');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
            return;
        }

        setIsLoading(true);
        try {
            // Simulate API call to send OTP
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verifynew`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`,
                },
                body: JSON.stringify({
                    co_tel: phoneNumber,
                    co_otp: otp,
                }),
            });
            const data = await res.json();
            if (data.status === true) {
                setRenewToken(data.data.access_token)
                toast.success('ยืนยัน OTP สำเร็จ');
                setStep('reset-password');
            } else {
                toast.error('OTP ไม่ถูกต้อง โปรดลองอีกครั้ง');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่อีกครั้ง');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            toast.error('กรุณากรอกรหัสผ่านให้ครบถ้วน');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('รหัสผ่านไม่ตรงกัน');
            return;
        }

        setIsLoading(true);
        try {
            // Simulate API call to send OTP
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/renewpassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${renewToken}`,
                },
                body: JSON.stringify({
                    new_password: newPassword
                }),
            });
            const data = await res.json();
            if (data.status === true) {
                setStep('success');
            } else {
                toast.error('เปลี่ยนรหัสไม่ผ่านสำเร็จ โปรดลองอีกครั้ง');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดบางอย่าง โปรดลองอีกครั้ง');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (countdown > 0) return;

        setIsLoading(true);
        try {
            // Simulate API call to send OTP
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgotpassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`,
                },
                body: JSON.stringify({
                    co_tel: phoneNumber,
                    co_email: email,
                }),
            });
            const data = await res.json();
            if (data.status === true) {
                const formattedTel = phoneNumber!.replace(/(\d{3})\d{3}(\d{4})/, 'xxx-xxx-$2');
                setBind(formattedTel)
                toast.success('ส่งรหัส OTP ไปยังอีเมลและเบอร์โทรศัพท์ของคุณแล้ว');
                setStep('otp');
                setOtp('')
                setCountdown(1);
            } else {
                toast.error('ไม่พบบัญชีที่ตรงกับอีเมล์และหมายเลขโทรศัพท์');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToEmail = () => {
        setStep('email');
        setOtp('');
        setCountdown(0);
    };

    const handleBackToOtp = () => {
        setStep('otp');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleLoginRedirect = () => {
        // Add your login redirect logic here
        window.location.href = '/ai/login';
    };

    return (
        <section className="flex flex-col flex-1 items-center justify-center lg:w-1/2 w-full px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo & Headline */}
                <div className="mb-6 text-center">
                    <Image
                        width={200}
                        height={60}
                        src="/images/logo/logo.svg"
                        alt="Logo"
                        className="mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                        {step === 'email' && 'ลืมรหัสผ่าน?'}
                        {step === 'otp' && 'ยืนยันรหัส OTP'}
                        {step === 'reset-password' && 'ตั้งรหัสผ่านใหม่'}
                        {step === 'success' && 'เปลี่ยนรหัสผ่านสำเร็จ!'}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {step === 'email' && 'กรอกอีเมลและเบอร์โทรศัพท์ที่เชื่อมกับบัญชีของคุณ ระบบจะส่งรหัส OTP เพื่อยืนยันตัวตน'}
                        {step === 'otp' && `กรอกรหัส OTP 6 หลักที่ส่งไปยังเบอร์ ${blind}`}
                        {step === 'reset-password' && 'กรอกรหัสผ่านใหม่ของคุณ'}
                        {step === 'success' && 'รหัสผ่านของคุณได้ถูกเปลี่ยนเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที'}
                    </p>
                </div>

                {/* Step Progress Indicator */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center ${step === 'email' ? 'text-brand-500' : 'text-green-500'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'email' ? 'bg-brand-500 text-white' : 'bg-green-500 text-white'
                                }`}>
                                {step === 'email' ? '1' : '✓'}
                            </div>
                            <span className="ml-2 text-xs font-medium">ข้อมูล</span>
                        </div>
                        <div className={`flex-1 h-0.5 mx-2 ${step === 'email' ? 'bg-gray-300' : 'bg-green-500'}`}></div>
                        <div className={`flex items-center ${step === 'email' ? 'text-gray-400' :
                            step === 'otp' ? 'text-brand-500' : 'text-green-500'
                            }`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'email' ? 'bg-gray-300 text-gray-600' :
                                step === 'otp' ? 'bg-brand-500 text-white' : 'bg-green-500 text-white'
                                }`}>
                                {step === 'email' ? '2' : step === 'otp' ? '2' : '✓'}
                            </div>
                            <span className="ml-2 text-xs font-medium">OTP</span>
                        </div>
                        <div className={`flex-1 h-0.5 mx-2 ${(step === 'reset-password' || step === 'success') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`flex items-center ${step === 'reset-password' ? 'text-brand-500' : step === 'success' ? 'text-green-500' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'reset-password' ? 'bg-brand-500 text-white' : step === 'success' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                                }`}>
                                {step === 'success' ? '✓' : '3'}
                            </div>
                            <span className="ml-2 text-xs font-medium">รหัสผ่าน</span>
                        </div>
                        <div className={`flex-1 h-0.5 mx-2 ${step === 'success' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`flex items-center ${step === 'success' ? 'text-brand-500' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'success' ? 'bg-brand-500 text-white' : 'bg-gray-300 text-gray-600'
                                }`}>
                                {step === 'success' ? '✓' : '4'}
                            </div>
                            <span className="ml-2 text-xs font-medium">เสร็จสิ้น</span>
                        </div>
                    </div>
                </div>

                {/* Email and Phone Form */}
                {step === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                อีเมล <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white dark:bg-dark-900 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 shadow-theme-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="0812345678"
                                maxLength={10}
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white dark:bg-dark-900 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 shadow-theme-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                กรอกเบอร์โทรศัพท์ 10 หลัก (ไม่ต้องใส่ขีด)
                            </p>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-gray-400 text-white px-4 py-3 text-sm font-medium shadow-md transition duration-150"
                            >
                                {isLoading ? 'กำลังส่ง...' : 'ส่งรหัส OTP'}
                            </button>
                        </div>
                    </form>
                )}

                {/* OTP Form */}
                {step === 'otp' && (
                    <form onSubmit={handleOtpSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                รหัส OTP <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="otp"
                                name="otp"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="123456"
                                maxLength={6}
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white dark:bg-dark-900 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 shadow-theme-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-center text-lg font-semibold tracking-widest"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
                                กรอกรหัส OTP 6 หลัก
                            </p>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-gray-400 text-white px-4 py-3 text-sm font-medium shadow-md transition duration-150"
                            >
                                {isLoading ? 'กำลังยืนยัน...' : 'ยืนยันรหัส OTP'}
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                ไม่ได้รับรหัส OTP?{' '}
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={countdown > 0 || isLoading}
                                    className="text-brand-500 hover:text-brand-600 disabled:text-gray-400 font-medium"
                                >
                                    {countdown > 0 ? `ส่งใหม่ใน ${countdown}s` : 'ส่งใหม่'}
                                </button>
                            </p>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleBackToEmail}
                                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ← กลับไปแก้ไขข้อมูล
                            </button>
                        </div>
                    </form>
                )}

                {/* Reset Password Form */}
                {step === 'reset-password' && (
                    <form onSubmit={handlePasswordReset} className="space-y-5">
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                รหัสผ่านใหม่ <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    id="newPassword"
                                    name="newPassword"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="กรอกรหัสผ่านใหม่"
                                    className="h-11 w-full rounded-lg border border-gray-300 bg-white dark:bg-dark-900 px-4 py-2.5 pr-10 text-sm text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 shadow-theme-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="ยืนยันรหัสผ่านใหม่"
                                    className="h-11 w-full rounded-lg border border-gray-300 bg-white dark:bg-dark-900 px-4 py-2.5 pr-10 text-sm text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 shadow-theme-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                </button>
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                                <div className="mt-2 text-xs text-red-500">
                                    รหัสผ่านไม่ตรงกัน
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || newPassword !== confirmPassword}
                                className="w-full flex items-center justify-center rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-gray-400 text-white px-4 py-3 text-sm font-medium shadow-md transition duration-150"
                            >
                                {isLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleBackToOtp}
                                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ← กลับไปขั้นตอนก่อนหน้า
                            </button>
                        </div>
                    </form>
                )}

                {/* Success Step */}
                {step === 'success' && (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                รหัสผ่านได้ถูกเปลี่ยนแล้ว!
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleLoginRedirect}
                                className="w-full flex items-center justify-center rounded-lg bg-brand-500 hover:bg-brand-600 text-white px-4 py-3 text-sm font-medium shadow-md transition duration-150"
                            >
                                เข้าสู่ระบบ
                            </button>
                        </div>
                    </div>
                )}
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
        </section>
    );
};

export default ResetPassword;