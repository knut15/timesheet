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

- [디자인 문서](design/README.md)
  - [근무 달력 화면 명세](design/calendar.md)
  - [컴포넌트 가이드 명세](design/component-guide.md) — 페이지는 웹 `/guide`

## API

- [OpenAPI 계약](api/openapi.json) — `server/src/contract.ts` 에서 `pnpm --filter timesheet-server openapi:export` 로 만든다. 손으로 고치지 않는다

## 검증

- [로그인·매장·초대 검증 기록](verify/auth.md)

## 운영

- [배포](deploy.md)

## 히스토리

- [작업 히스토리](history/) — 날짜별 결정·실패·수정 기록
  - [2026-09-25](history/2026-09-25.md)

## 에이전트 팀

- [팀 운영과 호출 방법](team/README.md)
- [6개 역할과 권한](team/roles.md)
- [작업 카드 양식](team/task-template.md)
- [TS-001 기록 수정 요청 팀 인수](team/tasks/TS-001-corrections.md)
- [TS-002 근무 달력](team/tasks/TS-002-calendar.md)
- [TS-003 디자인 컴포넌트 가이드](team/tasks/TS-003-component-guide.md)
