---
name: timesheet-auth
description: >
  timesheet 로그인 인증 — 액세스·리프레시 토큰을 둘 다 HttpOnly 쿠키로 두고 30일 슬라이딩 세션으로 로그인을 유지한다.
  "로그인", "로그인 유지", "로그아웃", "세션", "토큰", "쿠키", "CSRF", "401" 이 나오거나 인증 코드를 고칠 때 먼저 읽는다.
---

# timesheet 인증 — 쿠키 세션

전역 스킬 `web-auth` 의 **cookie-session 변형**(`~/.claude/skills/web-auth/references/cookie-session.md`)을 이 프로젝트에 적용한 것이다.
2026-09-25 사용자 결정: "액세스토큰으로 쿠키에 담고 리프레시 토큰으로 유지", 유지 기간은 "쓰는 동안 계속(슬라이딩)".

## 1. 쿠키

| 이름 | 속성 | 수명 |
|---|---|---|
| `access_token` | `HttpOnly; Secure; SameSite=Strict; Path=/api` | 10분 (`ACCESS_TOKEN_TTL_SEC`) |
| `refresh_token` | `HttpOnly; Secure; SameSite=Strict; Path=/api/auth` | 30일, 회전마다 새로 (`REFRESH_TOKEN_TTL_SEC`) |
| `csrf_token` | `HttpOnly; Secure; SameSite=Strict; Path=/` | 2시간 |

- 토큰은 응답 **본문에 없다**. 로그인·refresh 응답은 `{ expiresIn, user }`
- 서버는 `Authorization` 헤더를 **받지 않는다**. `requireAuth` 는 `access_token` 쿠키만 읽는다 (`server/src/auth/guard.ts`)
- 삭제는 설정과 같은 옵션 객체로 (`clearAuthCookies`)

## 2. 로그인 유지 — 슬라이딩 세션

```
부팅 → GET /api/users/me (쿠키)
         200 → 로그인 상태
         401 → POST /api/auth/refresh (쿠키 + CSRF) → 성공하면 /users/me 다시
                                                   실패하면 로그인 화면
```

- refresh 할 때마다 `session_expires_at = now + SESSION_MAX_AGE_SEC(30일)` 로 **다시 잡는다** (`server/src/auth/refresh.ts`). 안 쓰고 30일이 지나면 끊긴다
- 회전·재사용 탐지·grace·advisory lock 은 `web-auth` 스킬 그대로 — 바꾸지 않는다

## 3. CSRF — 모든 변경 요청

액세스 토큰이 쿠키라 브라우저가 자동으로 싣는다. 그래서 **POST·PUT·PATCH·DELETE 전부**에 Origin 검사 + 서명된 `X-CSRF-Token` 을 건다 (`server/src/app.ts` 의 전역 미들웨어).
라우트마다 `csrfGuard` 를 따로 붙이지 않는다 — 빠뜨리는 라우트가 생긴다.

FE 는 `authFetch`(`web/src/auth/session.ts`)가 변경 요청에 헤더를 자동으로 붙이고, `CSRF_TOKEN_INVALID` 면 토큰을 새로 받아 1회 재시도한다.
계약(OpenAPI)에서 `x-csrf-token` 이 optional 인 이유가 이것이다 — 필수로 두면 생성 타입이 모든 호출에 헤더를 요구한다.

## 4. FE 규칙 — `web/src/auth/session.ts`

| 규칙 | 이유 |
|---|---|
| JS 는 토큰을 보지 않는다. 세션 상태(`me`)와 CSRF 토큰만 안다 | XSS 가 토큰을 빼 가지 못하게 |
| 부팅은 `bootSession()` — `/users/me` 먼저, 401 이면 refresh | 액세스 쿠키가 살아 있으면 refresh 요청조차 없다 |
| refresh 는 single-flight + `navigator.locks` | 탭끼리 쿠키를 공유 — 잠금 없이는 재사용 탐지 오탐 |
| 401 이면 refresh 후 1회만 재시도 | 무한 루프 방지 |
| 로그인·로그아웃은 `BroadcastChannel("auth")` 로 다른 탭에 알린다 | |

## 5. 검증 — `server/test/e2e.test.ts`

| 시나리오 | 무엇 |
|---|---|
| S3 | 두 쿠키의 속성, 본문에 토큰 없음 |
| S5·S6 | 쿠키 없음·변조·다른 aud·alg none → 401, **Bearer 헤더만 → 401** |
| X-1 | CSRF 없는 `POST /api/stores` → 403, 위조 Origin → 403 |
| X-2 | refresh 가 새 access 쿠키, 로그아웃이 둘 다 삭제 |
| S7~S9·S23 | 회전·grace·재사용 탐지 (web-auth 그대로) |
| S17·S17b | `SESSION_MAX_AGE_SEC=5` 서버에서: 안 쓰면 401, 3초마다 쓰면 9초에도 유지 |

브라우저 시나리오(새로고침 유지, 탭 두 개, 로그아웃 동기화)는 자동화로 로그인하지 않으므로 사람이 확인한다.

## 6. 이 스킬을 갱신하는 때

인증 코드를 고친 커밋에 아래 중 해당하는 갱신이 같이 들어간다. 사용자가 따로 말하지 않아도 한다.

| 바뀐 것 | 고칠 곳 |
|---|---|
| 쿠키 이름·속성·수명 | 1절 표, `docs/prd/05-auth.md` |
| 세션 유지 방식 | 2절, `docs/prd/05-auth.md` |
| CSRF 적용 범위 | 3절 |
| FE 세션 흐름 | 4절 |
| 테스트 | 5절, `docs/verify/auth.md` |
| 이 프로젝트를 넘어 일반화할 교훈 | `web-auth` 스킬의 `references/cookie-session.md` |
