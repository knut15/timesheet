import cookieParser from "cookie-parser";
import express, { type RequestHandler } from "express";
import helmetImport from "helmet";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./auth/routes.js";
import { openApiDocument } from "./contract.js";
import { env } from "./env.js";
import { errorHandler } from "./errors.js";
import { shiftRouter } from "./shifts/routes.js";
import { storeRouter } from "./stores/routes.js";

// Vercel 빌더의 타입 검사는 helmet 의 기본 내보내기를 모듈 객체로 잡는다(로컬 tsc 는 아니다).
// 런타임은 ESM·CJS 모두 함수다 — helmet 의 index.cjs 가 module.exports.default 를 자기 자신으로 둔다.
const helmet = helmetImport as unknown as () => RequestHandler;

export const app = express();

// Vercel 과 Next.js rewrites 뒤에 있다. X-Forwarded-For 의 첫 값을 클라이언트 IP 로 본다 (로그인 제한 키).
app.set("trust proxy", true);
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

if (env.SWAGGER_ENABLED) {
  const doc = openApiDocument();
  app.get("/api/docs-json", (_req, res) => res.json(doc));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(doc));
}

app.use("/api", authRouter, storeRouter, shiftRouter);
app.use(errorHandler);

// Vercel 은 src/app.ts 를 server.ts 보다 먼저 진입점으로 고른다. 기본 내보내기가 앱이어야 한다.
export default app;
