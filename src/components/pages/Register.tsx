'use client';

import React, { useEffect, useState } from 'react';
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Checkbox from "../form/input/Checkbox";
import Link from "next/link";
import { toast } from "react-toastify";

interface RegisterProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCitizenId?: string;
  onRegisterSuccess?: (cid: string) => void;
  onSyncSuccess?: () => void;
  onSyncError?: (error: string) => void;
  showTermsCheckbox?: boolean;
  shopId?: number;
  apiUrl?: string;
}

const provinces = [
  'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา','ชลบุรี',
  'ชัยนาท','ชัยภูมิ','ชุมพร','เชียงราย','เชียงใหม่','ตรัง','ตราด','ตาก','นครนายก','นครปฐม','นครพนม',
  'นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี',
  'ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก',
  'เพชรบุรี','เพชรบูรณ์','แพร่','พะเยา','ภูเก็ต','มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา',
  'ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี','ลำปาง','ลำพูน','เลย','ศรีสะเกษ','สกลนคร','สงขลา',
  'สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี',
  'สุราษฎร์ธานี','สุรินทร์','หนองคาย','หนองบัวลำภู','อ่างทอง','อุดรธานี','อุทัยธานี','อุตรดิตถ์',
  'อุบลราชธานี','อำนาจเจริญ',
];

const prefixes = ['นาย', 'นาง', 'นางสาว', 'เด็กชาย', 'เด็กหญิง'];

export default function Register(props: RegisterProps) {
  const {
    isOpen,
    onClose,
    defaultCitizenId,
    onRegisterSuccess,
    showTermsCheckbox = true,
    shopId,
    apiUrl,
  } = props;

  // step state
  // 0 = citizen id input
  // 1 = hospital registration form
  // 2 = success page
  const [pageIndex, setPageIndex] = useState(0);

  // citizen id step state
  const [cid, setCid] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAccept, setIsAccept] = useState(false);

  // hospital registration form state
  const [formData, setFormData] = useState({
    prefix: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    address1: '',
    address2: '',
    province: '',
    district: '',
    subDistrict: '',
    postalCode: '',
  });

  // Get configuration values
  const getApiUrl = () => apiUrl || process.env.NEXT_PUBLIC_API_URL;
  const getShopId = () => shopId || parseInt(process.env.NEXT_PUBLIC_SHOP_ID || "950");

  // Prefill cid when open
  useEffect(() => {
    if (!isOpen) return;

    setCid(defaultCitizenId || '');
    setError('');
    setLoading(false);
    setPageIndex(0);
    setIsAccept(false);

    // reset form
    setFormData({
      prefix: '',
      firstName: '',
      lastName: '',
      birthDate: '',
      address1: '',
      address2: '',
      province: '',
      district: '',
      subDistrict: '',
      postalCode: '',
    });
  }, [isOpen, defaultCitizenId]);

  const handleClose = () => {
    onClose();
  };

  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCid(value);
  };

  // กดถัดไป -> ไปหน้า form
  const handleNextToRegisterForm = async () => {
    if (!cid.trim()) {
      setError("กรุณากรอกหมายเลขบัตรประชาชน");
      return;
    }

    if (cid.length !== 13) {
      setError("หมายเลขบัตรประชาชนต้องมี 13 หลัก");
      return;
    }

    setError('');
    setPageIndex(1);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit form และเรียก API สร้าง HN
  const handleSubmitHospitalRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("ไม่พบ token การเข้าสู่ระบบ");
      }

      // เรียก API สร้าง HN
      const response = await fetch(`${getApiUrl()}/auth/register-hospital`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          citizen_id: cid,
          shop_id: getShopId(),
          prefix: formData.prefix,
          first_name: formData.firstName,
          last_name: formData.lastName,
          birth_date: formData.birthDate,
          address: formData.address1,
          address2: formData.address2,
          province: formData.province,
          district: formData.district,
          sub_district: formData.subDistrict,
          postal_code: formData.postalCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.status) {
        // สำเร็จ -> ไปหน้า Success
        setPageIndex(2);
        toast.success("ลงทะเบียนสำเร็จ");
      } else {
        setError(data.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลงทะเบียน";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // กดปุ่มในหน้า Success -> เรียก callback และปิด modal
  const handleSuccessClose = () => {
    onRegisterSuccess?.(cid);
    handleClose();
  };

  const LoadingSpinner = () => (
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
  );

  // Styles
  const inputStyle = "w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white";
  const selectStyle = "w-full px-4 py-3 border border-gray-200 rounded-lg appearance-none bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all";
  const labelRequired = "block text-sm font-medium text-pink-500 mb-2";
  const labelOptional = "block text-sm font-medium text-gray-800 mb-2";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[900px] m-4 z-99">
      <div className="relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        
        {/* STEP 0: Citizen ID */}
        {pageIndex === 0 && (
          <>
            <div className="px-2 pr-6">
              <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
                ลงทะเบียน/กรอกข้อมูลก่อนเชื่อมต่อ
              </h4>
            </div>

            <form
              className="flex flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                handleNextToRegisterForm();
              }}
            >
              <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3 space-y-8">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
                  <div>
                    <Label>หมายเลขบัตรประชาชน</Label>
                    <Input
                      key={cid}
                      disabled={loading}
                      type="text"
                      defaultValue={cid}
                      onChange={handleCitizenIdChange}
                      placeholder="x-xxxx-xxxx-xx-x"
                      maxLength={13}
                    />
                  </div>

                  {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
                </div>
              </div>

              {showTermsCheckbox && (
                <div className="flex items-start gap-3 px-2">
                  <Checkbox
                    className="mt-1 w-5 h-5"
                    checked={isAccept}
                    onChange={() => setIsAccept(!isAccept)}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    การสร้างบัญชีแสดงว่าคุณยอมรับ{' '}
                    <span className="text-brand-500 hover:text-brand-600 dark:text-white/90 font-medium">
                      <Link target="_blank" href="">
                        ข้อตกลงการใช้บริการ
                      </Link>
                    </span>{' '}
                    และ{' '}
                    <span className="text-brand-500 hover:text-brand-600 dark:text-white/90 font-medium">
                      <Link target="_blank" href="">
                        นโยบายความเป็นส่วนตัว
                      </Link>
                    </span>{' '}
                    ของเรา
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center w-full gap-3 px-2 mt-6">
                <Button
                  disabled={(!isAccept && showTermsCheckbox) || loading || !cid.trim()}
                  onClick={handleNextToRegisterForm}
                  className="flex justify-center"
                  size="sm"
                >
                  {loading ? <LoadingSpinner /> : "ถัดไป"}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* STEP 1: Hospital Registration Form */}
        {pageIndex === 1 && (
          <div className="bg-white rounded-2xl p-2 md:p-4">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 mb-8">
              เพิ่มข้อมูลเพื่อลงทะเบียนใช้บริการสถานพยาบาล
            </h1>

            <form onSubmit={handleSubmitHospitalRegistration} className="space-y-5">
              {/* Row 1: คำนำหน้า, ชื่อจริง, นามสกุล */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelRequired}>
                    คำนำหน้า <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="prefix"
                      value={formData.prefix}
                      onChange={handleFormChange}
                      required
                      className={selectStyle}
                    >
                      <option value="" disabled>
                        เลือกคำนำหน้า
                      </option>
                      {prefixes.map((prefix) => (
                        <option key={prefix} value={prefix}>
                          {prefix}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelRequired}>
                    ชื่อจริงตามบัตรประชาชน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    placeholder="ชื่อของคุณ"
                    required
                    className={inputStyle}
                  />
                </div>

                <div>
                  <label className={labelRequired}>
                    นามสกุลตามบัตรประชาชน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    placeholder="นามสกุล"
                    required
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* วัน เดือน ปีเกิด */}
              <div>
                <label className={labelRequired}>
                  วัน เดือน ปีเกิด (ค.ศ.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleFormChange}
                  onClick={(e) => e.currentTarget.showPicker()}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white cursor-pointer"
                />
              </div>

              {/* ที่อยู่ */}
              <div>
                <label className={labelRequired}>
                  ที่อยู่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address1"
                  value={formData.address1}
                  onChange={handleFormChange}
                  placeholder="กรอกที่อยู่ของคุณ"
                  required
                  className={inputStyle}
                />
              </div>

              {/* ที่อยู่ (บรรทัดที่ 2) */}
              <div>
                <label className={labelOptional}>
                  ที่อยู่ (บรรทัดที่ 2)
                </label>
                <input
                  type="text"
                  name="address2"
                  value={formData.address2}
                  onChange={handleFormChange}
                  className={inputStyle}
                />
              </div>

              {/* จังหวัด */}
              <div>
                <label className={labelRequired}>
                  จังหวัด <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleFormChange}
                    required
                    className={selectStyle}
                  >
                    <option value="" disabled>
                      เลือกจังหวัด
                    </option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณีย์ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelRequired}>
                    เขต/อำเภอ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleFormChange}
                    placeholder="บางใหญ่"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white"
                  />
                </div>

                <div>
                  <label className={labelRequired}>
                    แขวง/ ตำบล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subDistrict"
                    value={formData.subDistrict}
                    onChange={handleFormChange}
                    placeholder="บางใหญ่"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white"
                  />
                </div>

                <div>
                  <label className={labelRequired}>
                    รหัสไปรษณีย์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleFormChange}
                    placeholder="11140"
                    required
                    maxLength={5}
                    pattern="[0-9]{5}"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>
              )}

              {/* Submit Button */}
              <div className="pt-4 flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-100 hover:bg-blue-200 text-blue-500 font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <LoadingSpinner /> : "ลงทะเบียนใช้บริการสถานพยาบาล"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Success Page */}
        {pageIndex === 2 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            {/* Success Icon */}
            <div className="w-32 h-32 mb-6 relative">
              <div className="absolute inset-0 bg-pink-100 rounded-full"></div>
              <div className="absolute inset-2 bg-pink-200 rounded-full flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-pink-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Success Text */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              ลงทะเบียนสำเร็จ
            </h2>
            <p className="text-gray-500 text-center mb-8">
              ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว
            </p>

            {/* Close Button */}
            <button
              onClick={handleSuccessClose}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
            >
              ดำเนินการต่อ
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}