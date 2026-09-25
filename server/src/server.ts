import { app } from "./app.js";
import { env } from "./env.js";
import { logger } from "./logger.js";

// 로컬 실행용. Vercel 은 이 파일이 아니라 src/app.ts 의 기본 내보내기를 쓴다.
if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "listening");
  });
}
