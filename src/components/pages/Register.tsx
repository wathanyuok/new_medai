"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { ChangeEvent, FormEvent, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import Select from "../form/Select";

const prefix = [
    { value: 'ไม่ระบุ', label: 'ไม่ระบุ' },
    { value: 'นางสาว', label: 'นางสาว' },
    { value: 'นาง', label: 'นาง' },
    { value: 'นาย', label: 'นาย' },
    { value: 'เด็กหญิง', label: 'เด็กหญิง' },
    { value: 'เด็กชาย', label: 'เด็กชาย' },
    { value: 'พระสงฆ์', label: 'พระสงฆ์' },
    { value: 'บาทหลวง', label: 'บาทหลวง' },
    { value: 'หม่อมหลวง', label: 'หม่อมหลวง' },
    { value: 'หม่อมราชวงศ์', label: 'หม่อมราชวงศ์' },
    { value: 'หม่อมเจ้า', label: 'หม่อมเจ้า' },
    { value: 'ศาสตราจารย์เกียรติคุณ (กิตติคุณ)', label: 'ศาสตราจารย์เกียรติคุณ (กิตติคุณ)' },
    { value: 'ศาสตราจารย์', label: 'ศาสตราจารย์' },
    { value: 'ผู้ช่วยศาสตราจารย์', label: 'ผู้ช่วยศาสตราจารย์' },
    { value: 'รองศาสตราจารย์', label: 'รองศาสตราจารย์' },
    { value: 'Unspecified', label: 'Unspecified' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Mrs.', label: 'Mrs.' },
    { value: 'Mr.', label: 'Mr.' },
    { value: 'Master', label: 'Master' },
    { value: 'Buddhist Monk', label: 'Buddhist Monk' },
    { value: 'Priest', label: 'Priest' },
    { value: 'Mom Luang', label: 'Mom Luang' },
    { value: 'Mom Rajawong', label: 'Mom Rajawong' },
    { value: 'Mom Chao', label: 'Mom Chao' },
    { value: 'Emeritus Professor', label: 'Emeritus Professor' },
    { value: 'Professor', label: 'Professor' },
    { value: 'Assistant Professor', label: 'Assistant Professor' },
    { value: 'Associate Professor', label: 'Associate Professor' },
];


interface FormData {
    hn: string;
    prefix: string;
    real_name: string;
    real_surname: string;
    birth_date: string;
    address_1: string;
    address_2: string;
    province: string;
    district: string;
    subdistrict: string;
    zipcode: string;
}

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [usePrefix, setPrefix] = useState<string>(""); // State for prefix
    // const [regCode, setRegCode] = useState(""); // State for regCode
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    // const [message, setMessage] = useState('');
    // const [isValid, setIsValid] = useState<boolean | null>(null); // null: ยังไม่เช็ค

    const router = useRouter();

    // Form data state
    const [formData, setFormData] = useState<FormData>({
        hn: '',
        prefix: '',
        real_name: '',
        real_surname: '',
        birth_date: '',
        address_1: '',
        address_2: '',
        province: '',
        district: '',
        subdistrict: '',
        zipcode: ''
    });

    //handle input changed
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // register submit handler
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        //pdpa check
        // if (!isChecked) {
        //     toast.error("กรุณายอมรับเงื่อนไขก่อนสมัคร");
        //     return;
        // }

        const form = e.target as HTMLFormElement;
        //  real_name: '',
        // real_surname: '',
        // birth_date: '',
        // address_1: '',
        // address_2: '',
        // province: '',
        // district: '',
        // subdistrict: '',
        // zipcode: ''
        const hn = (form.elements.namedItem('hn') as HTMLInputElement).value.trim();
        const real_name = (form.elements.namedItem('real_name') as HTMLInputElement).value.trim();
        const real_surname = (form.elements.namedItem('real_surname') as HTMLInputElement).value.trim();
        const birth_date = (form.elements.namedItem('birth_date') as HTMLInputElement).value.trim();
        const address_1 = (form.elements.namedItem('address_1') as HTMLInputElement).value.trim();
        const address_2 = (form.elements.namedItem('address_2') as HTMLInputElement).value.trim();
        const province = (form.elements.namedItem('province') as HTMLInputElement).value.trim();
        const district = (form.elements.namedItem('district') as HTMLInputElement).value.trim();
        const subdistrict = (form.elements.namedItem('subdistrict') as HTMLInputElement).value.trim();
        const zipcode = (form.elements.namedItem('zipcode') as HTMLInputElement).value.trim();

        // if (!email || !phone || !password || !confirmPassword) {
        //     toast.error("กรุณาระบุข้อมูลให้ครบทุกช่องที่มี *");
        //     return;
        // }

        // if (password.length < 6) {
        //     toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
        //     return;
        // }

        // if (password !== confirmPassword) {
        //     toast.error("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
        //     return;
        // }

        // if (!isChecked) {
        //     toast.error("กรุณายอมรับเงื่อนไขก่อนสมัคร");
        //     return;
        // }

        const data = {
            prefix: usePrefix,
            hn: hn,
            real_name: real_name,
            real_surname: real_surname,
            birth_date: birth_date,
            address_1: address_1,
            address_2: address_2,
            province: province,
            district: district,
            subdistrict: subdistrict,
            zipcode: zipcode
        };


        console.log(data)


        try {
            // const token = '769167175e6a64fd8e8982b3381a591db1e8df29'
            // token for access the api register
            // const token = process.env.NEXT_PUBLIC_TK_PUBLIC_KEY;
            // if (!token) {
            //     toast.error('Token is missing. Please check your environment variables.');
            //     return;
            // }

            //api for register
            // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${token}`,
            //     },
            //     body: JSON.stringify(data)
            // });

            //result after register
            // const result = await res.json();
            // if (result.status === true) {
            //     // toast.info('กรุณารอระบุ OTP จากระบบ');
            //     localStorage.setItem('co_email', email)
            //     localStorage.setItem('co_tel', phone)
            //     localStorage.setItem('otp_key', result.data.otp_key)
            //     router.push('/ai/verify-otp');
            // } else {
            //     toast.error(result.message || 'เกิดข้อผิดพลาด');
            // }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาด');
        }
    };

    return (
        <div className="flex flex-col p-4 sm:p-6 md:p-8 flex-1 w-full lg:w-1/2 overflow-y-auto">
            <div className="flex flex-col">
                <div>
                    <div className="mb-6 sm:mb-8 md:mb-10">
                        <h1 className="mb-2 font-semibold text-gray-800 text-xl sm:text-2xl md:text-3xl dark:text-white/90">
                            ข้อมูลผู้ใช้บริการสถานพยาบาลของคุณ
                        </h1>
                    </div>
                    <div>
                        <div>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                                    {/* เลขประจำตัวผู้ใช้บริการสถานพยาบาล */}
                                    <div className="w-full">
                                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            เลขประจำตัวผู้ใช้บริการสถานพยาบาล
                                        </label>
                                        <Input type="text" name="hn" placeholder="ระบุเลข HN" />
                                    </div>

                                    {/* ชื่อ-นามสกุล */}
                                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                                        <div className="flex-1 min-w-0">
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                คำนำหน้า
                                            </label>
                                            <Select options={prefix} onChange={setPrefix} placeholder="เลือกคำนำหน้าชื่อ" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                ชื่อจริงตามบัตรประชาชน
                                            </label>
                                            <Input type="text" name="real_name" placeholder="ระบุชื่อ" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                นามสกุลตามบัตรประชาชน
                                            </label>
                                            <Input type="text" name="real_surname" placeholder="ระบุนามสกุล" />
                                        </div>
                                    </div>

                                    {/* วันเกิด */}
                                    <div className="w-full">
                                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            วัน เดือน ปีเกิด (ค.ศ.)
                                        </label>
                                        <Input type="date" name="birth_date" placeholder="ระบุนามสกุล" />
                                    </div>

                                    {/* ที่อยู่ */}
                                    <div className="w-full">
                                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            ที่อยู่
                                        </label>
                                        <Input type="text" name="address_1" placeholder="กรุณากรอกที่อยู่ บรรทัดที่ 1" />
                                    </div>

                                    <div className="w-full">
                                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            ที่อยู่ (บรรทัดที่ 2)
                                        </label>
                                        <Input type="text" name="address_2" placeholder="กรุณากรอกที่อยู่ บรรทัดที่ 2" />
                                    </div>

                                    {/* จังหวัด */}
                                    <div className="w-full">
                                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            จังหวัด
                                        </label>
                                        <Input type="text" name="province" placeholder="เลือกจังหวัด" />
                                    </div>

                                    {/* เขต/อำเภอ แขวง/ตำบล รหัสไปรษณีย์ */}
                                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                                        <div className="flex-1 min-w-0">
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                เขต/อำเภอ
                                            </label>
                                            <Input type="text" name="district" placeholder="เลือกเขต/อำเภอ" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                แขวง/ตำบล
                                            </label>
                                            <Input type="text" name="subdistrict" placeholder="เลือกจังหวัด" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                รหัสไปรษณีย์
                                            </label>
                                            <Input type="text" name="zipcode" placeholder="ระบุรหัสไปรษณีย์" />
                                        </div>
                                    </div>

                                    {/* ปุ่มลงทะเบียน */}
                                    <div className="flex justify-center pt-2 sm:pt-4">
                                        <button
                                            type="submit"
                                            className="w-full sm:w-auto px-6 sm:px-8 md:px-12 py-2.5 sm:py-3 text-base sm:text-lg md:text-xl font-medium text-white transition rounded-full bg-blue-600 shadow-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            เชื่อมข้อมูลผู้ใช้บริการสถานพยาบาล
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
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
}