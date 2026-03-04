"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiCalendar, FiChevronDown, FiLock, FiEdit2, FiPlus, FiMapPin } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ==================== API Configuration ====================
const BASE_URL = process.env.NEXT_PUBLIC_APPOINT_API_URL || "https://shop.api-apsx.co";
const LINECRM_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://linecrm.api-apsx.com";
const SHOP_ID = parseInt(process.env.NEXT_PUBLIC_SHOP_ID || "949");

const API_KEYS = {
  public_key: process.env.NEXT_PUBLIC_API_PUBLIC_KEY || "",
  private_key: process.env.NEXT_PUBLIC_API_PRIVATE_KEY || "",
};

const AUTH_TOKEN = process.env.NEXT_PUBLIC_API_AUTH_TOKEN || "";

// Token Cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

interface AuthResponse {
  status: boolean;
  data: { access_token: string };
  message: string;
}

interface AddressItem {
  district: string;
  amphoe: string;
  province: string;
  zipcode: string;
}

// Shipping Address Interface
interface ShippingAddress {
  id: number;
  customer_id: number;
  shop_id: number;
  shop_mother_id: number;
  receiver_name: string;
  receiver_tel: string;
  address: string;
  district: string;
  amphoe: string;
  province: string;
  zipcode: string;
  remark: string;
  is_default: number;
  is_active: number;
}

// Customer Data Interface (from linecrm)
interface CustomerData {
  id: number;
  ctm_id: string;
  ctm_citizen_id: string;
  ctm_prefix: string;
  ctm_fname: string;
  ctm_lname: string;
  ctm_tel: string;
  ctm_email: string;
  ctm_birthdate: string;
  ctm_address: string;
  ctm_district: string;
  ctm_amphoe: string;
  ctm_province: string;
  ctm_zipcode: string;
}

// Get OAuth access token (with cache)
const getAccessToken = async (): Promise<string | null> => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/oauth`, {
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
    console.error("Error getting access token:", error);
    return null;
  }
};

// Search address API
const searchAddress = async (search: string): Promise<AddressItem[]> => {
  try {
    if (!AUTH_TOKEN) return [];

    const response = await fetch(`${BASE_URL}/address/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        search,
        limit: 50,  // เพิ่มจาก 20 เป็น 50
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    console.log("Address search result:", search, data.data?.length || 0, "items");
    return data.data || [];
  } catch (error) {
    console.error("Error searching address:", error);
    return [];
  }
};

// Check if citizen already exists
const checkCitizenExists = async (citizenId: string): Promise<{ exists: boolean; hn: string | null; customerId: number | null }> => {
  try {
    const token = await getAccessToken();
    if (!token) return { exists: false, hn: null, customerId: null };

    const response = await fetch(`${BASE_URL}/customer/citizen/${citizenId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return { exists: false, hn: null, customerId: null };

    const data = await response.json();
    if (data.status && data.data?.ctm_id) {
      return { exists: true, hn: data.data.ctm_id, customerId: data.data.id };
    }
    return { exists: false, hn: null, customerId: null };
  } catch (error) {
    console.error("Error checking citizen:", error);
    return { exists: false, hn: null, customerId: null };
  }
};

// ==================== Flow 1 API Functions ====================

// GET customer data from linecrm (for Flow 1 prefill)
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
    console.error("Error fetching customer data:", error);
    return null;
  }
};

// GET shipping address list from linecrm
const getShippingAddressList = async (token: string, customerId: number): Promise<ShippingAddress[]> => {
  try {
    const response = await fetch(`${LINECRM_API_URL}/customer/shipping-address/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shop_id: SHOP_ID,
        customer_id: customerId,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (data.status && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching shipping addresses:", error);
    return [];
  }
};

// POST create new shipping address
const createShippingAddress = async (
  token: string,
  shippingData: Omit<ShippingAddress, "id" | "is_active">
): Promise<{ status: boolean; data?: { id: number }; message?: string }> => {
  try {
    const response = await fetch(`${LINECRM_API_URL}/customer/shipping-address`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shippingData),
    });

    return await response.json();
  } catch (error) {
    console.error("Error creating shipping address:", error);
    return { status: false, message: "เกิดข้อผิดพลาด" };
  }
};

// PATCH update shipping address
const updateShippingAddress = async (
  token: string,
  shippingId: number,
  shippingData: Partial<ShippingAddress>
): Promise<{ status: boolean; message?: string }> => {
  try {
    const response = await fetch(`${LINECRM_API_URL}/customer/shipping-address/${SHOP_ID}/${shippingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shippingData),
    });

    return await response.json();
  } catch (error) {
    console.error("Error updating shipping address:", error);
    return { status: false, message: "เกิดข้อผิดพลาด" };
  }
};

// ==================== Component ====================
const PREFIXES = ["โปรดระบุ", "นาย", "นาง", "นางสาว", "เด็กชาย", "เด็กหญิง"];

interface FormData {
  ctm_citizen_id: string;
  ctm_prefix: string;
  ctm_fname: string;
  ctm_lname: string;
  ctm_birthdate: string;
  ctm_address: string;
  ctm_province: string;
  ctm_zipcode: string;
  ctm_amphoe: string;
  ctm_district: string;
  useIdCardAddress: boolean;
  // Shipping Address (ถ้าเลือก "ที่อยู่จัดส่งอื่น")
  shipping_receiver_name: string;
  shipping_receiver_tel: string;
  shipping_address: string;
  shipping_province: string;
  shipping_amphoe: string;
  shipping_district: string;
  shipping_zipcode: string;
  shipping_remark: string;
}

// Address Dropdown Component
interface AddressDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  onSelect: (address: AddressItem) => void;
  searchField: "province" | "amphoe" | "district" | "zipcode";
}

const AddressDropdown: React.FC<AddressDropdownProps> = ({
  label,
  value,
  placeholder,
  onSelect,
  searchField,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<AddressItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      const results = await searchAddress(term);
      setSuggestions(results);
      setIsLoading(false);
    }, 150);
  };

  const handleSelect = (address: AddressItem) => {
    onSelect(address);
    setSearchTerm("");
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-black-500 mb-1">
        {label} <span className="text-pink-500">*</span>
      </label>
      <div
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-gray-700" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <FiChevronDown className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหา..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">กำลังค้นหา...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                  onClick={() => handleSelect(item)}
                >
                  <div className="font-medium text-gray-800">{item[searchField]}</div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {item.district}, {item.amphoe}, {item.province} {item.zipcode}
                  </div>
                </div>
              ))
            ) : searchTerm.length >= 2 ? (
              <div className="p-4 text-center text-gray-500 text-sm">ไม่พบข้อมูล</div>
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">พิมพ์อย่างน้อย 2 ตัวอักษร</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TelemedicineRegisterPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // ===== Flow 1 States =====
  const [isFlow1, setIsFlow1] = useState(false);  // true = มี HN แล้ว (readonly)
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [editingShipping, setEditingShipping] = useState<ShippingAddress | null>(null);
  const [showAddShippingForm, setShowAddShippingForm] = useState(false);
  const [selectedShippingId, setSelectedShippingId] = useState<number | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    ctm_citizen_id: "",
    ctm_prefix: "โปรดระบุ",
    ctm_fname: "",
    ctm_lname: "",
    ctm_birthdate: "",
    ctm_address: "",
    ctm_province: "",
    ctm_zipcode: "",
    ctm_amphoe: "",
    ctm_district: "",
    useIdCardAddress: true,
    // Shipping Address
    shipping_receiver_name: "",
    shipping_receiver_tel: "",
    shipping_address: "",
    shipping_province: "",
    shipping_amphoe: "",
    shipping_district: "",
    shipping_zipcode: "",
    shipping_remark: "",
  });

  // ===== Initialize & Check Flow =====
  useEffect(() => {
    const initPage = async () => {
      const storedCitizenId = localStorage.getItem("citizenId");
      const hasExistingHN = localStorage.getItem("hasExistingHN") === "true";
      const isOtpVerified = localStorage.getItem("is_online_data_sync") === "true";
      const token = localStorage.getItem("token");

      if (!storedCitizenId) {
        router.push("/ai/telemedicine");
        return;
      }

      // ===== Flow 1: มี HN แล้ว + OTP verified =====
      if (hasExistingHN && isOtpVerified && token) {
        console.log("Flow 1: Has HN + OTP verified → Prefill data");
        setIsFlow1(true);

        // GET /customer → prefill
        const customerData = await getCustomerData(token);
        if (customerData) {
          // GET /shipping-address/list
          const addresses = await getShippingAddressList(token, customerData.id);
          setShippingAddresses(addresses);

          // หา shipping address ที่ไม่ใช่ที่อยู่ตามบัตร (สำหรับ prefill form "ที่อยู่จัดส่งอื่น")
          const otherShippingAddr = addresses.find(addr => 
            addr.address !== customerData.ctm_address ||
            addr.district !== customerData.ctm_district ||
            addr.amphoe !== customerData.ctm_amphoe ||
            addr.province !== customerData.ctm_province
          );

          setFormData(prev => ({
            ...prev,
            ctm_citizen_id: customerData.ctm_citizen_id || storedCitizenId,
            ctm_prefix: customerData.ctm_prefix || "โปรดระบุ",
            ctm_fname: customerData.ctm_fname || "",
            ctm_lname: customerData.ctm_lname || "",
            ctm_birthdate: customerData.ctm_birthdate?.split("T")[0] || "",
            ctm_address: customerData.ctm_address || "",
            ctm_province: customerData.ctm_province || "",
            ctm_amphoe: customerData.ctm_amphoe || "",
            ctm_district: customerData.ctm_district || "",
            ctm_zipcode: customerData.ctm_zipcode || "",
            // Prefill shipping form ถ้ามีข้อมูลจาก HIS
            shipping_receiver_name: otherShippingAddr?.receiver_name || "",
            shipping_receiver_tel: otherShippingAddr?.receiver_tel || "",
            shipping_address: otherShippingAddr?.address || "",
            shipping_province: otherShippingAddr?.province || "",
            shipping_amphoe: otherShippingAddr?.amphoe || "",
            shipping_district: otherShippingAddr?.district || "",
            shipping_zipcode: otherShippingAddr?.zipcode || "",
            shipping_remark: otherShippingAddr?.remark || "",
          }));

          // เก็บ shipping id ไว้สำหรับ PATCH
          if (otherShippingAddr) {
            setSelectedShippingId(otherShippingAddr.id);
          }
        }

        setIsInitialized(true);
        return;
      }

      // ===== Flow 2: ไม่มี HN หรือยังไม่ verify OTP =====
      console.log("Flow 2: No HN or not verified → New registration");
      setIsFlow1(false);
      setFormData(prev => ({
        ...prev,
        ctm_citizen_id: storedCitizenId,
      }));

      setIsInitialized(true);
      getAccessToken();
    };

    initPage();
  }, [router]);

  // ===== handleFormChange - ป้องกัน readonly ถ้า Flow 1 =====
  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    // ป้องกันการแก้ไข citizenId
    if (field === "ctm_citizen_id") return;

    // Flow 1: ป้องกันการแก้ไขข้อมูลตามบัตร
    if (isFlow1) {
      const readonlyFields: (keyof FormData)[] = [
        "ctm_prefix", "ctm_fname", "ctm_lname", "ctm_birthdate",
        "ctm_address", "ctm_province", "ctm_amphoe", "ctm_district", "ctm_zipcode"
      ];
      if (readonlyFields.includes(field)) return;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleAddressSelect = (address: AddressItem) => {
    setFormData(prev => ({
      ...prev,
      ctm_province: address.province,
      ctm_amphoe: address.amphoe,
      ctm_district: address.district,
      ctm_zipcode: address.zipcode,
    }));
  };

  // Handle shipping address select from dropdown
  const handleShippingAddressSelect = (address: AddressItem) => {
    setFormData(prev => ({
      ...prev,
      shipping_province: address.province,
      shipping_amphoe: address.amphoe,
      shipping_district: address.district,
      shipping_zipcode: address.zipcode,
    }));
  };

  // ===== Flow 1: Shipping Address Management =====
  
  // เช็คว่าเป็นที่อยู่ตามบัตรหรือไม่
  const isIdCardAddress = (shipping: ShippingAddress): boolean => {
    return (
      shipping.address === formData.ctm_address &&
      shipping.district === formData.ctm_district &&
      shipping.amphoe === formData.ctm_amphoe &&
      shipping.province === formData.ctm_province
    );
  };

  // เริ่มแก้ไขที่อยู่จัดส่ง
  const handleStartEditShipping = (shipping: ShippingAddress) => {
    setEditingShipping(shipping);
    setFormData(prev => ({
      ...prev,
      shipping_receiver_name: shipping.receiver_name,
      shipping_receiver_tel: shipping.receiver_tel,
      shipping_address: shipping.address,
      shipping_province: shipping.province,
      shipping_amphoe: shipping.amphoe,
      shipping_district: shipping.district,
      shipping_zipcode: shipping.zipcode,
      shipping_remark: shipping.remark || "",
    }));
  };

  // เริ่มเพิ่มที่อยู่จัดส่งใหม่
  const handleStartAddShipping = () => {
    setEditingShipping(null);
    setShowAddShippingForm(true);
    setFormData(prev => ({
      ...prev,
      shipping_receiver_name: "",
      shipping_receiver_tel: "",
      shipping_address: "",
      shipping_province: "",
      shipping_amphoe: "",
      shipping_district: "",
      shipping_zipcode: "",
      shipping_remark: "",
    }));
  };

  // ยกเลิกการแก้ไข/เพิ่ม
  const handleCancelShippingEdit = () => {
    setEditingShipping(null);
    setShowAddShippingForm(false);
  };

  // บันทึกที่อยู่จัดส่ง (POST หรือ PATCH)
  const handleSaveShipping = async () => {
    // Validate
    if (!formData.shipping_receiver_name.trim() ||
        !formData.shipping_receiver_tel.trim() ||
        !formData.shipping_address.trim() ||
        !formData.shipping_province.trim() ||
        !formData.shipping_amphoe.trim() ||
        !formData.shipping_district.trim() ||
        !formData.shipping_zipcode.trim()) {
      setError("กรุณากรอกข้อมูลที่อยู่จัดส่งให้ครบ");
      return;
    }

    setShippingLoading(true);
    const token = localStorage.getItem("token");
    const customerId = parseInt(localStorage.getItem("userCustomerId") || "0");

    if (!token || !customerId) {
      setError("ไม่พบข้อมูลผู้ใช้");
      setShippingLoading(false);
      return;
    }

    const shippingData = {
      customer_id: customerId,
      shop_id: SHOP_ID,
      shop_mother_id: SHOP_ID,
      receiver_name: formData.shipping_receiver_name,
      receiver_tel: formData.shipping_receiver_tel,
      address: formData.shipping_address,
      district: formData.shipping_district,
      amphoe: formData.shipping_amphoe,
      province: formData.shipping_province,
      zipcode: formData.shipping_zipcode,
      remark: formData.shipping_remark || "",
      is_default: shippingAddresses.length === 0 ? 1 : 0,
    };

    try {
      if (editingShipping) {
        // PATCH - แก้ไข
        const result = await updateShippingAddress(token, editingShipping.id, shippingData);
        if (result.status) {
          // Refresh list
          const addresses = await getShippingAddressList(token, customerId);
          setShippingAddresses(addresses);
          setEditingShipping(null);
          setSuccessMessage("แก้ไขที่อยู่จัดส่งสำเร็จ");
          setTimeout(() => setSuccessMessage(""), 2000);
        } else {
          setError(result.message || "ไม่สามารถแก้ไขที่อยู่ได้");
        }
      } else {
        // POST - เพิ่มใหม่
        const result = await createShippingAddress(token, shippingData);
        if (result.status) {
          // Refresh list
          const addresses = await getShippingAddressList(token, customerId);
          setShippingAddresses(addresses);
          setShowAddShippingForm(false);
          if (result.data?.id) {
            setSelectedShippingId(result.data.id);
          }
          setSuccessMessage("เพิ่มที่อยู่จัดส่งสำเร็จ");
          setTimeout(() => setSuccessMessage(""), 2000);
        } else {
          setError(result.message || "ไม่สามารถเพิ่มที่อยู่ได้");
        }
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setShippingLoading(false);
    }
  };

  // ===== Form Validation =====
  const isFormValid = () => {
    // Flow 1: ข้อมูลตามบัตร prefill แล้ว ไม่ต้องเช็ค
    if (isFlow1) {
      // ถ้าเลือก "ที่อยู่ตามบัตร" → valid
      if (formData.useIdCardAddress) {
        return true;
      }
      // ถ้าเลือก "ที่อยู่จัดส่งอื่น" → เช็ค shipping fields
      return (
        formData.shipping_receiver_name.trim() !== "" &&
        formData.shipping_receiver_tel.trim() !== "" &&
        formData.shipping_address.trim() !== "" &&
        formData.shipping_province.trim() !== "" &&
        formData.shipping_amphoe.trim() !== "" &&
        formData.shipping_district.trim() !== "" &&
        formData.shipping_zipcode.trim() !== ""
      );
    }

    // Flow 2: ต้องกรอกข้อมูลครบ
    const basicValid = (
      formData.ctm_citizen_id.length === 13 &&
      formData.ctm_prefix !== "โปรดระบุ" &&
      formData.ctm_fname.trim() !== "" &&
      formData.ctm_lname.trim() !== "" &&
      formData.ctm_birthdate !== "" &&
      formData.ctm_address.trim() !== "" &&
      formData.ctm_province.trim() !== "" &&
      formData.ctm_zipcode.trim() !== "" &&
      formData.ctm_amphoe.trim() !== "" &&
      formData.ctm_district.trim() !== ""
    );

    // ถ้าเลือกที่อยู่จัดส่งอื่น ต้องกรอก shipping address ด้วย
    if (!formData.useIdCardAddress) {
      return basicValid &&
        formData.shipping_receiver_name.trim() !== "" &&
        formData.shipping_receiver_tel.trim() !== "" &&
        formData.shipping_address.trim() !== "" &&
        formData.shipping_province.trim() !== "" &&
        formData.shipping_amphoe.trim() !== "" &&
        formData.shipping_district.trim() !== "" &&
        formData.shipping_zipcode.trim() !== "";
    }

    return basicValid;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // ===== Flow 1: มี HN แล้ว =====
      if (isFlow1) {
        console.log("Flow 1: Has HN");
        
        // ถ้าเลือก "ที่อยู่จัดส่งอื่น" → POST หรือ PATCH
        if (!formData.useIdCardAddress) {
          const token = localStorage.getItem("token");
          const customerId = parseInt(localStorage.getItem("userCustomerId") || "0");

          if (!token || !customerId) {
            setError("ไม่พบข้อมูลผู้ใช้");
            setIsLoading(false);
            return;
          }

          const shippingData = {
            customer_id: customerId,
            shop_id: SHOP_ID,
            shop_mother_id: SHOP_ID,
            receiver_name: formData.shipping_receiver_name,
            receiver_tel: formData.shipping_receiver_tel,
            address: formData.shipping_address,
            district: formData.shipping_district,
            amphoe: formData.shipping_amphoe,
            province: formData.shipping_province,
            zipcode: formData.shipping_zipcode,
            remark: formData.shipping_remark || "",
            is_default: 0,
          };

          // มี shipping address เดิม → PATCH
          if (selectedShippingId) {
            console.log("Flow 1: PATCH shipping address", selectedShippingId);
            const result = await updateShippingAddress(token, selectedShippingId, shippingData);
            if (!result.status) {
              setError(result.message || "ไม่สามารถแก้ไขที่อยู่จัดส่งได้");
              setIsLoading(false);
              return;
            }
          } else {
            // ไม่มี shipping address เดิม → POST
            console.log("Flow 1: POST new shipping address");
            const result = await createShippingAddress(token, shippingData);
            if (!result.status) {
              setError(result.message || "ไม่สามารถบันทึกที่อยู่จัดส่งได้");
              setIsLoading(false);
              return;
            }
          }
        }

        setSuccessMessage("กำลังไปหน้านัดหมาย...");
        setTimeout(() => router.push("/ai/telemedicine/register/appointment"), 1000);
        return;
      }

      // ===== Flow 2: ไม่มี HN → เช็คและสร้างใหม่ =====
      // ตรวจสอบว่ามีข้อมูลในระบบแล้วหรือไม่
      const existCheck = await checkCitizenExists(formData.ctm_citizen_id);

      if (existCheck.exists && existCheck.hn) {
        // ✅ เช็คว่า OTP verified แล้วหรือยัง
        const isOtpVerified = localStorage.getItem("is_online_data_sync") === "true";
        
        if (isOtpVerified) {
          // ✅ มี HN + OTP verified แล้ว → ไปหน้านัดหมายเลย
          localStorage.setItem("userHN", existCheck.hn);
          localStorage.setItem("userCustomerId", existCheck.customerId?.toString() || "");

          setSuccessMessage("พบข้อมูลในระบบแล้ว กำลังไปหน้านัดหมาย...");
          setTimeout(() => router.push("/ai/telemedicine/register/appointment"), 1500);
          return;
        }
        
        // ❌ มี HN แต่ยังไม่ได้ verify OTP → ไปหน้า capture-idcard เพื่อ verify OTP
        console.log("HN exists but OTP not verified, going to capture-idcard for OTP");
      }

      // สร้าง shipping_address_selected
      const coTel = localStorage.getItem("co_tel") || "";
      const shippingAddress = formData.useIdCardAddress
        ? {
            // ใช้ที่อยู่ตามบัตรประชาชน
            customer_id: 0,
            shop_id: SHOP_ID,
            shop_mother_id: SHOP_ID,
            receiver_name: `${formData.ctm_prefix}${formData.ctm_fname} ${formData.ctm_lname}`.trim(),
            receiver_tel: coTel,
            address: formData.ctm_address,
            district: formData.ctm_district,
            amphoe: formData.ctm_amphoe,
            province: formData.ctm_province,
            zipcode: formData.ctm_zipcode,
            remark: "",
            is_default: 1,
          }
        : {
            // ใช้ที่อยู่จัดส่งอื่น
            customer_id: 0,
            shop_id: SHOP_ID,
            shop_mother_id: SHOP_ID,
            receiver_name: formData.shipping_receiver_name,
            receiver_tel: formData.shipping_receiver_tel,
            address: formData.shipping_address,
            district: formData.shipping_district,
            amphoe: formData.shipping_amphoe,
            province: formData.shipping_province,
            zipcode: formData.shipping_zipcode,
            remark: formData.shipping_remark || "",
            is_default: 1,
          };

      // เก็บข้อมูลไว้ใน localStorage แล้วไปหน้าถ่ายรูป
      const customerData = {
        shop_id: 949,
        customer_group_id: 3245,
        user_id: null,
        right_treatment_id: 16,
        ctm_prefix: formData.ctm_prefix,
        ctm_gender:
          formData.ctm_prefix === "นาย" || formData.ctm_prefix === "เด็กชาย"
            ? "ชาย"
            : formData.ctm_prefix === "นาง" || formData.ctm_prefix === "นางสาว" || formData.ctm_prefix === "เด็กหญิง"
              ? "หญิง"
              : "ไม่ระบุ",
        ctm_nation: "ไทย",
        ctm_religion: "ไม่ระบุ",
        ctm_edu_level: "ไม่ระบุ",
        ctm_marital_status: "ไม่ระบุ",
        ctm_blood: "ไม่ระบุ",
        ctm_treatment_type: 2,
        ctm_citizen_id: formData.ctm_citizen_id,
        ctm_fname: formData.ctm_fname,
        ctm_lname: formData.ctm_lname,
        ctm_nname: "",
        ctm_fname_en: "",
        ctm_lname_en: "",
        ctm_email: localStorage.getItem("email") || "",
        ctm_tel: coTel,
        ctm_birthdate: formData.ctm_birthdate || "",
        ctm_address: formData.ctm_address,
        ctm_district: formData.ctm_district,
        ctm_amphoe: formData.ctm_amphoe,
        ctm_province: formData.ctm_province,
        ctm_zipcode: formData.ctm_zipcode,
        ctm_subscribe_opd: 0,
        ctm_subscribe_lab: 0,
        ctm_subscribe_cert: 0,
        ctm_subscribe_receipt: 0,
        ctm_subscribe_appoint: 1,
        ctm_is_active: 1,
        ctm_image: "",
        ctm_image_size: 0,
        tag_selected: [],
        family_selected: [],
        contact_selected: [],
        shipping_address_selected: [shippingAddress],
      };

      // เก็บข้อมูลไว้ใน localStorage
      localStorage.setItem("pendingCustomerData", JSON.stringify(customerData));

      // ไปหน้าถ่ายรูปบัตรประชาชน
      router.push("/ai/telemedicine/register/capture-idcard");
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state ขณะตรวจสอบ citizenId
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#F2F8FE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F8FE] p-4 md:p-6 pb-32">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center mb-2">
          {isFlow1 ? "ข้อมูลของคุณ" : "1. ข้อมูลตามบัตรประชาชน"}
        </h1>
        
        {isFlow1 && (
          <p className="text-center text-sm text-green-600 mb-4">
            ✓ ข้อมูลถูกเชื่อมต่อกับระบบแล้ว
          </p>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center">
            ✓ {successMessage}
          </div>
        )}

        <div className="space-y-4">
          {/* Citizen ID - Readonly */}
          <div>
            <label className="block text-sm font-medium text-black-500 mb-1">
              เลขบัตรประชาชน<span className="text-pink-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formData.ctm_citizen_id}
                readOnly
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed pr-10"
              />
              <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              เลขบัตรประชาชนถูกยืนยันแล้ว ไม่สามารถแก้ไขได้
            </p>
          </div>

          {/* Prefix */}
          <div>
            <label className="block text-sm font-medium text-black-500 mb-1">
              คำนำหน้า <span className="text-pink-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.ctm_prefix}
                onChange={(e) => handleFormChange("ctm_prefix", e.target.value)}
                disabled={isFlow1}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 appearance-none focus:outline-none focus:border-blue-400 ${
                  isFlow1 ? "bg-gray-100 cursor-not-allowed" : "bg-white cursor-pointer"
                }`}
              >
                {PREFIXES.map((prefix) => (
                  <option key={prefix} value={prefix}>
                    {prefix}
                  </option>
                ))}
              </select>
              {isFlow1 ? (
                <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              ) : (
                <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              )}
            </div>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-black-500 mb-1">
              ชื่อจริงตามบัตรประชาชน <span className="text-pink-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.ctm_fname}
                onChange={(e) => handleFormChange("ctm_fname", e.target.value)}
                placeholder="ชื่อจริง"
                disabled={isFlow1}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-blue-400 ${
                  isFlow1 ? "bg-gray-100 cursor-not-allowed pr-10" : "bg-white"
                }`}
              />
              {isFlow1 && <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />}
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-black-500 mb-1">
              นามสกุลตามบัตรประชาชน <span className="text-pink-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.ctm_lname}
                onChange={(e) => handleFormChange("ctm_lname", e.target.value)}
                disabled={isFlow1}
                placeholder="นามสกุล"
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-blue-400 ${
                  isFlow1 ? "bg-gray-100 cursor-not-allowed pr-10" : "bg-white"
                }`}
              />
              {isFlow1 && <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />}
            </div>
          </div>

          {/* Birth Date */}
          <div className="w-full">
            <label className="block text-sm font-medium text-black-500 mb-1">
              วัน เดือน ปีเกิด (ค.ศ.) <span className="text-pink-500">*</span>
            </label>

            <div className="relative w-full">
              {isFlow1 ? (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.ctm_birthdate}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed pr-10"
                  />
                  <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              ) : (
                <>
                  <DatePicker
                    wrapperClassName="w-full"
                    popperClassName="z-50"
                    selected={formData.ctm_birthdate ? new Date(formData.ctm_birthdate) : null}
                    onChange={(date: Date | null) => {
                      if (!date) {
                        handleFormChange("ctm_birthdate", "");
                        return;
                      }
                      const yyyy = date.getFullYear();
                      const mm = String(date.getMonth() + 1).padStart(2, "0");
                      const dd = String(date.getDate()).padStart(2, "0");
                      handleFormChange("ctm_birthdate", `${yyyy}-${mm}-${dd}`);
                    }}
                    dateFormat="yyyy-MM-dd"
                    maxDate={new Date()}
                    placeholderText="เลือกวันเกิด"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-blue-400 pr-12"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <FiCalendar />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Address (House Number) */}
          <div>
            <label className="block text-sm font-medium text-black-500 mb-1">
              บ้านเลขที่ <span className="text-pink-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.ctm_address}
                onChange={(e) => handleFormChange("ctm_address", e.target.value)}
                disabled={isFlow1}
                placeholder="เช่น 82/100"
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-blue-400 ${
                  isFlow1 ? "bg-gray-100 cursor-not-allowed pr-10" : "bg-white"
                }`}
              />
              {isFlow1 && <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />}
            </div>
          </div>

          {/* Province - Flow 1 แสดง readonly, Flow 2 แสดง dropdown */}
          {isFlow1 ? (
            <div>
              <label className="block text-sm font-medium text-black-500 mb-1">จังหวัด</label>
              <div className="relative">
                <input type="text" value={formData.ctm_province} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed pr-10" />
                <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          ) : (
            <AddressDropdown
              label="จังหวัด"
              value={formData.ctm_province}
              placeholder="เลือกจังหวัด"
              onSelect={handleAddressSelect}
              searchField="province"
            />
          )}

          {/* Amphoe - Flow 1 แสดง readonly, Flow 2 แสดง dropdown */}
          {isFlow1 ? (
            <div>
              <label className="block text-sm font-medium text-black-500 mb-1">เขต/ อำเภอ</label>
              <div className="relative">
                <input type="text" value={formData.ctm_amphoe} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed pr-10" />
                <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          ) : (
            <AddressDropdown
              label="เขต/ อำเภอ"
              value={formData.ctm_amphoe}
              placeholder="เลือกเขต/อำเภอ"
              onSelect={handleAddressSelect}
              searchField="amphoe"
            />
          )}

          {/* District - Flow 1 แสดง readonly, Flow 2 แสดง dropdown */}
          {isFlow1 ? (
            <div>
              <label className="block text-sm font-medium text-black-500 mb-1">แขวง/ ตำบล</label>
              <div className="relative">
                <input type="text" value={formData.ctm_district} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed pr-10" />
                <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          ) : (
            <AddressDropdown
              label="แขวง/ ตำบล"
              value={formData.ctm_district}
              placeholder="เลือกแขวง/ตำบล"
              onSelect={handleAddressSelect}
              searchField="district"
            />
          )}

          {/* Zipcode - Flow 1 แสดง readonly */}
          {isFlow1 ? (
            <div>
              <label className="block text-sm font-medium text-black-500 mb-1">รหัสไปรษณีย์</label>
              <div className="relative">
                <input type="text" value={formData.ctm_zipcode} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed pr-10" />
                <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          ) : (
            <AddressDropdown
              label="รหัสไปรษณีย์"
              value={formData.ctm_zipcode}
              placeholder="เลือกรหัสไปรษณีย์"
              onSelect={handleAddressSelect}
              searchField="zipcode"
            />
          )}

          {/* ===== Shipping Address Section ===== */}
          {isFlow1 ? (
            // Flow 1: Radio เลือกที่อยู่ตามบัตร หรือ ที่อยู่จัดส่งอื่น (UI เหมือน Flow 2)
            <div className="space-y-3 pt-2">
              {/* Option 1: ใช้ที่อยู่ตามบัตร */}
              <div
                onClick={() => handleFormChange("useIdCardAddress", true)}
                className="flex items-center gap-3 cursor-pointer bg-white rounded-xl p-3 border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    formData.useIdCardAddress ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  }`}
                >
                  {formData.useIdCardAddress && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-gray-700 text-sm">
                  ใช้ที่อยู่ตามบัตรประชาชนเป็นที่อยู่จัดส่งเวชภัณฑ์
                </span>
              </div>

              {/* Option 2: ที่อยู่จัดส่งอื่น */}
              <div
                onClick={() => handleFormChange("useIdCardAddress", false)}
                className="flex items-center gap-3 cursor-pointer bg-white rounded-xl p-3 border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    !formData.useIdCardAddress ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  }`}
                >
                  {!formData.useIdCardAddress && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-gray-700 text-sm">
                  เลือกที่อยู่จัดส่งอื่น (โปรดระบุ)
                </span>
              </div>

              {/* แสดงเมื่อเลือก "ที่อยู่จัดส่งอื่น" */}
              {!formData.useIdCardAddress && (
                <div className="space-y-4 mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">ชื่อผู้รับ <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.shipping_receiver_name}
                      onChange={(e) => handleFormChange("shipping_receiver_name", e.target.value)}
                      placeholder="ชื่อ-นามสกุล ผู้รับ"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-blue-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">เบอร์โทรผู้รับ <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={formData.shipping_receiver_tel}
                      onChange={(e) => handleFormChange("shipping_receiver_tel", e.target.value.replace(/\D/g, ""))}
                      placeholder="เบอร์โทรศัพท์"
                      maxLength={10}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-blue-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">ที่อยู่ <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.shipping_address}
                      onChange={(e) => handleFormChange("shipping_address", e.target.value)}
                      placeholder="บ้านเลขที่ ซอย ถนน"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-blue-400 text-sm"
                    />
                  </div>

                  <AddressDropdown label="จังหวัด" value={formData.shipping_province} placeholder="เลือกจังหวัด" onSelect={handleShippingAddressSelect} searchField="province" />
                  <AddressDropdown label="เขต/ อำเภอ" value={formData.shipping_amphoe} placeholder="เลือกเขต/อำเภอ" onSelect={handleShippingAddressSelect} searchField="amphoe" />
                  <AddressDropdown label="แขวง/ ตำบล" value={formData.shipping_district} placeholder="เลือกแขวง/ตำบล" onSelect={handleShippingAddressSelect} searchField="district" />
                  <AddressDropdown label="รหัสไปรษณีย์" value={formData.shipping_zipcode} placeholder="เลือกรหัสไปรษณีย์" onSelect={handleShippingAddressSelect} searchField="zipcode" />

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">หมายเหตุ (ถ้ามี)</label>
                    <input
                      type="text"
                      value={formData.shipping_remark}
                      onChange={(e) => handleFormChange("shipping_remark", e.target.value)}
                      placeholder="เช่น ฝากไว้กับรปภ."
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-blue-400 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Flow 2: เลือกใช้ที่อยู่ตามบัตร หรือ กรอกที่อยู่จัดส่งใหม่
            <>
              {/* Address Options */}
          <div className="space-y-3 pt-2">
            <div
              onClick={() => handleFormChange("useIdCardAddress", true)}
              className="flex items-center gap-3 cursor-pointer bg-white rounded-xl p-3 border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.useIdCardAddress ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}
              >
                {formData.useIdCardAddress && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className="text-gray-700 text-sm">
                ใช้ที่อยู่ตามบัตรประชาชนเป็นที่อยู่จัดส่งเวชภัณฑ์
              </span>
            </div>

            <div
              onClick={() => handleFormChange("useIdCardAddress", false)}
              className="flex items-center gap-3 cursor-pointer bg-white rounded-xl p-3 border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${!formData.useIdCardAddress ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}
              >
                {!formData.useIdCardAddress && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className="text-gray-700 text-sm">
                เลือกที่อยู่จัดส่งอื่น (โปรดระบุ)
              </span>
            </div>
          </div>

          {/* Shipping Address Fields (แสดงเมื่อเลือก "ที่อยู่จัดส่งอื่น") */}
          {!formData.useIdCardAddress && (
            <div className="space-y-4 mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              {/* ชื่อผู้รับ */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">ชื่อผู้รับ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.shipping_receiver_name}
                  onChange={(e) => handleFormChange("shipping_receiver_name", e.target.value)}
                  placeholder="ชื่อ-นามสกุล ผู้รับ"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-blue-400 transition-colors text-sm"
                />
              </div>

              {/* เบอร์โทรผู้รับ */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">เบอร์โทรผู้รับ <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={formData.shipping_receiver_tel}
                  onChange={(e) => handleFormChange("shipping_receiver_tel", e.target.value.replace(/\D/g, ""))}
                  placeholder="เบอร์โทรศัพท์"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-blue-400 transition-colors text-sm"
                />
              </div>

              {/* ที่อยู่ */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">ที่อยู่ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.shipping_address}
                  onChange={(e) => handleFormChange("shipping_address", e.target.value)}
                  placeholder="บ้านเลขที่ ซอย ถนน"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-blue-400 transition-colors text-sm"
                />
              </div>

              {/* จังหวัด */}
              <AddressDropdown
                label="จังหวัด"
                value={formData.shipping_province}
                placeholder="เลือกจังหวัด"
                onSelect={handleShippingAddressSelect}
                searchField="province"
              />

              {/* เขต/อำเภอ */}
              <AddressDropdown
                label="เขต/ อำเภอ"
                value={formData.shipping_amphoe}
                placeholder="เลือกเขต/อำเภอ"
                onSelect={handleShippingAddressSelect}
                searchField="amphoe"
              />

              {/* แขวง/ตำบล */}
              <AddressDropdown
                label="แขวง/ ตำบล"
                value={formData.shipping_district}
                placeholder="เลือกแขวง/ตำบล"
                onSelect={handleShippingAddressSelect}
                searchField="district"
              />

              {/* รหัสไปรษณีย์ */}
              <AddressDropdown
                label="รหัสไปรษณีย์"
                value={formData.shipping_zipcode}
                placeholder="เลือกรหัสไปรษณีย์"
                onSelect={handleShippingAddressSelect}
                searchField="zipcode"
              />

              {/* หมายเหตุ */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  value={formData.shipping_remark}
                  onChange={(e) => handleFormChange("shipping_remark", e.target.value)}
                  placeholder="เช่น ฝากไว้กับรปภ."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-blue-400 transition-colors text-sm"
                />
              </div>
            </div>
          )}
            </>
          )}

          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full py-4 rounded-full font-medium transition-all duration-300 shadow-md mt-6 ${
              isLoading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isLoading ? "กำลังตรวจสอบ..." : isFlow1 ? "ไปนัดหมาย" : "ถัดไป"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelemedicineRegisterPage;