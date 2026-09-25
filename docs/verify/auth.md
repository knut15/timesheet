# 검증 기록 — 로그인·매장·초대

[← 문서 목차](../README.md) · 기준: [05-auth.md](../prd/05-auth.md), [06-store-invite.md](../prd/06-store-invite.md), `web-auth` 스킬 verify.md

실행일 2026-09-25. 테스트 코드는 `server/test/e2e.test.ts` 한 파일이다.

## 돌린 방법

| 환경 | 명령 | 결과 |
|---|---|---|
| 로컬 (Postgres 18.6 Docker, API `localhost:4200`) | `pnpm dev` 뒤 `pnpm test:e2e` | 11/11 통과 |
| 로컬, 세션 상한 5초 | `SESSION_MAX_AGE_SEC=5 PORT=4201` 로 띄우고 `S17=1 API=http://localhost:4201 pnpm test:e2e` | 1/1 통과 |
| 운영 (웹 주소로 요청 → rewrites → API, Neon DB) | `API`·`WEB_ORIGINS` 를 웹 주소, `DATABASE_URL` 을 운영 DB 로 | 아래 표 |

운영 검증에서 만든 테스트 계정(`@test.dev`)과 매장은 끝난 뒤 지웠다 (사용자 24명, 매장 2개).

## 시나리오별 결과

| # | 무엇 | 로컬 | 운영 | 비고 |
|---|---|---|---|---|
| S1·S2 | 가입, 대소문자만 다른 중복 → 409 `EMAIL_TAKEN` | ✅ | ✅ | |
| S3 | 로그인 쿠키 `Path=/api/auth; HttpOnly; Secure; SameSite=Strict; Expires`, `Cache-Control: no-store` | ✅ | ✅ | |
| S4 | 틀린 비밀번호·없는 이메일 둘 다 401 `INVALID_CREDENTIALS`, 시간 차 < 50ms | ✅ 36.8 / 36.3ms | ✅ 316.0 / 271.3ms | 운영 차이는 네트워크 편차 포함 |
| S5 | Bearer 없음·변조·다른 `aud` → 401 | ✅ | ✅ | 운영에는 로컬 JWT 비밀이 없어 "다른 aud" 는 서명 불일치로도 걸린다 |
| S6 | `alg:none` → 거부 | ✅ 401 | ✅ 403 | 운영은 **Vercel 방화벽이 앱에 닿기 전에 403 으로 막는다** (`x-vercel-mitigated: deny`). 서명 자리에 값을 넣으면 앱까지 와서 401 |
| S7 | 회전 — 새 쿠키, 옛 행 `rotated` + `replaced_by` | ✅ | ✅ | |
| S8 | 10초 안 옛 쿠키 → 409 `REFRESH_TOKEN_ROTATED`, 세션 유지 | ✅ | ✅ | |
| S9 | 10초 뒤 옛 쿠키 → 401 `REFRESH_TOKEN_REUSED`, 살아 있는 행 0, 정상 쿠키도 `REUSED` | ✅ | ✅ | |
| S10~S13 | CSRF 헤더 없음·위조(`abc.def`)·Origin 위조·Origin 없음 → 403 | ✅ | ✅ | Next rewrites 를 거쳐도 `Origin` 이 API 까지 전달된다 |
| S14 | 로그아웃 204, 삭제 쿠키에 `Path=/api/auth`, 멱등, 옛 쿠키는 `INVALID` | ✅ | ✅ | |
| S15·S16 | 세션 목록·전체 로그아웃 | — | — | 범위 밖 ([05](../prd/05-auth.md)) |
| S17 | 세션 상한 지나면 refresh 401 | ✅ | — | 운영 설정을 바꿔야 해서 로컬에서만 |
| S18 | 다른 출처 preflight 에 `Access-Control-Allow-Origin` 없음 | ✅ | ✅ | CORS 미들웨어를 두지 않았다 |
| S19 | 틀린 로그인 6번째 429 | ✅ | ✅ | |
| S20~S22 | 브라우저: 새로고침 유지, 탭 두 개 동시 만료, 로그아웃 동기화 | ❌ | ❌ | **미검증.** 브라우저 자동화로는 계정 생성·비밀번호 입력을 하지 않는다. 사람이 확인해야 한다 |
| S23 | 회전이 family 잠금을 기다리는 사이 옛 토큰 → 새 토큰까지 폐기 | ✅ | ✅ | 테스트가 DB 에서 잠금을 쥔 채 두 요청을 보낸 뒤 놓는다. 로컬은 최신 요청이 먼저(200→REUSED), 운영은 옛 요청이 먼저(REUSED, REUSED). 둘 다 살아 있는 행 0 |
| I-1~I-8 | 초대 코드 등록·재사용·만료·취소, 이중 소속, 권한 403, 다른 매장 404, 출퇴근, 대시보드 반영, 기록 수정·검증, 내보내기 | ✅ | ✅ | |

## 운영에서 알게 된 것

- **클라이언트 IP:** Vercel 은 클라이언트가 보낸 `X-Forwarded-For` 를 덮어쓴다. 테스트가 요청마다 다른 값을 넣었는데 DB `refresh_tokens.ip` 에는 실제 IP 하나만 남았다. 그래서 `trust proxy` 를 켜도 로그인 제한 키를 위조할 수 없다. 웹→API rewrites 를 거쳐도 실제 IP 가 유지된다.
- **로그인 제한 저장소:** 인스턴스 메모리다. Vercel 함수 인스턴스가 여럿이면 인스턴스마다 따로 센다. 같은 IP 로 테스트를 연달아 돌리면 S4·S19 의 실패가 쌓여 뒤 테스트의 로그인이 429 가 된다 — 운영에서 I-1 은 1분 쉬고 따로 돌렸다.

## 브라우저로 확인한 것

| 항목 | 결과 |
|---|---|
| 로그인하지 않고 `/admin` 접속 | `/login` 으로 이동 |
| 390px 폭 가로 스크롤 (D-6) | **미검증** — 창 크기 조절이 적용되지 않았다 |
| 대시보드·멤버·초대·매장 화면 (D-1~D-5) | **화면으로는 미검증.** 같은 데이터 경로는 I-7(대시보드 API 에 열린 기록)로 확인 |
