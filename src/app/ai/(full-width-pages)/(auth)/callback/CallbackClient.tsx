'use client';

import liff from "@line/liff";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Lottie from 'lottie-react';
import loading from '../../../../../../public/images/loading.json';
import complete from '../../../../../../public/images/check-animation.json';
import { toast, ToastContainer } from 'react-toastify';

// ✅ ฟังก์ชัน decode token แบบเต็ม
function decodeJwt<T extends Record<string, unknown>>(token: string): T {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(payload);
}

const CallbackClient: React.FC = () => {
    const router = useRouter();
    const [loadingState, setLoadingState] = useState(true);

    const checkLineId = async (id: string) => {
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/auth/checklineidexa`,
                { line_id: id },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`,
                    },
                }
            );
            console.log('✅ checkLineId result:', response.data);
            return response.data;
        } catch (error) {
            console.error("Error checking line ID:", (axios.isAxiosError(error) && error.response?.data) || String(error));
            throw error;
        }
    };
    const fetchCustomerProfile = async (token: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/co_profile`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            console.log(data)
            return data.data
        } catch {
            console.error('Failed to fetch customer profile');
        }
    }

    useEffect(() => {
        const syncFromProfile = localStorage.getItem("syncFromProfile")!;
        const exchangeCode = async () => {
            try {
                await liff.init({ liffId: `${process.env.NEXT_PUBLIC_LIFF_KEY || '2006526342-OEYmV1wW'}` });
                if (liff.isLoggedIn()) {
                    const userProfile = await liff.getProfile();
                    const lineId = userProfile.userId;
                    const lineName = userProfile.displayName;
                    const idtoken = liff.getIDToken();

                    if (!idtoken) {
                        console.error("idtoken is null");
                        router.push("/ai/signin");
                        return;
                    }

                    const decoded = decodeJwt(idtoken);
                    const lineEmail = String(decoded.email) || "";
                    console.log(lineEmail)
                    // localStorage.setItem("email", lineEmail);
                    // localStorage.setItem("username", lineName);

                    document.cookie = `lineId=${lineId}; path=/; SameSite=Strict`;
                    document.cookie = `lineEmail=${lineEmail}; path=/; Secure; SameSite=Strict`;
                    document.cookie = `lineName=${lineName}; path=/; Secure; SameSite=Strict`;

                    localStorage.setItem("idToken", idtoken);
                    localStorage.setItem("someData", JSON.stringify({ lineId, lineName, lineEmail }));
                    localStorage.setItem("lineId", lineId);



                    // console.log(checkedId)
                    if (syncFromProfile == "true") {
                        const obj = {
                            "line_id": lineId,
                            "co_email": localStorage.getItem("email")!,
                            "line_name": lineName,
                            "line_email": lineEmail
                        }
                        const syncAcc_ = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/auth/accountsyncwithmail`, obj, {
                            headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}` }

                        })
                        if (syncAcc_.data.status == true) {
                            const token = await checkLineId(lineId)
                            localStorage.setItem("token", token.data.access_token);
                            const co_profile = await fetchCustomerProfile(token.data.access_token)
                            if (co_profile.co_line_id !== null || '') {
                                localStorage.setItem('is_line_sync', 'true');
                            } else {
                                localStorage.setItem('is_line_sync', 'false');
                            }
                            if (co_profile.is_online_data_sync == true) {
                                localStorage.setItem('is_online_data_sync', 'true');
                            } else {
                                localStorage.setItem('is_online_data_sync', 'false');
                            }
                            localStorage.setItem('username', co_profile?.co_fname + ' ' + co_profile?.co_lname);
                            localStorage.setItem('email', co_profile?.co_email);
                            localStorage.removeItem("syncFromProfile");
                            router.push("/ai");
                        }
                        if (syncAcc_.data.status == false) {
                            toast.warning('บัญชี Line นี้มีอยู่ในระบบแล้ว ไม่สามารถเชื่อมต่อได้');
                            router.push("/ai");
                        }
                    } else {
                        const checkedId = await checkLineId(lineId);
                        if (checkedId.status == false) {
                            // toast.warning('บัญชี Line นี้มีอยู่ในระบบแล้ว ไม่สามารถเชื่อมต่อได้');
                            router.push("/ai/login");
                            return;
                        }

                        if (checkedId.data.access_token) {
                            localStorage.setItem("token", checkedId.data.access_token)

                            const co_profile = await fetchCustomerProfile(checkedId.data.access_token)
                            if (co_profile.co_line_id !== null || '') {
                                localStorage.setItem('is_line_sync', 'true');
                            } else {
                                localStorage.setItem('is_line_sync', 'false');
                            }
                            if (co_profile.is_online_data_sync == true) {
                                localStorage.setItem('is_online_data_sync', 'true');
                            } else {
                                localStorage.setItem('is_online_data_sync', 'false');
                            }
                            localStorage.setItem('username', co_profile?.co_fname + ' ' + co_profile?.co_lname);
                            localStorage.setItem('email', co_profile?.co_email);
                            // const shop = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/shop/getshop`, {
                            //     headers: { Authorization: `Bearer ${checkedId.data.access_token}` },
                            // });

                            // const userDetails = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/customer`, {
                            //     headers: { Authorization: `Bearer ${checkedId.data.access_token}` },
                            // });

                            // if (userDetails.data.status) {
                            //     localStorage.setItem("userDetails", JSON.stringify(userDetails.data.data));
                            // }

                            // const auth = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/shop/oauth`, {
                            //     shop_id: parseInt(process.env.NEXT_PUBLIC_SHOP_ID!),
                            // }, {
                            //     headers: { Authorization: `Bearer ${checkedId.data.access_token}` },
                            // }).then(res => {
                            //     if (res.data.status == true) {
                            //         return localStorage.setItem("token", res.data.data.access_token)
                            //     } else if (res.data.status == false) {
                            //         return localStorage.setItem("token", checkedId.data.access_token);
                            //     }
                            // });

                            // localStorage.setItem("shop_list", JSON.stringify(shop.data));
                            // localStorage.setItem("shop", JSON.stringify(shop.data.data[0]));

                            // const token = auth.data.data.access_token;


                            // const decodedAuth = decodeJwt(token);
                            // if (decodedAuth?.exp) {
                            //     const expires = new Date(Number(decodedAuth.exp) * 1000).toUTCString();
                            //     document.cookie = `token=${token}; Path=/; Expires=${expires}; Secure; SameSite=Strict`;
                            // }

                            setLoadingState(false);
                            setTimeout(() => {
                                router.push("/ai");
                            }, 2000);
                        }
                    }


                }
            } catch (error) {
                console.error("Error during exchangeCode:", error);
                setLoadingState(false);
                router.push("/ai/signin");
            }
        };

        // const someData = localStorage.getItem("someData");
        exchangeCode();
        // if (someData) {
        //     setLoadingState(false);
        //     setTimeout(() => {
        //         router.push("/signin");
        //     }, 1000);
        // }
    }, [router]);

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            {loadingState ? (
                <>
                    <Lottie style={{ width: '300px', height: '300px', margin: '0 auto' }} loop={true} animationData={loading} />
                    <p style={{ marginTop: '10px', color: '#555', fontSize: '25px' }}>
                        กำลังตรวจสอบข้อมูล...
                    </p>
                </>
            ) : (
                <>
                    <Lottie style={{ width: '300px', height: '300px', margin: '0 auto' }} loop={false} animationData={complete} />
                    <p style={{ marginTop: '10px', color: '#555', fontSize: '25px' }}>
                        เข้าสู่ระบบสำเร็จ
                    </p>
                </>
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
                style={{ zIndex: 99999 }}
            />
        </div>
    );
};

export default CallbackClient;
