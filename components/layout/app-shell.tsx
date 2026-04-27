"use client";

import { SiteBackground } from "@/components/layout/site-background";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteBackground />
      <div className="relative z-[1] flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}
