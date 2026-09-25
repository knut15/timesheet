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

## 5. 명령

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
