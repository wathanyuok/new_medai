"use client";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from 'react-toastify';

export default function SignInCoForm() {
  const [coEmail, setCoEmail] = useState('')
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  // const [error, setError] = useState('');
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleSubmit = async () => {
    if (!coEmail || !password) return setError(true)

    setIsSubmitting(true); // 🔁 เริ่มโหลด

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/auth/loginexa`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`,
          },
          body: JSON.stringify({
            co_email: coEmail,
            co_password: password,
          }),
        }
      );

      // แปลง response เป็น JSON
      const data = await res.json();


      if (data.status === true) {
        console.log('data: ', data);
        const tokens = data?.data?.access_token;
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
        if (co_profile.is_online_data_sync == true) {
          localStorage.setItem('is_online_data_sync', 'true');
        } else {
          localStorage.setItem('is_online_data_sync', 'false');
        }
        localStorage.setItem('username', co_profile?.co_fname + ' ' + co_profile?.co_lname);
        localStorage.setItem('email', co_profile?.co_email);
        localStorage.setItem('co_tel', co_profile?.co_tel);
        // toast.success('ยืนยัน OPT สำเร็จ');
        // localStorage.setItem('co_email', coEmail);
        // localStorage.setItem('co_tel', data.co_tel);
        // // localStorage.setItem('otp_key',data.otp_key)
        // // setError(false);
        router.push('/ai')
      } else if (data.status === false) {
        toast.error('ไม่สามารถเข้าสู่ระบบได้');
        setIsSubmitting(false);
        setError(true);
      }

    } catch (err: unknown) {
      console.error('Login error:', err);
      setIsSubmitting(false);

    } finally {
      // setIsSubmitting(false); // ✅ หยุดโหลดไม่ว่าผลลัพธ์เป็นอะไร
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCoEmail(value);


  };
  const handleChangePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    // const value = e.target.value.replace(/\D/g, ''); // ลบทุกตัวที่ไม่ใช่ตัวเลข
    setPassword(e.target.value);


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
    <>
      {isSubmitting == true &&
        <div className="flex items-center justify-center w-full h-full py-10">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" />
        </div>
      }
      {isSubmitting == false &&
        <div className="p-6 sm:p-0 flex flex-col flex-1 lg:w-1/2 w-full bg-white">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div className="mb-5 sm:mb-8">
                <Image
                  width={200}
                  height={60}
                  src="/images/logo/logo.svg"
                  alt="Logo"
                  className="mb-10 mx-auto sm:hidden"
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
                        อีเมล์ <span className="text-error-500">*</span>{" "}
                      </Label>
                      <input
                        type="email"
                        value={coEmail}
                        onChange={handleChange}
                        placeholder="example@example.com"
                        className={`border ${error == true ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2 w-full`}
                      />

                    </div>
                    <div>
                      <Label>
                        รหัสผ่าน <span className="text-error-500">*</span>{" "}
                      </Label>
                      <div className="relative">
                        <input
                          id="phone"

                          value={password}
                          onChange={handleChangePhone}
                          type="password"
                          placeholder=""
                          className={`border ${error == true ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2 w-full`}
                        />
                        {error === true && (
                          <p className="text-error-500 text-sm mt-1">อีเมล์หรือรหัสผ่านไม่ถูกต้อง</p>
                        )}
                      </div>
                    </div>



                  </div>
                </form>
                <div className="w-full mt-10">
                  <Button onClick={handleSubmit} className="w-full">เข้าสู่ระบบ</Button>
                </div>
                <div className="mt-4 text-center text-sm text-gray-700 dark:text-gray-400">
                  <Link
                    href="reset-password"
                    className="ml-1 font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    ลืมรหัสผ่าน
                  </Link>
                </div>


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
      }
    </>

  );
}
