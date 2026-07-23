import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fredoka",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Delícias",
  description: "Sistema web para gestão de confeitaria.",
};

/**
 * Aplica o tema salvo antes da primeira pintura. Sem isto a página abriria
 * no tema padrão e piscaria para o escolhido assim que o React montasse.
 */
const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("delicias-theme");
    if (saved !== "delicias" && saved !== "delicias-dark") {
      saved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "delicias-dark"
        : "delicias";
    }
    document.documentElement.setAttribute("data-theme", saved);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "delicias");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="delicias"
      className={`${nunito.variable} ${fredoka.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
