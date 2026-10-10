import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = String(process.env.DATABASE_URL || "").trim();
if (!/^postgres(ql)?:\/\//i.test(connectionString)) {
  throw new Error(
    "DATABASE_URL 必须是 Supabase PostgreSQL 连接字符串。运行时请使用 Supabase transaction pooler（通常端口 6543）；迁移用 DIRECT_URL。",
  );
}

const adapter = new PrismaPg({
  connectionString,
  max: Math.max(1, Number(process.env.DATABASE_CONNECTION_LIMIT || 3)),
  connectionTimeoutMillis: Math.max(1000, Number(process.env.DATABASE_CONNECT_TIMEOUT || 10000)),
  idleTimeoutMillis: Math.max(1000, Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 10000)),
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
