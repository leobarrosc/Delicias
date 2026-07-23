"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Clock } from "@/components/clock";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { navigationItems } from "@/lib/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebar, setDesktopSidebar] = useState(true);
  const currentPage =
    navigationItems.find((item) => item.href === pathname) ?? navigationItems[0];

  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-500">
      {desktopSidebar ? (
        <div className="hidden w-64 shrink-0 md:block">
          <Sidebar activePath={pathname} />
        </div>
      ) : null}

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-64 overflow-y-auto">
            <Sidebar
              activePath={pathname}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
            className="absolute left-[17rem] top-4 inline-flex size-9 items-center justify-center rounded-md bg-card text-stone-700 shadow"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-300 bg-stone-100 px-4 py-2.5 md:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            className="inline-flex size-10 items-center justify-center rounded-md text-stone-700 transition hover:bg-stone-200 md:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setDesktopSidebar((current) => !current)}
            aria-label={desktopSidebar ? "Recolher menu" : "Expandir menu"}
            className="hidden size-10 items-center justify-center rounded-md text-stone-700 transition hover:bg-stone-200 md:inline-flex"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-1">
            <Clock />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Delícias
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold text-stone-950">
              {currentPage.label}
            </h1>
          </div>
          {children}
        </main>

        <footer className="border-t border-stone-300 bg-card px-4 py-3 text-right text-xs text-stone-500 md:px-6">
          Delícias — Gestão para confeiteiras
        </footer>
      </div>
    </div>
  );
}
