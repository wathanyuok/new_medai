'use client';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useProfile } from "@/hooks/useProfile";
import { Customer } from "@/types/customer";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { checkAccessToken, getCustomerDetails } from "@/utils/checkAuthen";
import NoAccessModal from "@/components/auth/NoAccessModal";
import NoSyncedComponent from "../auth/NoSyncedComponent";
import { LiaIdCardSolid } from "react-icons/lia";
import Checkbox from "../form/input/Checkbox";
import Link from "next/link";
import liff from "@line/liff";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";



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

export default function UserInfoComponent() {
  const [isLogin, setIsLogin] = useState(true);
  const { userDataProfile, setUserDataProfile } = useProfile();
  // const [profileUser1, setProfileUser1] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isSynced, setIsSynced] = useState(true);
  const { isOpen, closeModal, openModal } = useModal(false);
  const [isSyncLine, setOpenSyncLine] = useState(false);
  const [isAccept, setIsAccept] = useState(false);
  const [isDataSync, setIsDataSync] = useState(false);
  const [isUnsyncDataModal, setIsUnsyncDataModal] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cid, setCid] = useState('');
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [blindPhone, setBindPhone] = useState('');
  const [error, setError] = useState('');
  // const [openSynceModal, setOpenSynceModal ] = useState(false);

  const router = useRouter();
  const fetchData = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("ไม่พบ token");
      return;
    }
    const user_data = await getCustomerDetails(token);
    if (user_data.status == true) {
      setUserDataProfile(user_data.data.customer);
      if (user_data.data.customer.id == 0) {
        return setIsSynced(false);
      }
    } else if (user_data.status == false) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginLine = async () => {

    const liffId = `${process.env.NEXT_PUBLIC_LIFF_KEY || '2006526342-OEYmV1wW'}`;
    liff
      .init({ liffId })
      .then(() => {
        console.log("LIFF initialized successfully.");
        try {
          // const liffId = `${process.env.NEXT_PUBLIC_LIFF_KEY || '2006526342-OEYmV1wW'}`;
          if (!liffId) {
            throw new Error(
              "LIFF ID is not defined. Please set NEXT_PUBLIC_LIFF_KEY in your environment variables."
            );
          }
          localStorage.setItem("syncFromProfile", "true"); // Replace with actual server token
          liff.login();
          const token = "user_token_from_server"; // Replace with actual server token
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
      setIsDataSync(localStorage.getItem("is_online_data_sync") === "true");
      fetchData();
    }
  }, [fetchData]);

  const handleSynceUser = async () => {
    setLoading(true)
    const email = localStorage.getItem("email");
    const phone_number = localStorage.getItem("co_tel")
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/onlinesyncexa`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ co_citizen_id: cid, co_email: email, co_tel: phone_number }),
    });

    // Optional: handle response
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    const json = await res.json();
    if (json.status == true) {
      const formattedTel = json.co_tel!.replace(/(\d{3})\d{3}(\d{4})/, 'xxx-xxx-$2');
      setBindPhone(formattedTel)
      setPhone(json.co_tel)
      setPageIndex(1)
      setError("")
    } else if (json.status == false) {
      setError("เลขบัตรประชาชนนี้อาจถูกเชื่อมต่อแล้ว กรุณาลองเข้าสู่ระบบใหม่ หรือติดต่อเจ้าหน้าที่")
    }
    setLoading(false)
  }
  const handleSynceUserSubmit = async () => {
    setLoading(true)
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/otponlinesyncexa-lock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cid: cid, otp: otp, shop_id: parseInt(process.env.NEXT_PUBLIC_SHOP_ID || "950") }),
    });

    // Optional: handle response
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();
    console.log(data);
    if (data.status === true) {
      localStorage.setItem("token", data.data.access_token);
      localStorage.setItem("is_online_data_sync", "true")
      setError("")
      window.location.reload()
    } else if (data.status === false) {
      setError("รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว")
      toast.warning('รหัส OTP ไม่ถูกต้อง หรือ หรือไม่พบหมายเลขบัตรนี้ในระบบ\nโปรดติดต่อเจ้าหน้าที่')
      setLoading(false)
    }
  }
  const handleUnsyncUser = async () => {
    // setLoading(true);
    setPageIndex(0)
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/onlineunsync`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // body: JSON.stringify({ co_citizen_id: cid, otp: otp }),
    });

    // Optional: handle response
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    const data = await res.json();
    console.log(data);
    if (data.status === true) {
      localStorage.setItem("is_online_data_sync", "false")
      localStorage.setItem("token", data.data.access_token);
      window.location.reload()
    }

  }




  const profile = (userDataProfile: Customer | null) => {
    return (
      <>
        {!isLogin && (
          <NoAccessModal />
        )}
        {isLogin === true && <div>
          <PageBreadcrumb size="text-3xl" oi={false} text="text-[#F639BD]" pageTitle="ข้อมูลผู้ใช้บริการคลินิก" />
          <div className="lg:max-w-6xl rounded-xl  p-4 lg:p-6">
            <div className="space-y-6">
              <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-3">
                บัญชีผู้ใช้
              </h3>

              <div className="flex flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="space-y-2 text-sm md:text-base text-gray-700 w-full">
                  <div className="flex flex-row sm:items-center sm:gap-10.5">
                    <span className="text-[#4385EF] w-4/12 sm:w-2/12">ชื่อผู้ใช้</span>
                    <span className="font-medium text-gray-800 break-words">
                      {username || '-'}
                    </span>
                  </div>
                  <div className="flex flex-row sm:items-center sm:gap-10.5">
                    <span className="text-[#4385EF] w-4/12 sm:w-2/12">อีเมล</span>
                    <span className="text-gray-800 break-words">
                      {email}
                    </span>

                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-10.5">
                    <span className="text-[#4385EF] w-12/12 sm:w-2/12">ข้อมูลจากสถานพยาบาล</span>

                    <>

                      <div className="flex items-center w-12/12 pt-2 justify-start">
                        {isDataSync ? (<label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isDataSync}
                            onChange={() => {
                              if (isDataSync == true) {
                                setIsUnsyncDataModal(true)
                              } else if (isDataSync == false) {
                                openModal()
                              }
                            }} // toggle state
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                          <span className={`ml-3 text-sm font-medium ${isDataSync ? 'text-green-700' : 'text-gray-500'}`}>
                            {isDataSync ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ"}
                          </span>
                        </label>) : (
                          <span>กรุณาลงทะเบียนด้วยบัตรประชาชนเพื่อดูผลตรวจสุขภาพ</span>
                        )}


                      </div>
                    </>

                    {/* {isDataSync == false &&
                      <span className="text-gray-800 flex row items-center justify-end sm:justify-start w-6/12 break-words">
                        <span onClick={handleLoginLine} className="text-sm cursor-pointer bg-white p-2 rounded-md text-green-600">เชื่อมต่อ +</span>
                      </span>} */}

                  </div>
                  {isDataSync == false && (
                    <div className="flex flex-row sm:items-center sm:gap-10.5">
                      <div className="flex justify-center py-5">
                        <div
                          className="p-[2px] rounded-[45px]"
                          style={{
                            background: 'linear-gradient(90deg, rgba(0,162,255,1) 0%, rgba(255,48,221,1) 100%)'
                          }}
                        >
                          <button
                            onClick={() => {
                              openModal()
                              // console.log(isOpen)
                            }}
                            className="flex flex-row justify-center items-center p-4 gap-2 bg-white rounded-[45px] w-full"
                          >
                            {/* <LiaIdCardSolid size={25} className="text-[#4385EF]" /> */}
                            <span className="font-bold">คลิก</span> ยืนยันเลขบัตรประชาชนเพื่อดูผลตรวจสุขภาพ
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {isSyncLine != true && (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-10.5">
                        <span className="text-[#4385EF] w-4/12 sm:w-2/12 pt-2">เข้าสู่ระบบด้วยไลน์</span>
                        <span className="text-gray-800 w-8/12 break-words pt-2">
                          เชื่อมต่อกับไลน์เพื่อเข้าสู่ระบบให้ง่ายขึ้น
                        </span>

                      </div>

                      <div className="flex flex-row sm:items-center sm:gap-10.5">
                        <div onClick={handleLoginLine} className="w-12/12 sm:w-5/12 inline-flex items-center justify-center gap-3 py-1.5 px-7 text-[14px] .font-bold text-white transition bg-[#06C755] hover:bg-[#06C755]/90 active:bg-[#06C755]/70 rounded-lg cursor-pointer">
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

                  {/* {isSyncLine == false && <button onClick={handleLoginLine} className="w-full inline-flex items-center justify-center gap-3 py-1.5 px-7 text-[14px] .font-bold text-white transition bg-[#06C755] hover:bg-[#06C755]/90 active:bg-[#06C755]/70 rounded-lg">
                    <Image
                      width={32}
                      height={32}
                      src="/images/logo/line_64.png"
                      alt="LINE"
                    />
                    เข้าสู่ระบบด้วย LINE
                  </button>} */}

                </div>


                {/* <button
                onClick={openModal}
                className="mt-2 sm:mt-0 flex items-center gap-1 bg-gray-100 hover:bg-gray-100 text-sm text-gray-800 px-3 py-1.5 rounded-full transition"
              >
                <TbPencilMinus />
                <span className="font-medium">แก้ไข</span>
              </button> */}
              </div>

              {isSynced == true && <>
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
                        // src={userDataProfile.ctm_image || "/images/user/owner.jpg"}
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
                        <p className="font-medium text-sm ">HN {userDataProfile.ctm_id}</p>
                        <p className="text-sm text-gray-600">ติดต่อ {userDataProfile.ctm_tel}</p>
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
                      <span className="text-gray-800">{userDataProfile.ctm_fname} {userDataProfile.ctm_lname}</span>
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

                  {/* ที่อยู่ */}
                  <div className="flex flex-row sm:items-start gap-1 sm:gap-6">
                    <span className="text-[#4385EF] w-[100px] sm:w-[120px] shrink-0">ที่อยู่</span>
                    {userDataProfile ? (
                      <span className="text-gray-800">
                        {userDataProfile.ctm_address} แขวง/ตำบล{userDataProfile.ctm_district} เขต/อำเภอ{userDataProfile.ctm_amphoe} จังหวัด
                        {userDataProfile.ctm_province} {userDataProfile.ctm_zipcode}
                      </span>
                    ) : (
                      <div className="h-5 w-80 rounded bg-gray-100 animate-pulse"></div>
                    )}
                  </div>
                </div>
              </>}






            </div>

          </div>
          {/* {isSynced == false && <>
            <NoSyncedComponent />
            <div className="w-full">
              <span className="flex justify-center">
                หรือ
              </span>
            </div>
            <div className="flex justify-center py-5">
              <button onClick={() => {
                openModal()
                // console.log(isOpen)
              }} className="text-black flex flex-row justify-center items-center p-4 gap-2  bg-white rounded-[45px]">
                <LiaIdCardSolid size={25} className="text-red-300" />
                เชื่อมต่อข้อมูลกับคลินิกด้วยเลขบัตรประชาชน
              </button>
            </div>

          </>} */}



          <Modal isOpen={isOpen} onClose={() => {
            closeModal()
            setPageIndex(0)
            setError('')
            setIsAccept(false)
          }} className="max-w-[700px] m-4 z-99">
            <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
              <div className="px-2 pr-6">
                <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
                  เชื่อมต่อข้อมูลกับสถานพยาบาล
                </h4>
                {/* <p className="mb-6 text-sm text-gray-500 dark:text-[#4385EF]">
                  เชื่อมต่อข้อมูลกับคลินิกเพื่อดูข้อมูลและบริการ
                </p> */}
              </div>
              {pageIndex == 0 &&
                <>
                  <form className="flex flex-col">
                    <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3 space-y-8">
                      {/* 🧍‍♀️ ข้อมูลส่วนตัว */}
                      <div>
                        {/* <h5 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">
                      หมายเลขบัตรประชาชน
                    </h5> */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
                          <div>
                            <Label>หมายเลขบัตรประชาชน</Label>
                            <Input disabled={loading} type="text" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCid(e.target.value)} placeholder="x-xxxx-xxxx-xx-x" />
                          </div>
                          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
                        </div>
                      </div>


                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        className="mt-1 w-5 h-5"
                        checked={isAccept}
                        onChange={() => { setIsAccept(!isAccept) }}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        การสร้างบัญชีแสดงว่าคุณยอมรับ{' '}
                        <span className="text-brand-500 hover:text-brand-600 dark:text-white/90 font-medium"><Link target="_blank" href="">ข้อตกลงการใช้บริการ</Link></span> และ{' '}
                        <span className="text-brand-500 hover:text-brand-600 dark:text-white/90 font-medium"><Link target="_blank" href="" >นโยบายความเป็นส่วนตัว</Link></span> ของเรา
                      </p>
                    </div>

                    {/* ปุ่ม */}
                  </form>
                  <div className="flex items-center justify-center w-full gap-3 px-2 mt-6">
                    {/* <Button size="sm" variant="outline" onClick={closeModal}>
                    ยกเลิก
                  </Button> */}
                    <Button disabled={!isAccept || loading || cid == ""} onClick={handleSynceUser} className="flex justify-center" size="sm" >
                      {loading ? (
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
                      ) : (

                        <p>
                          เชื่อมต่อข้อมูล
                        </p>
                      )}
                    </Button>

                  </div>
                </>
              }
              {pageIndex == 1 &&
                <>
                  <form
                    className="flex flex-col"
                    onSubmit={(e) => {
                      e.preventDefault(); // Prevent form submission
                      handleSynceUserSubmit(); // Call your verification function
                    }}
                  >
                    <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3 space-y-8">
                      {/* 🧍‍♀️ ข้อมูลส่วนตัว */}
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
                        <p className="text-md flex text-center justify-center text-gray-500 dark:text-gray-400">
                          หมายเลขบัตรประชาชนที่ใช้เชื่อมต่อ
                        </p>
                        <p className="text-md flex justify-center text-pink-400 dark:text-gray-400">
                          {cid}
                        </p>
                        <p className="text-md flex text-center justify-center text-gray-500 dark:text-gray-400">
                          กรุณากรอกรหัสยืนยันที่เราส่งไปยังหมายเลขโทรศัพท์ของคุณ
                        </p>
                        <p className="text-md flex justify-center text-pink-400 dark:text-gray-400">
                          {blindPhone}
                        </p>
                        <div className="flex justify-center">
                          <input
                            disabled={loading}
                            placeholder='รหัสยืนยัน'
                            className={`text-center text-lg w-full sm:w-4/12 border border-gray-400 bg-white py-4 rounded-md `}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 6) {
                                setOtp(value);
                              }
                            }}
                            value={otp}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSynceUserSubmit(); // Now this will work properly
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                  <div className="flex items-center justify-center w-full gap-3 px-2">
                    <Button
                      onClick={() => { handleSynceUserSubmit() }}
                      className="flex justify-center"
                      size="sm"
                    // type="button" // Explicitly set type to button to prevent form submission
                    >
                      {loading ? (
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
                      ) : (
                        <p>ยืนยัน</p>
                      )}
                    </Button>
                  </div>
                </>
              }


            </div>
          </Modal>

          {/* ยกเลิกการเชื่อมต่อข้อมูลกับคลินิก */}
          <Modal isOpen={isUnsyncDataModal} onClose={() => {
            setIsUnsyncDataModal(false);
            setPageIndex(0)
            setError('')
          }} className="max-w-[700px] m-4 z-99">
            <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
              <div className="px-2 pr-6">
                <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
                  ยกเลิกการเชื่อมต่อข้อมูลกับคลินิก
                </h4>
              </div>
              {pageIndex == 0 &&
                <>
                  <form className="flex flex-col">
                    <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3 space-y-8">
                      {/* 🧍‍♀️ ข้อมูลส่วนตัว */}
                      <div>
                        <h5 className="text-base font-medium text-gray-800 dark:text-white/90">
                          คุณต้องการยกเลิกการเชื่อมต่อข้อมูลกับคลินิกใช่หรือไม่
                        </h5>
                      </div>
                    </div>
                  </form>
                  <div className="flex items-center justify-center w-full gap-3 px-2">
                    <Button onClick={() => { handleUnsyncUser() }} className="flex justify-center" size="sm" >
                      ใช่, ฉันต้องการยกเลิกการเชื่อมต่อ
                    </Button>
                  </div>
                </>}

            </div>
          </Modal>
        </div>}
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
  }
  return profile(userDataProfile);
}
