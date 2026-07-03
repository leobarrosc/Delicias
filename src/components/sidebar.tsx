import Link from "next/link";
import { CakeSlice } from "lucide-react";
import { navigationItems } from "@/lib/navigation";

type SidebarProps = {
  activePath: string;
};

export function Sidebar({ activePath }: SidebarProps) {
  return (
    <aside className="flex w-full flex-col border-b border-stone-200 bg-white px-4 py-4 md:min-h-screen md:w-72 md:border-b-0 md:border-r md:px-5 md:py-6">
      <Link href="/" className="mb-4 flex items-center gap-3 md:mb-8">
        <span className="flex size-11 items-center justify-center rounded-lg bg-brand-600 text-white">
          <CakeSlice className="size-6" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-lg font-semibold text-stone-950">Delícias</span>
          <span className="block text-sm text-stone-500">{"Gest\u00e3o para confeiteiras"}</span>
        </span>
      </Link>

      <nav
        className="flex gap-2 overflow-x-auto pb-1 md:flex-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0"
        aria-label="Menu principal"
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-stone-700 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              <Icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
