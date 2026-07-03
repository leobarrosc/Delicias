import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não foi configurada. Crie um arquivo .env na raiz do projeto seguindo o .env.example.",
  );
}

// Em serverless (Vercel), cada função abre seu próprio pool; um limite baixo
// evita esgotar os clientes do pooler do Supabase quando as funções escalam.
const adapter = new PrismaPg({
  connectionString,
  max: process.env.NODE_ENV === "production" ? 3 : 10,
});

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
