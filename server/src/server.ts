import { existsSync } from "node:fs";
import express from "express";
import pino from "pino";

// 배포 환경에는 .env 파일이 없다. 플랫폼이 환경변수를 직접 넣어 준다.
if (existsSync(".env")) process.loadEnvFile(".env");

const logger = pino();
const port = Number(process.env.PORT ?? 4200);

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  logger.info({ port }, "listening");
});
