import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tema dark do Gentelella v4: teal brilhante como acento.
        // 50/100 são tintas escuras para chips; 500+ são os tons vivos.
        brand: {
          50: "#0C2B27",
          100: "#0F3D37",
          500: "#2DD4BF",
          600: "#14B8A6",
          700: "#0FA795",
        },
        // Superfície dos cards/painéis (um passo acima do fundo da página).
        card: "#111A2C",
        // Escala stone invertida para o dark: classes de fundo claras viram
        // navy escuro e classes de texto escuras viram claras — reskina a
        // aplicação inteira sem tocar classe por classe.
        stone: {
          50: "#0B1220",
          100: "#0F172A",
          200: "#1D2A3F",
          300: "#2A3A54",
          400: "#54657E",
          500: "#8B9BB4",
          600: "#A9B7CC",
          700: "#DCE4F0",
          800: "#0D1526",
          900: "#EAF0F8",
          950: "#F7FAFC",
        },
        // Cores de status em versão dark: fundo tintado escuro, texto claro.
        amber: {
          50: "#2E2109",
          200: "#5B4108",
          400: "#FBBF24",
          700: "#FBBF24",
          800: "#FCD34D",
        },
        sky: {
          50: "#0A2438",
          400: "#38BDF8",
          700: "#60C5F8",
        },
        emerald: {
          50: "#07291D",
          200: "#065F46",
          700: "#34D399",
        },
        red: {
          50: "#331118",
          200: "#7F1D1D",
          700: "#F87171",
        },
      },
    },
  },
  plugins: [],
};

export default config;