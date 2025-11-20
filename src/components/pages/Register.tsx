"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
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


export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [usePrefix, setPrefix] = useState<string>(""); // State for prefix
    // const [regCode, setRegCode] = useState(""); // State for regCode
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    // const [message, setMessage] = useState('');
    // const [isValid, setIsValid] = useState<boolean | null>(null); // null: ยังไม่เช็ค

    const router = useRouter();

    return (
        <div className="flex flex-col p-6 flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
            <div className="flex flex-col">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                            ข้อมูลผู้ใช้บริการสถานพยาบาลของคุณ
                        </h1>
                    </div>
                    <div>
                        <form >
                            <div className="space-y-5">
                                {/* ชื่อ-นามสกุล */}
                                <div>
                                    <Label>เลขประจำตัวผู้ใช้บริการสถานพยาบาล</Label>
                                    <Input type="email" name="email" placeholder="ระบุเลข HN" />
                                </div>
                                <div className="flex flox-col  sm:flex-row justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <Label className="whitespace-nowrap">คำนำหน้า</Label>
                                        <Input type="text" name="title" placeholder="เลือกคำนำหน้า " />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Label className="whitespace-nowrap">ชื่อจริงตามบัตรประชาชน</Label>
                                        <Input type="text" name="realName" placeholder="ระบุชื่อ" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Label className="whitespace-nowrap">นามสกุลตามบัตรประชาชน</Label>
                                        <Input type="text" name="realSername" placeholder="ระบุนามสกุล" />
                                    </div>
                                </div>

                                {/* อีเมล */}
                                <div>
                                    <Label>วัน เดือน ปีเกิด (ค.ศ.) </Label>
                                    <Input type="date" name="birthDate" placeholder="ระบุอีเมล" />
                                </div>

                                {/* ที่อยู่ */}
                                <div>
                                    <Label>ที่อยู่ </Label>
                                    <Input type="text" name="address_1" placeholder="กรุณากรอกที่อยู่ บรรทัดที่1" />
                                </div>
                                <div>
                                    <Label>ที่อยู่ (บรรทัดที่ 2)</Label>
                                    <Input type="text" name="address_2" placeholder="กรุณากรอกที่อยู่ บรรทัดที่2" />
                                </div>

                                {/* ประเทศ */}
                                <div>
                                    <Label>จังหวัด</Label>
                                    <Input type="test" name="province" placeholder="เลือกจังวัด" />
                                </div>

                                <div className="flex flox-col  sm:flex-row justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <Label className="whitespace-nowrap">เขต/อำเภอ</Label>
                                        <Input type="test" name="province" placeholder="เลือกเขตเขต/อำเภอ" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Label className="whitespace-nowrap">แขวง/ ตำบล </Label>
                                        <Input type="test" name="province" placeholder="เลือกแขวง/ ตำบล" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Label className="whitespace-nowrap">รหัสไปรษณีย์</Label>
                                        <Input type="test" name="province" placeholder="ระบุรหัสไปรษณีย์" />
                                    </div>
                                </div>

                                {/* ปุ่มสมัคร */}
                                <div className="flex justify-center">
                                    <button
                                        type="submit"
                                        className="w-50% px-4 py-3 text-xl font-medium text-white transition rounded-full bg-brand-500 shadow-theme-xs hover:bg-brand-600"
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
    );
}
