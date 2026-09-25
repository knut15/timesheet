# 사용자 결정 목록

[← 문서 목차](README.md)

사용자가 정한 규칙이 **어느 문서에 적혀 있는지** 찾는 목록이다. 규칙의 본문은 오른쪽 문서가 정본이고, 여기에는 한 줄 요약과 링크만 둔다.
새 규칙이 생기면 그 규칙을 맞는 문서에 먼저 쓰고, 여기에 한 줄을 더한다 ([CLAUDE.md](../CLAUDE.md) §5). 요청 원문은 [작업 히스토리](history/2026-09-25.md).

## 일하는 방식

| 날짜 | 규칙 | 적힌 곳 |
|---|---|---|
| 2026-09-25 | 모든 문서는 `docs/` 에, 문서마다 목차에 링크 | [CLAUDE.md](../CLAUDE.md) §1 |
| 2026-09-25 | 작업하면서 히스토리를 남긴다 — 배포 실패도 왜·어떻게 고쳤는지 | 전역 스킬 `work-history`, [history/](history/2026-09-25.md) |
| 2026-09-25 | README 는 작업마다 갱신해 푸시 | 전역 스킬 `work-history` §3 |
| 2026-09-25 | 지시가 없어도 바뀐 부분(배포·문서·스킬)은 반영한다. 파괴적 DB 변경·새 외부 리소스·비용은 묻는다 | `work-history` §3, [CLAUDE.md](../CLAUDE.md) §5 |
| 2026-09-25 | 기능마다 맡은 스킬이 있고, 그 기능을 고치면 같은 커밋에서 스킬도 고친다 | [CLAUDE.md](../CLAUDE.md) §5 |
| 2026-09-25 | 머지는 PR 마다 사용자가 말했을 때 | `work-history` §3 |
| 2026-09-25 | 역할별 팀(디자인·시니어 …)으로 진행할 수 있다, 팀 파일은 저장소에 | [팀 운영](team/README.md), [역할](team/roles.md) |
| 2026-09-25 | 컴포넌트를 바꾸면 `/guide` 페이지·명세도 같이 | [timesheet-ui](../.claude/skills/timesheet-ui/SKILL.md) §0 |

## 제품

| 날짜 | 규칙 | 적힌 곳 |
|---|---|---|
| 2026-09-25 | 급여 = 시급 + 주휴수당(공식 출처 확인) + 연장근로 가산 | [PRD 02](prd/02-pay.md), [PRD 03](prd/03-overtime.md) |
| 2026-09-25 | 매장 50m 안 출근 알림, 1분 뒤 재알림 1회 | [PRD 04](prd/04-geofence-notification.md) |
| 2026-09-25 | 관리자 화면은 timesheet 앱 안(`~/Workspace/cms` 아님), 마스터가 멤버를 초대 | [PRD 06](prd/06-store-invite.md), [PRD 07](prd/07-admin.md) |
| 2026-09-25 | 로그인은 직접 구현(JWT), 인프라는 Neon + Vercel | [PRD 05](prd/05-auth.md), [배포](deploy.md) |
| 2026-09-25 | 액세스 토큰도 쿠키, 쓰는 동안 로그인 유지(30일 슬라이딩) | [PRD 05](prd/05-auth.md), [timesheet-auth](../.claude/skills/timesheet-auth/SKILL.md) |
| 2026-09-25 | 멤버는 기록 수정을 요청하고 마스터가 승인 | [PRD 08](prd/08-correction-requests.md), [timesheet-requests](../.claude/skills/timesheet-requests/SKILL.md) |
| 2026-09-25 | 휴가·대타는 마스터가 승인하고 직접 등록·삭제 | [PRD 09](prd/09-leave-substitution.md) |
| 2026-09-25 | 휴가 유급 여부는 멤버가 고르지 않고 마스터가 승인 때 정한다 | [PRD 09](prd/09-leave-substitution.md) §1 |
| 2026-09-25 | 근무 달력 — 마스터는 전체 멤버, 멤버는 본인만 | [PRD 10](prd/10-calendar.md) |
| 2026-09-25 | 멤버 첫 화면에 오늘 근무 대시보드 — 출퇴근 탭의 시계 바로 아래 | [PRD 12](prd/12-member-today.md) |
| 2026-09-25 | 퇴근하면 다시 출근 없음 — 내일 0시까지 출근 버튼 비활성, 50m 알림도 끔 | [PRD 12](prd/12-member-today.md) T-7 |
| 2026-09-25 | 마스터가 멤버별 근무 요일·출퇴근 시각을 정하고, 주 시간·일수는 그 시간표로 계산 | [PRD 13](prd/13-work-schedule.md) |
| 2026-09-25 | 대타·사정으로 달라지는 날은 날짜별 변경(쉼·시각)으로 — 마스터만 | [PRD 13](prd/13-work-schedule.md) |
| 2026-09-25 | 시급 입력은 천 단위 쉼표 | [PRD 13](prd/13-work-schedule.md) WS-6 |
| 2026-09-25 | 마스터가 로고(PNG·JPG·SVG) 업로드, 헤더에 노출 | [PRD 11](prd/11-store-logo.md) |
| 2026-09-25 | 로고가 있으면 매장 이름 글자는 지운다 | [PRD 11](prd/11-store-logo.md) LG-5 |
| 2026-09-25 | 초대 코드는 휴대폰 문자 앱(공유)으로 보낸다 — 서버 자동 문자 아님 | [PRD 06](prd/06-store-invite.md) "초대 코드 보내기" |

## 디자인

| 날짜 | 규칙 | 적힌 곳 |
|---|---|---|
| 2026-09-25 | 헤더·하단 내비(푸터)·멤버 아바타, 내비 아이콘은 lucide | [timesheet-ui](../.claude/skills/timesheet-ui/SKILL.md) §1~3 |
| 2026-09-25 | 컴포넌트 가이드는 shadcn 문서 형식만 따른다(컴포넌트 코드는 그대로), MDX, `/guide` 공개 | [TS-003](team/tasks/TS-003-component-guide.md), [가이드 명세](design/component-guide.md) |
| 2026-09-25 | 달력 선택 시 파란 테두리 없음 | [달력 명세](design/calendar.md) §3, timesheet-ui §4 |
| 2026-09-25 | 좌우 화살표는 심플한 아이콘 — lucide Chevron | timesheet-ui §0·§2, [가이드 명세](design/component-guide.md) §2-5 |
| 2026-09-25 | 스크롤은 전부 shadcn ScrollArea | timesheet-ui §0·§2, [가이드 명세](design/component-guide.md) §2-5 |
| 2026-09-25 | 멤버 시계는 모바일에서도 한 줄 — HH:MM:SS | `web/src/lib/format.ts` clockText, [PRD 12](prd/12-member-today.md) |
| 2026-09-25 | 멤버 카드의 글자 링크(근무 기록·조건 수정·내보내기)는 버튼 모양으로 | timesheet-ui §0 "카드 안 동작" |
| 2026-09-25 | 글꼴은 Pretendard | timesheet-ui §0, [가이드 명세](design/component-guide.md) §2-2, 웹 `/guide/foundations` |
