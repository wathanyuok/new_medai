"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaRegAddressCard } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { PiDnaLight } from "react-icons/pi";
import { useSidebar } from "../context/SidebarContext";
import { TfiWorld } from "react-icons/tfi";
import { CgFileDocument } from "react-icons/cg";
import { MdOutlineLogout, MdOutlineMedicalServices, MdOutlineVideoCall } from "react-icons/md";
import classNames from "classnames";
import {
  ChevronDownIcon,
} from "../icons/index";
import { Customer } from "@/types/customer";
import { useProfile } from "@/hooks/useProfile";
import { checkAccessToken } from "@/utils/checkAuthen";

// ==================== API Configuration ====================
const BASE_URL = process.env.NEXT_PUBLIC_APPOINT_API_URL || "https://shop.api-apsx.co";

const API_KEYS = {
  public_key: process.env.NEXT_PUBLIC_API_PUBLIC_KEY || "",
  private_key: process.env.NEXT_PUBLIC_API_PRIVATE_KEY || "",
};

const AUTH_TOKEN = process.env.NEXT_PUBLIC_API_AUTH_TOKEN || "";

interface AuthResponse {
  status: boolean;
  data: { access_token: string };
  message: string;
}

// Get OAuth access token
const getAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/auth/oauth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(API_KEYS),
    });
    const data: AuthResponse = await response.json();
    if (data.status && data.data?.access_token) {
      return data.data.access_token;
    }
    return null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

// Check if user has HN by citizen ID
// Check if user exists by citizen ID (need customerId for appointment)
const checkUserHN = async (
  citizenId: string
): Promise<{ hasHN: boolean; hn: string | null; customerId: number | null }> => {
  try {
    const token = await getAccessToken();
    if (!token) return { hasHN: false, hn: null, customerId: null };

    const response = await fetch(`${BASE_URL}/customer/citizen/${citizenId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    const hn = data?.data?.ctm_id ?? null;
    const customerId = data?.data?.id ?? null;

    // ✅ ถือว่า "พร้อมไป appointment" เมื่อมี customerId (และปกติก็จะมี hn มาด้วย)
    if (data?.status && customerId) {
      return { hasHN: true, hn, customerId };
    }

    return { hasHN: false, hn: null, customerId: null };
  } catch (error) {
    console.error("Error checking HN:", error);
    return { hasHN: false, hn: null, customerId: null };
  }
};


// ==================== Customer Data (Mock) ====================
const customerData: Customer = {
  "id": 45334,
  "shop_id": 608,
  "customer_group_id": 1295,
  "user_id": 0,
  "ctm_id": "HN20240002",
  "ctm_citizen_id": "1300201263110",
  "ctm_passport_id": "1509900769001",
  "ctm_prefix": "นางสาว",
  "ctm_fname": "สมศักดิ์",
  "ctm_lname": "รักดี",
  "ctm_nname": "เอชาย",
  "ctm_fname_en": "Somsak",
  "ctm_lname_en": "Rakdee",
  "ctm_gender": "ชาย",
  "ctm_nation": "ไม่ระบุ",
  "ctm_religion": "ไม่ระบุ",
  "ctm_edu_level": "ไม่ระบุ",
  "ctm_marital_status": "ไม่ระบุ",
  "ctm_blood": "ไม่ระบุ",
  "ctm_email": "somsak.ru@gmail.com",
  "ctm_tel": "0987878654",
  "ctm_tel_2": "",
  "ctm_birthdate": "1996-01-17T00:00:00+07:00",
  "ctm_address": "89 หมู่4 ถนน นิวาสน์ดำเนิน",
  "ctm_district": "พระโขนงเหนือ",
  "ctm_amphoe": "วัฒนา",
  "ctm_province": "กรุงเทพมหานคร",
  "ctm_zipcode": "10260",
  "ctm_comment": "77777",
  "ctm_weight": 80,
  "ctm_height": 189,
  "ctm_waistline": 70,
  "ctm_chest": 90,
  "ctm_treatment_type": 2,
  "right_treatment_id": 3,
  "ctm_allergic": "แพ้ยา แพ้ยา แพ้ยา\nแพ้ยา แพ้ยา\nแพ้ยา ",
  "ctm_mental_health": "จิตปกติ",
  "ctm_disease": "หอบหืด",
  "ctm_health_comment": "",
  "ctm_image": "",
  "ctm_image_size": 0,
  "ctm_point": 269249,
  "ctm_coin": 198500,
  "line_token": "",
  "line_send": 0,
  "line_send_date": "0001-01-01T00:00:00Z",
  "facebook_id": "",
  "company_name": "APSTH",
  "company_tax": "12214124124214",
  "company_tel": "8888888",
  "company_email": "apsthgraphicg@gmail.com",
  "company_address": "888/8",
  "company_district": "บ้านเป็ด",
  "company_amphoe": "เมืองขอนแก่น",
  "company_province": "ขอนแก่น",
  "company_zipcode": "40000",
  "ctm_subscribe_opd": 0,
  "ctm_subscribe_lab": 0,
  "ctm_subscribe_cert": 0,
  "ctm_subscribe_receipt": 0,
  "ctm_subscribe_appoint": 0,
  "ctm_is_active": 1,
  "ctm_is_del": 0,
  "ctm_create": "2024-06-19T14:43:05+07:00",
  "ctm_update": "2025-05-05T18:38:05+07:00",
  "ctm_subscribe_pdpa_token": "",
  "ctm_subscribe_pdpa_image": "",
  "cg_name": "VIP",
  "cg_save_type": 2,
  "cg_save": 0,
  "rt_code": "SSS",
  "rt_name": "สิทธิประกันสังคม",
  "rt_name_en": "-"
}

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  requiresAuth?: boolean;      // ต้อง login ก่อน
  requiresHN?: boolean;        // ต้องมี HN ก่อน
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

type MainItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
{
  icon: <MdOutlineMedicalServices size={20} />,
  name: "หาหมอออนไลน์",
  path: "/ai/telemedicine",
  requiresAuth: true,
  requiresHN: true,
},

  {
    icon: <FaRegAddressCard size={20} />,
    name: "ข้อมูลผู้ใช้บริการ",
    path: "/ai",
  },
  {
    icon: <CgFileDocument size={20} />,
    name: "เอกสารผลตรวจ",
    path: "/ai/health-reports",
  },
  {
    icon: <FiClock size={20} />,
    name: "นัดหมายของคุณ",
    path: "/ai/appointment",
  },
  {
    icon: <TfiWorld size={20} />,
    name: "เว็บไซต์หลัก",
    path: "/",
  },
];

const mainaichat: MainItem[] = [
  {
    icon: <PiDnaLight size={25} className="" />,
    name: "EXA AI ผู้ช่วยเรื่องสุขภาพ",
    path: "/ai/aichat",
  }
];

const AppSidebar: React.FC = () => {
  const router = useRouter();
  const { userDataProfile, setUserDataProfile } = useProfile();
  const [isLogIn, setIsLogIn] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [userHN, setUserHN] = useState<string | null>(null);
  const [userCustomerId, setUserCustomerId] = useState<number | null>(null);
  const [isCheckingHN, setIsCheckingHN] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/ai/aichat";
  }

  const fetchProfile = async (token: string) => {
    setUserDataProfile(customerData)
  }

  const intitialsName = (fname: string, lname: string) => {
    return `${fname?.[0] || ''}${lname?.[0] || ''}`.toUpperCase()
  }


// ==================== Handle Telemedicine Click ====================
const handleTelemedicineClick = async (e: React.MouseEvent, nav: NavItem) => {
  e.preventDefault();

  // 1. ถ้าต้อง login แต่ยังไม่ login → ไปหน้า login
  if (nav.requiresAuth && !isLogIn) {
    router.push("/ai/register");
    return;
  }

  // 2. ถ้าต้องมี HN
  if (nav.requiresHN) {
    setIsCheckingHN(true);

    try {
      const storedCustomerId = localStorage.getItem("userCustomerId");
      const storedCitizenId = localStorage.getItem("citizenId");

      // ✅ ถ้ามี customerId แล้ว → ไปหน้า telemedicine (ไม่ต้องยิง API)
      if (storedCustomerId) {
        setIsCheckingHN(false);
        router.push(nav.path || "/ai/telemedicine"); // ✅ เปลี่ยนตรงนี้
        return;
      }

      // ✅ ถ้าไม่มี citizenId → ให้ไปหน้า telemedicine (หรือจะไป register ก็ได้)
      if (!storedCitizenId) {
        setIsCheckingHN(false);
        router.push(nav.path || "/ai/telemedicine"); // ✅ เปลี่ยนตรงนี้
        return;
      }

      // ✅ มี citizenId → ยิงเช็ค 1 ครั้ง
      const result = await checkUserHN(storedCitizenId);

      if (result.hasHN && result.customerId) {
        localStorage.setItem("userCustomerId", String(result.customerId));
        if (result.hn) localStorage.setItem("userHN", result.hn);

        setUserCustomerId(result.customerId);
        setUserHN(result.hn);

        setIsCheckingHN(false);
        router.push(nav.path || "/ai/telemedicine"); // ✅ เปลี่ยนตรงนี้
        return;
      }

      // ไม่พบใน APSX → ไปหน้า telemedicine (แทน register)
      setIsCheckingHN(false);
      router.push(nav.path || "/ai/telemedicine"); // ✅ เปลี่ยนตรงนี้
      return;
    } catch (err) {
      console.error(err);
      setIsCheckingHN(false);
      router.push(nav.path || "/ai/telemedicine"); // ✅ เปลี่ยนตรงนี้
      return;
    }
  }

  // ไม่มีเงื่อนไขพิเศษ → ไปตาม path ปกติ
  if (nav.path) router.push(nav.path);
};


  // ==================== Check HN on Mount ====================
  useEffect(() => {
    const checkHNOnMount = async () => {
      if (!checkAccessToken()) {
        setIsLogIn(false);
        return;
      }

      setIsLogIn(true);
      const token = localStorage.getItem('token') || '';
      setUsername(localStorage.getItem("username") || "");
      setEmail(localStorage.getItem("email") || "");
      fetchProfile(token);

      // เช็ค HN จาก localStorage
      const storedHN = localStorage.getItem("userHN");
      const storedCustomerId = localStorage.getItem("userCustomerId");
      
      if (storedHN) {
        setUserHN(storedHN);
        if (storedCustomerId) {
          setUserCustomerId(parseInt(storedCustomerId));
        }
      }
    };

    checkHNOnMount();
  }, []);

  const { isExpanded, isMobileOpen, isHovered, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      <ul className="space-y-3 text-sm text-gray-800 mt-5">
        {mainaichat.map((nav, index) => (
          <li key={index}>
            <Link
              href={nav.path || ""}
              className={`menu-item group text-white ${isActive(nav.path ?? "") ? "bg-[linear-gradient(90deg,_rgba(0,162,255,1)_0%,_rgba(255,48,221,1)_100%)]  py-4 rounded-4xl " : " bg-[linear-gradient(90deg,_rgba(0,162,255,1)_0%,_rgba(255,48,221,1)_100%)]   py-4 rounded-4xl"}`}
            >
              <span
                className={`${isActive(nav.path || "")
                  ? "menu-item-icon-activ text-white rounded-4xl"
                  : "menu-item-icon-inactiv text-white"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span onClick={() => {
                  if (isMobileOpen == true) {
                    toggleMobileSidebar()
                  }
                }} className="menu-item-text ">{nav.name}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={` ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span onClick={() => {
                  toggleMobileSidebar()
                }} className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              // ✅ ถ้าเป็นเมนู "หาหมออนไลน์" ให้ใช้ custom handler
              nav.requiresAuth || nav.requiresHN ? (
                <button
                  onClick={(e) => handleTelemedicineClick(e, nav)}
                  disabled={isCheckingHN}
                  style={{fontSize: "15px"}}
                  className={`menu-item group w-full ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  } ${isCheckingHN ? "opacity-50 cursor-wait" : ""}`}
                >
                  <span
                    className={`${isActive(nav.path || "")
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      }`}
                  >
                    {isCheckingHN && nav.requiresHN ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text`}>
                      {isCheckingHN ? "กำลังตรวจสอบ..." : nav.name}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  href={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}
                >
                  <span
                    className={`${isActive(nav.path || "")
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span onClick={() => {
                      if (isMobileOpen == true) {
                        toggleMobileSidebar()
                      }
                    }} className={`menu-item-text`}>{nav.name}</span>
                  )}
                </Link>
              )
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}

      <ul className="space-y-3 text-sm text-gray-800 mt-5"></ul>

      {isLogIn == false && <div className="sm:row flex justify-start gap-2 pl-2">
        {(isExpanded || isHovered || isMobileOpen) && (<>
          <button
            onClick={() => {
              window.location.href = "register";
            }}
            className=" p-2 rounded-3xl w-6/12 transition-all bg-white duration-300 ease-in-out hover:bg-[linear-gradient(90.48deg,_#F73ABB_0.55%,_#DDA3FF_179.33%)]  hover:text-white hover:shadow-md"
          >
            สมัครสมาชิก
          </button>
          <button
            onClick={() => {
              window.location.href = "/ai/login"
            }}
            className=" p-2 rounded-3xl w-6/12 text-[#4385EF] border border-[#4385EF] transition-all duration-300 ease-in-out hover:bg-[#4385EF] hover:text-white hover:shadow-md"
          >
            เข้าสู่ระบบ
          </button></>)}
      </div>
      }
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items: NavItem[] = menuType === "main" ? navItems : [];
      items.forEach((nav: NavItem, index: number) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem: { name: string; path: string; pro?: boolean; new?: boolean }) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const Sidebar = (userDataProfile: Customer | null) => {
    return (
      <aside
        className={`fixed flex flex-col lg:mt-0 top-0 px-5 left-0 bg-[#F2F8FD] dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-[999999999] border-r border-gray-200 
        ${isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
              ? "w-[290px]"
              : "w-[90px]"
          }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      >
        <div
          className={`py-4 lg:py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
            }`}
        >
          <Link href="/ai">
            {isExpanded || isHovered || isMobileOpen ? (
              <>
                {!isMobileOpen && (
                  <>
                    <Image
                      className="dark:hidden block"
                      src="/images/logo/logo.svg"
                      alt="Logo"
                      width={150}
                      height={40}
                    />
                    <Image
                      className="hidden dark:block"
                      src="/images/logo/logo.svg"
                      alt="Logo"
                      width={150}
                      height={40}
                    />
                  </>
                )}
              </>
            ) : (
              <Image
                src="/images/logo/logo.svg"
                alt="Logo"
                width={32}
                height={32}
              />
            )}
          </Link>
        </div>
        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
          <nav className="mb-6">
            {isLogIn ? <div className="flex flex-col gap-4">
              <div className="w-full max-w-lg mx-auto rounded-lg">
                <div className="flex items-center space-x-4 w-full bg-white rounded-lg shadow-sm p-2">
                  <div className="flex-shrink-0">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-gray-700 font-bold ring-2 ring-white"
                      style={{
                        border: '1px solid transparent',
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, rgba(0,162,255,1) 0%, rgba(255,48,221,1) 100%)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'content-box, border-box'
                      }}
                    >
                      {intitialsName(username || '', '') || '–'}
                    </div>
                  </div>
                  <div className="text-start">
                    <h3 className="text-base font-semibold text-gray-900 leading-snug">
                      {username}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {email}
                    </p>
                    {/* แสดง HN ถ้ามี */}
                    {userHN && (
                      <p className="text-xs text-blue-600 font-medium">
                        {userHN}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <hr />
            </div> : <></>}

            {renderMenuItems(navItems, "main")}
            
            {isLogIn && (
              <span onClick={() => {
                setIsLogIn(false)
              }} className={classNames(
                isExpanded || isMobileOpen ? 'cursor-pointer' : 'hidden'
              )}>
                <div onClick={handleLogout} className="flex items-center px-2 py-2 rounded-md transition-all duration-300 ease-in-out hover:bg-red-100">
                  <div className="flex items-center space-x-3">
                    <span className="text-red-400 text-theme-sm flex row gap-1 ml-1">
                      <MdOutlineLogout size={20} />
                      <span>ออกจากระบบ</span>
                    </span>
                  </div>
                </div>
              </span>
            )}
          </nav>
        </div>
      </aside>
    );
  }
  return Sidebar(userDataProfile);
};

export default AppSidebar;