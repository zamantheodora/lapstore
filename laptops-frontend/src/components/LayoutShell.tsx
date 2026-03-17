"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import ChatWidget from "@/components/ChatWidget";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#dbeafe_0%,#eef2ff_28%,#e2e8f0_60%,#cbd5e1_100%)] text-slate-900">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <ChatWidget />
    </div>
  );
}
