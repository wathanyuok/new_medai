'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Lottie from 'lottie-react';
import loading from '../../../public/images/loading.json';
import complete from '../../../public/images/check-animation.json';
import { ToastContainer } from 'react-toastify';
function decodeJwt(token: string): { exp: number } {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(payload);
}

const Callback: React.FC = () => {
    const router = useRouter();
    const [loadingState, setLoadingState] = useState(true);
    const searchParams = useSearchParams();
    const checkLineId = async (id: string) => {
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/auth/checklineid`,
                {
                    line_id: id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`, // Correct header format
                    },
                }
            );
            console.log('🚀 ~ file: page.tsx:50 ~ checkLineId ~ response:', response.data);
            return response; // Return the response data
        } catch (error) {
            console.error(
                "Error checking line ID:",
                (axios.isAxiosError(error) && error.response?.data) || String(error)
            );
            throw error; // Rethrow the error if needed
        }
    };

    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) return;

        const exchangeCode = async () => {
            try {
                // 1. แลกรหัสเป็น token
                const tokenRes = await axios.post(
                    'https://api.line.me/oauth2/v2.1/token',
                    new URLSearchParams({
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: process.env.NEXT_PUBLIC_LINE_REDIRECT_URI!,
                        client_id: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID!,
                        client_secret: process.env.NEXT_PUBLIC_LINE_CHANNEL_SECRET!,
                    }),
                    {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    }
                );

                const { access_token, id_token } = tokenRes.data;

                // 2. ดึงชื่อและ userId จาก LINE
                const profileRes = await axios.get('https://api.line.me/v2/profile', {
                    headers: { Authorization: `Bearer ${access_token}` },
                });

                const { userId, displayName } = profileRes.data;
                const checkedId = await checkLineId(userId);
                if (!checkedId.status) {
                    router.push("/ai/login");
                    return;
                }
                // 3. decode email จาก id_token
                const payloadBase64 = id_token.split('.')[1];
                const payload = JSON.parse(atob(payloadBase64));
                const email = payload.email;

                // 4. เก็บข้อมูล line user
                const lineUser = {
                    line_id: userId,
                    line_name: displayName,
                    line_email: email,
                };
                localStorage.setItem("someData", JSON.stringify(lineUser));
                localStorage.setItem("lineUser", JSON.stringify(lineUser));
                localStorage.setItem("lineId", userId);
                console.log('🚀 ~ file: page.tsx:50 ~ checkLineId ~ lineId:', userId);
                // Store someData in cookies
                document.cookie = `lineId=${userId}; path=/; Secure; SameSite=Strict`;
                document.cookie = `lineName=${displayName}; path=/; Secure; SameSite=Strict`;
                document.cookie = `lineEmail=${email}; path=/; Secure; SameSite=Strict`;


                // 5. เช็คว่ามีบัญชีในระบบหรือไม่
                if (checkedId.data.access_token) {
                    try {

                        // const getProfile = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer`)
                        const getShop = await axios
                            .get(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/shop/getshop`, {
                                headers: {
                                    Authorization: `Bearer ${checkedId.data.access_token}`, // Correct header format
                                },
                            })
                            .then((shop) => {
                                const userDetails = axios
                                    .get(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/customer`, {
                                        headers: {
                                            Authorization: `Bearer ${checkedId.data.access_token}`, // Correct header format
                                        },
                                    })
                                    .then((detail) => {
                                        if (detail.data.status) {
                                            localStorage.setItem(
                                                "userDetails",
                                                JSON.stringify(detail.data.data) // Store user details in localStorage
                                            );
                                        }
                                    })
                                    .catch((error) => {
                                        console.error('Error fetching user details:', error);
                                    });
                                console.log(userDetails)
                                try {
                                    console.log('Shop data:', shop.data);
                                    const authShop = axios
                                        .post(
                                            `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/shop/oauth`,
                                            {
                                                shop_id: shop.data.data[0].id,
                                            },
                                            {
                                                headers: {
                                                    Authorization: `Bearer ${checkedId.data.access_token}`, // Correct header format
                                                },
                                            }
                                        )
                                        .then((auth) => {
                                            localStorage.setItem(
                                                `shop_list`,
                                                JSON.stringify(shop.data)
                                            );
                                            localStorage.setItem(
                                                "shop",
                                                JSON.stringify(shop.data[0])
                                            );

                                            const token = auth.data.data.access_token;
                                            const decoded = decodeJwt(token);
                                            localStorage.setItem("token", token);
                                            localStorage.setItem("token1", token);
                                            if (!decoded?.exp) {
                                                console.error("❌ Token ไม่มี field 'exp'");
                                                return;
                                            }
                                            const expires = new Date(decoded.exp * 1000).toUTCString();
                                            document.cookie = `token=${token}; Path=/; Expires=${expires}; Secure; SameSite=Strict`;
                                            setLoadingState(false);
                                            setTimeout(() => {
                                                router.push("/");
                                            }, 2000);
                                            // Calculate expiration time for the cookie
                                            if (decoded && typeof decoded.exp === 'number') {
                                                const expires = new Date(decoded.exp * 1000).toUTCString();
                                                document.cookie = `token=${token}; Path=/; Expires=${expires}; Secure; SameSite=Strict`;
                                            } else {
                                                console.error("Token ไม่มี exp หรือรูปแบบไม่ถูกต้อง");
                                            }
                                            setLoadingState(false);
                                            setTimeout(() => {
                                                router.push("/");
                                            }, 2000); // 1000ms = 1 second delay
                                        });
                                    console.log(authShop)
                                } catch (error) {
                                    console.error("Error during shop authentication:", error);
                                }
                            });
                        console.log(getShop)
                        const { token } = checkedId.data.access_token;
                        console.log('🚀 ~ file: page.tsx:56 ~ Callback ~ token:', token);
                        if (token) {
                            localStorage.setItem('token', token);
                            setLoadingState(false);
                            setTimeout(() => {
                                router.push('/ai');
                            }, 1500);
                        } else {
                            setTimeout(() => {
                                router.push('/signin');
                            }, 1500);
                        }
                    } catch (error) {
                        console.error('LINE Login Error:', error);
                        router.push('/signin');
                    }
                };

                exchangeCode();
            } catch (error) {
                console.error('Error during exchangeCode execution:', error);
                router.push('/signin');
            }
        };

        exchangeCode();
    }, [router, searchParams]); // Close the useEffect function


    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            {loadingState ? (
                <>
                    <Lottie
                        style={{ width: '300px', height: '300px', margin: '0 auto' }}
                        loop={true}
                        animationData={loading}
                    />
                    <p style={{ marginTop: '10px', color: '#555', fontSize: '25px' }}>
                        กำลังตรวจสอบข้อมูล...
                    </p>
                </>
            ) : (
                <>
                    <Lottie
                        style={{ width: '300px', height: '300px', margin: '0 auto' }}
                        loop={false}
                        animationData={complete}
                    />
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

import { Suspense } from "react";

const PageWrapper = () => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}>
    <Callback />
  </Suspense>
);

export default PageWrapper;
