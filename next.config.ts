import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acessar o servidor de desenvolvimento por outros dispositivos da
  // rede local (http://192.168.1.x:3000). Sem isso, o Next 16 bloqueia os
  // bundles JS para origens fora de localhost e a página fica sem interação.
  // Vale apenas para `next dev`; não afeta produção/Vercel.
  allowedDevOrigins: ["192.168.1.8", "192.168.1.*"],
};

export default nextConfig;