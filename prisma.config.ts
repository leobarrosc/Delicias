import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// DIRECT_URL só é usado pela CLI do Prisma (db push / migrate). Em produção a
// integração do Neon na Vercel cria apenas DATABASE_URL — sem DIRECT_URL —, o
// que fazia o `prisma generate` do build quebrar com PrismaConfigEnvError.
// Caímos para DATABASE_URL quando DIRECT_URL não estiver definido.
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
