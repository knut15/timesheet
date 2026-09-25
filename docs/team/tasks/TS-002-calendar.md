# TS-002 — 근무 달력

- 상태: review — 구현·자동 검증·배포 끝. 실화면(390px·다크·스크린리더)과 독립 QA 는 미실시
- 사용자 요청과 범위: "근무 기록은 달력으로 보는 부분이 필요해. 사장의 달력은 전체 멤버의 근무, 멤버의 달력은 본인의 근무 기록만. 디자인 및 시니어 개발자 출동" (2026-09-25) — [PRD 10](../../prd/10-calendar.md)
- 부모 에이전트와 현재 담당: 부모 = 현재 대화. 디자인 → 시니어 순서.
  이 세션에서는 `.claude/agents/timesheet-*` 가 세션 시작 뒤 생겨 에이전트 유형으로 잡히지 않는다. 범용 서브에이전트에 roles.md 해당 절을 읽혀 위임한다 (docs/team/README.md 의 대체 규칙).
- 참고 PRD·계약·디자인: PRD 10, 01, 08, 09 · 계약 변경 없음 · [timesheet-ui](../../../.claude/skills/timesheet-ui/SKILL.md)
- 현재 코드·기존 변경 확인: PR #3 머지(c2a816c) 뒤 origin/main 에서 딴 브랜치 feature/calendar. 멤버 기록 = `web/src/components/member/RecordsPanel.tsx`, 마스터 = `web/src/app/admin/*`
- 담당별 허용 파일과 공유 파일 소유자:

| 담당 | 허용 파일 |
|---|---|
| 디자인 | `docs/design/calendar.md`(신규), `docs/design/README.md`(신규), `.claude/skills/timesheet-ui/SKILL.md` |
| 시니어 | `web/src/components/calendar/*`(신규), `web/src/components/member/*`, `web/src/components/TimesheetApp.tsx`, `web/src/components/shell.tsx`·`ui.tsx`, `web/src/app/admin/**`, `web/src/lib/calendar.ts`(신규)·`calendar.test.mjs`(신규), `web/package.json`(test 스크립트만) |
| 공유 | `shell.tsx`·`ui.tsx` — 시니어만 쓴다. `contract.ts` 변경 없음 |
| 부모 | 이 카드, docs/team/README.md, docs/history, README, 배포 |

- 선행 의존성·확정 정책·남은 질문: 마스터 달력 진입점(내비 5개 상한) — 디자인이 정한다
- 완료 조건: CAL-1~CAL-9 충족 증거. 달력 날짜 계산 단위 테스트, web typecheck·lint·build, 운영 배포 확인. 390px·실화면은 로그인 자동화 제약으로 사람 확인
- 반복 횟수와 중단 조건: 같은 실패를 새 증거 없이 2회 → 멈추고 보고

## 검증

| 기준 | 환경·명령·증거 | pass / fail / not-run |
|---|---|---|
| CAL-1 월 격자·월요일 시작 | `web/src/lib/calendar.test.mjs` — 2026 12달 전부 월요일 시작, 2026-02 5줄·2027-02 4줄·2026-03 6줄 (부모가 `pnpm test` 재실행 35/35) | pass |
| CAL-2~CAL-4 칸 집계 | 같은 테스트 — 자정 넘긴 근무는 출근일, 휴가·근무 겹침, 근무 중/퇴근 기록 없음, 마스터 인원·시간 합·마스터 제외 | pass |
| CAL-7 멤버는 본인만 | 멤버 화면이 `/api/shifts/me`·`/api/absences/me` 만 호출 (코드 확인). 서버 격리는 기존 e2e | pass (정적 확인) |
| CAL-5·CAL-6·CAL-8·CAL-9 화면 동작 | 브라우저 — 로그인 자동화 불가 | not-run |
| 타입·린트·빌드 | `pnpm typecheck` 오류 0, `pnpm lint` 0, `pnpm build` 성공(`/admin/calendar`) — 부모 재실행 | pass |
| 운영 배포 | 웹 배포 READY, `/admin/calendar` 200 | pass |
| 독립 QA | QA 역할 미투입 — 부모 재실행은 자기 검토라 QA 로 치지 않는다 | not-run |

## 전달 기록

- 2026-09-25 / 부모 → 디자인 / PRD 10 / 마스터 진입점 미정 / 화면·상태 명세 작성
- 2026-09-25 / 디자인 → 시니어 / [docs/design/calendar.md](../../design/calendar.md), timesheet-ui §4 / 진입점 = 내비 "초대" 자리에 달력, 초대는 멤버 화면 안. 시각 검증 미실시 / 구현
  - 부모 처리: docs/README 목차에 디자인 링크, PRD 10 진입점·데이터·CAL-2 표현 확정
- 2026-09-25 / 시니어 → 부모 / 달력 구현(파일은 허용 목록 안), test 35/35·typecheck·lint·build / 명세 §7 요일 예시가 하루씩 어긋남, 테스트용 import 훅(registerHooks) / 부모: 명세 요일 12곳 수정, 재검증, 웹 배포
- 다음: 사람의 실화면 확인(명세 §10 체크리스트) 또는 QA 투입

