"use client";

import { Suspense, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function SidebarFallback() {
  return (
    <aside className="hidden h-screen w-64 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:block">
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-1 px-3 py-4">
          <div className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    </aside>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SessionProvider>
      <AuthGuard>
        <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
          <Suspense fallback={<SidebarFallback />}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </Suspense>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
        </div>
      </AuthGuard>
    </SessionProvider>
  );
}
