"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiCamera, FiRotateCcw, FiCheck } from "react-icons/fi";

// ==================== API Configuration ====================
// shop.api-apsx.co - สร้าง HN
const SHOP_API_URL = process.env.NEXT_PUBLIC_APPOINT_API_URL || "https://shop.api-apsx.co";
// linecrm.api-apsx.com - OTP + ดึงข้อมูล customer
const LINECRM_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://linecrm.api-apsx.com";

const SHOP_ID = parseInt(process.env.NEXT_PUBLIC_SHOP_ID || "949");

const API_KEYS = {
  public_key: process.env.NEXT_PUBLIC_API_PUBLIC_KEY || "",
  private_key: process.env.NEXT_PUBLIC_API_PRIVATE_KEY || "",
};

const AUTH_TOKEN = process.env.NEXT_PUBLIC_API_AUTH_TOKEN || "";

// Token Cache for shop API
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

interface AuthResponse {
  status: boolean;
  data: { access_token: string };
  message: string;
}

// Get OAuth access token for shop API (with cache)
const getShopAccessToken = async (): Promise<string | null> => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${SHOP_API_URL}/auth/oauth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(API_KEYS),
    });

    if (!response.ok) return null;

    const data: AuthResponse = await response.json();
    if (data.status && data.data?.access_token) {
      cachedToken = data.data.access_token;
      tokenExpiry = Date.now() + 50 * 60 * 1000;
      return cachedToken;
    }
    return null;
  } catch (error) {
    console.error("Error getting shop access token:", error);
    return null;
  }
};

// Create customer API (shop)
interface CustomerAddRequest {
  shop_id: number;
  customer_group_id: number;
  user_id: number | null;
  right_treatment_id: number;
  ctm_prefix: string;
  ctm_gender: string;
  ctm_nation: string;
  ctm_religion: string;
  ctm_edu_level: string;
  ctm_marital_status: string;
  ctm_blood: string;
  ctm_treatment_type: number;
  ctm_citizen_id: string;
  ctm_fname: string;
  ctm_lname: string;
  ctm_nname: string;
  ctm_fname_en: string;
  ctm_lname_en: string;
  ctm_email: string;
  ctm_tel: string;
  ctm_birthdate: string;
  ctm_address: string;
  ctm_district: string;
  ctm_amphoe: string;
  ctm_province: string;
  ctm_zipcode: string;
  ctm_subscribe_opd: number;
  ctm_subscribe_lab: number;
  ctm_subscribe_cert: number;
  ctm_subscribe_receipt: number;
  ctm_subscribe_appoint: number;
  ctm_is_active: number;
  ctm_image: string;
  ctm_image_size: number;
}

interface CustomerAddResponse {
  status: boolean;
  message: string;
  data: number;
}

const createCustomer = async (
  customerData: CustomerAddRequest
): Promise<CustomerAddResponse> => {
  try {
    const token = await getShopAccessToken();
    if (!token) {
      return { status: false, message: "ไม่สามารถขอ Token ได้", data: 0 };
    }

    const response = await fetch(`${SHOP_API_URL}/customer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      return {
        status: false,
        message: `เกิดข้อผิดพลาด: ${response.status}`,
        data: 0,
      };
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating customer:", error);
    return {
      status: false,
      message: "เกิดข้อผิดพลาดในการสร้างข้อมูล",
      data: 0,
    };
  }
};

// Upload customer file (รูปถ่ายคู่บัตร)
const uploadCustomerFile = async (
  customerId: number,
  base64Image: string,
  fileName: string
): Promise<{ status: boolean; message: string }> => {
  try {
    const token = await getShopAccessToken();
    if (!token) {
      return { status: false, message: "ไม่สามารถขอ Token ได้" };
    }

    // Split base64 - ตัด prefix "data:image/jpeg;base64," ออก
    const base64Data = base64Image.includes(",") 
      ? base64Image.split(",")[1] 
      : base64Image;

    const response = await fetch(`${SHOP_API_URL}/customer/file/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify([{
        customer_id: customerId,
        file_base64: base64Data,
        file_name: fileName,
      }]),
    });

    if (!response.ok) {
      return {
        status: false,
        message: `เกิดข้อผิดพลาด: ${response.status}`,
      };
    }

    const result = await response.json();
    return { status: result.status, message: result.message };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      status: false,
      message: "เกิดข้อผิดพลาดในการอัพโหลดไฟล์",
    };
  }
};

// Check if citizen already has HN in THIS shop (shop_id must match)
const checkCitizenExists = async (
  citizenId: string
): Promise<{ exists: boolean; hn: string | null; customerId: number | null }> => {
  try {
    const token = await getShopAccessToken();
    if (!token) return { exists: false, hn: null, customerId: null };

    const response = await fetch(`${SHOP_API_URL}/customer/citizen/${citizenId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return { exists: false, hn: null, customerId: null };

    const data = await response.json();
    // ✅ เช็ค shop_id ด้วย - ต้องตรงกับ SHOP_ID (949) เท่านั้น
    if (data.status && data.data?.ctm_id && data.data?.shop_id === SHOP_ID) {
      console.log("Found HN in correct shop:", data.data.ctm_id, "shop_id:", data.data.shop_id);
      return { exists: true, hn: data.data.ctm_id, customerId: data.data.id };
    }
    // ถ้า shop_id ไม่ตรง → ถือว่าไม่มี HN ใน shop นี้
    if (data.status && data.data?.ctm_id && data.data?.shop_id !== SHOP_ID) {
      console.log("Found HN but wrong shop:", data.data.ctm_id, "shop_id:", data.data.shop_id, "expected:", SHOP_ID);
    }
    return { exists: false, hn: null, customerId: null };
  } catch (error) {
    console.error("Error checking citizen:", error);
    return { exists: false, hn: null, customerId: null };
  }
};

// ==================== LinecrM API Functions ====================

interface SyncResponse {
  status: boolean;
  co_tel?: string;
  message?: string;
  data?: {
    access_token: string;
  };
}

interface CustomerData {
  id: number;
  ctm_id: string;
  ctm_citizen_id: string;
  ctm_prefix: string;
  ctm_fname: string;
  ctm_lname: string;
  ctm_tel: string;
  ctm_address: string;
  ctm_district: string;
  ctm_amphoe: string;
  ctm_province: string;
  ctm_zipcode: string;
}

// Send OTP (linecrm)
const sendOTP = async (citizenId: string): Promise<SyncResponse> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return { status: false, message: "ไม่พบ token" };
    }

    const email = localStorage.getItem("email") || "";
    const phone = localStorage.getItem("co_tel") || "";

    const response = await fetch(`${LINECRM_API_URL}/auth/onlinesyncexa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        co_citizen_id: citizenId,
        co_email: email,
        co_tel: phone,
      }),
    });

    if (!response.ok) {
      return { status: false, message: `Error: ${response.status}` };
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending OTP:", error);
    return { status: false, message: "เกิดข้อผิดพลาดในการส่ง OTP" };
  }
};

// Verify OTP (linecrm)
const verifyOTP = async (citizenId: string, otp: string): Promise<SyncResponse> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return { status: false, message: "ไม่พบ token" };
    }

    const response = await fetch(`${LINECRM_API_URL}/auth/otponlinesyncexa-lock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cid: citizenId,
        otp: otp,
        shop_id: SHOP_ID,
      }),
    });

    if (!response.ok) {
      return { status: false, message: `Error: ${response.status}` };
    }

    return await response.json();
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { status: false, message: "เกิดข้อผิดพลาดในการยืนยัน OTP" };
  }
};

// Get customer data (linecrm) - after OTP verified
const getCustomerData = async (token: string): Promise<CustomerData | null> => {
  try {
    const response = await fetch(`${LINECRM_API_URL}/customer`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status && data.data?.customer) {
      return data.data.customer;
    }
    return null;
  } catch (error) {
    console.error("Error getting customer data:", error);
    return null;
  }
};

// ==================== Image Compression ====================
const compressImage = (
  canvas: HTMLCanvasElement,
  maxWidth: number = 1200,
  quality: number = 0.6
): string => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", quality);

  if (canvas.width > maxWidth) {
    const ratio = maxWidth / canvas.width;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = maxWidth;
    tempCanvas.height = canvas.height * ratio;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      return tempCanvas.toDataURL("image/jpeg", quality);
    }
  }

  return canvas.toDataURL("image/jpeg", quality);
};

// ==================== Component ====================
type PageState = "capture" | "preview" | "loading" | "otp" | "success";

const CaptureIDCardPage: React.FC = () => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pageState, setPageState] = useState<PageState>("capture");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [registeredHN, setRegisteredHN] = useState<string | null>(null);
  
  // OTP states
  const [otp, setOtp] = useState("");
  const [blindPhone, setBlindPhone] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Assign srcObject หลังจาก video element render แล้ว
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Open camera (กล้องหน้าสำหรับ selfie คู่บัตร)
  const openCamera = useCallback(async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // กล้องหน้าสำหรับถ่ายรูปคู่บัตร
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง หรือเลือกรูปจากแกลเลอรี่"
      );
    }
  }, []);

  // Close camera
  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = compressImage(canvas, 1200, 0.6);
    setCapturedImage(imageData);
    setPageState("preview");
    closeCamera();
  }, [closeCamera]);

  // Handle file selection from gallery
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const compressed = compressImage(canvas, 1200, 0.6);
            setCapturedImage(compressed);
            setPageState("preview");
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setPageState("capture");
    setError("");
  }, []);

  // ==================== Main Submit Flow ====================
  // Flow 2: สร้าง HN → ส่ง OTP → verify OTP → sync → Success
  const handleSubmit = async () => {
    if (!capturedImage) {
      setError("กรุณาถ่ายรูปคู่บัตรประชาชน");
      return;
    }

    setPageState("loading");
    setError("");

    try {
      const pendingDataStr = localStorage.getItem("pendingCustomerData");
      const storedCitizenId = localStorage.getItem("citizenId");

      if (!storedCitizenId) {
        setError("ไม่พบข้อมูลการลงทะเบียน กรุณากรอกข้อมูลใหม่");
        setTimeout(() => router.push("/ai/telemedicine/register"), 2000);
        return;
      }

      // ===== Step 0: เช็คว่ามี HN แล้วหรือยัง (ป้องกัน duplicate) =====
      console.log("Step 0: Checking if HN exists...");
      const existingCustomer = await checkCitizenExists(storedCitizenId);

      if (existingCustomer.exists && existingCustomer.customerId) {
        // ✅ มี HN แล้ว → Upload รูป แล้วส่ง OTP
        console.log("Step 0: HN already exists:", existingCustomer.hn);
        
        // Upload รูปถ่ายคู่บัตร
        console.log("Step 0.5: Uploading ID card photo for existing customer...");
        const fileName = `selfie_idcard_${storedCitizenId}_${Date.now()}.jpg`;
        const uploadResult = await uploadCustomerFile(existingCustomer.customerId, capturedImage, fileName);
        
        if (!uploadResult.status) {
          console.warn("Upload photo failed:", uploadResult.message);
        } else {
          console.log("Step 0.5 Success: Photo uploaded");
        }
        
        await handleSendOTP(storedCitizenId);
        return;
      }

      // ===== Step 1: POST /customer (สร้าง HN ในระบบ shop) =====
      if (!pendingDataStr) {
        setError("ไม่พบข้อมูลการลงทะเบียน กรุณากรอกข้อมูลใหม่");
        setTimeout(() => router.push("/ai/telemedicine/register"), 2000);
        return;
      }

      console.log("Step 1: Creating customer in shop system...");
      const customerData: CustomerAddRequest = JSON.parse(pendingDataStr);
      // ไม่ส่ง ctm_image ไปใน createCustomer - จะ upload แยกทีหลัง
      customerData.ctm_image = "";
      customerData.ctm_image_size = 0;

      const response = await createCustomer(customerData);

      if (!response.status || !response.data) {
        setError(response.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
        setPageState("preview");
        return;
      }

      const customerId = response.data;
      console.log("Step 1 Success: Customer created, ID:", customerId);

      // ===== Step 1.5: Upload รูปถ่ายคู่บัตร =====
      console.log("Step 1.5: Uploading ID card photo...");
      const fileName = `selfie_idcard_${storedCitizenId}_${Date.now()}.jpg`;
      const uploadResult = await uploadCustomerFile(customerId, capturedImage, fileName);
      
      if (!uploadResult.status) {
        console.warn("Upload photo failed:", uploadResult.message);
        // ไม่ block flow ถ้า upload ไม่สำเร็จ - ยังคง continue ไปส่ง OTP
      } else {
        console.log("Step 1.5 Success: Photo uploaded");
      }

      // ลบข้อมูลชั่วคราว
      localStorage.removeItem("pendingCustomerData");

      // ===== Step 2: ส่ง OTP =====
      await handleSendOTP(storedCitizenId);

    } catch (err) {
      console.error("Submit error:", err);
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setPageState("preview");
    }
  };

  // ===== Send OTP =====
  const handleSendOTP = async (citizenId: string) => {
    console.log("Step 2: Sending OTP...");
    
    const otpResult = await sendOTP(citizenId);
    
    if (otpResult.status) {
      // ส่ง OTP สำเร็จ → เก็บเบอร์โทรไว้ใช้
      if (otpResult.co_tel) {
        localStorage.setItem("co_tel", otpResult.co_tel);
      }
      
      const formattedTel = otpResult.co_tel?.replace(/(\d{3})\d{3}(\d{4})/, 'xxx-xxx-$2') || '';
      setBlindPhone(formattedTel);
      setPageState("otp");
      setError("");
    } else {
      setError(otpResult.message || "ไม่สามารถส่ง OTP ได้");
      setPageState("preview");
    }
  };

  // ===== Verify OTP =====
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("กรุณากรอกรหัส OTP 6 หลัก");
      return;
    }

    setOtpLoading(true);
    setError("");

    try {
      const storedCitizenId = localStorage.getItem("citizenId");
      if (!storedCitizenId) {
        setError("ไม่พบข้อมูล กรุณาเริ่มใหม่");
        return;
      }

      console.log("Step 3: Verifying OTP...");
      const verifyResult = await verifyOTP(storedCitizenId, otp);

      if (verifyResult.status && verifyResult.data?.access_token) {
        // ✅ OTP ถูกต้อง
        console.log("Step 3 Success: OTP verified");
        
        // อัพเดท token ใหม่
        localStorage.setItem("token", verifyResult.data.access_token);
        localStorage.setItem("is_online_data_sync", "true");
          // ✅ ลบ draft เมื่อลงทะเบียนสำเร็จจริงๆ
        localStorage.removeItem("draftRegisterForm");
        localStorage.removeItem("pendingCustomerData");

        // ===== Step 4: ดึงข้อมูล customer จาก linecrm =====
        console.log("Step 4: Fetching customer data from linecrm...");
        const customerData = await getCustomerData(verifyResult.data.access_token);

        if (customerData && customerData.ctm_id) {
          console.log("Step 4 Success: HN =", customerData.ctm_id);
          localStorage.setItem("userHN", customerData.ctm_id);
          localStorage.setItem("userCustomerId", customerData.id?.toString() || "");
          setRegisteredHN(customerData.ctm_id);

          // Note: Shipping Address ถูกสร้างพร้อมกับ POST /customer แล้ว (shipping_address_selected)
        } else {
          setRegisteredHN("ลงทะเบียนสำเร็จ");
        }

        setPageState("success");
      } else {
        setError("รหัส OTP ไม่ถูกต้องหรือหมดอายุ");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  // Go to appointment
  const goToAppointment = () => {
    router.push("/ai/telemedicine/register/appointment");
  };

  // ==================== Render ====================

  // Success Page
  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-[#F2F8FE] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-pink-500 flex items-center justify-center">
            <FiCheck className="w-12 h-12 text-pink-500" strokeWidth={3} />
          </div>

          <h2 className="text-xl font-bold text-pink-500 mb-4">
            ลงทะเบียนใช้บริการสถานพยาบาลแล้ว
          </h2>

          {/* แสดง HN */}
          {registeredHN && (
            <div className="bg-blue-50 rounded-2xl p-4 mb-6">
              <p className="text-gray-500 text-sm mb-1">หมายเลขผู้ป่วย (HN)</p>
              <p className="text-2xl font-bold text-blue-600">{registeredHN}</p>
            </div>
          )}

          <button
            onClick={goToAppointment}
            className="w-full py-4 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors shadow-md"
          >
            ไปหน้านัดหมาย
          </button>
        </div>
      </div>
    );
  }

  // OTP Page
  if (pageState === "otp") {
    return (
      <div className="min-h-screen bg-[#F2F8FE] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            ยืนยันตัวตน
          </h2>
          
          <p className="text-gray-500 text-sm mb-2">
            กรุณากรอกรหัสยืนยันที่ส่งไปยัง
          </p>
          <p className="text-pink-500 font-medium mb-6">
            {blindPhone}
          </p>

          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-600">
              ✓ สร้าง HN สำเร็จ รอยืนยัน OTP
            </span>
          </div>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            placeholder="กรอกรหัส 6 หลัก"
            className="w-full text-center text-2xl tracking-widest py-4 border-2 border-gray-200 rounded-xl mb-4 focus:outline-none focus:border-blue-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleVerifyOTP();
              }
            }}
          />

          {error && (
            <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleVerifyOTP}
            disabled={otpLoading || otp.length !== 6}
            className={`w-full py-4 rounded-full font-medium transition-colors shadow-md mb-3 ${
              otpLoading || otp.length !== 6
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {otpLoading ? "กำลังตรวจสอบ..." : "ยืนยัน OTP"}
          </button>

          <button
            onClick={() => {
              const storedCitizenId = localStorage.getItem("citizenId");
              if (storedCitizenId) {
                handleSendOTP(storedCitizenId);
              }
            }}
            className="text-sm text-gray-500 hover:text-blue-500"
          >
            ส่ง OTP อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // Loading Page
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-[#F2F8FE] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="animate-spin w-16 h-16 mx-auto mb-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">กำลังลงทะเบียน...</p>
        </div>
      </div>
    );
  }

  // Preview Page
  if (pageState === "preview" && capturedImage) {
    return (
      <div className="min-h-screen bg-[#F2F8FE] p-4 md:p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center mb-6">
            2. ถ่ายรูปคู่บัตรประชาชนเพื่อยืนยันตัวตน
          </h1>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            {/* Preview Image */}
            <div className="rounded-2xl overflow-hidden mb-6">
              <img
                src={capturedImage}
                alt="รูปถ่ายคู่บัตรประชาชน"
                className="w-full h-auto"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg mb-4">
                {error}
              </p>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <FiCheck className="w-5 h-5" />
                ยืนยันและลงทะเบียน
              </button>

              <button
                onClick={retakePhoto}
                className="w-full py-4 bg-white text-blue-500 border-2 border-blue-500 rounded-full font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <FiRotateCcw className="w-5 h-5" />
                ถ่ายใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Capture Page (Default)
  return (
    <div className="min-h-screen bg-[#F2F8FE] p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center mb-4">
          2. ถ่ายรูปคู่บัตรประชาชนเพื่อยืนยันตัวตน
        </h1>

        {/* คำแนะนำ */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-blue-700 text-sm text-center font-medium mb-2">
            📸 วิธีถ่ายรูปคู่บัตร
          </p>
          <ul className="text-blue-600 text-xs space-y-1">
            <li>• ถือบัตรประชาชนไว้ข้างใบหน้า</li>
            <li>• ให้เห็นหน้าและบัตรชัดเจนในรูปเดียวกัน</li>
            <li>• ถ่ายในที่มีแสงสว่างเพียงพอ</li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
            {/* Camera Preview - Clean without overlay */}
            {isCameraOpen && (
              <div className="relative rounded-2xl overflow-hidden mb-6 bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-72 object-cover"
                />
                
                {/* Simple hint text only */}
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">
                    📸 ถือบัตรข้างใบหน้า แล้วกดถ่าย
                  </span>
                </div>
              </div>
            )}


            {/* Example Image - แสดงก่อนเปิดกล้อง */}
            {!isCameraOpen && (
              <div className="mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
                  <p className="text-blue-600 text-xs text-center font-medium mb-3">
                    ✓ ตัวอย่างภาพที่ถูกต้อง
                  </p>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <svg viewBox="0 0 280 140" className="w-full h-auto">
                      {/* Background */}
                      <rect width="280" height="140" fill="#f8fafc" rx="8"/>
                      
                      {/* Person silhouette - head */}
                      <ellipse cx="100" cy="45" rx="28" ry="32" fill="#cbd5e1"/>
                      
                      {/* Person silhouette - body */}
                      <ellipse cx="100" cy="120" rx="45" ry="40" fill="#e2e8f0"/>
                      
                      {/* ID Card in hand */}
                      <g transform="translate(150, 35)">
                        <rect width="75" height="50" rx="4" fill="#fff" stroke="#3b82f6" strokeWidth="2"/>
                        <rect x="6" y="6" width="22" height="28" rx="2" fill="#bfdbfe"/>
                        <rect x="32" y="10" width="38" height="5" rx="1" fill="#93c5fd"/>
                        <rect x="32" y="19" width="30" height="4" rx="1" fill="#bfdbfe"/>
                        <rect x="32" y="27" width="34" height="4" rx="1" fill="#bfdbfe"/>
                      </g>
                      
                      {/* Checkmark */}
                      <circle cx="250" cy="25" r="18" fill="#22c55e"/>
                      <path d="M242 25 L248 31 L260 19" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-blue-500 text-xs text-center mt-3">
                    ถือบัตรข้างใบหน้า ให้เห็นชัดทั้งคู่
                  </p>
                </div>
              </div>
            )}

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg mb-4">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            {isCameraOpen && (
              <>
                <button
                  onClick={capturePhoto}
                  className="w-full py-4 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <FiCamera className="w-5 h-5" />
                  กดถ่ายรูป
                </button>

                <button
                  onClick={closeCamera}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
              </>
            )}

            {!isCameraOpen && (
              <>
                <button
                  onClick={openCamera}
                  className="w-full py-4 bg-white text-blue-500 border-2 border-blue-500 rounded-full font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FiCamera className="w-5 h-5" />
                  ถ่ายรูปคู่บัตรประชาชน
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  เลือกจากแกลเลอรี่
                </button>
              </>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Info Text */}
        <p className="text-center text-gray-500 text-sm mt-4">
          รูปภาพจะถูกบีบอัดอัตโนมัติเพื่อความรวดเร็วในการส่งข้อมูล
        </p>
      </div>
    </div>
  );
};

export default CaptureIDCardPage;