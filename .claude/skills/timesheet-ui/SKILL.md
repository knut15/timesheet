---
name: timesheet-ui
description: >
  timesheet 웹 화면의 셸 규칙 — 헤더(AppHeader), 하단 내비게이션 푸터(BottomNav, lucide 아이콘), 멤버 아바타(Avatar).
  화면·탭·메뉴를 추가하거나 고칠 때, 멤버 이름을 화면에 띄울 때, 아이콘을 넣을 때 읽는다.
---

# timesheet 화면 셸

코드는 `web/src/components/shell.tsx` 한 파일이다. 새 화면은 여기 있는 셋을 조립해서 만들고, 헤더·내비·아바타를 화면마다 새로 그리지 않는다.
컴포넌트별 props·예시는 [컴포넌트 가이드 명세](../../../docs/design/component-guide.md)(웹 `/guide`)에 있다. 규칙의 원본은 이 문서다.
2026-09-25 에 정했다. 따를 시안이 없어 기존 색 토큰(`web/src/app/globals.css` 의 `--accent` 등) 위에서 정한 것이다.

## 1. 헤더 — `AppHeader`

| 자리 | 무엇 |
|---|---|
| 위 작은 줄 `eyebrow` | 매장 이름. 마스터 화면은 `"<매장> · 사장님"` |
| 로고 `logoUrl` | 매장 로고가 있으면 eyebrow 줄 맨 앞, 높이 20px·가로 최대 96px·비율 유지. **로고가 매장 이름 글자를 대신한다** — eyebrow 에서 이름을 빼고(멤버 빈 값, 마스터 "사장님"), 이름은 `logoAlt` 로. 없으면 이름만 ([PRD 11](../../../docs/prd/11-store-logo.md)) |
| 제목 `title` | **지금 활성인 메뉴 이름**과 같다 (출퇴근·기록·요청·급여·내 정보 / 대시보드·달력·요청·멤버·매장) |
| 오른쪽 | 내 아바타(항상). 그 앞에 `actions` — 마스터는 로그아웃 `IconButton` |

- `sticky top-0`, 반투명 배경 + blur. 본문 위로 스크롤되어도 제목이 남는다
- `width` 는 본문 폭과 같게: 멤버 `max-w-md`, 마스터 `max-w-3xl`

## 2. 푸터 — `BottomNav`

모든 로그인 화면의 푸터는 하단 내비게이션이다. 별도 텍스트 푸터를 두지 않는다.

| 역할 | 항목 (아이콘) | 방식 |
|---|---|---|
| 멤버 `/` | 출퇴근 `Clock` · 기록 `CalendarDays` · 요청 `ClipboardList` · 급여 `Wallet` · 내 정보 `UserRound` | 탭 상태 `onSelect` |
| 마스터 `/admin` | 대시보드 `LayoutDashboard` · 달력 `CalendarDays` · 요청 `Inbox` · 멤버 `Users` · 매장 `Store` | 라우트 `href` |

- 초대(`/admin/invites`)는 2026-09-25 에 내비에서 빠져 **멤버 화면 안**(맨 위 "초대 코드" 줄)으로 갔다. 이 경로에서는 멤버를 활성으로 본다. 이유는 [달력 명세 §1](../../../docs/design/calendar.md#1-마스터-달력-진입점--결정)
- 두 역할 모두 5개가 찼다. 메뉴를 더 넣으려면 하나를 다른 화면 안으로 옮기는 결정을 먼저 한다
- 항목은 3~5개. 아이콘 위(22px), 이름 아래(11px). 활성은 `text-accent` + 아이콘 선 굵기 2.4 + 윗선
- 활성 표시는 `aria-current="page"`. 아이콘은 `aria-hidden` — 이름 글자가 접근 이름이다
- `pb-[env(safe-area-inset-bottom)]` 로 아이폰 홈 표시줄을 피한다. 본문은 `pb-28` 로 가려지지 않게 한다
- 하위 경로(`/admin/members/[userId]`)는 부모 메뉴를 활성으로 본다

### 아이콘은 lucide-react 만

```tsx
import { Clock } from "lucide-react";   // ✓ 이름으로 하나씩 가져온다 (트리 셰이킹)
```

- 새 아이콘은 쓰기 전에 이름이 설치된 버전에 있는지 확인한다: `node -e "console.log(typeof require('lucide-react').Clock)"` → `object`
- 아이콘만 있는 버튼은 `IconButton` 으로 — `aria-label` 과 `title` 이 같이 붙는다

## 3. 멤버 아바타 — `Avatar`

사진 업로드가 없다. **이름 이니셜 + 사용자 id 로 고정된 색**이다.

| 규칙 | 값 |
|---|---|
| 글자 | 한글 이름은 첫 글자, 로마자는 두 글자 대문자 (`initials`) |
| 색 | `seed`(= **사용자 id**) 해시로 8색 중 하나. 흰 글자 대비 4.5:1 이상인 색만 |
| 크기 | `xs` 18px(달력 칸 겹침, `ring-2 ring-surface`) · `sm` 32px(목록 안) · `md` 40px(행·헤더) · `lg` 64px(상세·내 정보) |
| 접근성 | 옆에 이름이 있으면 장식(`aria-hidden`), 혼자 쓰면 `label` |

- `seed` 에는 반드시 사용자 id 를 넣는다. 이름을 넣으면 같은 사람이 화면마다 다른 색이 된다.
  API 응답에 id 가 없으면 계약(`server/src/contract.ts`)에 id 를 추가한다 — 초대 코드의 `usedByUserId` 가 그렇게 들어갔다
- 멤버 이름이 나오는 곳에는 아바타를 같이 둔다: 대시보드(근무 중 — 초록 점, 멤버별 행), 달력(칸 겹침·날짜 상세 행), 멤버 목록, 멤버 상세, 초대 사용자, 내 정보

## 4. 달력

화면·상태 명세 전체는 [docs/design/calendar.md](../../../docs/design/calendar.md). 여기에는 다른 화면에도 걸리는 규칙만 둔다.

| 규칙 | 값 |
|---|---|
| 주 시작 | **월요일** — 급여의 주 경계(`startOfWeek`)와 같다 |
| 날짜 기준 | 기록은 **출근한 날**(`dayKey(s.start)`) 한 칸에만 붙는다 |
| 날짜 칸 | 버튼, 터치 영역 40px 이상, 읽는 이름에 날짜·요약, 선택은 `aria-pressed`, 오늘은 `aria-current="date"` |
| 상태 표시 | **색만으로 구별하지 않는다.** 휴가·대타 = 점선 테두리 + 글자, 근무 중 = 채운 점, 퇴근 기록 없음 = `TriangleAlert`, 요청 대기 = `Hourglass`, 오늘 = 숫자 둘레 원, 선택 = 테두리 없이 `bg-accent/10` + 날짜 숫자 `font-bold` (휴가·대타 점선은 선택돼도 유지, 키보드 `focus-visible` 바깥 선도 유지 — 2026-09-25 사용자 요청 "선택 시 파란 라인 제거") |
| 점선 테두리 색 | `border-muted` — `border-line` 은 대비 1.3 이라 쓰지 않는다 |
| 아바타 겹침 | 최대 3개, 4명 이상이면 2개 + `+N` |

## 5. 바꾸면 같이 고칠 것

- 이 문서의 표 (메뉴·아이콘·크기)
- 화면이 바뀌었으면 `work-history` 스킬 3절대로 배포·README·히스토리까지 반영한다
