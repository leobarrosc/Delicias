import Link from "next/link";
import { CakeSlice, ChevronRight } from "lucide-react";
import { navigationItems } from "@/lib/navigation";

type SidebarProps = {
  activePath: string;
  onNavigate?: () => void;
};

export function Sidebar({ activePath, onNavigate }: SidebarProps) {
  return (
    // A sidebar não usa a ponte `stone-*`: o fundo é `neutral`, que é escuro nos
    // dois temas, enquanto `stone-*` mapeia para `base-content`, que inverte.
    // No tema claro isso dava texto escuro sobre marrom escuro (1.15:1). Aqui o
    // par correto é neutral / neutral-content.
    <aside className="flex h-full min-h-screen w-full flex-col border-r border-base-300 bg-neutral text-neutral-content/70">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 border-b border-white/10 px-4 py-4"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-content">
          <CakeSlice className="size-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-lg font-semibold text-neutral-content">
            Delícias
          </span>
          <span className="block text-xs text-neutral-content/60">
            Gestão para confeiteiras
          </span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto py-4" aria-label="Menu principal">
        <h3 className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-content/60">
          Geral
        </h3>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 py-2.5 pr-4 text-sm transition ${
                isActive
                  ? "border-l-4 border-primary bg-black/40 pl-3 font-medium text-neutral-content"
                  : "pl-4 text-neutral-content/70 hover:bg-white/5 hover:text-neutral-content"
              }`}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Lobby da usuária, fixo no rodapé esquerdo. */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-white/5"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-content">
            C
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-neutral-content">
              Confeiteira Delícias
            </span>
            <span className="block text-xs text-neutral-content/60">Minha conta</span>
          </span>
          <ChevronRight className="size-4 text-neutral-content/60" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
