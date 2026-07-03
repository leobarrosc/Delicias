import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  Cookie,
  LayoutDashboard,
  Settings,
  ShoppingBasket,
  Users,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Insumos", href: "/insumos", icon: ShoppingBasket },
  { label: "Receitas", href: "/receitas", icon: Cookie },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Pedidos", href: "/pedidos", icon: ClipboardList },
  { label: "Financeiro", href: "/financeiro", icon: BarChart3 },
  { label: "Configura\u00e7\u00f5es", href: "/configuracoes", icon: Settings },
];