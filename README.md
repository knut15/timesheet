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

## 무엇으로 만들었나

서버와 클라이언트를 pnpm 워크스페이스 하나에서 관리한다.

| 폴더 | 패키지 | 역할 |
|---|---|---|
| `server/` | `timesheet-server` | Express API. Prisma 로 Postgres 에 붙는다 |
| `web/` | `timesheet-web` | Next.js App Router 클라이언트 |

문서는 [docs/](docs/README.md) 에 있다.

## 돌려 보기

Docker 와 pnpm 이 필요하다.

```bash
pnpm install

# DB (Postgres 18.6, 호스트 포트 5434)
cp server/.env.example server/.env
pnpm --filter timesheet-server db:up

# 서버 → http://localhost:4200/health
pnpm dev:server

# 웹 → http://localhost:3200
pnpm dev:web
```

타입 검사는 루트에서 `pnpm typecheck` 로 돌린다.

## 어디까지 왔나

| 항목 | 상태 |
|---|---|
| 워크스페이스·DB·서버·웹 뼈대 | 완료 |
| 웹 MVP (출퇴근·급여·50m 출근 알림, localStorage) | 완료 — [docs/prd](docs/prd/README.md) |
| 서버 연동 — 매장·초대 코드·근무 기록 | 완료 |
| 로그인 (JWT 직접 구현, 리프레시 회전·재사용 탐지) | 완료 — [검증 기록](docs/verify/auth.md) |
| 마스터 관리 화면·대시보드 | 완료 |
| 배포 | 웹 https://timesheet-brown-ten.vercel.app · API·Neon DB ([docs/deploy.md](docs/deploy.md)) |
