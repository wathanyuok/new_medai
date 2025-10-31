'use client';

import React, { useEffect, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';

import Image from 'next/image';
import { toast, ToastContainer } from 'react-toastify';
import { checkAccessToken, getAccessToken, getCustomerDetails } from "@/utils/checkAuthen";
import NoAccessModal from "@/components/auth/NoAccessModal";
import NoSyncedComponent from '../auth/NoSyncedComponent';

export interface Appointment {
    id: number;
    shop_id: number;
    user_id: number;
    user_image: string;
    user_fullname: string;
    user_fullname_en: string;
    role_name_th: string;
    role_name_en: string;
    customer_id: number;
    customer_fullname: string;
    ctm_fname: string;
    ctm_lname: string;
    ctm_fname_en: string;
    ctm_lname_en: string;
    ap_type: number;
    ap_topic: string;
    ap_tel: string;
    ap_datetime: Date;
    ap_note: string;
    ap_comment: string;
    ap_color: string;
    ap_confirm: number;
    ap_status_id: number;
    ap_status_sms: number;
    ap_status_line: number;
    ap_sms: string;
    ap_is_gcalendar: number;
    ap_gid: string;
    ap_user_id: number;
    ap_is_del: number;
    ap_create: Date;
    ap_update: Date;
    shop_name: string;
}


export default function AppointmentPage() {
    const [items, setItems] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isLogin, setIsLogin] = useState(true);
    const [isSynced, setIsSynced] = useState(true);

    useEffect(() => {
        setLoading(true);
        if (!checkAccessToken()) {
            setIsLogin(false)
        } else {
            setIsLogin(true);
            fetchHistory();
        }

    }, []);

    const fetchHistory = async () => {
        // setLoading(true);
        const token = getAccessToken();
        const user_data = await getCustomerDetails(token || '')
        if (user_data.data.customer.id === 0) {
            setLoading(false);
            return setIsSynced(false)
        }
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/customer/appointment`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        search: '',
                        date: '',
                        type: '2',
                        is_active: '1',
                        active_page: 1,
                        per_page: 10,
                        date_from: new Date(),
                    }),
                }
            );
            const data = await res.json();
            if (data.status) {
                setItems(data.data.result_data);
            } else {
                setItems([]);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {isLogin == true && (<>
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                    draggable
                    style={{ zIndex: 99999 }}
                />

                <PageBreadcrumb
                    size="text-3xl"
                    oi={false}
                    text="text-[#F639BD]"
                    pageTitle="นัดหมายของคุณ"
                />

                <div className="grid grid-cols-1  gap-6 p-6">
                    <div className="lg:col-span-2 space-y-4">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-4 bg-white rounded-xl shadow-sm p-4 animate-pulse"
                                >
                                    <div className="w-[120px] h-[120px] bg-gray-200 rounded-xl" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-6 bg-gray-200 rounded w-1/2" />
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {[...Array(4)].map((_, idx) => (
                                                <div key={idx} className="h-4 bg-gray-200 rounded" />
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <div className="h-8 w-24 bg-gray-200 rounded" />
                                            <div className="h-8 w-24 bg-gray-200 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : <>
                            {isSynced == true && items.length > 0 ? (
                                items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-4 bg-white rounded-xl shadow-sm p-4"
                                    >



                                        <div className='w-full'>
                                            <p className="text-base font-semibold text-gray-800">
                                                {item.ap_topic}
                                            </p>
                                            <div className="mt-2 w-full sm:w-2/4 gap-y-1 text-md ">
                                                <div className='flex row'>
                                                    <div className="text-[#4385EF] w-4/12 ">ผู้รับบริการ</div>
                                                    <div className="text-gray-800 ">{item.customer_fullname}</div>
                                                </div>
                                                <div className='flex row '>
                                                    <div className="text-[#4385EF] w-4/12 ">วันที่ตรวจ</div>
                                                    <div className="text-gray-800">
                                                        {new Date(item.ap_datetime).toLocaleDateString('th-TH', {
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        })}
                                                    </div>
                                                </div>
                                                <div className='flex row '>

                                                    <div className="text-[#4385EF] w-4/12 ">เวลา</div>
                                                    <div className="text-gray-800">
                                                        {new Date(item.ap_datetime).toLocaleTimeString('th-TH', {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })} น.
                                                    </div>
                                                </div>
                                                <div className='flex row '>
                                                    <div className="text-[#4385EF] w-4/12 ">แพทย์</div>
                                                    <div className="text-gray-800">{item.user_fullname}</div>
                                                </div>



                                            </div>
                                            <div className="mt-2 w-full gap-y-1 text-md" style={{ whiteSpace: 'pre-line' }}>
                                                <p>
                                                    {item.ap_note}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center text-gray-500 mt-10">
                                    <Image
                                        src="/images/no-data.png"
                                        alt="ไม่มีข้อมูล"
                                        width={200}
                                        height={200}
                                        className="mb-4"
                                    />
                                    <p className="text-lg font-semibold">ไม่มีเอกสารผลตรวจในระบบ</p>
                                </div>
                            )}
                            {isSynced == false && <>
                             <NoSyncedComponent/>
                            </>}
                        </>
                        }


                    </div>
                </div>
            </>)}
            {isLogin == false && <><NoAccessModal /></>}

        </>

    );
}
