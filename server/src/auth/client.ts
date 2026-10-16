// 네이티브 앱 요청 구분 (docs/prd/14-native-app.md, 2026-10-15 사용자 결정 "앱 전용 토큰 방식 추가").
// 앱에는 브라우저 쿠키가 없다 — `X-Client: native` 요청은 쿠키를 읽지도 쓰지도 않고, 토큰을 본문·Authorization 헤더로 주고받는다.
// 브라우저가 다른 출처에서 이 헤더를 붙이려면 CORS 사전 요청을 거쳐야 하는데 이 서버는 CORS 를 열지 않는다.
// 그래서 이 헤더가 붙은 요청에는 CSRF 검사를 하지 않는다. 쿠키를 아예 보지 않으므로 피해자 쿠키를 빌려 쓸 수도 없다.
import type { Request } from "express";

export const isNative = (req: Request) => req.headers["x-client"] === "native";

/** `Authorization: Bearer <토큰>` 에서 토큰만. 없으면 null */
export function bearerToken(req: Request): string | null {
  const h = req.headers.authorization;
  if (typeof h !== "string" || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}
