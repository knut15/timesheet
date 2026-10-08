# timesheet 문서

- [사용자 결정 목록](decisions.md) — 사용자가 정한 규칙이 어느 문서에 있는지

## PRD

- [PRD 개요](prd/README.md)
  - [01. 출퇴근 기록](prd/01-attendance.md)
  - [02. 급여 계산 — 시급 + 주휴수당](prd/02-pay.md)
  - [03. 연장근로(오버타임) 계산](prd/03-overtime.md)
  - [04. 매장 50m 출근 알림](prd/04-geofence-notification.md)
  - [05. 로그인](prd/05-auth.md)
  - [06. 매장과 초대 코드](prd/06-store-invite.md)
  - [07. 마스터 관리 화면과 대시보드](prd/07-admin.md)
  - [08. 기록 수정 요청과 승인](prd/08-correction-requests.md)
  - [09. 휴가와 대타 근무](prd/09-leave-substitution.md)
  - [10. 근무 달력](prd/10-calendar.md)
  - [11. 매장 로고](prd/11-store-logo.md)

## 디자인

- [DESIGN.md](../DESIGN.md) — 디자인 기준 원본 (색 토큰·모양·글꼴·움직임·접근성)
- [디자인 문서](design/README.md)
  - [근무 달력 화면 명세](design/calendar.md)
  - [컴포넌트 가이드 명세](design/component-guide.md) — 페이지는 웹 `/guide`
- [디자인 새로 잡기 설계](superpowers/specs/2026-10-07-design-refresh-design.md) (2026-10-07) — 라이트 청록·다크 민트, 토큰 교체, CSS 움직임
  - [구현 계획](superpowers/plans/2026-10-07-design-refresh.md) — 태스크 6개

## API

- [OpenAPI 계약](api/openapi.json) — `server/src/contract.ts` 에서 `pnpm --filter timesheet-server openapi:export` 로 만든다. 손으로 고치지 않는다

## 검증

- [로그인·매장·초대 검증 기록](verify/auth.md)

## 버그 기록

- [/login "1 Issue" — getServerSnapshot 캐시 안 됨](bugs/2026-10-07-login-server-snapshot.md) (2026-10-07)

## 자동 수정 루프 (autofix)

- [정상 목록](autofix/allowlist.json) — 감지에서 에러로 세지 않을 신호와 근거
- [감지 보고서](autofix/reports/) — `autofix detect` 가 날짜별로 쓴다
- 밤 작업: `node ~/Workspace/autofix/bin/autofix.mjs run` — 개발 서버를 끈 뒤 실행. 별도 worktree 의 `autofix/<날짜>` 브랜치에 고친 커밋과 `<날짜>-run.md` 보고서를 남긴다
- 주의: 시드는 로컬 API(4200)에 직접 요청한다. 이미 떠 있는 API(4200)가 운영 DB 를 보고 있으면 막지 못한다.

## 운영

- [배포](deploy.md)
- [브랜치 전략](branching.md) — release 에서 분기·스쿼시 머지, main 은 release 를 fast-forward (= 배포)

## 히스토리

- [작업 히스토리](history/) — 날짜별 결정·실패·수정 기록
  - [2026-09-25](history/2026-09-25.md)
  - [2026-10-07](history/2026-10-07.md) — 디자인 새로 잡기

## 에이전트 팀

- [팀 운영과 호출 방법](team/README.md)
- [6개 역할과 권한](team/roles.md)
- [작업 카드 양식](team/task-template.md)
- [TS-001 기록 수정 요청 팀 인수](team/tasks/TS-001-corrections.md)
- [TS-002 근무 달력](team/tasks/TS-002-calendar.md)
- [TS-003 디자인 컴포넌트 가이드](team/tasks/TS-003-component-guide.md)
