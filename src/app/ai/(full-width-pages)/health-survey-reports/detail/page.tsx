"use client"
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

// Type definitions based on the actual API response
export interface Customer {
    id: number
    shop_id: number
    customer_group_id: number
    user_id: number
    ctm_id: string
    ctm_citizen_id: string
    ctm_passport_id: string
    ctm_prefix: string
    ctm_fname: string
    ctm_lname: string
    ctm_nname: string
    ctm_fname_en: string
    ctm_lname_en: string
    ctm_gender: string
    ctm_nation: string
    ctm_religion: string
    ctm_edu_level: string
    ctm_marital_status: string
    ctm_blood: string
    ctm_email: string
    ctm_tel: string
    ctm_tel_2: string
    ctm_birthdate: string
    ctm_address: string
    ctm_district: string
    ctm_amphoe: string
    ctm_province: string
    ctm_zipcode: string
    ctm_comment: string
    ctm_weight: number
    ctm_height: number
    ctm_waistline: number
    ctm_chest: number
    ctm_treatment_type: number
    right_treatment_id: number
    ctm_allergic: string
    ctm_mental_health: string
    ctm_disease: string
    ctm_health_comment: string
    ctm_image: string
    ctm_image_size: number
    ctm_point: number
    ctm_coin: number
    line_token: string
    line_send: number
    line_send_date: string
    facebook_id: string
    company_name: string
    company_tax: string
    company_tel: string
    company_email: string
    company_address: string
    company_district: string
    company_amphoe: string
    company_province: string
    company_zipcode: string
    ctm_subscribe_opd: number
    ctm_subscribe_lab: number
    ctm_subscribe_cert: number
    ctm_subscribe_receipt: number
    ctm_subscribe_appoint: number
    ctm_is_active: number
    ctm_is_del: number
    ctm_create: string
    ctm_update: string
    ctm_subscribe_pdpa_token: string
    ctm_subscribe_pdpa_image: string
    cg_name: string
    cg_save_type: number
    cg_save: number
    rt_code: string
    rt_name: string
    rt_name_en: string
}

interface LabResultItem {
    id: number;
    shop_id: number;
    receipt_id: number;
    receipt_detail_id: number;
    user_id: number;
    customer_id: number;
    queue_id: number;
    checking_id: number;
    chk_type_id: number;
    chk_code: string;
    chk_name: string;
    chk_unit: string;
    chk_value: string;
    chk_upload: string;
    chk_upload_size: number;
    chk_old: string;
    direction_id: number;
    chk_flag: string;
    chk_date: string;
    chk_is_print: number;
    chk_is_report: number;
    chk_is_active: number;
    chk_datetime: string;
    chk_create: string;
    chk_update: string;
    direction_name: string;
    que_code: string;
    que_shop_id: number;
    shop_name: string;
    que_datetime: string;
    rec_code: string;
    user_fullname: string;
}

interface XRayResultItem {
    id: number;
    shop_id: number;
    receipt_id: number;
    receipt_detail_id: number;
    user_id: number;
    customer_id: number;
    queue_id: number;
    checking_id: number;
    chk_type_id: number;
    chk_code: string;
    chk_name: string;
    chk_unit: string;
    chk_value: string;
    chk_upload: string;
    chk_upload_size: number;
    chk_old: string;
    direction_id: number;
    chk_flag: string;
    chk_date: string;
    chk_is_print: number;
    chk_is_report: number;
    chk_is_active: number;
    chk_datetime: string;
    chk_create: string;
    chk_update: string;
    direction_name: string;
    que_code: string;
    que_shop_id: number;
    shop_name: string;
    que_datetime: string;
    rec_code: string;
    user_fullname: string;
}

interface LabResultsData {
    items: LabResultItem[];
    count_page: number;
    count_all: number;
}

interface XRayResultsData {
    items: XRayResultItem[];
    count_page: number;
    count_all: number;
}

interface ApiResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

// Grouped lab results by queue
interface GroupedLabResults {
    queueId: number;
    receiptCode: string;
    shopName: string;
    date: string;
    queueCode: string;
    results: LabResultItem[];
    dateObject: Date;
    flag?: string;
}

// Grouped X-ray results by queue
interface GroupedXRayResults {
    queueId: number;
    receiptCode: string;
    shopName: string;
    date: string;
    queueCode: string;
    results: XRayResultItem[];
    dateObject: Date;
}

type TabType = 'lab' | 'xray';

const Page: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('lab');
    const [groupedLabResults, setGroupedLabResults] = useState<GroupedLabResults[]>([]);
    const [groupedXRayResults, setGroupedXRayResults] = useState<GroupedXRayResults[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedQueues, setExpandedQueues] = useState<Set<number>>(new Set());
    const [customer, setCustomer] = useState<Customer | null>(null);

    const router = useRouter();

    useEffect(() => {
        fetchLabResults();
        fetchXRayResults();
        fetchCustomer();
    }, []);

    const processLabResults = (items: LabResultItem[]): GroupedLabResults[] => {
        // Filter active results
        const activeItems = items.filter(item => item.chk_is_active === 1);

        // Group by queue_id
        const grouped = activeItems.reduce((acc, item) => {
            const queueId = item.queue_id;

            if (!acc[queueId]) {
                acc[queueId] = [];
            }

            acc[queueId].push(item);

            return acc;
        }, {} as Record<number, LabResultItem[]>);

        // Convert to array and sort
        const groupedArray: GroupedLabResults[] = Object.entries(grouped).map(([queueId, results]) => {
            const firstResult = results[0];

            // Find the latest date from all results in this queue
            const latestDate = results.reduce((latest, item) => {
                const itemDate = new Date(item.chk_datetime);
                return itemDate > latest ? itemDate : latest;
            }, new Date(0));

            return {
                queueId: parseInt(queueId),
                receiptCode: firstResult.rec_code,
                shopName: firstResult.shop_name,
                date: formatDateTime(firstResult.chk_datetime),
                queueCode: firstResult.que_code,
                results: results.sort((a, b) => a.chk_name.localeCompare(b.chk_name)),
                dateObject: latestDate,
                flag: firstResult.chk_flag || '',
            };
        });

        // Sort by latest date (newest first)
        return groupedArray.sort((a, b) => b.dateObject.getTime() - a.dateObject.getTime());
    };

    const processXRayResults = (items: XRayResultItem[]): GroupedXRayResults[] => {
        // Filter active results
        const activeItems = items.filter(item => item.chk_is_active === 1);

        // Group by queue_id
        const grouped = activeItems.reduce((acc, item) => {
            const queueId = item.queue_id;

            if (!acc[queueId]) {
                acc[queueId] = [];
            }

            acc[queueId].push(item);

            return acc;
        }, {} as Record<number, XRayResultItem[]>);

        // Convert to array and sort
        const groupedArray: GroupedXRayResults[] = Object.entries(grouped).map(([queueId, results]) => {
            const firstResult = results[0];

            // Find the latest date from all results in this queue
            const latestDate = results.reduce((latest, item) => {
                const itemDate = new Date(item.chk_datetime);
                return itemDate > latest ? itemDate : latest;
            }, new Date(0));

            return {
                queueId: parseInt(queueId),
                receiptCode: firstResult.rec_code,
                shopName: firstResult.shop_name,
                date: formatDateTime(firstResult.chk_datetime),
                queueCode: firstResult.que_code,
                results: results.sort((a, b) => a.chk_name.localeCompare(b.chk_name)),
                dateObject: latestDate,
            };
        });

        // Sort by latest date (newest first)
        return groupedArray.sort((a, b) => b.dateObject.getTime() - a.dateObject.getTime());
    };

    const formatDateTime = (dateTimeString: string): string => {
        try {
            return new Date(dateTimeString).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateTimeString;
        }
    };

    const fetchLabResults = async (): Promise<void> => {
        try {
            // Get token from localStorage
            const token = localStorage.getItem('hs_acc_token');

            if (!token) {
                setError('ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
                router.push('/health-survey-reports');
                return;
            }

            setIsLoading(true);
            setError(null);

            // Fetch lab results using the actual endpoint structure
            const labResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/history/lab`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    "search_date": "",
                    "search_text": "",
                    "current_page": 1,
                    "per_page": 50
                })
            });

            if (!labResponse.ok) {
                if (labResponse.status === 401) {
                    localStorage.removeItem('hs_acc_token');
                    setError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
                    return;
                }
                throw new Error(`ไม่สามารถดึงข้อมูลผลตรวจได้: ${labResponse.status}`);
            }

            const labResult: ApiResponse<LabResultsData> = await labResponse.json();

            if (labResult.status && labResult.data.items) {
                const processedResults = processLabResults(labResult.data.items);
                setGroupedLabResults(processedResults);
                // Auto-expand first queue
                if (processedResults.length > 0) {
                    setExpandedQueues(new Set([processedResults[0].queueId]));
                }
            } else {
                throw new Error(labResult.message || 'ไม่สามารถโหลดผลการตรวจได้');
            }

        } catch (error) {
            console.error('Error fetching lab results:', error);
            const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchXRayResults = async (): Promise<void> => {
         setIsLoading(true);
        try {
            // Get token from localStorage
            const token = localStorage.getItem('hs_acc_token');

            if (!token) {
                return;
            }

            // Fetch X-ray results using similar structure to lab results
            const xrayResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/history/xray`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    "search_date": "",
                    "search_text": "",
                    "current_page": 1,
                    "per_page": 50
                })
            });

            if (!xrayResponse.ok) {
                if (xrayResponse.status === 401) {
                    localStorage.removeItem('hs_acc_token');
                    return;
                }
                console.error(`Cannot fetch X-ray results: ${xrayResponse.status}`);
                return;
            }

            const xrayResult: ApiResponse<XRayResultsData> = await xrayResponse.json();

            if (xrayResult.status && xrayResult.data.items) {
                const processedResults = processXRayResults(xrayResult.data.items);
                setGroupedXRayResults(processedResults);
            }

        } catch (error) {
            console.error('Error fetching X-ray results:', error);
        }finally{
             setIsLoading(false);
        }
    };

    const fetchCustomer = async (): Promise<void> => {
        const token = localStorage.getItem('hs_acc_token');
        try {
            if (!token) {
                setError('เข้าระบบใหม่อีกครั้ง');
                return;
            }
            setIsLoading(true);
            setError(null);
            const customerResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!customerResponse.ok) {
                if (customerResponse.status === 401) {
                    localStorage.removeItem('hs_acc_token');
                    setError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
                    return;
                }
                throw new Error(`ไม่สามารถดึงข้อมูลลูกค้าได้: ${customerResponse.status}`);
            }
            const customerData = await customerResponse.json();
            if (customerData.status) {
                setCustomer(customerData.data.customer);

            } else {
                throw new Error(customerData.message || 'ไม่สามารถโหลดข้อมูลลูกค้าได้');
            }

        } catch (error) {
            console.error('Error fetching customer:', error);
            const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
            setError(errorMessage);
        }
    }

    const getDirectionColor = (directionName: string): string => {
        if (!directionName) return 'text-slate-600 bg-slate-50';
        switch (directionName.toLowerCase()) {
            case 'positive':
                return 'text-amber-800 bg-amber-100';
            case 'negative':
                return 'text-emerald-800 bg-emerald-100';
            default:
                return 'text-slate-600 bg-slate-50';
        }
    };

    const toggleQueueExpansion = (queueId: number) => {
        const newExpanded = new Set(expandedQueues);
        if (newExpanded.has(queueId)) {
            newExpanded.delete(queueId);
        } else {
            newExpanded.add(queueId);
        }
        setExpandedQueues(newExpanded);
    };

    const refreshCurrentTab = () => {
        if (activeTab === 'lab') {
            fetchLabResults();
        } else {
            fetchXRayResults();
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="relative mb-6">
                        <div className="w-16 h-16 border-4 border-pink-200 rounded-full animate-spin mx-auto" style={{ borderTopColor: '#f639bd' }}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl">💖</span>
                        </div>
                    </div>
                    <p className="text-slate-700 text-lg font-medium">กำลังโหลดผลการตรวจ...</p>
                    <p className="text-slate-500 text-sm mt-1">โปรดรอสักครู่ค่ะ</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 max-w-sm mx-auto text-center border border-white/20">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">เกิดข้อผิดพลาด</h3>
                    <p className="text-slate-600 mb-4 text-sm leading-relaxed">{error}</p>
                    <button
                        onClick={() => {
                            fetchLabResults();
                            fetchXRayResults();
                        }}
                        className="w-full text-white px-4 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                        style={{ background: 'linear-gradient(45deg, #f639bd, #e879f9)' }}
                    >
                        ลองอีกครั้ง
                    </button>
                </div>
            </div>
        );
    }

    const currentResults = activeTab === 'lab' ? groupedLabResults : groupedXRayResults;

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4 pb-8">
            <div className="max-w-lg sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6 pt-4">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                        ผลการตรวจสุขภาพ
                    </h1>
                </div>

                {/* Customer Info */}
                <div className="my-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">ข้อมูลทั่วไป</h2>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-pink-100 flex-shrink-0">
                            {customer?.ctm_image
                                ? <img src={customer.ctm_image} alt="Avatar" className="object-cover w-full h-full" />
                                : <div className="flex items-center justify-center h-full">
                                    <span className="text-2xl text-pink-300">👤</span>
                                </div>
                            }
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 flex-1">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-slate-700">ชื่อ-สกุล:</span>
                                <span className="text-[#f639bd]">{customer?.ctm_fname} {customer?.ctm_lname}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-slate-700">เพศ:</span>
                                <span className="text-[#f639bd]">{customer?.ctm_gender}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-slate-700">วันเกิด:</span>
                                <span className="text-[#f639bd]">
                                    {customer?.ctm_birthdate
                                        ? new Date(customer.ctm_birthdate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : '–'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-slate-700">เบอร์ติดต่อ:</span>
                                <span className="text-[#f639bd]">{customer?.ctm_tel || '-'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-slate-700">กรุ๊ปเลือด:</span>
                                <span className="text-[#f639bd]">{customer?.ctm_blood || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-6 overflow-hidden">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('lab')}
                            className={`flex-1 px-4 py-4 font-semibold transition-all duration-300 ${activeTab === 'lab'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                                : 'text-slate-600 hover:bg-white/60'
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <span className="text-lg">🧪</span>
                                <span>ผลตรวจทางห้องปฏิบัติการ</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('xray')}
                            className={`flex-1 px-4 py-4 font-semibold transition-all duration-300 ${activeTab === 'xray'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                                : 'text-slate-600 hover:bg-white/60'
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <span className="text-lg">📷</span>
                                <span>ผลตรวจเอ็กซเรย์</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Results Content */}
                {currentResults.length > 0 && (
                    <div className="space-y-4 sm:space-y-6">
                        {currentResults.map((group, index) => (
                            <div key={group.queueId} className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg overflow-hidden border border-white/20 hover:shadow-xl transition-all duration-300">
                                {/* Queue Header */}
                                <div
                                    className="p-3 sm:p-4 md:p-6 cursor-pointer hover:bg-white/60 transition-all duration-300 active:scale-95 touch-manipulation"
                                    onClick={() => toggleQueueExpansion(group.queueId)}
                                >
                                    {/* Mobile Layout */}
                                    <div className="flex flex-col space-y-3 sm:hidden">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-xl transition-transform duration-300 ${expandedQueues.has(group.queueId)
                                                    ? 'rotate-90'
                                                    : ''
                                                    }`} style={{ backgroundColor: expandedQueues.has(group.queueId) ? '#fdf2f8' : '#f1f5f9' }}>
                                                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-semibold text-slate-800">
                                                        คิวตรวจที่: {group.queueCode}
                                                    </h3>
                                                    <p className="text-slate-500 text-xs">ใบเสร็จ: {group.receiptCode}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{group.date}</span>
                                            <a
                                                href={`print/${activeTab}-page?queue_id=${group.queueId}`}
                                                target="_blank"
                                                className="text-sm text-[#4385EF] text-center px-2 py-3 rounded-2xl w-auto border border-[#4385EF] hover:bg-[#4385EF] hover:text-white"
                                            >
                                                ดูผลตรวจ
                                            </a>
                                        </div>
                                    </div>

                                    {/* Desktop/Tablet Layout */}
                                    <div className="hidden sm:flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-2xl transition-transform duration-300 ${expandedQueues.has(group.queueId)
                                                ? 'rotate-90'
                                                : ''
                                                }`} style={{ backgroundColor: expandedQueues.has(group.queueId) ? '#fdf2f8' : '#f1f5f9' }}>
                                                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg md:text-xl font-semibold text-slate-800">
                                                    {group.queueCode}
                                                </h3>
                                                <div className="flex flex-row items-center justify-between space-x-4 text-sm text-slate-500 mt-1">
                                                    <span>ใบเสร็จ: {group.receiptCode}</span>
                                                    <span>•</span>
                                                    <span>{group.date}</span>
                                                    <div className='flex justify-end'>
                                                        <a
                                                            href={`print/${activeTab}-page?queue_id=${group.queueId}`}
                                                            target="_blank"
                                                            className="text-sm text-[#4385EF] text-center px-4 py-3 rounded-3xl w-24 border border-[#4385EF] hover:bg-[#4385EF] hover:text-white"
                                                        >
                                                            ดูผลตรวจ
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Results Content */}
                                {expandedQueues.has(group.queueId) && (
                                    <div className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
                                        <div className="bg-white/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/40">
                                            <div className="space-y-1 sm:space-y-2">
                                                {activeTab === 'lab' ? (
                                                    // Lab Results - Minimal Design
                                                    (group as GroupedLabResults).results.map((result, resultIndex) => (
                                                        <div key={resultIndex} className="group py-2 sm:py-3 border-b border-slate-100 shadow-sm my-5 last:border-b-0 hover:bg-slate-50/50 transition-colors duration-200">
                                                            {/* Mobile Result Layout */}
                                                            <div className="lg:hidden">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="inline-block text-md font-bold  px-2 py-1 rounded">
                                                                            รายการตรวจ: <span className='text-[#f639bd]'>
                                                                                {result.chk_name}
                                                                            </span>
                                                                        </h4>
                                                                        <h5 className="text-sm font-bold text-gray-700  px-2 py-1 rounded">
                                                                            ผู้ตรวจ: <span className='text-[#f639bd]'>
                                                                                {result.user_fullname}
                                                                            </span>
                                                                        </h5>
                                                                        <div className="flex items-center gap-2 px-2 mt-1">
                                                                            <span className="text-sm font-semibold text-slate-900">ค่าที่ตรวจได้: {result.chk_value || 'N/A'}</span>
                                                                            {/* {result.chk_unit && <span className="text-xs text-slate-500">{result.chk_unit}</span>} */}
                                                                        </div>
                                                                    </div>
                                                                    {/* {result.direction_name && (
                                                                        <span className={`px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ${getDirectionColor(result.direction_name)}`}>
                                                                            {result.direction_name}
                                                                        </span>
                                                                    )} */}
                                                                </div>
                                                            </div>

                                                            {/* Desktop/Tablet Result Layout */}
                                                            <div className="hidden lg:flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <h4 className="font-medium text-slate-800 text-sm">{result.chk_name}</h4>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-right">
                                                                        <div className="font-semibold text-slate-900">{result.chk_value || 'N/A'}</div>
                                                                        {result.chk_unit && <div className="text-xs text-slate-500">{result.chk_unit}</div>}
                                                                    </div>
                                                                    {/* {result.direction_name && (
                                                                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getDirectionColor(result.direction_name)}`}>
                                                                            {result.direction_name}
                                                                        </span>
                                                                    )} */}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    // X-Ray Results - Minimal Design
                                                    (group as GroupedXRayResults).results.map((result, resultIndex) => (
                                                        <div
                                                            key={resultIndex}
                                                            className="group flex flex-col lg:flex-row  bg-white rounded-2xl shadow-sm hover:shadow-md transition p-4 space-y-2 sm:space-y-0 sm:space-x-4"
                                                        >
                                                            {/* Textual info */}
                                                            <div className="flex-1">
                                                                <h4 className="inline-block text-md font-bold  px-2 py-1 rounded">
                                                                    รายการตรวจ: <span className='text-[#f639bd]'>
                                                                        {result.chk_name}
                                                                    </span>
                                                                </h4>
                                                                <h5 className="text-sm font-bold text-gray-700  px-2 py-1 rounded">
                                                                    ผู้ตรวจ: <span className='text-[#f639bd]'>
                                                                        {result.user_fullname}
                                                                    </span>
                                                                </h5>

                                                                {result.chk_type_id === 2 && (
                                                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                                                        {result.chk_value || 'N/A'}
                                                                        {result.chk_unit && (
                                                                            <span className="ml-1 text-sm text-gray-500">
                                                                                {result.chk_unit}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Optional image */}
                                                            {result.chk_upload && (
                                                                <button
                                                                    onClick={() => window.open(result.chk_upload, '_blank')}
                                                                    className="flex-shrink-0 flex justify-center"
                                                                    aria-label="View full X-ray"
                                                                >
                                                                    <Image
                                                                        src={result.chk_upload}
                                                                        alt={`Preview of ${result.chk_name}`}
                                                                        width={400}
                                                                        height={400}
                                                                        className="w-40 h-40 sm:w-80 sm:h-80 rounded-lg object-cover items-center"
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>

                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* No Results */}
                {currentResults.length === 0 && !isLoading && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 md:p-12 text-center border border-white/20">
                        <div className="text-5xl sm:text-6xl md:text-7xl mb-4 sm:mb-6">
                            {activeTab === 'lab' ? '🧪' : '📷'}
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800 mb-2 sm:mb-3">
                            {activeTab === 'lab' ? 'ยังไม่มีผลการตรวจทางห้องปฏิบัติการ' : 'ยังไม่มีผลการตรวจเอ็กซเรย์'}
                        </h3>
                        <p className="text-slate-600 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed max-w-sm mx-auto">
                            {activeTab === 'lab'
                                ? 'เริ่มต้นการดูแลสุขภาพของคุณด้วยการตรวจสุขภาพประจำปี'
                                : 'เริ่มต้นการดูแลสุขภาพของคุณด้วยการตรวจเอ็กซเรย์'
                            }
                        </p>
                        <button
                            onClick={refreshCurrentTab}
                            className="w-full sm:w-auto sm:px-8 md:px-12 text-white px-6 py-3 sm:py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium text-sm sm:text-base"
                            style={{ background: 'linear-gradient(45deg, #f639bd, #e879f9)' }}
                        >
                            ตรวจสอบอีกครั้ง
                        </button>
                    </div>
                )}

                {/* Refresh Button */}
                <div className="text-center mt-6 sm:mt-8">
                    <button
                        onClick={refreshCurrentTab}
                        className="bg-white/70 backdrop-blur-sm text-slate-700 px-6 py-3 sm:px-8 sm:py-4 rounded-2xl hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium border border-white/30 flex items-center space-x-2 mx-auto active:scale-95 text-sm sm:text-base"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>รีเฟรชข้อมูล{activeTab === 'lab' ? 'ผลตรวจแลป' : 'เอ็กซเรย์'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Page;