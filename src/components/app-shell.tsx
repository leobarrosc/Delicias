"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { navigationItems } from "@/lib/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const currentPage =
    navigationItems.find((item) => item.href === pathname) ?? navigationItems[0];

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-950 md:flex-row">
      <Sidebar activePath={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-stone-200 bg-white px-5 py-5 md:px-8">
          <p className="text-sm font-medium text-brand-700">Delícias</p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-950">
            {currentPage.label}
          </h1>
        </header>
        <main className="flex-1 px-5 py-6 md:px-8 md:py-7">{children}</main>
      </div>
    </div>
  );
}
