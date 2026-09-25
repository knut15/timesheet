# timesheet

![Express](https://img.shields.io/badge/Express-5.2.1-000000?style=flat-square&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-4.6.5-3E67B1?style=flat-square&logo=zod&logoColor=white)
![Pino](https://img.shields.io/badge/Pino-10.3.1-687634?style=flat-square&logo=pino&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.6-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.10.0-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.3.6-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=flat-square&logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11.20.0-F69220?style=flat-square&logo=pnpm&logoColor=white)

파트타임 근무자의 출퇴근 기록과 급여를 관리하는 앱이다. 로그인부터 배포까지 직접 구현하는 것이 목표다.

사장(마스터)이 매장을 만들고 초대 코드로 알바생(멤버)을 불러들인다. 알바생은 매장 50m 안에 들어가면 출근 알림을 받고, 급여는 시급 + 주휴수당 + 연장근로 가산으로 계산된다.

| | 주소 |
|---|---|
| 웹 | https://timesheet-brown-ten.vercel.app |
| API | https://timesheet-api-hazel.vercel.app (웹이 `/api/*` 를 넘긴다) |

## 무엇으로 만들었나

서버와 클라이언트를 pnpm 워크스페이스 하나에서 관리한다.

| 폴더 | 패키지 | 역할 |
|---|---|---|
| `server/` | `timesheet-server` | Express API. Prisma 로 Postgres 에 붙는다. 로그인(쿠키 세션·argon2·CSRF)·매장·초대·근무 기록·수정 요청·휴가·대타 |
| `web/` | `timesheet-web` | Next.js App Router. 멤버 화면 `/`, 마스터 관리 화면 `/admin`. `/api/*` 를 rewrites 로 서버에 넘긴다 |

- 급여 계산은 `web/src/lib/pay.ts` 한 곳에만 있다. 서버는 기록과 조건만 내려준다
- API 계약은 `server/src/contract.ts`(zod)에서 `docs/api/openapi.json` 으로 내보내고, 웹은 그 파일로 타입을 만든다

문서는 [docs/](docs/README.md) 에 있다.

## 돌려 보기

Docker 와 pnpm 이 필요하다.

```bash
pnpm install

# DB (Postgres 18.6, 호스트 포트 5434)
cp server/.env.example server/.env
# server/.env 의 JWT_ACCESS_SECRET·CSRF_SECRET 에 서로 다른 값을 넣는다: openssl rand -base64 48
pnpm --filter timesheet-server db:up
pnpm --filter timesheet-server exec prisma migrate deploy

# 서버 → http://localhost:4200/health, API 문서 /api/docs
pnpm dev:server

# 웹 → http://localhost:3200
pnpm dev:web
```

| 검사 | 명령 |
|---|---|
| 타입 | `pnpm typecheck` |
| 급여·알림 단위 테스트 | `pnpm --filter timesheet-web test` |
| API e2e (서버가 떠 있어야 한다) | `pnpm --filter timesheet-server test:e2e` |

## 어디까지 왔나

| 항목 | 상태 |
|---|---|
| 워크스페이스·DB·서버·웹 뼈대 | 완료 |
| 웹 MVP (출퇴근·급여·50m 출근 알림, localStorage) | 완료 — [docs/prd](docs/prd/README.md) |
| 서버 연동 — 매장·초대 코드·근무 기록 | 완료 |
| 로그인 (JWT 직접 구현, 리프레시 회전·재사용 탐지) | 완료 — [검증 기록](docs/verify/auth.md) |
| 마스터 관리 화면·대시보드 | 완료 |
| 화면 셸 — 헤더·하단 내비(lucide)·멤버 아바타 | 완료 — 규칙은 [`.claude/skills/timesheet-ui`](.claude/skills/timesheet-ui/SKILL.md) |
| 기록 수정 요청·승인, 휴가·대타 근무 | 완료 — [PRD 08](docs/prd/08-correction-requests.md)·[09](docs/prd/09-leave-substitution.md), 스킬 [`timesheet-requests`](.claude/skills/timesheet-requests/SKILL.md) |
| 로그인 유지 — 쿠키 세션(액세스·리프레시 모두 HttpOnly 쿠키), 30일 슬라이딩 | 완료 — 스킬 [`timesheet-auth`](.claude/skills/timesheet-auth/SKILL.md) |
| 근무 달력 — 마스터는 전체 멤버, 멤버는 본인 | 배포 — 실화면 확인 대기 ([PRD 10](docs/prd/10-calendar.md), [디자인](docs/design/calendar.md)) |
| 디자인 컴포넌트 가이드 — 웹 `/guide` (MDX) | 배포 — https://timesheet-brown-ten.vercel.app/guide |
| 매장 로고 업로드·헤더 노출 | 배포 ([PRD 11](docs/prd/11-store-logo.md)) |
| 초대 코드 문자 보내기(휴대폰 문자 앱·공유), 가입 링크 | 배포 ([PRD 06](docs/prd/06-store-invite.md)) |
| 멤버 오늘 근무 대시보드 — 출퇴근 탭 시계 아래 | 배포 — 실화면 확인 대기 ([PRD 12](docs/prd/12-member-today.md), [디자인](docs/design/member-today.md)) |
| 근무 시간표 — 요일·출퇴근 시각, 날짜별 변경(마스터), 시급 천 단위 쉼표 | 배포 — 실화면 확인 대기 ([PRD 13](docs/prd/13-work-schedule.md)) |
| 배포 | 웹 https://timesheet-brown-ten.vercel.app · API·Neon DB ([docs/deploy.md](docs/deploy.md)) |

## 문서

| 문서 | 내용 |
|---|---|
| [docs/prd/](docs/prd/README.md) | 요구사항 01~07 — 급여 규칙은 공식 출처와 함께 |
| [docs/verify/auth.md](docs/verify/auth.md) | 로그인·매장·초대 검증 결과 (로컬·운영) |
| [docs/deploy.md](docs/deploy.md) | 배포 절차와 환경변수 |
| [docs/history/](docs/history/) | 작업 히스토리 — 결정·실패·수정 기록 |
