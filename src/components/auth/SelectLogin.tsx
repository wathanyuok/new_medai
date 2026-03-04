"use client";
import liff from "@line/liff";
import Image from 'next/image';
import Link from "next/link";
import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';

const SelectLogin: React.FC = () => {
  useEffect(() => {
  });
  const [loading, setLoading] = useState(false);
  console.log('loading', loading)
  useEffect(() => {
    const liffId = `${process.env.NEXT_PUBLIC_LIFF_KEY || '2006526342-OEYmV1wW'}`;
    if (!liffId) {
      console.error(
        "LIFF ID is not defined. Please set NEXT_PUBLIC_LIFF_KEY in your environment variables."
      );
      return;
    }

    liff
      .init({ liffId })
      .then(() => {
        console.log("LIFF initialized successfully.");
      })
      .catch((err) => {
        console.error("Error initializing LIFF:", err);
      });
  }, []);

  const handleLoginLine = async () => {
    try {
      const liffId = `${process.env.NEXT_PUBLIC_LIFF_KEY || '2006526342-OEYmV1wW'}`;
      if (!liffId) {
        throw new Error(
          "LIFF ID is not defined. Please set NEXT_PUBLIC_LIFF_KEY in your environment variables."
        );
      }
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
  };
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, []);
  return (
    <section className="flex flex-col flex-1 items-center justify-center lg:w-1/2 w-full px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Image
            width={80}
            height={48}
            src="/images/logo/logo.svg"
            alt="Logo"
            className="mx-auto mb-4"
          />
        </div>

        {/* Form */}
        <button onClick={() => { window.location.href = "signin-co" }} className="w-full inline-flex items-center justify-center gap-3 py-3 px-7  text-[14px] .font-bold text-white transition bg-[linear-gradient(90.48deg,_rgb(247,58,187)_0.55%,_rgb(221,163,255)_179.33%)] rounded-lg">
          เข้าสู่ระบบด้วยอีเมล์
        </button>
        <div className="w-full my-4">
          <span className="flex justify-center">หรือ</span>
        </div>
        <button onClick={handleLoginLine} className="w-full inline-flex items-center justify-center gap-3 py-1.5 px-7 text-[14px] .font-bold text-white transition bg-[#06C755] hover:bg-[#06C755]/90 active:bg-[#06C755]/70 rounded-lg">
          <Image
            width={32}
            height={32}
            src="/images/logo/line_64.png"
            alt="LINE"
          />
          เข้าสู่ระบบด้วย LINE
        </button>
      </div>
      <div className="mt-4 text-center text-sm text-gray-700 dark:text-gray-400">
        ยังไม่มีบัญชีใช่ไหม?
        <Link
          href="register"
          className="ml-1 font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ลงทะเบียนกับ EXA MED+
        </Link>
      </div>
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
    </section>
  );
};

export default SelectLogin;
