"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { usePathname } from "next/navigation";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  const pathname = usePathname()

  const blockpath = ['/ai/print/lab-page', '/ai/print/xray-page', '/ai/print/xray/queue_id'].includes(pathname) || pathname.startsWith('/ai/print/lab') || pathname.startsWith('/ai/print/xray');
  return (
    <div className={`min-h-screen ${blockpath ? ' ' : 'xl:flex'}`}>
      {/* Sidebar and Backdrop */}
      {!blockpath && (
        <AppSidebar />
      )}
      {!blockpath && (
        <Backdrop />
      )}
      {/* Main Content Area */}
      <div
        className={`${blockpath ? '' : 'flex-1'} transition-all duration-300 ease-in-out ${blockpath ? ' ' : `${mainContentMargin}`}`}
      >
        {/* Header */}
        {!blockpath && (
          <AppHeader />
        )}
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>

      </div>
    </div>
  );
}
