'use client';

import React, { useEffect, useState, useCallback } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Image from 'next/image';
import { toast, ToastContainer } from 'react-toastify';
import { checkAccessToken, getAccessToken, getCustomerDetails } from "@/utils/checkAuthen";
import NoAccessModal from "@/components/auth/NoAccessModal";
import NoSyncedComponent from '@/components/auth/NoCitizenSyncModal';
import { LiaXRaySolid } from 'react-icons/lia';
import { MdScience } from 'react-icons/md';
import AiLoading from '../auth/AiLoading';
import { PDFMerger, PrintData, MergeOptions } from '@/utils/mergeLabFile';
import { useRouter } from 'next/navigation';
import { fetchS3Image, getPresignedPDFUrl } from '@/utils/getS3file';

interface QueueData {
    queue_id: number;
    que_code: string;
    que_datetime: string;
    que_lab_analyst: string;
    que_lab_analyst_license: string;
    que_lab_inspector: string;
    que_lab_inspector_license: string;
    customer: {
        ctm_id: string;
        ctm_prefix: string;
        ctm_fname: string;
        ctm_lname: string;
        ctm_gender: string;
        ctm_birthdate: string;
    };
    shop: {
        shop_name: string;
        shop_address: string;
        shop_district: string;
        shop_amphoe: string;
        shop_province: string;
        shop_zipcode: string;
        shop_phone: string;
        shop_image: string;
    };
    checks: Array<{
        id: number;
        chk_code: string;
        specimen_name_en: string;
        chk_name: string;
        chk_value?: string;
        fetchedImageValue?: string;
        chk_direction_detail?: string;
        chk_flag?: string;
        chk_old?: string;
        chk_unit?: string;
        chk_type_id?: number;
        chk_method?: string;
    }>;
    queue_file: Array<{
        quef_path: string;
    }>;
}

interface Item {
    id: number
    que_code: string;
    rec_code: string;
    shop_id: string;
    chk_name: string;
    chk_type_id: number;
    chk_unit: string;
    chk_value: string;
    chk_old: string;
    chk_flag: string;
    ctm_fname: string;
    ctm_lname: string;
    ctm_birthdate: string;
    ctm_gender: string;
    chk_datetime: string;
    user_fullname: string;
    queue_id: number;
    idDoc?: number;
    que_shop_id: number;
}

interface QueueItems {
    queue_id: number;
    rec_code: string;
    que_code: string;
    chk_datetime: string;
    user_fullname: string;
    queue_item: Item[];
}

// Enhanced return type for fetchQueueData
interface FetchQueueDataResult {
    queueData: QueueData;
    s3Urls: string[];
    shopImage: string;
}

export default function HealthReportsPage() {
    const [queueItems, setQueueItems] = useState<QueueItems[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [analyzing, setAnalyzing] = useState<boolean>(false);
    const [isLogin, setIsLogin] = useState(true);
    const [isSynced, setIsSynced] = useState(true);
    const [viewType, setViewType] = useState<'lab' | 'xray'>('lab');
    const [queueData, setQueueData] = useState<QueueData | null>(null);
    const [s3Urls, setS3Urls] = useState<string[]>([]);
    const [shopImage, setShopImage] = useState<string>('');
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [isIOS, setIsIOS] = useState<boolean>(false);
    const router = useRouter()

    useEffect(() => {
        setLoading(true);
        if (!checkAccessToken()) {
            setIsLogin(false);
        } else {
            setIsLogin(true);
            fetchHistory(viewType);
        }
    }, [viewType]);

    useEffect(() => {
        const detect = () => {
            try {
                const ua = navigator.userAgent || '';
                setIsIOS(/iPad|iPhone|iPod/.test(ua));
                setIsMobile(/Mobi|Android/i.test(ua));
            } catch (e) {
                // SSR or unexpected, keep defaults
            }
        };

        detect();
        window.addEventListener('resize', detect);
        return () => window.removeEventListener('resize', detect);
    }, []);

    const fetchHistory = async (type: 'lab' | 'xray') => {
        setLoading(true);
        const token = getAccessToken();
        const user_data = await getCustomerDetails(token || '');

        setIsSynced(localStorage.getItem("is_online_data_sync") === "true")

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/customer/exa/history/${type}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        search_date: '',
                        search_text: '',
                        current_page: 1,
                        per_page: 3000,
                        shop_id: parseInt(process.env.NEXT_PUBLIC_SHOP_ID || "950"),
                    }),
                }
            );
            const data = await res.json();
            if (data.status) {
                const grouped = data.data.items.reduce((acc: QueueItems[], item: Item) => {
                    const existing = acc.find(g => g.queue_id === item.queue_id);
                    if (existing) {
                        existing.queue_item.push(item);
                    } else {
                        acc.push({
                            queue_id: item.queue_id,
                            rec_code: item.rec_code,
                            que_code: item.que_code,
                            chk_datetime: item.chk_datetime,
                            user_fullname: item.user_fullname,
                            queue_item: [item],
                        });
                    }
                    return acc;
                }, []);
                setQueueItems(grouped);
            } else {
                setQueueItems([]);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    function calculateAge(birthdate: string): number {
        const birth = new Date(birthdate);
        const today = new Date();

        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    }

    // Refactored to return all necessary data directly
    const fetchQueueData = async (queueId: number): Promise<FetchQueueDataResult | null> => {
        try {
            const token = getAccessToken();
            if (!token) {
                toast.error('ไม่พบ Token การเข้าสู่ระบบ');
                return null;
            }

            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/queue/check/lab/${queueId}`;

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorMessage = `การเรียกข้อมูลล้มเหลว: ${response.status} ${response.statusText}`;
                throw new Error(errorMessage);
            }

            const result = await response.json();

            if (!result || !result.data) {
                throw new Error('ไม่พบข้อมูลจาก API');
            }

            const data: QueueData = result.data;
            console.log('Queue data loaded:', data);

            // Extract S3 URLs immediately
            const fileUrls = data.queue_file?.map(file => file.quef_path) || [];

            // Load shop image
            let loadedShopImage = '';
            if (data.shop?.shop_image) {
                try {
                    const shopImageData = await fetchS3Image('shop/S9d95a914-8929-4738-9693-81e133b8f03b.jpg');
                    if (shopImageData) {
                        loadedShopImage = shopImageData;
                    }
                } catch (imageError) {
                    console.warn('ไม่สามารถโหลดรูปภาพร้านได้:', imageError);
                }
            }

            // Update state for UI display
            setQueueData(data);
            setS3Urls(fileUrls);
            setShopImage(loadedShopImage);

            // Return all data directly
            return {
                queueData: data,
                s3Urls: fileUrls,
                shopImage: loadedShopImage
            };

        } catch (error) {
            console.error('Error in fetchQueueData:', error);

            const errorMessage = error instanceof Error
                ? error.message
                : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';

            toast.error(errorMessage);

            setQueueData(null);
            setS3Urls([]);
            setShopImage('');

            return null;
        }
    };

    // Refactored to accept all necessary data as parameters
    const handleMergePDFs = async (
        queueDataParam: QueueData,
        s3UrlsParam: string[],
        shopImageParam: string
    ) => {
        if (!queueDataParam) {
            toast.error('ไม่พบข้อมูลคิว');
            return null;
        }

        setLoading(true);

        try {
            // Use the passed parameters directly
            const allUrls = [...s3UrlsParam];

            const printData: PrintData = {
                checks: queueDataParam.checks,
                customer: queueDataParam.customer,
                shop: queueDataParam.shop,
                que_code: queueDataParam.que_code,
                que_datetime: queueDataParam.que_datetime,
                que_lab_analyst: queueDataParam.que_lab_analyst,
                que_lab_analyst_license: queueDataParam.que_lab_analyst_license,
                que_lab_inspector: queueDataParam.que_lab_inspector,
                que_lab_inspector_license: queueDataParam.que_lab_inspector_license,
            };

            const mergeOptions: MergeOptions = {
                includeLabReport: true,
                printData: printData,
                shopImage: shopImageParam,
                progressCallback: (prog: number, stat: string, step?: string) => {
                    // Handle progress updates here
                }
            };

            const result = await PDFMerger.mergePDFsAndImages(allUrls, {
                ...mergeOptions,
                uploadToS3: true,
                s3Config: {
                    bucketName: 'refer-img',
                    region: 'ap-southeast-1',
                    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
                }

            });

            if (result.success && result.url) {
                console.log('PDF merged successfully:', result);
                return result;
            } else {
                console.error('เกิดข้อผิดพลาดในการสร้าง PDF');
                toast.error('เกิดข้อผิดพลาดในการสร้าง PDF');
                return null;
            }

        } catch (error) {
            console.error('Error merging PDFs:', error);
            toast.error(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Refactored to use the returned data directly
    const handleAnalyze = async (queue_item: QueueItems) => {
        setAnalyzing(true);

        try {
            // Fetch queue data and get all necessary data directly
            const fetchResult = await fetchQueueData(queue_item.queue_id);

            if (!fetchResult) {
                toast.error('ไม่สามารถโหลดข้อมูลคิวได้');
                return;
            }

            // Use the fetched data directly without relying on state
            const { queueData: fetchedQueueData, s3Urls: fetchedS3Urls, shopImage: fetchedShopImage } = fetchResult;

            // Pass all data directly to avoid state timing issues
            const rawPdfData = await handleMergePDFs(
                fetchedQueueData,
                fetchedS3Urls,
                fetchedShopImage
            );

            if (rawPdfData && rawPdfData.s3Key) {
                const encodedUrl = await getPresignedPDFUrl(rawPdfData.s3Key);
                console.log('Presigned URL:', encodedUrl);
                localStorage.setItem("from_lab_analyst", "true")
                localStorage.setItem("lab_link", String(encodedUrl!))
                router.push(`/ai/aichat`)

                // You can add navigation or further processing here
                // router.push(`/ai-analysis?url=${encodeURIComponent(encodedUrl)}`);

                toast.success('วิเคราะห์ข้อมูลสำเร็จ');
            } else {
                toast.error('ไม่สามารถสร้าง PDF สำหรับการวิเคราะห์ได้');
            }

        } catch (error) {
            console.error('Error in handleAnalyze:', error);
            toast.error('เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล');
        } finally {
            setAnalyzing(false);
        }
    };

    // Handler for when sync is successful
    const handleSyncSuccess = () => {
        fetchHistory(viewType);
        toast.success('เชื่อมต่อข้อมูลสำเร็จ');
    };

    return (
        <>
            {isLogin ? (
                <>
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
                        pageTitle="เอกสารผลตรวจจากคลินิก"
                    />

                    {/* Tabs */}
                    {isSynced === true && (
                        <div className="flex mb-4 gap-3">
                            <button
                                disabled={loading}
                                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ease-out ${viewType === 'lab'
                                    ? 'text-white shadow-lg transform scale-[0.98] bg-[#F639BD]'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                                    }`}
                                onClick={() => setViewType('lab')}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <MdScience size={25} />
                                    Lab
                                </span>
                            </button>

                            <button
                                disabled={loading}
                                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ease-out ${viewType === 'xray'
                                    ? 'text-white shadow-lg transform scale-[0.98] bg-[#F639BD]'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                                    }`}
                                onClick={() => setViewType('xray')}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <LiaXRaySolid size={25} />
                                    Radiology
                                </span>
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 p-6">
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
                            ) : isSynced ? (
                                queueItems.length > 0 ? (
                                    queueItems.map((item, idx) => (
                                        <div key={idx} className="bg-white rounded-xl shadow-sm mb-4">
                                            <div className="flex flex-col p-6 bg-white rounded-xl">
                                                <div className="w-full mb-3">
                                                    <p className="text-base font-semibold text-gray-600">
                                                        {new Date(item.chk_datetime).toLocaleDateString('th-TH', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                </div>

                                                <div className="mt-2 grid grid-cols-2 gap-y-1 text-base font-medium text-gray-800 w-fit">
                                                    <div className="text-[#4385EF]">คิวตรวจ</div>
                                                    <div className="text-gray-800">{item.que_code}</div>
                                                    <div className="text-[#4385EF]">แพทย์</div>
                                                    <div className="text-gray-800">{item.user_fullname}</div>
                                                </div>

                                                {viewType === "xray" ? (
                                                    <div className="mt-4">
                                                        <div className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                รายการตรวจ ({item.queue_item.length} รายการ)
                                                            </span>
                                                        </div>

                                                        <div className="mt-3 space-y-2">
                                                            {item.queue_item.map((sub_item, subIdx) => (
                                                                <div
                                                                    key={subIdx}
                                                                    className="p-3 bg-white border border-gray-200 rounded-lg"
                                                                >
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                                        <div>
                                                                            <span className="font-medium text-gray-600">ชื่อการตรวจ:</span>
                                                                            <span className="ml-2 text-gray-800">{sub_item.chk_name}</span>
                                                                        </div>

                                                                        <div className="w-full flex justify-center mt-4 sm:mt-0 sm:justify-end px-5">
                                                                            <div className="flex flex-col sm:flex-row gap-4">
                                                                                <a
                                                                                    href={`print/${viewType}/${item.queue_id}?check_id=${sub_item.id}`}
                                                                                    target={!isMobile && !isIOS ? "_blank" : undefined}
                                                                                    rel={!isMobile && !isIOS ? "noopener noreferrer" : undefined}
                                                                                    onClick={(e) => {
                                                                                        if (isMobile || isIOS) {
                                                                                            e.preventDefault();
                                                                                            router.push(`print/${viewType}/${item.queue_id}?check_id=${sub_item.id}`);
                                                                                        }
                                                                                    }}
                                                                                    className="text-sm text-[#4385EF] text-center px-4 py-3 rounded-3xl w-38 border border-[#4385EF] hover:bg-[#4385EF] hover:text-white transition-all duration-300"
                                                                                >
                                                                                    ดูผลตรวจ
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-full flex justify-center mt-4 sm:mt-0 sm:justify-end px-5">
                                                            <div className="flex flex-col sm:flex-row gap-4">
                                                                <a
                                                                    href={`print/${viewType}/${item.queue_id}`}
                                                                    target={!isMobile && !isIOS ? "_blank" : undefined}
                                                                    rel={!isMobile && !isIOS ? "noopener noreferrer" : undefined}
                                                                    onClick={(e) => {
                                                                        if (isMobile || isIOS) {
                                                                            e.preventDefault();
                                                                            router.push(`print/${viewType}/${item.queue_id}`);
                                                                        }
                                                                    }}
                                                                    className="text-sm text-[#4385EF] text-center px-4 py-3 rounded-3xl w-38 border border-[#4385EF] hover:bg-[#4385EF] hover:text-white transition-all duration-300"
                                                                >
                                                                    ดูผลตรวจ
                                                                </a>
                                                                {viewType === "lab" && (
                                                                    <button
                                                                        onClick={() => handleAnalyze(item)}
                                                                        style={{
                                                                            background:
                                                                                'linear-gradient(100.66deg, #00A2FF 15.06%, #FF30DD 61.87%, #FF7098 84.34%)',
                                                                        }}
                                                                        className={`text-sm px-4 py-3 w-38 rounded-3xl text-white transition-all duration-300 ${analyzing ? 'opacity-50 cursor-not-allowed ' : 'hover:shadow-lg hover:scale-105'
                                                                            }`}
                                                                        disabled={analyzing}
                                                                    >
                                                                        {analyzing ? 'กำลังส่งข้อมูล...' : 'วิเคราะห์ผลด้วย AI'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
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
                                )
                            ) : (
                                <NoSyncedComponent
                                    onSyncSuccess={handleSyncSuccess}
                                    title="ยังไม่ได้เชื่อมต่อข้อมูลกับสถานพยาบาล"
                                    description="กรุณาเชื่อมต่อข้อมูลด้วยเลขบัตรประชาชนเพื่อดูเอกสารผลตรวจจากคลินิก"
                                />
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <NoAccessModal />
            )}

            {analyzing && <AiLoading />}
        </>
    );
}