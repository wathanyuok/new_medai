"use client"
import GridShape from "@/components/common/GridShape";


import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()

  const isAiChat = pathname === '/callback' || pathname === '/checkAuth'
  return (
    <div className="relative bg-white  z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row h-dvh w-full justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {!isAiChat && (
            <div className="lg:w-1/2 w-full h-full bg-gradient-to-br  dark:bg-white/5 lg:grid items-center hidden">
              <div className="relative items-center justify-center flex z-1">
                {/* <!-- ===== Common Grid Shape Start ===== --> */}
                <GridShape />
                <div className="flex flex-col items-center max-w-xs">
                  <Link href="/ai" className="block mb-4">
                    <Image
                      width={400}
                      height={48}
                      src="/images/logo/logo.svg"
                      alt="Logo"
                    />
                  </Link>
                  {/* <p className="text-center text-gray-400 dark:text-white/60">
                Free and Open-Source Tailwind CSS Admin Dashboard Template
                </p> */}
                </div>
              </div>

            </div>
          )}
          {/* <BgEffect /> */}
          {children}

          {/* <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div> */}
        </div>

        <footer className="w-full border-t sm:bottom-0 sm:fixed border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#4385EF]  to-[#E474DD] dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm px-4 py-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
            <p className="text-center sm:text-left text-white">
              <a
                className="hover:underline text-white"
                href="https://exa-med.co"
                target="_blank"
                rel="noopener noreferrer"
              >
                © {new Date().getFullYear()} Exa-med.co. All rights reserved.
              </a>
            </p>
            <div className="flex space-x-4 mt-2 sm:mt-0">
              <Link href="" className="hover:underline text-white">
                Privacy Policy
              </Link>
              <Link href="" className="hover:underline text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </ThemeProvider>

    </div>
  );
}
