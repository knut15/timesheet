# 배포

[← 문서 목차](README.md)

## 주소

| 무엇 | 주소 | Vercel 프로젝트 |
|---|---|---|
| 웹 (사용자가 여는 주소) | https://timesheet-brown-ten.vercel.app | `youngs-projects-0d9d5367/timesheet` |
| API | https://timesheet-api-hazel.vercel.app | `youngs-projects-0d9d5367/timesheet-api` |
| DB | Neon Postgres `timesheet-db` (us-east-1), Vercel Marketplace 로 `timesheet-api` 에 연결 | — |

브라우저는 웹 주소만 부른다. 웹이 Next.js rewrites 로 `/api/*` 를 API 로 넘긴다 — 같은 출처라야 리프레시 쿠키가 `SameSite=Strict` 로 동작한다 ([05-auth.md](prd/05-auth.md) 토폴로지).

## 환경변수

| 프로젝트 | 이름 | 값 |
|---|---|---|
| timesheet (웹) | `API_URL` | API 주소. 빌드 시점에 rewrites 로 굳는다 — 바꾸면 웹을 다시 빌드한다. 비밀이 아니라 Config(`--no-sensitive`)로 둔다. Sensitive 로 두면 로컬 `vercel build` 가 값을 못 읽어 `Invalid rewrite` 로 실패한다 |
| timesheet-api | `DATABASE_URL` 외 `PG*`·`POSTGRES_*` | Neon 연동이 넣는다 |
| timesheet-api | `JWT_ACCESS_SECRET`, `CSRF_SECRET` | 서로 다른 48바이트 난수. Sensitive — 값은 어디에도 적어 두지 않았다. 바꾸면 모든 세션이 끊긴다 |
| timesheet-api | `WEB_ORIGINS` | `https://timesheet-brown-ten.vercel.app` (CSRF Origin 허용 목록) |
| timesheet-api | `COOKIE_SECURE` / `SWAGGER_ENABLED` | `true` / `false` |

## 배포 방법

둘 다 **저장소 루트에서** 한다. pnpm 워크스페이스라 의존성과 lockfile 이 루트에 있다.

### 웹 — 로컬에서 빌드해 올린다

루트의 `.vercel/` 이 웹 프로젝트에 연결돼 있다. 프로젝트 설정 `rootDirectory` 는 `web`.

```bash
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```

### API — Vercel 에서 빌드한다

로컬(macOS)에서 빌드하면 argon2·Prisma 의 네이티브 바이너리가 macOS 용으로 들어가므로 원격 빌드를 쓴다.
프로젝트 설정 `rootDirectory=server`, `framework=express`. 루트 `.vercel/` 은 웹 것이라 환경변수로 대상을 바꾼다.
업로드 제외 목록은 루트 `.vercelignore` (로컬 `.env` 가 올라가지 않게 한다).

```bash
VERCEL_ORG_ID=team_BTqeg4nCPHp5GagNaFpZqA9v VERCEL_PROJECT_ID=prj_mhTMcf3grCnh49bx1dMeyvkYLheD \
  vercel deploy --prod
```

- Vercel 은 `src/app.ts` 를 진입점으로 고른다(`server.ts` 보다 먼저). 그래서 `app.ts` 가 앱을 기본 내보내기한다.
- Vercel 빌더의 타입 검사는 로컬 `tsc` 와 결과가 다를 수 있다 — helmet 기본 내보내기가 그랬다 (`src/app.ts` 주석).

### DB 마이그레이션

배포와 따로 한다. 연결 풀러를 거치지 않는 주소(`DATABASE_URL_UNPOOLED`)를 쓴다.

```bash
vercel env pull   # timesheet-api 에 연결된 폴더에서. 값은 커밋하지 않는다
cd server && DATABASE_URL="<DATABASE_URL_UNPOOLED>" pnpm exec prisma migrate deploy
```

## 배포 후 확인

```bash
curl -s https://timesheet-api-hazel.vercel.app/health                                   # {"ok":true}
curl -s -o /dev/null -w "%{http_code}\n" https://timesheet-brown-ten.vercel.app/api/users/me   # 401 (rewrites 동작)
curl -s -o /dev/null -w "%{http_code}\n" https://timesheet-brown-ten.vercel.app/sw.js          # 200
```

전체 시나리오는 [verify/auth.md](verify/auth.md).

## 알려진 한계

- 로그인 제한(1분 5회)은 함수 인스턴스 메모리에 센다. 인스턴스가 여럿이면 느슨해진다. 엄격히 하려면 공유 저장소(Redis 등)가 필요하다.
- 폐기·만료된 리프레시 토큰 행을 지우는 주기 작업이 아직 없다.
