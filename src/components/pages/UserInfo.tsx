'use client';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useProfile } from "@/hooks/useProfile";
import { Customer } from "@/types/customer";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { checkAccessToken, getCustomerDetails } from "@/utils/checkAuthen";
import NoAccessModal from "@/components/auth/NoAccessModal";
import liff from "@line/liff";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import CitizenIdSync from "@/components/auth/CitizenIdSync";
import { FiMapPin, FiPackage, FiEdit2, FiX, FiCheck, FiChevronDown } from "react-icons/fi";

// ===== Address Search =====
const ADDRESS_API_URL = process.env.NEXT_PUBLIC_APPOINT_API_URL || "https://shop.api-apsx.co";
const AUTH_TOKEN = process.env.NEXT_PUBLIC_API_AUTH_TOKEN || "";

interface AddressItem {
  district: string;
  amphoe: string;
  province: string;
  zipcode: string;
}

// Search address API
const searchAddress = async (search: string): Promise<AddressItem[]> => {
  try {
    if (!AUTH_TOKEN) {
      console.error("AUTH_TOKEN is missing");
      return [];
    }

    console.log("Searching address:", search);
    const response = await fetch(`${ADDRESS_API_URL}/address/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        search,
        limit: 50,
      }),
    });

    if (!response.ok) {
      console.error("Address search failed:", response.status);
      return [];
    }

    const data = await response.json();
    console.log("Address search result:", data.data?.length || 0, "items");
    return data.data || [];
  } catch (error) {
    console.error("Error searching address:", error);
    return [];
  }
};

// ===== AddressDropdown Component =====
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
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

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
      <label className="block text-xs text-gray-600 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 cursor-pointer flex items-center justify-between text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-gray-700" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <FiChevronDown className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
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

export interface UserResponse {
  data: {
    userDataProfile: Customer;
    tag: { id: number; name: string }[];
    family: { id: number; name: string; relation: string }[];
    contact: { id: number; type: string; value: string }[];
    balance: Balance;
  };
  message: string;
  status: boolean;
}

export interface Balance {
  pay_total: number;
  balance_total: number;
}

// ✅ Interface สำหรับ Shipping Address
interface ShippingAddress {
  id: number;
  customer_id: number;
  receiver_name: string;
  receiver_tel: string;
  address: string;
  district: string;
  amphoe: string;
  province: string;
  zipcode: string;
  remark: string;
  is_default: number;
}

// ✅ Interface สำหรับ Edit Form
interface ShippingEditForm {
  receiver_name: string;
  receiver_tel: string;
  address: string;
  district: string;
  amphoe: string;
  province: string;
  zipcode: string;
  remark: string;
}

export default function UserInfoComponent() {
  const [isLogin, setIsLogin] = useState(true);
  const { userDataProfile, setUserDataProfile } = useProfile();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isSynced, setIsSynced] = useState(true);
  const [isSyncLine, setOpenSyncLine] = useState(false);
  const [isDataSync, setIsDataSync] = useState<boolean | null>(null);
  const [isUnsyncDataModal, setIsUnsyncDataModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ State สำหรับ CitizenIdSync Modal
  const [showCitizenSync, setShowCitizenSync] = useState(false);

  // ✅ State สำหรับ Shipping Addresses
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  
  // ✅ State สำหรับแก้ไข Shipping Address
  const [editingShippingId, setEditingShippingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ShippingEditForm>({
    receiver_name: "",
    receiver_tel: "",
    address: "",
    district: "",
    amphoe: "",
    province: "",
    zipcode: "",
    remark: "",
  });
  const [savingShipping, setSavingShipping] = useState(false);

  // ✅ State สำหรับ CoProfile (ข้อมูลจาก linecrm)
  const [coProfile, setCoProfile] = useState<{
    co_tel: string;
    co_email: string;
    co_fname: string;
    co_lname: string;
    is_online_data_sync: boolean;
  } | null>(null);

  const router = useRouter();

  // ✅ Fetch Shipping Addresses
  const fetchShippingAddresses = React.useCallback(async (customerId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !customerId) return;

      const SHOP_ID = 949;
      // ✅ ใช้ POST + body แทน GET + params ใน URL
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://linecrm.api-apsx.com"}/customer/shipping-address/list`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            shop_id: SHOP_ID,
            customer_id: customerId,
          }),
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      if (data.status && data.data) {
        setShippingAddresses(data.data);
      }
    } catch (error) {
      console.error("Error fetching shipping addresses:", error);
    }
  }, []);

  // ✅ เริ่มแก้ไข Shipping Address
  const handleStartEdit = (addr: ShippingAddress) => {
    setEditingShippingId(addr.id);
    setEditForm({
      receiver_name: addr.receiver_name,
      receiver_tel: addr.receiver_tel,
      address: addr.address,
      district: addr.district,
      amphoe: addr.amphoe,
      province: addr.province,
      zipcode: addr.zipcode,
      remark: addr.remark || "",
    });
  };

  // ✅ ยกเลิกแก้ไข
  const handleCancelEdit = () => {
    setEditingShippingId(null);
    setEditForm({
      receiver_name: "",
      receiver_tel: "",
      address: "",
      district: "",
      amphoe: "",
      province: "",
      zipcode: "",
      remark: "",
    });
  };

  // ✅ บันทึกการแก้ไข (PATCH API)
  const handleSaveEdit = async () => {
    if (!editingShippingId) return;

    setSavingShipping(true);
    try {
      const token = localStorage.getItem("token");
      const customerId = localStorage.getItem("userCustomerId");
      if (!token || !customerId) {
        toast.error("ไม่พบข้อมูลผู้ใช้");
        setSavingShipping(false);
        return;
      }

      const SHOP_ID = 949;
      // ใช้ PUT แทน PATCH (บาง server ไม่รองรับ PATCH)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://linecrm.api-apsx.com"}/customer/shipping-address/${SHOP_ID}/${editingShippingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: editingShippingId,
            customer_id: parseInt(customerId),
            shop_id: SHOP_ID,
            shop_mother_id: SHOP_ID,
            receiver_name: editForm.receiver_name,
            receiver_tel: editForm.receiver_tel,
            address: editForm.address,
            district: editForm.district,
            amphoe: editForm.amphoe,
            province: editForm.province,
            zipcode: editForm.zipcode,
            remark: editForm.remark || "",
            is_default: 0,
          }),
        }
      );

      const data = await response.json();

      if (data.status) {
        toast.success("แก้ไขที่อยู่จัดส่งสำเร็จ");
        handleCancelEdit();
        // Refresh shipping addresses
        fetchShippingAddresses(parseInt(customerId));
      } else {
        toast.error(data.message || "ไม่สามารถแก้ไขที่อยู่จัดส่งได้");
      }
    } catch (error) {
      console.error("Error updating shipping address:", error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขที่อยู่จัดส่ง");
    } finally {
      setSavingShipping(false);
    }
  };

  // ✅ Update form field
  const handleEditFormChange = (field: keyof ShippingEditForm, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // ✅ Handle address select from dropdown
  const handleEditAddressSelect = (address: AddressItem) => {
    setEditForm(prev => ({
      ...prev,
      province: address.province,
      amphoe: address.amphoe,
      district: address.district,
      zipcode: address.zipcode,
    }));
  };

  // ✅ ฟังก์ชันเช็คว่าเป็นที่อยู่ตามบัตรหรือไม่
  const isIdCardAddress = (addr: ShippingAddress): boolean => {
    if (!userDataProfile) return false;
    return (
      addr.address === userDataProfile.ctm_address &&
      addr.district === userDataProfile.ctm_district &&
      addr.amphoe === userDataProfile.ctm_amphoe &&
      addr.province === userDataProfile.ctm_province
    );
  };

  // ✅ Fetch CoProfile จาก linecrm
  const fetchCoProfile = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://linecrm.api-apsx.com"}/customer/co_profile`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      if (data.status && data.data) {
        setCoProfile(data.data);
        // อัพเดท sync status
        setIsDataSync(data.data.is_online_data_sync === true);
      }
    } catch (error) {
      console.error("Error fetching co_profile:", error);
    }
  }, []);

  const fetchData = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("ไม่พบ token");
        setIsLogin(false);
        return;
      }

      const user_data = await getCustomerDetails(token);
      console.log("getCustomerDetails response:", user_data);

      if (user_data?.status === true && user_data?.data?.customer) {
        const customer = user_data.data.customer;
        setUserDataProfile(customer);

        // sync ให้ sidebar
        if (customer?.ctm_citizen_id) localStorage.setItem("citizenId", customer.ctm_citizen_id);
        else localStorage.removeItem("citizenId");

        if (customer?.ctm_id) localStorage.setItem("userHN", customer.ctm_id);
        else localStorage.removeItem("userHN");

        if (typeof customer?.id === "number" && customer.id > 0) {
          localStorage.setItem("userCustomerId", String(customer.id));
          // ✅ Fetch shipping addresses
          fetchShippingAddresses(customer.id);
        } else {
          localStorage.removeItem("userCustomerId");
        }

        if (customer?.id === 0) {
          setIsSynced(false);
          return;
        }

        setIsSynced(true);
        return;
      }

      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้", user_data);
    } catch (err) {
      console.error("fetchData exception:", err);
    }
  }, [setUserDataProfile, fetchShippingAddresses]);

  const handleLoginLine = async () => {
    const liffId = `${process.env.NEXT_PUBLIC_LIFF_KEY || '2006526342-OEYmV1wW'}`;
    liff
      .init({ liffId })
      .then(() => {
        console.log("LIFF initialized successfully.");
        try {
          if (!liffId) {
            throw new Error(
              "LIFF ID is not defined. Please set NEXT_PUBLIC_LIFF_KEY in your environment variables."
            );
          }
          localStorage.setItem("syncFromProfile", "true");
          liff.login();
          const token = "user_token_from_server";
          document.cookie = `token=${token}; path=/; Secure; HttpOnly; SameSite=Strict;`;
        } catch (err) {
          if (err instanceof Error) {
            console.error("Login error:", err.message);
          } else {
            console.error("Login error:", err);
          }
        }
      })
      .catch((err) => {
        console.error("Error initializing LIFF:", err);
      });
  };

  useEffect(() => {
    if (!checkAccessToken()) {
      setIsLogin(false);
    } else {
      setIsLogin(true);
      setUsername(localStorage.getItem("username") || "");
      setEmail(localStorage.getItem("email") || "");
      setOpenSyncLine(localStorage.getItem("is_line_sync") === "true");

      // ✅ เรียก fetchCoProfile เพื่อดึงข้อมูลจาก linecrm (รวมถึงเบอร์โทร)
      fetchCoProfile();
      fetchData();
    }
  }, [fetchData, fetchCoProfile]);

  // ❌ ปิด auto open modal - ให้ user กดเมนูก่อน (Flow 2 ไม่มี OTP)
  // TODO: เปิดกลับเมื่อต้องการ auto open modal หลัง login
  useEffect(() => {
    if (isLogin && isDataSync === false) {
      setShowCitizenSync(true);
    }
  }, [isLogin, isDataSync]);

  // ✅ Handler เมื่อ Sync สำเร็จ
  const handleSyncSuccess = (hasHN: boolean) => {
    setShowCitizenSync(false);
    toast.success("เชื่อมต่อข้อมูลสำเร็จ");
    window.location.reload();
  };

  const handleUnsyncUser = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/onlineunsync`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      setLoading(false);
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();
    console.log(data);

    if (data.status === true) {
      localStorage.setItem("is_online_data_sync", "false");
      localStorage.setItem("token", data.data.access_token);
      window.location.reload();
    }
    setLoading(false);
  };

  // ✅ Filter ที่อยู่จัดส่งอื่น (ไม่ใช่ที่อยู่ตามบัตร)
  const otherShippingAddresses = shippingAddresses.filter(addr => !isIdCardAddress(addr));

  const profile = (userDataProfile: Customer | null) => {
    return (
      <>
        {!isLogin && <NoAccessModal />}
        {isLogin === true && (
          <div>
            <PageBreadcrumb size="text-3xl" oi={false} text="text-[#F639BD]" pageTitle="ข้อมูลผู้ใช้บริการคลินิก" />
            <div className="lg:max-w-6xl rounded-xl p-4 lg:p-6">
              <div className="space-y-6">
                <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-3">
                  บัญชีผู้ใช้
                </h3>

                <div className="flex flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="space-y-2 text-sm md:text-base text-gray-700 w-full">
                    {/* ชื่อผู้ใช้ */}
                    <div className="flex flex-row sm:items-center sm:gap-10.5">
                      <span className="text-[#4385EF] w-4/12 sm:w-2/12">ชื่อผู้ใช้</span>
                      <span className="font-medium text-gray-800 break-words">
                        {username || '-'}
                      </span>
                    </div>
                    {/* อีเมล */}
                    <div className="flex flex-row sm:items-center sm:gap-10.5">
                      <span className="text-[#4385EF] w-4/12 sm:w-2/12">อีเมล</span>
                      <span className="text-gray-800 break-words">{email}</span>
                    </div>
                    {/* เชื่อมต่อกับไลน์ */}
                    {isSyncLine !== true && (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-10.5">
                          <span className="text-[#4385EF] w-4/12 sm:w-2/12 pt-2">เข้าสู่ระบบด้วยไลน์</span>
                          <span className="text-gray-800 w-8/12 break-words pt-2">
                            เชื่อมต่อกับไลน์เพื่อเข้าสู่ระบบให้ง่ายขึ้น
                          </span>
                        </div>
                        <div className="flex flex-row sm:items-center sm:gap-10.5">
                          <div
                            onClick={handleLoginLine}
                            className="w-12/12 sm:w-5/12 inline-flex items-center justify-center gap-3 py-1.5 px-7 text-[14px] text-white transition bg-[#06C755] hover:bg-[#06C755]/90 active:bg-[#06C755]/70 rounded-lg cursor-pointer"
                          >
                            <Image
                              width={32}
                              height={32}
                              src="/images/logo/line_64.png"
                              alt="LINE"
                            />
                            เชื่อมต่อกับไลน์
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ข้อมูล HN (แสดงเมื่อ sync แล้ว) - Flow 0 */}
                {isSynced === true && (
                  <>
                    <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                      บัตรประจำตัวผู้ใช้บริการคลินิก
                    </h3>

                    {/* กล่องข้อมูลหลัก */}
                    <div className="flex flex-row items-center sm:items-center gap-4 sm:gap-6 bg-[#EFDDFD] rounded-xl p-4 sm:p-6 mb-6 w-full">
                      {/* รูปโปรไฟล์ */}
                      <div className="w-24 h-20 rounded-full overflow-hidden">
                        {userDataProfile ? (
                          <Image
                            src={"/images/user/owner.jpg"}
                            alt="User profile"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full animate-pulse bg-gray-200" />
                        )}
                      </div>

                      {/* รายละเอียด */}
                      <div className="text-left space-y-0.5 w-full">
                        {userDataProfile ? (
                          <>
                            <p className="font-semibold text-gray-800 text-base sm:text-lg leading-tight">
                              {userDataProfile.ctm_fname} {userDataProfile.ctm_lname}
                            </p>
                            <p className="font-medium text-sm">{userDataProfile.ctm_id}</p>
                            <p className="text-sm text-gray-600">
                              ติดต่อ {userDataProfile.ctm_tel || coProfile?.co_tel || "-"}
                            </p>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className="h-5 w-48 rounded bg-gray-200 animate-pulse"></div>
                            <div className="h-4 w-24 rounded bg-gray-200 animate-pulse"></div>
                            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ข้อมูลส่วนตัว */}
                    <div className="space-y-4 text-sm md:text-base">
                      {/* ชื่อ–สกุล */}
                      <div className="flex flex-row sm:items-start gap-1 sm:gap-6">
                        <span className="text-[#4385EF] w-[100px] sm:w-[120px] shrink-0">ชื่อ–สกุล</span>
                        {userDataProfile ? (
                          <span className="text-gray-800">
                            {userDataProfile.ctm_fname} {userDataProfile.ctm_lname}
                          </span>
                        ) : (
                          <div className="h-5 w-60 rounded bg-gray-100 animate-pulse"></div>
                        )}
                      </div>

                      {/* วันเกิด */}
                      <div className="flex flex-row sm:items-start gap-1 sm:gap-6">
                        <span className="text-[#4385EF] w-[100px] sm:w-[120px] shrink-0">เกิดวันที่</span>
                        {userDataProfile ? (
                          <span className="text-gray-800">
                            {new Date(userDataProfile.ctm_birthdate).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        ) : (
                          <div className="h-5 w-48 rounded bg-gray-100 animate-pulse"></div>
                        )}
                      </div>

                      {/* เลขบัตรประชาชน */}
                      <div className="flex flex-row sm:items-start gap-1 sm:gap-6">
                        <span className="text-[#4385EF] w-[100px] sm:w-[120px] shrink-0">เลขบัตรประชาชน</span>
                        {userDataProfile ? (
                          <span className="text-gray-800 break-words">{userDataProfile.ctm_citizen_id}</span>
                        ) : (
                          <div className="h-5 w-72 rounded bg-gray-100 animate-pulse"></div>
                        )}
                      </div>

                      {/* ===== ที่อยู่ตามบัตร - Card ===== */}
                      <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                          <FiMapPin className="w-5 h-5 text-[#4385EF]" />
                          <span className="text-[#4385EF] font-semibold">ที่อยู่ตามบัตร</span>
                        </div>
                        {userDataProfile ? (
                          <span className="text-gray-800 text-sm md:text-base">
                            {userDataProfile.ctm_address} แขวง/ตำบล{userDataProfile.ctm_district} เขต/อำเภอ
                            {userDataProfile.ctm_amphoe} จังหวัด{userDataProfile.ctm_province} {userDataProfile.ctm_zipcode}
                          </span>
                        ) : (
                          <div className="h-5 w-80 rounded bg-gray-100 animate-pulse"></div>
                        )}
                      </div>

                      {/* ===== ที่อยู่จัดส่งอื่น - Card ===== */}
                      {otherShippingAddresses.length > 0 && otherShippingAddresses.map((addr) => (
                        <div key={addr.id} className="mt-4">
                          {/* ===== โหมดแก้ไข ===== */}
                          {editingShippingId === addr.id ? (
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <FiPackage className="w-5 h-5 text-[#4385EF]" />
                                  <span className="text-[#4385EF] font-semibold">แก้ไขที่อยู่จัดส่งอื่น</span>
                                </div>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1 text-gray-500 hover:text-gray-700"
                                >
                                  <FiX className="w-5 h-5" />
                                </button>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">ชื่อผู้รับ *</label>
                                    <input
                                      type="text"
                                      value={editForm.receiver_name}
                                      onChange={(e) => handleEditFormChange("receiver_name", e.target.value)}
                                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-blue-400 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">เบอร์โทรผู้รับ *</label>
                                    <input
                                      type="tel"
                                      value={editForm.receiver_tel}
                                      onChange={(e) => handleEditFormChange("receiver_tel", e.target.value.replace(/\D/g, ""))}
                                      maxLength={10}
                                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-blue-400 text-sm"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">ที่อยู่ *</label>
                                  <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={(e) => handleEditFormChange("address", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-blue-400 text-sm"
                                  />
                                </div>

                                {/* Address Dropdowns */}
                                <AddressDropdown
                                  label="จังหวัด"
                                  value={editForm.province}
                                  placeholder="เลือกจังหวัด"
                                  onSelect={handleEditAddressSelect}
                                  searchField="province"
                                />
                                <AddressDropdown
                                  label="เขต/อำเภอ"
                                  value={editForm.amphoe}
                                  placeholder="เลือกเขต/อำเภอ"
                                  onSelect={handleEditAddressSelect}
                                  searchField="amphoe"
                                />
                                <AddressDropdown
                                  label="แขวง/ตำบล"
                                  value={editForm.district}
                                  placeholder="เลือกแขวง/ตำบล"
                                  onSelect={handleEditAddressSelect}
                                  searchField="district"
                                />
                                <AddressDropdown
                                  label="รหัสไปรษณีย์"
                                  value={editForm.zipcode}
                                  placeholder="เลือกรหัสไปรษณีย์"
                                  onSelect={handleEditAddressSelect}
                                  searchField="zipcode"
                                />

                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">หมายเหตุ</label>
                                  <input
                                    type="text"
                                    value={editForm.remark}
                                    onChange={(e) => handleEditFormChange("remark", e.target.value)}
                                    placeholder="เช่น ฝากไว้กับ รปภ."
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-blue-400 text-sm"
                                  />
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                                  >
                                    ยกเลิก
                                  </button>
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={savingShipping}
                                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 text-sm flex items-center justify-center gap-1"
                                  >
                                    <FiCheck className="w-4 h-4" />
                                    {savingShipping ? "กำลังบันทึก..." : "บันทึก"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* ===== โหมดแสดงผล - Card แยกชัด ===== */
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-200">
                                <div className="flex items-center gap-2">
                                  <FiPackage className="w-5 h-5 text-[#4385EF]" />
                                  <span className="text-[#4385EF] font-semibold">ที่อยู่จัดส่งอื่น</span>
                                </div>
                                <button
                                  onClick={() => handleStartEdit(addr)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Content */}
                              <div className="space-y-2 text-sm md:text-base">
                                {/* ชื่อผู้รับ */}
                                <div className="flex flex-row gap-2 sm:gap-4">
                                  <span className="text-[#4385EF] w-[80px] sm:w-[100px] shrink-0">ชื่อผู้รับ</span>
                                  <span className="text-gray-800">{addr.receiver_name}</span>
                                </div>

                                {/* เบอร์โทร */}
                                <div className="flex flex-row gap-2 sm:gap-4">
                                  <span className="text-[#4385EF] w-[80px] sm:w-[100px] shrink-0">เบอร์โทร</span>
                                  <span className="text-gray-800">{addr.receiver_tel}</span>
                                </div>

                                {/* ที่อยู่ */}
                                <div className="flex flex-row gap-2 sm:gap-4">
                                  <span className="text-[#4385EF] w-[80px] sm:w-[100px] shrink-0">ที่อยู่</span>
                                  <span className="text-gray-800">
                                    {addr.address} แขวง/ตำบล{addr.district} เขต/อำเภอ{addr.amphoe} จังหวัด{addr.province} {addr.zipcode}
                                  </span>
                                </div>

                                {/* หมายเหตุ */}
                                {addr.remark && (
                                  <div className="flex flex-row gap-2 sm:gap-4">
                                    <span className="text-[#4385EF] w-[80px] sm:w-[100px] shrink-0">หมายเหตุ</span>
                                    <span className="text-gray-800">{addr.remark}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ✅ CitizenIdSync Modal */}
            <CitizenIdSync
              isOpen={showCitizenSync}
              onClose={() => setShowCitizenSync(false)}
              onSyncSuccess={handleSyncSuccess}
            />

            {/* Modal ยกเลิกการเชื่อมต่อ */}
            <Modal
              isOpen={isUnsyncDataModal}
              onClose={() => setIsUnsyncDataModal(false)}
              className="max-w-[700px] m-4 z-99"
            >
              <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
                <div className="px-2 pr-6">
                  <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
                    ยกเลิกการเชื่อมต่อข้อมูลกับคลินิก
                  </h4>
                </div>
                <form className="flex flex-col">
                  <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3 space-y-8">
                    <div>
                      <h5 className="text-base font-medium text-gray-800 dark:text-white/90">
                        คุณต้องการยกเลิกการเชื่อมต่อข้อมูลกับคลินิกใช่หรือไม่
                      </h5>
                    </div>
                  </div>
                </form>
                <div className="flex items-center justify-center w-full gap-3 px-2">
                  <Button
                    onClick={handleUnsyncUser}
                    disabled={loading}
                    className="flex justify-center"
                    size="sm"
                  >
                    {loading ? "กำลังดำเนินการ..." : "ใช่, ฉันต้องการยกเลิกการเชื่อมต่อ"}
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        )}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          style={{ zIndex: 99999999999999999 }}
        />
      </>
    );
  };

  return profile(userDataProfile);
}