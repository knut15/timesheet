# TS-004 — 멤버 오늘 근무 대시보드

- 상태: review
- 사용자 요청과 범위: "멤버의 메인화면에서는 오늘 근무에 대한 대시보드가 필요하다. 디자이너 출동" (2026-09-25) — [PRD 12](../../prd/12-member-today.md)
- 부모 에이전트와 현재 담당: 부모 = 현재 대화. 디자인 → 부모가 시니어 역할로 구현(사용자가 디자이너만 지정)
  - `.claude/agents/timesheet-*` 는 이 세션에서 에이전트 유형으로 안 잡힌다 — 범용 서브에이전트에 roles.md 디자인 절을 읽혀 위임
- 참고: PRD 12, timesheet-ui 스킬, 컴포넌트 가이드 명세, 기존 출퇴근 화면 `web/src/components/TimesheetApp.tsx` ClockPanel
- 담당별 허용 파일:

| 담당 | 허용 파일 |
|---|---|
| 디자인 | `docs/design/member-today.md`(신규), `docs/design/README.md`, `.claude/skills/timesheet-ui/SKILL.md` |
| 부모(시니어) | `web/src/components/**`, `web/src/lib/**`, 가이드(`web/src/app/guide/**`), docs, 배포 |

- 완료 조건: TD-1~TD-5, 계산은 pay.ts 재사용(새 계산 없음), 단위 테스트·typecheck·lint·build, 운영 배포. 로그인 화면이라 실화면은 가이드 예시로 확인
- 반복 횟수와 중단 조건: 같은 실패를 새 증거 없이 2회 → 멈추고 보고

## 검증

| 기준 | 환경·명령·증거 | pass / fail / not-run |
|---|---|---|
| TD-1 상태 판정 | `pnpm --filter timesheet-web test` — today.test.mjs 4상태 + 휴가 있어도 기록 있으면 done + 어제 열린 기록 working | pass (49/49) |
| 타입·린트·빌드 | `pnpm typecheck`, `pnpm --filter timesheet-web lint`, `vercel build --prod` | pass (0, 0, 성공) |
| TD-2·TD-3 값 | 가이드 today-dashboard Basic — 4시간 30분 = 3시간 28분 + 1시간 2분, 14시간 / 20시간, 진행 중 (4/5일), 144,480원 (pay.ts 계산·빌드 HTML·운영 페이지 글자) | pass |
| TD-5 | 운영 가이드 390·320px iframe — scrollWidth ≤ 틀, 시계 10개 높이 48(한 줄) | pass |
| TD-4 | 처리할 것 → 요청 탭 활성 — 로그인 화면이라 자동화 불가 | not-run (사람 확인) |
| 실화면 | 로그인한 멤버 출퇴근 탭 | not-run (사람 확인) |

## 전달 기록

- 2026-09-25 / 부모 → 디자인 / PRD 12 / — / 화면·상태 명세
- 2026-09-25 / 디자인 → 부모 / docs/design/member-today.md / — / 구현 (lib/today.ts, ProgressBar, TodayDashboard.tsx, ClockPanel 연결)
- 2026-09-25 / 부모 → 개발 / 명세 §5-5 / — / 가이드 페이지 3개(예시 21개), component-guide.md, nav.ts
- 2026-09-25 / 개발 → 부모 / 가이드 3페이지 / — / 운영 배포·폭 검증(부모)
