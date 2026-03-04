'use client'

import { IBM_Plex_Sans_Thai } from 'next/font/google'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import './globals.css'
import { SidebarProvider } from '@/context/SidebarContext'
import { ThemeProvider } from '@/context/ThemeContext'
import BgEffect from '@/components/bgEffect/BgEffect'
import BgEffect2 from '@/components/bgEffect2/BgEffect2'
// import { fetchDataProfile } from '@/utils/getprofile'
// import { Customer } from '../types/customer'

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ['400'],
  subsets: ['thai'],
  variable: '--font-ibm-plex-sans-thai',
});

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAiChat = pathname === '/aichat'

  // useEffect(() => {
  //   const setUserDataProfile = (customer: Customer) => {
  //     console.log("User profile set:", customer)
  //   };

  //   if (!localStorage.getItem('profileUser')) {
  //     fetchDataProfile(setUserDataProfile)
  //   }
  // }, [])

  return (
    <div
      className={`${ibmPlexSansThai.className} ${isAiChat ? '' : 'bg-[#F2F8FD]'} dark:bg-gray-900`}
    >
      <ThemeProvider>
        <SidebarProvider>
          <div className="relative">
            <BgEffect />
            <BgEffect2 />
            {children}
          </div>
        </SidebarProvider>
      </ThemeProvider>
    </div>
  )
}
