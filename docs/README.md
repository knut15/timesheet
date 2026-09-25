# timesheet 문서

## PRD

- [PRD 개요](prd/README.md)
  - [01. 출퇴근 기록](prd/01-attendance.md)
  - [02. 급여 계산 — 시급 + 주휴수당](prd/02-pay.md)
  - [03. 연장근로(오버타임) 계산](prd/03-overtime.md)
  - [04. 매장 50m 출근 알림](prd/04-geofence-notification.md)
  - [05. 로그인](prd/05-auth.md)
  - [06. 매장과 초대 코드](prd/06-store-invite.md)
  - [07. 마스터 관리 화면과 대시보드](prd/07-admin.md)

## API

- [OpenAPI 계약](api/openapi.json) — `server/src/contract.ts` 에서 `pnpm --filter timesheet-server openapi:export` 로 만든다. 손으로 고치지 않는다

## 검증

- [로그인·매장·초대 검증 기록](verify/auth.md)

## 운영

- [배포](deploy.md)
