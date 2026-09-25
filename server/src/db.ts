import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

// 로고 바이트(최대 1MB)가 매장을 읽는 모든 조회에 딸려 오지 않게 기본으로 뺀다. 로고 라우트만 omit: { logo: false } 로 읽는다.
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  omit: { store: { logo: true } },
});
