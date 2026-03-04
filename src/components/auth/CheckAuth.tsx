'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
const CheckAuth = () => {
  const router = useRouter();
  const [loadingState, setLoadingState] = useState(true);

  useEffect(() => {
    const checkLineAccount = async () => {
      const lineId = localStorage.getItem('lineId');
      if (!lineId) {
        router.push('/signin');
        return;
      }

      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/auth/checklineid`,
          { line_id: lineId },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`,
            },
          }
        );

        const accessToken = res.data?.data?.access_token;
        if (!accessToken) {
          router.push('/signin');
          return;
        }

        // Get Shop & Customer info
        const shopRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/shop/getshop`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const customerRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/customer`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (customerRes.data.status) {
          localStorage.setItem('userDetails', JSON.stringify(customerRes.data.data));
        }

        // Auth shop
        const authShop = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/shop/oauth`,
          { shop_id: shopRes.data.data[0].id },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const token = authShop.data.data.access_token;
        const decoded = decodeJwt(token);
        const expires = new Date(decoded.exp * 1000).toUTCString();

        // Set everything
        localStorage.setItem('token', token);
        localStorage.setItem('shop', JSON.stringify(shopRes.data.data[0]));
        localStorage.setItem('shop_list', JSON.stringify(shopRes.data.data));
        document.cookie = `token=${token}; Path=/; Expires=${expires}; Secure; SameSite=Strict`;
        // Done
        setLoadingState(false);
        setTimeout(() => router.push('/'), 1500);
      } catch (error) {
        console.error('❌ Error in checkLineAccount:', error);
        router.push('/signin');
      }
    };

    checkLineAccount();
  }, [router]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      {loadingState ? (
        <>
          <Lottie style={{ width: '300px', height: '300px', margin: '0 auto' }} loop animationData={loading} />
          <p style={{ marginTop: '10px', color: '#555', fontSize: '25px' }}>กำลังตรวจสอบข้อมูล...</p>
        </>
      ) : (
        <>
          <Lottie style={{ width: '300px', height: '300px', margin: '0 auto' }} loop={false} animationData={complete} />
          <p style={{ marginTop: '10px', color: '#555', fontSize: '25px' }}>เข้าสู่ระบบสำเร็จ</p>
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

export default CheckAuth;
