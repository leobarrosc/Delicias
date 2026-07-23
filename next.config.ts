import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fixa a raiz do workspace nesta pasta. Sem isto o Next sobe a árvore
  // procurando lockfile, acha um solto em C:\Users\<user>\ e elege a pasta de
  // usuário inteira como raiz — o Tailwind v4 então varre o home atrás de
  // classes e o `next dev` trava no "Compiling /".
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Permite acessar o servidor de desenvolvimento por outros dispositivos da
  // rede local (http://192.168.1.x:3000). Sem isso, o Next 16 bloqueia os
  // bundles JS para origens fora de localhost e a página fica sem interação.
  // Vale apenas para `next dev`; não afeta produção/Vercel.
  allowedDevOrigins: ["192.168.1.8", "192.168.1.*"],
};

export default nextConfig;