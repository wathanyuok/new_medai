'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';

const TwoStepVerification: React.FC = () => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [otp, setOtp] = useState(Array(6).fill(''));
    const router = useRouter();

    const handleChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const finalOtp = otp.join('');
        const lineUserStr = localStorage.getItem('someData');
        const phone = localStorage.getItem('phone');
        const cid = localStorage.getItem('cid');

        if (!lineUserStr) {
            alert('กรุณาเข้าสู่ระบบด้วย LINE ก่อน');
            router.push('/ai/login');
            return;
        }

        const { lineId } = JSON.parse(lineUserStr);

        try {
            // const res = await axios.post('https://shop.api-apsx.co/crm/auth/otp', {
            //     line_id,
            //     tel: phone,
            //     otp: finalOtp,
            // }, {
            //     headers: {
            //         Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`,
            //     },
            // });
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/auth/otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`,
                },
                body: JSON.stringify({
                    line_id: lineId,
                    tel: phone,
                    otp: finalOtp,
                    co_citizen_id: cid,
                }),
            });
            const data = await res.json();
            console.log('Response data: otp', data?.data?.access_token);
            const tokens = data?.data?.access_token;

            if (tokens && data.status === true) {
                localStorage.setItem('token', tokens);
                document.cookie = `token=${tokens}; path=/;`;
                toast.success('เข้าสู่ระบบสำเร็จ');
                router.push('/ai');
            } else if (!tokens) {
                localStorage.setItem('token', tokens);
                document.cookie = `token=${tokens}; path=/;`;
                toast.error('เข้าสู่ระบบไม่สำเร็จ');
            } else {
                toast.error('ไม่พบ token จากระบบ');
            }
        } catch (error) {
            console.error('OTP verification failed:', error);
            alert('เกิดข้อผิดพลาดในการยืนยัน OTP');
            router.push('/signin');
        }
    };

    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                            Two Step Verification
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            กรอกรหัส OTP ที่ส่งไปยังหมายเลขโทรศัพท์ของคุณ
                        </p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                    กรอกรหัส OTP 6 หลัก
                                </label>
                                <div className="flex gap-2 sm:gap-4" id="otp-container">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el: HTMLInputElement | null) => {
                                                inputRefs.current[i] = el;
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                            className="otp-input h-11 w-full rounded-lg border border-gray-300 bg-transparent p-4 text-center text-xl font-semibold text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                                >
                                    ยืนยันรหัส OTP
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-5 text-center text-sm text-gray-700 dark:text-gray-400">
                        <span>กลับไปที่</span>{' '}
                        <a href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                            เข้าสู่ระบบ
                        </a>
                    </div>
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

export default TwoStepVerification;
