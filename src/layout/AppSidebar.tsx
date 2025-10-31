"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaRegAddressCard } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { PiDnaLight } from "react-icons/pi";
import { useSidebar } from "../context/SidebarContext";
import { TfiWorld } from "react-icons/tfi";
import { CgFileDocument } from "react-icons/cg";
import { MdOutlineLogout } from "react-icons/md";
// import Avatar from "@/components/ui/avatar/Avatar";
import classNames from "classnames";
import {
  ChevronDownIcon,
} from "../icons/index";
import { Customer } from "@/types/customer";
import { useProfile } from "@/hooks/useProfile";
import { checkAccessToken } from "@/utils/checkAuthen";
// import NoAccessModal from "@/components/auth/NoAccessModal";
// import { profile } from "console";

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
    icon: <FaRegAddressCard size={20} />,
    name: "ข้อมูลผู้ใช้บริการคลินิก",
    path: "/ai",
  },
  {
    icon: <CgFileDocument size={20} />,
    name: "เอกสารผลตรวจจากคลินิก",
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
  // {
  //   icon: <GiPolarStar size={20} />,
  //   name: "Chat Ai",
  //   path: "/aichat",
  // },
  // {
  //   icon: <FaRegClock size={20} />,
  //   name: "ประวัติการใช้บริการ",
  //   path: "/service-history",
  // },
  // {
  //   icon: <CalenderIcon size={20} />,
  //   name: "Calendar",
  //   path: "/calendar",
  // },


];


// const menuItems = [
//   {
//     date: "8-01-2567",
//     from: "EXAMED"
//   },
//   {
//     date: "8-07-2024",
//     from: ""
//   }
// ]
const mainaichat: MainItem[] = [
  {
    icon: <PiDnaLight size={25} className="" />,
    name: "EXA AI ผู้ช่วยเรื่องสุขภาพ",
    path: "/ai/aichat",
  }
];
// const othersItems: NavItem[] = [
//   // {
//   //   icon: <PieChartIcon />,
//   //   name: "Charts",
//   //   subItems: [
//   //     { name: "Line Chart", path: "/line-chart", pro: false },
//   //     { name: "Bar Chart", path: "/bar-chart", pro: false },
//   //   ],
//   // },
//   // {
//   //   icon: <BoxCubeIcon />,
//   //   name: "UI Elements",
//   //   subItems: [
//   //     { name: "Alerts", path: "/alerts", pro: false },
//   //     { name: "Avatar", path: "/avatars", pro: false },
//   //     { name: "Badge", path: "/badge", pro: false },
//   //     { name: "Buttons", path: "/buttons", pro: false },
//   //     { name: "Images", path: "/images", pro: false },
//   //     { name: "Videos", path: "/videos", pro: false },
//   //   ],
//   // },
//   // {
//   //   icon: <PlugInIcon />,
//   //   name: "Authentication",
//   //   subItems: [
//   //     { name: "Sign In", path: "/signin", pro: false },
//   //     { name: "Sign Up", path: "/signup", pro: false },
//   //   ],
//   // },
// ];

const AppSidebar: React.FC = () => {
  // const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { userDataProfile, setUserDataProfile } = useProfile();
  const [isLogIn, setIsLogIn] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  // const formatThaiDate = (dateStr: string) => {
  //   const date = new Date(dateStr);
  //   return date.toLocaleString("th-TH", {
  //     day: "numeric",
  //     month: "long",
  //     year: "numeric",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   }) + " น.";
  // };\
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/ai/aichat";
  }

  const fetchProfile = async (token: string) => {

    // const data = await getCustomerDetails(token)
    setUserDataProfile(customerData)

  }
  const intitialsName = (fname: string, lname: string) => {
    return `${fname?.[0] || ''}${lname?.[0] || ''}`.toUpperCase()
  }
  useEffect(() => {

    if (!checkAccessToken()) {
      setIsLogIn(false)
    } else {
      setIsLogIn(true);
      const token = localStorage.getItem('token') || '';
      setUsername(localStorage.getItem("username") || "");
      setEmail(localStorage.getItem("email") || "");
      fetchProfile(token)
      // const data = getCustomerDetails(token)
      // setUserDataProfile(data)

      // const storedData = localStorage.getItem("userDetails");
      // if (storedData) {
      //   setProfileUser1(storedData);
      //   // console.log(isLogin)
      // }
    }
  }, []);
  // useEffect(() => {
  //   fetchData();
  // }, []);
  // useEffect(() => {
  //   localStorage.getItem("profileUser")
  //   const fetchProfileData = async () => {
  //     const token = localStorage.getItem("token");
  //     if (!token) {
  //       console.warn("ไม่พบ token");
  //       return;
  //     }
  //     const profileUser = localStorage.getItem("profileUser");
  //     if (profileUser) {
  //       setUserDataProfile(JSON.parse(profileUser) as Customer);
  //     } else {
  //       try {
  //         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer`, {
  //           method: 'GET',
  //           headers: {
  //             'Content-Type': 'application/json',
  //             Authorization: `Bearer ${token}`,
  //           },
  //         });

  //         if (!response.ok) {
  //           // ถ้า response status ไม่ใช่ 2xx
  //           const errorData = await response.json();
  //           throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
  //         }

  //         const data = await response.json();

  //         setUserDataProfile(data.data.customer);
  //         localStorage.setItem("profileUser", JSON.stringify(data.data.customer));
  //         document.cookie = `profileUser=${encodeURIComponent(JSON.stringify(data.data.customer))}; path=/;`;
  //         console.log("ข้อมูลผู้ใช้:", data);
  //       } catch (error) {
  //         console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", error);
  //       }
  //     }
  //   };

  //   fetchProfileData();
  // }, []);

  // const toggleMenu = (index: number) => {
  //   setOpenIndex((prev) => (prev === index ? null : index))
  // }
  const { isExpanded, isMobileOpen, isHovered, toggleMobileSidebar } = useSidebar();
  // const { isExpanded, isMobileOpen, isHovered, setIHovered } = useSidebar();
  const pathname = usePathname();


  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (

    <ul className="flex flex-col gap-4">
      <ul className="space-y-3 text-sm text-gray-800 mt-5">
        {/* หัวข้อ */}
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
      {/* {(isExpanded || isHovered || isMobileOpen) && (
        <>
          {!upcoming ? (
            <li className="min-w-[180px] rounded-xl p-4 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-100 animate-pulse shadow-sm text-sm space-y-2">
              <div className="h-4 w-24 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-100 rounded-full" />
              <div className="h-5 w-32 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-100 rounded" />
              <div className="h-4 w-40 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-100 rounded" />
            </li>
          ) : (
            <li className="min-w-[180px] rounded-xl p-4 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-100 shadow-sm text-sm">
              <span className="inline-block bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-xs font-medium px-3 py-0.5 rounded-full mb-2">
                กำลังจะมาถึง
              </span>
              <p className="text-base font-bold text-gray-800">
                {formatThaiDate(upcoming.ap_datetime)}
              </p>
              <p className="text-sm text-gray-700">
                {upcoming.ap_topic}
              </p>
            </li>
          )}
        </>
      )} */}


      <ul className="space-y-3 text-sm text-gray-800 mt-5">
        {/* หัวข้อ */}
        {/* {mainaichat.map((nav, index) => (
          <li key={index}>
            <Link
              href={nav.path || ""}
              className={`menu-item group ${isActive(nav.path ?? "") ? "menu-item-active" : " bg-[linear-gradient(90deg,_rgba(246,57,189,0.3)_0%,_rgba(239,221,253,0.3)_100%)] py-4 rounded-4xl"}`}
            >
              <span
                className={`${isActive(nav.path || "")
                  ? "menu-item-icon-activ rounded-4xl"
                  : "menu-item-icon-inactiv text-gray-700"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text text-gray-700 ">{nav.name}</span>
              )}
            </Link>
          </li>
        ))} */}
        {/* {mainaichat.map((nav, index) => (
          {nav.subItems ? (
          <li className="flex items-center text-blue-600 font-bold" key={index}>
            <Link href={nav.path || ""} className="flex items-center">
              {nav.icon}
              <span className="font-bold text-md ml-3">{nav.name}</span>
            </Link>
          </li>
          {(isExpanded || isHovered || isMobileOpen) && (
            <ChevronDownIcon
              className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === menuType &&
                openSubmenu?.index === index
                ? "rotate-180 text-brand-500"
                : ""
                }`}
            />
          )}
        )
        ))} */}
        {/* <li className="flex items-center text-blue-600 font-bold">
    <Link href="/aichat" className="flex items-center">
      <BsFillPlusCircleFill className="mr-3" size={30} />
      <span className="font-bold text-md">วิเคราะห์ผลตรวจสุขภาพ</span>
    </Link>
  </li> */}


      </ul>
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

  // const isActive = (path: string) => path === pathname;
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items: NavItem[] = menuType === "main" ? navItems : []; // Adjust as needed for "others"
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

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
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
              <div className="w-full max-w-lg mx-auto   rounded-lg">
                {/* <button
                  onClick={() => setOpenProfile(o => !o)}
                  className={classNames(
                    'w-full flex items-center justify-between px-4 py-2 rounded-md',
                    // faster color fade
                    'transition-colors duration-75 ease-linear',
                    openProfile ? 'bg-purple-100' : 'bg-none hover:bg-purple-100'
                  )}
                > */}
                <div className="flex items-center space-x-4 w-full bg-white rounded-lg shadow-sm p-2">
                  {/* Avatar */}
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

                  {/* Name & Email */}
                  <div className="text-start">
                    <h3 className="text-base font-semibold text-gray-900 leading-snug">
                      {username}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {email}
                    </p>
                  </div>
                </div>

                {/* chevron */}
                {/* <svg
                    className={classNames(
                      // faster, snappier rotation
                      'w-5 h-5 text-gray-600 transition-transform duration-75 ease-linear',
                      openProfile && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg> */}
                {/* </button> */}

                {/* <div
                  onClick={() => {
                    setOpenProfile(false)
                    setIsLogIn(false)
                  }}
                  className={classNames(
                    'px-5 overflow-hidden rounded-b-lg bg-slate-50 transition-all duration-300 ease-in-out cursor-pointer hover:bg-slate-100',
                    openProfile ? 'max-h-60 py-4 overflow-auto' : 'max-h-0 py-0'
                  )}
                >
                  <div className="flex row gap-2 text-red-400  ">
                    <MdOutlineLogout size={20} />
                    <span>
                      ออกจากระบบ
                    </span>
                  </div>
                </div> */}
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
                <div onClick={handleLogout} className="flex items-center  px-2 py-2 rounded-md transition-all duration-300 ease-in-out hover:bg-red-100">
                  <div className="flex items-center  space-x-3">
                    {/* <MdOutlinePerson size={20} /> */}
                    <span className="text-red-400 text-theme-sm flex row  gap-1 ml-1"><MdOutlineLogout size={20} /><span>ออกจากระบบ</span></span>
                  </div>
                </div>
              </span>
            )}

          </nav>
          {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
        </div>
        {/* <div className="mt-auto text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
  © {new Date().getFullYear()} AthichaBow. All rights reserved.
</div> */}

      </aside>
    );
  }
  return Sidebar(userDataProfile);
};

export default AppSidebar;
