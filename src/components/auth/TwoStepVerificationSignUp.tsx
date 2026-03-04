'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
// import Input from '../form/input/InputField';

const TwoStepVerificationSignUpSignUp: React.FC = () => {
    // const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [otp, setOtp] = useState('');
    const [phone, setPhone] = useState('');
    // const [otpKey, setOtpKey] = useState('');
    const [blind, setBind] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(300);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        // setOtpKey(localStorage.getItem('otp_key')!);
        setPhone(localStorage.getItem('co_tel')!);
        const formattedTel = localStorage.getItem('co_tel')!.replace(/(\d{3})\d{3}(\d{4})/, 'xxx-xxx-$2');
        setBind(formattedTel)

    }, []);
    useEffect(() => {
        if (timeLeft === 0) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval); // Clean up
    }, [timeLeft]);
    const formatTime = (seconds: number) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true)
        const email = localStorage.getItem('co_email');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/otponline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`,
                },
                body: JSON.stringify({
                    co_tel: phone,
                    co_email: email,
                    otp: otp,
                    // co_citizen_id: cid,
                }),
            });
            const data = await res.json();
            console.log('Response data: otp', data?.data?.access_token);
            const tokens = data?.data?.access_token;

            if (tokens && data.status === true) {
                localStorage.removeItem("cid")
                localStorage.setItem('token', tokens);
                document.cookie = `token=${tokens}; path=/;`;
                const co_profile = await fetchCustomerProfile(tokens)
                console.log(co_profile.co_line_id !== null)
                console.log(co_profile.co_line_id !== '')
                if (co_profile.co_line_id !== '') {
                    localStorage.setItem('is_line_sync', 'true');
                } else {
                    localStorage.setItem('is_line_sync', 'false');
                }
                if (co_profile.is_online_data_sync== true) {
                    localStorage.setItem('is_online_data_sync', 'true');
                }else{
                    localStorage.setItem('is_online_data_sync', 'false');
                }
                localStorage.setItem('username', co_profile?.co_fname + ' ' + co_profile?.co_lname);
                localStorage.setItem('email', co_profile?.co_email);
                // toast.success('ยืนยัน OPT สำเร็จ');
                router.push('/ai');
            } else if (!tokens) {
                setLoading(false)
                localStorage.setItem('token', tokens);
                document.cookie = `token=${tokens}; path=/;`;
                toast.error('รหัสยืนยันไม่ถูกต้องหรือหมดอายุ โปรดลองใหม่อีกครั้ง');
                setError('รหัสยืนยันไม่ถูกต้องหรือหมดอายุ โปรดลองใหม่อีกครั้ง')
            } else {
                setLoading(false)
                toast.error('ไม่พบ token จากระบบ');
            }
        } catch (error) {
            console.error('OTP verification failed:', error);
            setLoading(false)
            alert('เกิดข้อผิดพลาดในการยืนยัน OTP');
            // router.push('/signup');
        }
    };

    const fetchCustomerProfile = async (token: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/co_profile`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            console.log(data)
            return data.data
        } catch {
            console.error('Failed to fetch customer profile');
        }
    }


    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar p-6">
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold flex justify-center text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                            ตรวจสอบข้อความ
                        </h1>
                        <p className="text-md flex text-center justify-center text-gray-500 dark:text-gray-400">
                            กรุณากรอกรหัสยืนยันที่เราส่งไปยังหมายเลขโทรศัพท์ของคุณ
                        </p>
                        <p className="text-md flex justify-center text-pink-400 dark:text-gray-400">
                            {blind}
                        </p>
                        <p className="text-md flex justify-center text-green-600 mt-2">
                            รหัสจะหมดอายุใน {formatTime(timeLeft)} นาที
                        </p>

                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-ทก font-medium text-gray-700 dark:text-gray-400">
                                    กรอกรหัสยืนยัน
                                </label>
                                <input
                                    disabled={loading}
                                    placeholder='รหัสยืนยัน'
                                    className={`text-center text-lg w-full border border-gray-400 bg-white py-4 rounded-md `}
                                    type="text" // switch to "text" to allow maxlength
                                    inputMode="numeric" // still shows numeric keypad on mobile
                                    maxLength={6}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, ''); // remove non-digits
                                        if (value.length <= 6) {
                                            setOtp(value); // or your state handler
                                        }
                                    }}
                                    value={otp}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSubmit(e); // call your verify function here
                                        }
                                    }}
                                />
                                {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                            </div>

                            <div className='w-full flex items-center justify-center'>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full sm:w-1/2 px-4 py-3 text-lg font-medium text-white transition rounded-3xl shadow-theme-xs ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#465681] hover:bg-brand-600'
                                        }`}
                                >
                                    {loading ? (
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
                                    ) : (
                                        'ยืนยัน'
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* <div className="mt-5 text-center text-sm text-gray-700 dark:text-gray-400">
                        <span>ไม่ได้รับรหัส ?</span>{' '}
                        <a href="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                            ส่งรหัสอีกครั้ง
                        </a>
                    </div>
                    <div className="mt-5 text-center text-sm text-gray-700 dark:text-gray-400">
                        <span>หรือ</span>{' '}

                    </div> */}
                    <div className="mt-5 text-center text-sm text-gray-700 dark:text-gray-400">
                        <span>กลับไปที่</span>{' '}
                        <a href="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                            สมัครสมาชิก
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

export default TwoStepVerificationSignUpSignUp;
