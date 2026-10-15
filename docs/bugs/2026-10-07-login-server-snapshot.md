# /login 에 "1 Issue" — getServerSnapshot 이 매번 새 객체를 돌려준다

- 날짜: 2026-10-07
- 상태: 해결

## 1. 발견

로컬 `http://localhost:3200/login` 을 열면 Next 개발 화면 왼쪽 아래에 빨간 "1 Issue" 배지가 뜬다. 브라우저 콘솔과 `next dev` 로그에 같은 에러가 찍힌다.

```
The result of getServerSnapshot should be cached to avoid an infinite loop
    at useSession (src/auth/hooks.ts:8:30)
    at useArea (src/auth/hooks.ts:36:19)
    at AuthForm (src/components/AuthForm.tsx:16:30)
```

`/` 에서도 같은 에러가 난다(`TimesheetApp` 경로). `useSession` 을 쓰는 모든 화면에 해당한다.

재현: Playwright 로 `/login` 을 열고 콘솔 에러를 모은다 → 매번 재현된다.

## 2. 원인

`useSession` 은 `useSyncExternalStore(subscribe, getSession, getServerSession)` 이다. 세 번째 인자 `getServerSnapshot` 은 서버 렌더와 하이드레이션 때 쓰는 값인데, React 는 이 함수가 **호출할 때마다 같은 값(`Object.is` 로 같은 참조)** 을 돌려준다고 가정한다.

`web/src/auth/session.ts` 의 구현은 화살표 함수 본문에서 객체 리터럴을 만든다.

```ts
export const getServerSession = (): SessionState => ({ status: "unknown" });
```

부를 때마다 새 객체라 React 는 스냅샷이 바뀌었다고 보고 다시 렌더할 수 있다. 개발 모드는 이를 감지해 위 에러를 낸다. 지금은 화면이 그려지지만, React 가 경고하는 대로 다시 렌더가 끝없이 이어질 수 있는 구조다.

같은 저장소의 `web/src/lib/storage.ts` 는 `useSyncExternalStore(subscribe, get, () => DEFAULT)` 로 모듈 상수를 돌려줘서 문제가 없다. 차이는 그것뿐이다.

### 원인이 아닌 것

같은 화면에서 콘솔에 `401 (Unauthorized)` 가 함께 찍힌다. 로그인하지 않은 상태의 부팅 흐름(`/api/users/me` → 401 → `/api/auth/refresh` → 401 → anonymous)이라 정상이다. 실제로 찍힌 401 은 `GET /api/users/me` 2번과 `POST /api/auth/refresh` 1번이다. `/users/me` 가 2번인 것은 개발 모드 StrictMode 가 `useBootSession` 의 effect 를 두 번 돌리기 때문이고, refresh 는 single-flight 라 1번만 나간다. 규칙은 `.claude/skills/timesheet-auth/SKILL.md` 의 "부팅" 절에 있다.

## 3. 해결 방법

서버 스냅샷을 모듈 상수 하나로 두고 `getServerSession` 은 그 상수를 돌려주게 한다. 서버 스냅샷은 늘 `unknown` 이라 값이 바뀔 일이 없다. 클라이언트 스냅샷 `getSession` 은 이미 모듈 변수 `state` 를 그대로 돌려줘서 고칠 필요가 없다.

## 4. 한 일과 검증

- `web/src/auth/session.ts`: `const SERVER_SESSION: SessionState = { status: "unknown" }` 를 두고 `getServerSession = () => SERVER_SESSION` 으로 바꿨다.
- 검증
  - 수정 전: Playwright 로 `/login` 을 열면 콘솔에 `getServerSnapshot should be cached` 에러가 찍히고 "1 Issue" 배지가 뜬다.
  - 수정 후: 같은 스크립트로 `/login`·`/` 를 열었을 때 이 에러가 없고 배지도 없다. 남은 콘솔 에러는 위 "원인이 아닌 것" 의 401 뿐이다.
  - `pnpm typecheck` 통과, `pnpm --filter timesheet-web test` 통과.
