"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

export default function SignInForm() {
  const [isChecked, setIsChecked] = useState(false);
  const [regCode, setRegCode] = useState('');
  const [message, setMessage] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null); // null: ยังไม่เช็ค
  const [phone, setPhone] = useState('');
  // const [error, setError] = useState('');
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const lineUserStr = localStorage.getItem('someData');
    if (!lineUserStr) {
      toast.error('ไม่พบข้อมูลบัญชี LINE');
      setTimeout(() => {
        router.push("/ai/login");
    }, 1000);
      return;
    }

    const lineUser = JSON.parse(lineUserStr);
    console.log('🚀 ~ file: page.tsx:50 ~ checkLineId ~ lineUser:', lineUser);
    setIsSubmitting(true); // 🔁 เริ่มโหลด

    try {
      // const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      //   {
      //     line_id: lineUser.line_id,
      //     line_name: lineUser.line_name,
      //     line_email: lineUser.line_email,
      //     citizen_id: regCode,
      //     tel: phone,
      //   },
      //   {
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`,
      //     },
      //   }
      // );
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer 769167175e6a64fd8e898crm2b3381a591db1e8df29`,
        },
        body: JSON.stringify({
          line_id: lineUser.lineId,
          line_name: lineUser.lineName,
          line_email: lineUser.lineEmail,
          citizen_id: regCode,
          tel: phone,
        }),
      });
      localStorage.setItem('phone', phone);
      localStorage.setItem('co_tel', phone);

      const data = await res.json();
      console.log('Response data:', data);
      const tokens = data.data?.access_token;
      if (data.data === "" && data.status === true) {
        toast.info('กรุณารอการยืนยันจากระบบ');
        router.push('/two-step-verification');
      } else if (tokens) {
        localStorage.setItem('token', tokens);
        document.cookie = `token=${tokens}; path=/;`;
        toast.success('เข้าสู่ระบบสำเร็จ');
        router.push('/ai/telemedicine');
      } else {
        toast.error('เข้าสู่ระบบไม่สำเร็จ');
      }

      // if (tokens) {
      //   localStorage.setItem('token', tokens);
      //   toast.success('เข้าสู่ระบบสำเร็จ');
      //   // router.push('/');
      // } else {
      //   toast.error('ไม่พบ token จากระบบ');
      // }
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false); // ✅ หยุดโหลดไม่ว่าผลลัพธ์เป็นอะไร
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/-/g, '');
    setRegCode(value);

    if (value.length === 13) {
      if (!checkInvalidPersonID(value)) {
        setMessage('ไม่ถูกต้อง เลขบัตรประจำตัวประชาชน');
        setIsValid(false);
      } else {
        setMessage('ข้อมูลถูกต้อง เลขบัตรประจำตัวประชาชน');
        setIsValid(true);
      }
    } else {
      setMessage('');
      setIsValid(null);
    }
  };

  const checkInvalidPersonID = (id: string): boolean => {
    if (!/^[0-9]{13}$/.test(id)) return false;
    const digits = id.split('').map(Number);
    let total = 0;
    for (let i = 0; i < 12; i++) {
      total += digits[i] * (13 - i);
    }
    const mod = total % 11;
    const checkDigit = (11 - mod) % 10;
    return checkDigit === digits[12];
  };

  const handleChangePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // ลบทุกตัวที่ไม่ใช่ตัวเลข
    setPhone(value);

    // if (value.length === 0) {
    //   setError('');
    // } else if (!/^0[689]\d{8}$/.test(value)) {
    //   setError('กรุณากรอกหมายเลขโทรศัพท์มือถือให้ถูกต้อง');
    // } else {
    //   setError('');
    // }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <Image
              width={80}
              height={48}
              src="./images/logo/logo-icon.svg"
              alt="Logo"
              className="mb-2 mx-auto"
            />
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              เข้าสู่ระบบ
            </h1>
          </div>
          <div>
            <form>
              <div className="space-y-6">
                <div>
                  <Label>
                    เลขบัตรประชาชน <span className="text-error-500">*</span>{" "}
                  </Label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={13}
                    value={regCode}
                    onChange={handleChange}
                    placeholder="กรอกเลขบัตรประชาชน"
                    className="border border-gray-300 rounded px-4 py-2 w-full"
                  />
                  {isValid === false && (
                    <p className="text-error-500 text-sm mt-1">{message}</p>
                  )}
                  {isValid === true && (
                    <p className="text-success-500 text-sm mt-1">{message}</p>
                  )}
                </div>
                <div>
                  <Label>
                    หมายเลขโทรศัพท์มือถือ <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={handleChangePhone}
                      maxLength={10}
                      placeholder="0xxxxxxxxx"
                      className="border border-gray-300 rounded px-4 py-2 w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  {/* <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link> */}
                </div>
                <div>
                  
                  {/* <div className="mt-4 text-center text-sm text-gray-700 dark:text-gray-400">
                    ยังไม่มีบัญชี?
                    <Link
                      href="/signup"
                      className="ml-1 font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      สมัครสมาชิก
                    </Link>
                  </div> */}
                </div>

              </div>
            </form>
            <Button onClick={() => handleSubmit()} disabled={isSubmitting} >Sign in</Button>
            {/* <div className="relative py-8 .sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div>
            <button className="w-full inline-flex items-center justify-center gap-3 py-1.5 px-7 text-[14px] .font-bold text-white transition bg-[#06C755] hover:bg-[#06C755]/90 active:bg-[#06C755]/70 rounded-lg">
              <Image
                width={32}
                height={32}
                src="/images/logo/line_64.png"
                alt="LINE"
              />
              เข้าสู่ระบบด้วย LINE
            </button> */}
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={4000}
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
}
