# timesheet 작업 규칙

파트타임 근무자의 출퇴근 기록과 급여 계산 앱이다. 상위 `~/Workspace/CLAUDE.md` 규칙을 따르고, 이 문서가 그 위에 덧붙는다.

## 1. 문서는 전부 `docs/` 에 둔다

- 새 문서는 `docs/` 아래에 쓴다. 루트에는 `README.md` 와 이 파일만 둔다.
- 문서를 만들면 **`docs/README.md` 목차에 링크를 건다.** 목차에 없는 문서는 없는 문서로 본다.
- 요구사항은 `docs/prd/` 에 기능 하나당 문서 하나로 쓴다. 기능이 늘면 번호를 이어 붙인다 (`05-...md`).
- 문서끼리는 상대 경로 링크로 잇는다.

| 문서 | 내용 |
|---|---|
| [docs/README.md](docs/README.md) | 문서 목차 |
| [docs/prd/README.md](docs/prd/README.md) | PRD 개요와 기능 문서 링크 |
| [docs/deploy.md](docs/deploy.md) | 배포 방법과 주소 |
| [docs/verify/auth.md](docs/verify/auth.md) | 로그인·매장·초대 검증 기록 |
| [docs/verify/performance.md](docs/verify/performance.md) | 성능 검사표 — API 부팅 순서·화면별 데이터 도착·번들 |
| [docs/api/openapi.json](docs/api/openapi.json) | API 계약 (생성물) |

## 2. 급여 규칙은 PRD 가 기준이다

- 계산식은 [docs/prd/02-pay.md](docs/prd/02-pay.md)·[docs/prd/03-overtime.md](docs/prd/03-overtime.md) 에 적힌 대로 구현한다. 코드와 문서가 다르면 문서를 먼저 고치고 코드를 맞춘다.
- 법정 수치(최저임금, 주휴 요건, 가산율)는 **공식 출처 링크와 함께** 문서에 적는다. 출처를 못 찾은 값은 "확인 불가" 로 남긴다.
- 최저임금은 해마다 바뀐다. 연도가 바뀌면 `web/src/lib/pay.ts` 의 `MINIMUM_WAGE` 와 02-pay.md 를 같이 고친다.
- 계산 로직은 `web/src/lib/pay.ts` 한 곳에만 둔다. 화면 컴포넌트에서 금액을 계산하지 않는다.

## 3. 구조

| 폴더 | 역할 |
|---|---|
| `web/` | Next.js App Router. 멤버 화면(`/`), 마스터 관리 화면(`/admin`), 로그인. `/api/*` 는 rewrites 로 server 에 넘긴다 |
| `server/` | Express + Prisma + Postgres. 로그인(JWT 직접 구현)·매장·초대·근무 기록 API |

## 4. API 계약과 인증

- API 계약의 원본은 `server/src/contract.ts` 다. 바꾸면 `openapi:export` → `web` 의 `gen:api` 순서로 돌리고, `tsc` 가 깨지는 곳이 FE 가 고칠 곳이다.
- 인증은 전역 스킬 `web-auth` 의 설계를 따른다. 토큰·쿠키·CSRF 를 바꾸려면 [05-auth.md](docs/prd/05-auth.md) 부터 고친다.
- 인증·권한을 건드리면 `server/test/e2e.test.ts` 를 돌리고 [docs/verify/auth.md](docs/verify/auth.md) 를 갱신한다.

## 5. 프로젝트 스킬 — 기능마다 맡은 스킬이 있다

기능을 고치기 전에 그 기능의 스킬을 먼저 읽고, **규칙이 바뀌면 같은 커밋에서 스킬도 고친다.** 사용자가 따로 말하지 않아도 한다 (사용자 지시 2026-09-25).

| 스킬 | 맡는 것 |
|---|---|
| [timesheet-auth](.claude/skills/timesheet-auth/SKILL.md) | 로그인·쿠키 세션·CSRF |
| [timesheet-requests](.claude/skills/timesheet-requests/SKILL.md) | 기록 수정 요청·휴가·대타 |
| [timesheet-ui](.claude/skills/timesheet-ui/SKILL.md) | 헤더·하단 내비·아바타 |

작업 진행 기록과 반영(배포·README·푸시)은 전역 스킬 `work-history` 를 따른다.

사용자가 새 규칙을 정하면 **맞는 문서(PRD·디자인 명세·스킬)에 먼저 쓰고** [docs/decisions.md](docs/decisions.md) 에 한 줄(날짜·요약·링크)을 더한다. 목록에만 쓰고 끝내지 않는다 — 규칙 본문은 각 문서가 정본이다.

## 6. 명령

```bash
pnpm --filter timesheet-web dev        # http://localhost:3200
pnpm --filter timesheet-web build
pnpm --filter timesheet-web test       # 급여·거리·알림 로직 단위 테스트 (node --test)
pnpm --filter timesheet-server db:up   # 로컬 Postgres (5434)
pnpm --filter timesheet-server dev     # API http://localhost:4200, Swagger /api/docs
pnpm --filter timesheet-server test:e2e        # API 가 떠 있어야 한다
pnpm --filter timesheet-server openapi:export  # → docs/api/openapi.json
pnpm --filter timesheet-web gen:api            # → web/src/api/schema.d.ts
pnpm typecheck
```

- 패키지 매니저는 pnpm 고정.
- `web/` 의 Next.js 는 16 이다. 코드를 쓰기 전에 `web/node_modules/next/dist/docs/` 를 확인한다 (`web/AGENTS.md`).

## 6. 팀 작업

팀으로 진행하거나 담당자를 지정하면 `.agents/skills/timesheet-team/SKILL.md`와 [팀 운영](docs/team/README.md)을 읽는다. 역할별 지침은 [역할 문서](docs/team/roles.md)에 있다. 기존 코드 변경을 먼저 확인하고 필요한 역할만 배정한다.
