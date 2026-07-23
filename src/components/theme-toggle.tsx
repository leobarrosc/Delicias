"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "delicias-theme";
const LIGHT = "delicias";
const DARK = "delicias-dark";

/**
 * Alterna entre o tema diurno (capuccino) e o noturno (chocolate amargo).
 * A escolha é gravada em localStorage e reaplicada pelo script inline do
 * layout, antes da primeira pintura, para não piscar o tema errado.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<string>(LIGHT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") ?? LIGHT;
    setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === DARK ? LIGHT : DARK;
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage indisponível (modo privado) — a troca vale só na sessão.
    }
    setTheme(next);
  }

  const isDark = theme === DARK;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
      className="inline-flex size-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-200"
    >
      {/* Antes de montar, renderiza o ícone padrão para não divergir do SSR. */}
      {mounted && isDark ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
