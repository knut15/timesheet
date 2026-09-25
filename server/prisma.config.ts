// Prisma 7 부터 연결 주소는 스키마가 아니라 여기에 둔다.
// .env 는 파일이 있을 때만 읽는다. 배포 환경에는 없는 것이 정상이다.

import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
