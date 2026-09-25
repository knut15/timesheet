import { existsSync } from "node:fs";
import { z } from "zod";

// 배포 환경에는 .env 파일이 없다. 플랫폼이 환경변수를 직접 넣어 준다.
if (existsSync(".env")) process.loadEnvFile(".env");

const bool = z.enum(["true", "false"]).transform((v) => v === "true");

export const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().default(4200),
    JWT_ACCESS_SECRET: z.string().min(32),
    CSRF_SECRET: z.string().min(32),
    // FE 출처 목록(쉼표 구분). CSRF Origin 검사에 쓴다.
    WEB_ORIGINS: z.string().transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
    COOKIE_SECURE: bool.default(true),
    SWAGGER_ENABLED: bool.default(false),
    ACCESS_TOKEN_TTL_SEC: z.coerce.number().default(600),
    REFRESH_TOKEN_TTL_SEC: z.coerce.number().default(30 * 86_400),
    // 슬라이딩 세션: 마지막 refresh 뒤 이 시간 동안 안 쓰면 끊긴다. 회전할 때마다 다시 잡는다 (docs/prd/05-auth.md)
    SESSION_MAX_AGE_SEC: z.coerce.number().default(30 * 86_400),
  })
  .parse(process.env);

export const JWT_ISSUER = "timesheet-api";
export const JWT_AUDIENCE = "timesheet-web";
