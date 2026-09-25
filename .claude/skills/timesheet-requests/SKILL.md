---
name: timesheet-requests
description: >
  timesheet 의 기록 수정 요청·승인, 휴가, 대타 근무를 맡는다 — 상태 전이, 권한, 급여 영향, 파일 위치, 테스트.
  "수정 요청", "승인", "컨펌", "휴가", "연차", "대타", "결근", "요청함" 이 나오거나 이 기능의 코드·화면·API 를 고칠 때 먼저 읽는다.
---

# 수정 요청 · 휴가 · 대타

요구사항 원본은 [docs/prd/08](../../../docs/prd/08-correction-requests.md), [docs/prd/09](../../../docs/prd/09-leave-substitution.md).
이 문서는 **코드가 지키는 규칙**의 정본이다. 규칙을 바꾸면 PRD → 이 스킬 → 코드 → 테스트 순으로 같은 커밋에서 고친다.

## 1. 상태 전이

| 대상 | 전이 | 누가 | 조건 |
|---|---|---|---|
| 수정 요청 | `pending → approved` | 마스터 | 한 트랜잭션에서 기록 반영. 기록이 없으면 404 로 롤백, 요청은 `pending` 유지 |
| | `pending → rejected` | 마스터 | 메모 선택 |
| | `pending → canceled` | 요청자 | |
| 휴가 | `pending → approved` | 마스터 | `paid` 를 바꿀 수 있다 |
| | `pending → rejected` / `canceled` | 마스터 / 신청자 | |
| | 직접 등록 → `approved` | 마스터 | `createdBy ≠ userId` 이면 `byMaster: true` |
| 대타 | `requested → accepted` / `declined` | 지정된 대타 | |
| | `accepted → approved` | 마스터 | `requested` 에서 승인하면 409 `SUBSTITUTE_NOT_ACCEPTED` |
| | `requested·accepted → rejected` | 마스터 | |
| | `requested·accepted → canceled` | 요청자 | |
| | 직접 등록 → `approved` | 마스터 | |

**전이 구현 규칙**: 조건부 `updateMany({ where: { id, 소유자, status: 이전상태 } })` 한 번. 0건이면 행이 없으면 404, 있으면 409 `REQUEST_CLOSED` (`transition()` 헬퍼).
읽고 → 검사하고 → 쓰는 3단계로 나누지 않는다 — 동시에 두 번 누르면 둘 다 통과한다.

## 2. 권한

- 멤버 API(`/api/corrections`, `/api/leaves`, `/api/substitutions`, `/api/requests/me`, `/api/absences/me`)는 소속 필수
- 마스터 API(`/api/stores/me/{requests,absences,corrections,leaves,substitutions}`)는 `requireMaster`
- 다른 매장·다른 사람 것은 **404** (존재를 드러내지 않는다). 역할이 틀리면 403
- 대타 대상은 같은 매장 멤버, 자기 자신은 400

## 3. 급여 영향 — `web/src/lib/pay.ts`

서버는 `absences`(날짜별 결근 아닌 날)만 내려주고 계산은 FE 의 `pay.ts` 한 곳에서 한다.

| absence.kind | 만드는 것 | 급여 |
|---|---|---|
| `paid_leave` | 승인된 유급 휴가의 각 날짜 | 휴가수당 = 1일 소정근로시간 × 시급 |
| `unpaid_leave` | 승인된 무급 휴가 | 0 |
| `substitution` | 승인된 대타의 **요청자** 날짜 | 0 |

- 그날 근무 기록이 있으면 absence 는 무시한다 (근무로 센다)
- 개근 = `workDays ≥ 1 && workDays + excusedDays ≥ workDaysPerWeek`. 근거와 인용은 PRD 09 3절, 법 기준은 `kr-parttime-pay` 스킬
- 대타를 선 사람(B)은 자기 기록대로. 소정을 넘으면 연장근로

## 4. 파일

| 무엇 | 어디 |
|---|---|
| DB | `server/prisma/schema.prisma` — `ShiftCorrection`, `Leave`, `Substitution`. 대기 수정 요청은 기록당 하나(부분 유니크 인덱스, 마이그레이션 SQL) |
| 계약 | `server/src/contract.ts` — `CorrectionDto`, `LeaveDto`, `SubstitutionDto`, `AbsenceDto` … |
| 라우트 | `server/src/requests/routes.ts` (대시보드의 `absences`·`pendingRequests` 는 `stores/routes.ts` 가 가져다 쓴다) |
| 멤버 화면 | `web/src/components/member/RecordsPanel.tsx`(수정·삭제·추가 요청), `RequestsPanel.tsx`(휴가·대타·내 요청) |
| 마스터 화면 | `web/src/app/admin/requests/page.tsx`, 하단 내비 "요청" 배지 = `dashboard.pendingRequests` |
| 급여 | `web/src/lib/pay.ts` `Absence`, `computeWeek(…, absences)` |
| 상태 표시 | `web/src/components/ui.tsx` `StatusPill` — 새 상태를 만들면 여기 라벨을 추가 |

## 5. 에러 코드

| code | 언제 |
|---|---|
| `REQUEST_PENDING` 409 | 같은 기록에 대기 수정 요청이 또 |
| `REQUEST_CLOSED` 409 | 처리된 요청을 다시 전이 |
| `LEAVE_OVERLAP` 409 | 대기·승인 휴가와 날짜 겹침 |
| `SUBSTITUTE_NOT_ACCEPTED` 409 | 동료 수락 전 마스터 승인 |
| `ALREADY_CLOCKED_IN` 409 | 승인하면 열린 기록이 둘이 됨 |

## 6. 검증

- `pnpm --filter timesheet-web test` — L-1~L-4, S-1 (급여 영향)
- `pnpm --filter timesheet-server test:e2e` — `C-1~C-7`, `L·S·M` (API 가 떠 있어야 한다)

## 7. 이 스킬을 갱신하는 때

이 기능을 고친 커밋에는 아래 중 해당하는 줄의 갱신이 **같이** 들어간다. 사용자가 따로 말하지 않아도 한다.

| 바뀐 것 | 이 문서에서 고칠 곳 |
|---|---|
| 상태·전이·권한 | 1·2절 표 |
| 급여 계산 | 3절 표 + `kr-parttime-pay` 스킬(법 기준이 바뀐 경우) |
| 파일 이동·추가 | 4절 |
| 에러 코드 | 5절 + `server/src/errors.ts` |
| 테스트 이름 | 6절 |
