import "dotenv/config";
import { prisma } from "../lib/prisma";

function safeDbInfo() {
  const url = String(process.env.DATABASE_URL || "").trim();
  if (url) {
    try {
      const parsed = new URL(url);
      return {
        source: "DATABASE_URL",
        host: parsed.hostname,
        port: Number(parsed.port || 5432),
        user: parsed.username || "<empty>",
        database: parsed.pathname.replace(/^\//, "") || "<empty>",
      };
    } catch {
      return { source: "DATABASE_URL", error: "DATABASE_URL 格式无法解析" };
    }
  }

  return {
    source: "DATABASE_URL (Supabase PostgreSQL)",
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER || "<empty>",
    database: process.env.DATABASE_NAME || "ai",
  };
}

async function main() {
  console.log("[DB] 连接配置:", safeDbInfo());
  const result = await prisma.$queryRawUnsafe<Array<{ ok: number }>>(
    "SELECT 1 AS ok"
  );
  console.log("[DB] SELECT 1:", result);

  const siteSetting = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  console.log("[DB] siteSetting(id=1):", siteSetting ? "OK" : "未找到记录（数据库已连接）");
}

main()
  .catch((error) => {
    console.error("[DB] 连接测试失败");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
