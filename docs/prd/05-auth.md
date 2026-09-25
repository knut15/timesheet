# 05. 로그인 (가입·로그인·세션)

[← PRD 개요](README.md) · 매장·초대는 [06-store-invite.md](06-store-invite.md)

## 목표

이메일·비밀번호로 가입하고 로그인한다. 새로고침해도 로그인이 유지되고, 탈취된 토큰은 탐지해 끊는다.
외부 인증 서비스를 쓰지 않고 `server/` 에 직접 구현한다.

설계는 전역 스킬 `web-auth` 를 그대로 따른다. 아래는 이 프로젝트에 맞춘 값이다.

## 토폴로지

| 항목 | 값 |
|---|---|
| FE 출처 | `https://timesheet-brown-ten.vercel.app` (로컬 `http://localhost:3200`) |
| API | `server/` (Express). FE 가 Next.js rewrites 로 `/api/*` 를 API 로 넘긴다 |
| 관계 | 브라우저 기준 **같은 출처**. CORS 가 필요 없고 `SameSite=Strict` 가 그대로 동작한다 |
| 경로 접두사 | `/api/auth/*`, `/api/users/*` — 리프레시 쿠키 `Path=/api/auth` |

FE 와 API 를 서로 다른 `*.vercel.app` 주소로 직접 부르면 **다른 사이트**가 된다(`vercel.app` 은 공개 접미사 목록에 있다).
그러면 `SameSite=None` 이 강제되고 Safari 가 쿠키를 막는다. 그래서 프록시로 같은 출처를 만든다.

## 토큰·쿠키

| 항목 | 값 |
|---|---|
| 액세스 토큰 | JWT HS256, 10분, 클레임 `sub`·`sid`·`jti`·`iss`·`aud`. 응답 본문으로 주고 FE 메모리에만 둔다 |
| 리프레시 토큰 | 32바이트 난수, DB 에 SHA-256 해시만. 쿠키 `refresh_token; HttpOnly; Secure; SameSite=Strict; Path=/api/auth`, 최대 14일 |
| 회전 | refresh 마다 새로 발급, 옛 것은 `rotated`. 10초 뒤 옛 것이 다시 오면 세션 전체 폐기 (`REFRESH_TOKEN_REUSED`) |
| 세션 상한 | 첫 로그인부터 30일 |
| CSRF | `login`·`refresh`·`logout` 에 SameSite + Origin 검사 + 서명된 `X-CSRF-Token` |
| 비밀번호 | argon2id (`m=19456, t=2, p=1`), 8자 이상 |
| 로그인 제한 | IP 당 1분 5회 실패 → 429 |

## 엔드포인트

| 메서드·경로 | 인증 | CSRF | 설명 |
|---|---|---|---|
| `GET /api/auth/csrf` | — | — | CSRF 토큰 발급 |
| `POST /api/auth/signup` | — | — | `{ email, password, nickname }` → 201 |
| `POST /api/auth/login` | — | ✅ | 200 토큰 + 리프레시 쿠키 |
| `POST /api/auth/refresh` | 쿠키 | ✅ | 회전 |
| `POST /api/auth/logout` | 쿠키 | ✅ | 204, 멱등 |
| `GET /api/users/me` | Bearer | — | 내 정보 + 소속 매장·역할 |

에러 응답은 `{ statusCode, code, message }` 이고 FE 는 `code` 로 분기한다. 코드 목록은 `web-auth` 스킬의 api-contract 와 같다.
API 문서(OpenAPI)는 `server` 가 `/api/docs` 로 낸다 (운영에서는 끈다).

세션 목록·전체 로그아웃(`/auth/sessions`, `/auth/logout-all`)은 이번 범위에서 뺀다.

## 화면

| 경로 | 내용 |
|---|---|
| `/login` | 이메일·비밀번호. "가입하기" 링크 |
| `/signup` | 이메일·비밀번호·이름. 가입 뒤 바로 로그인한다 |
| 로그인 뒤 | 소속이 없으면 `/onboarding` ([06](06-store-invite.md)), 마스터면 `/admin`, 멤버면 `/` |

## 수용 기준

`web-auth` 스킬 verify.md 의 S1~S14, S19~S22 를 돌리고 결과를 [docs/verify/auth.md](../verify/auth.md) 에 남긴다.
S15·S16(세션 목록·전체 로그아웃)은 범위 밖이라 뺀다.
