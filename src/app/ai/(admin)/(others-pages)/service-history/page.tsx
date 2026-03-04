"use client";

import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';
import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { th } from "date-fns/locale/th"; // ภาษาไทย
import { setHours, setMinutes } from "date-fns";
interface UpcomingAppointment {
    date: string;
    type: string;
    doctor: string;
    location: string;
    ap_datetime: string; // Added property to match usage
    ap_topic: string; // Added property to fix the error
    user_fullname: string; // Added property to fix the error
    ap_status_id: number; // Added property to fix the error
}
const MockData = {
    "data": [
        {
            "TimeData": "09:00:00",
            "day_datas": null
        },
        {
            "TimeData": "09:30:00",
            "day_datas": null
        },
        {
            "TimeData": "10:00:00",
            "day_datas": null
        },
        {
            "TimeData": "10:30:00",
            "day_datas": null
        },
        {
            "TimeData": "11:00:00",
            "day_datas": null
        },
        {
            "TimeData": "11:30:00",
            "day_datas": null
        },
        {
            "TimeData": "12:00:00",
            "day_datas": null
        },
        {
            "TimeData": "12:30:00",
            "day_datas": null
        },
        {
            "TimeData": "13:00:00",
            "day_datas": null
        },
        {
            "TimeData": "13:30:00",
            "day_datas": null
        },
        {
            "TimeData": "14:00:00",
            "day_datas": null
        },
        {
            "TimeData": "14:30:00",
            "day_datas": null
        },
        {
            "TimeData": "15:00:00",
            "day_datas": null
        },
        {
            "TimeData": "15:30:00",
            "day_datas": null
        },
        {
            "TimeData": "16:00:00",
            "day_datas": null
        },
        {
            "TimeData": "16:30:00",
            "day_datas": null
        },
        {
            "TimeData": "17:00:00",
            "day_datas": null
        },
        {
            "TimeData": "17:30:00",
            "day_datas": null
        },
        {
            "TimeData": "18:00:00",
            "day_datas": null
        },
        {
            "TimeData": "18:30:00",
            "day_datas": null
        },
        {
            "TimeData": "19:00:00",
            "day_datas": null
        },
        {
            "TimeData": "19:30:00",
            "day_datas": null
        },
        {
            "TimeData": "20:00:00",
            "day_datas": null
        }
    ],
    "message": "",
    "status": true
};

const ServiceHistoryPage = () => {
    // const [history, setHistory] = useState<AppointmentHistory[]>([]);
    const [upcoming, setUpcoming] = useState<UpcomingAppointment | null>(null);
    const [pastAppointments, setPastAppointments] = useState<UpcomingAppointment[]>([]);
    const [loading, setLoading] = useState(true); // เพิ่ม state นี้
    const { isOpen, openModal, closeModal } = useModal();
    // const [minDateTime, setMinDateTime] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const selectedDate = new Date(); // หรือวันใดก็ได้ที่เลือกใน DatePicker

    const availableTimeData = MockData; // สมมุติเป็น response จาก API ด้านบน
    
    const includeTimes = useMemo(() => {
      return availableTimeData.data.map((item: { TimeData: string }) => {
        const [hours, minutes, seconds] = item.TimeData.split(":").map(Number);
        const date = new Date(selectedDate);
        date.setHours(hours, minutes, seconds, 0);
        return date;
      });
    }, [availableTimeData, selectedDate]);
    // ตัวอย่าง: ห้ามเลือกเวลา 12:00, 13:00, 14:00
    const excludeTimes = [
        setHours(setMinutes(new Date(), 0), 12),
        setHours(setMinutes(new Date(), 0), 13),
        setHours(setMinutes(new Date(), 0), 14),
    ];


    // useEffect(() => {
    //     const now = new Date();
    //     const year = now.getFullYear();
    //     const month = (`0${now.getMonth() + 1}`).slice(-2);
    //     const date = (`0${now.getDate()}`).slice(-2);
    //     const hour = (`0${now.getHours()}`).slice(-2);
    //     const minute = (`0${now.getMinutes()}`).slice(-2);
    //     setMinDateTime(`${year}-${month}-${date}T${hour}:${minute}`);
    // }, []);
    const formatThaiDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString("th-TH", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }) + " น.";
    };
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/appointment/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await response.json();
            const now = new Date();
            const threeDaysLater = new Date();
            threeDaysLater.setDate(now.getDate() + 3);

            const all: UpcomingAppointment[] = json.data;

            const upcomingList = all
                .filter(ap => {
                    const apDate = new Date(ap.ap_datetime);
                    return apDate >= now && apDate <= threeDaysLater;
                })
                .sort((a, b) => new Date(a.ap_datetime).getTime() - new Date(b.ap_datetime).getTime());

            setUpcoming(upcomingList[0] || null);
            setPastAppointments(all.filter(ap => new Date(ap.ap_datetime) <= now));
            setLoading(false);

        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    return (
        <>
            <div className="space-y-4">
                {/* นัดหมายที่กำลังจะมาถึง */}
                {!upcoming && (
                    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-6xl animate-pulse space-y-4">
                        <div className="h-4 bg-gray-300 rounded w-48" />
                        <div className="h-6 bg-gray-300 rounded w-64" />

                        <div className="grid grid-cols-1 sm:grid-cols-3 text-sm gap-y-4 mt-4">
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-24" />
                                <div className="h-4 bg-gray-400 rounded w-36" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-24" />
                                <div className="h-4 bg-gray-400 rounded w-32" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-24" />
                                <div className="h-4 bg-gray-400 rounded w-40" />
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-md p-4 mt-2 space-y-2">
                            <div className="h-4 bg-blue-200 rounded w-40" />
                            <div className="h-4 bg-blue-100 rounded w-full" />
                            <div className="h-4 bg-blue-100 rounded w-5/6" />
                            <div className="h-4 bg-blue-100 rounded w-4/5" />
                            <div className="h-4 bg-blue-100 rounded w-4/5" />
                            <div className="h-4 bg-blue-100 rounded w-4/5" />
                        </div>
                    </div>
                )}

                {upcoming && (
                    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-6xl space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-purple-600 font-bold mb-1">นัดหมายที่กำลังจะมาถึง</p>
                                <p className="text-lg font-bold text-gray-900">{formatThaiDate(upcoming.ap_datetime)}</p>
                            </div>
                            <button
                                onClick={openModal}
                                className="flex items-center gap-1 text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-200 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                เลื่อนนัด
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 text-sm gap-y-2">
                            <div>
                                <p className="text-gray-500">ประเภทบริการ</p>
                                <p className="text-gray-800 font-medium">{upcoming.ap_topic || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">แพทย์ผู้ตรวจ</p>
                                <p className="text-gray-800 font-medium">{upcoming.user_fullname || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">สถานที่</p>
                                <p className="text-blue-600 font-medium">-</p> {/* หากไม่มีให้เติมภายหลัง */}
                            </div>
                        </div>
                        <div className="bg-blue-50 rounded-md p-4 mt-2">
                            <p className="text-sm font-semibold text-blue-800 mb-2">สิ่งที่ต้องเตรียมตัวก่อนเข้ารับบริการ</p>
                            <ul className="list-disc text-sm pl-5 space-y-1 text-gray-700">
                                <li>งดอาหารและเครื่องดื่มทุกชนิด (ยกเว้นน้ำเปล่า) อย่างน้อย 8-12 ชั่วโมงก่อนเข้ารับการตรวจ</li>
                                <li>นำผลตรวจเลือดล่าสุดมาด้วย (หากมี)</li>
                                <li>นำยาประจำตัวมาด้วยทุกกรณี หรือถ่ายภาพฉลากยาแสดง</li>
                                <li>สวมเสื้อผ้าที่เปลี่ยนง่าย และถอดง่าย</li>
                                <li>ควรมาถึงก่อนเวลานัดอย่างน้อย 30 นาที เพื่อลงทะเบียน</li>
                            </ul>
                        </div>
                        <p className="text-xs text-gray-400 pt-2">
                            หากต้องการเลื่อนนัด กรุณาแจ้งล่วงหน้าอย่างน้อย 3 วัน
                        </p>
                    </div>
                )}

                {/* ประวัติการรับบริการทั้งหมด */}
                <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-6xl space-y-4">
                    <h2 className="text-base font-bold text-gray-800 mb-2">ประวัติการรับบริการทั้งหมด</h2>
                    {loading && (
                        <>
                            {[...Array(2)].map((_, idx) => (
                                <div key={idx} className="rounded-md border border-gray-200 p-4 animate-pulse space-y-2">
                                    <div className="h-4 bg-gray-300 rounded w-40" />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <div className="space-y-2">
                                            <div className="h-3 bg-gray-300 rounded w-24" />
                                            <div className="h-4 bg-gray-400 rounded w-32" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 bg-gray-300 rounded w-24" />
                                            <div className="h-4 bg-gray-400 rounded w-28" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 bg-gray-300 rounded w-24" />
                                            <div className="h-4 bg-gray-400 rounded w-36" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {pastAppointments
                        .filter(ap => ap.ap_status_id === 3)
                        .map((item, idx) => (
                            <div key={idx} className="rounded-md border border-gray-200 p-4 space-y-1">
                                <p className="text-sm font-bold text-gray-800">{formatThaiDate(item.ap_datetime)}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">ประเภทบริการ</span>
                                        <p className="text-gray-800">{item.ap_topic || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">แพทย์ผู้ตรวจ</span>
                                        <p className="text-gray-800">{item.user_fullname || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">สถานที่</span>
                                        <p className="text-blue-600">{item.location || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                    {!loading && pastAppointments.filter(ap => ap.ap_status_id === 3).length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                            <p>ไม่มีประวัติการรับบริการ</p>
                        </div>
                    )}
                </div>
            </div>
            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                className="w-full max-w-md mx-auto p-4 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 shadow-xl"
            >
                <div className="flex flex-col space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <h5 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">เลื่อนนัดหมาย</h5>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-snug">
                            กรุณาเลือกวันและเวลาใหม่ที่คุณต้องการนัดหมาย
                        </p>
                    </div>

                    {/* DatePicker */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            วันและเวลานัดใหม่
                        </label>
                        <div className="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden shadow-sm">
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                showTimeSelect
                                includeTimes={includeTimes}
                                dateFormat="dd/MM/yyyy HH:mm"
                                timeFormat="HH:mm"
                                timeIntervals={30}
                                locale={th}
                                minDate={new Date()}
                                excludeTimes={excludeTimes}
                                className="w-full px-4 py-2 text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-900 focus:outline-none"
                                calendarClassName="!w-full sm:!w-auto"
                                placeholderText="เลือกวันและเวลา"
                                popperPlacement="bottom-start"
                                popperModifiers={[
                                    {
                                        name: "offset",
                                        options: {
                                            offset: [0, 10],
                                        },
                                        fn: (state) => state, // Add a no-op function to satisfy the 'fn' requirement
                                    },
                                    {
                                        name: "preventOverflow",
                                        options: {
                                            boundary: "viewport",
                                        },
                                        fn: (state) => state, // Add a no-op function to satisfy the 'fn' requirement
                                    },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    {startDate && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            วันที่เลือก:{" "}
                            {startDate.toLocaleString("th-TH", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })} น.
                        </p>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={closeModal}
                            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            ปิด
                        </button>
                        {/* <button
                    onClick={handleAddOrUpdateEvent}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                  >
                    ยืนยันการเลื่อนนัด
                  </button> */}
                        <button
                            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                        >
                            ยืนยันการเลื่อนนัด
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default ServiceHistoryPage;