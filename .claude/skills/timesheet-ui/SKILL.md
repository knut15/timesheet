---
name: timesheet-ui
description: >
  timesheet 웹 화면의 셸 규칙 — 헤더(AppHeader), 하단 내비게이션 푸터(BottomNav, lucide 아이콘), 멤버 아바타(Avatar).
  화면·탭·메뉴를 추가하거나 고칠 때, 멤버 이름을 화면에 띄울 때, 아이콘을 넣을 때 읽는다.
---

# timesheet 화면 셸

코드는 `web/src/components/shell.tsx` 한 파일이다. 새 화면은 여기 있는 셋을 조립해서 만들고, 헤더·내비·아바타를 화면마다 새로 그리지 않는다.
2026-09-25 에 정했다. 따를 시안이 없어 기존 색 토큰(`web/src/app/globals.css` 의 `--accent` 등) 위에서 정한 것이다.

## 1. 헤더 — `AppHeader`

| 자리 | 무엇 |
|---|---|
| 위 작은 줄 `eyebrow` | 매장 이름. 마스터 화면은 `"<매장> · 사장님"` |
| 제목 `title` | **지금 활성인 메뉴 이름**과 같다 (출퇴근·기록·급여·내 정보 / 대시보드·멤버·초대·매장) |
| 오른쪽 | 내 아바타(항상). 그 앞에 `actions` — 마스터는 로그아웃 `IconButton` |

- `sticky top-0`, 반투명 배경 + blur. 본문 위로 스크롤되어도 제목이 남는다
- `width` 는 본문 폭과 같게: 멤버 `max-w-md`, 마스터 `max-w-3xl`

## 2. 푸터 — `BottomNav`

모든 로그인 화면의 푸터는 하단 내비게이션이다. 별도 텍스트 푸터를 두지 않는다.

| 역할 | 항목 (아이콘) | 방식 |
|---|---|---|
| 멤버 `/` | 출퇴근 `Clock` · 기록 `CalendarDays` · 급여 `Wallet` · 내 정보 `UserRound` | 탭 상태 `onSelect` |
| 마스터 `/admin` | 대시보드 `LayoutDashboard` · 멤버 `Users` · 초대 `TicketPlus` · 매장 `Store` | 라우트 `href` |

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
| 크기 | `sm` 32px(목록 안) · `md` 40px(행·헤더) · `lg` 64px(상세·내 정보) |
| 접근성 | 옆에 이름이 있으면 장식(`aria-hidden`), 혼자 쓰면 `label` |

- `seed` 에는 반드시 사용자 id 를 넣는다. 이름을 넣으면 같은 사람이 화면마다 다른 색이 된다.
  API 응답에 id 가 없으면 계약(`server/src/contract.ts`)에 id 를 추가한다 — 초대 코드의 `usedByUserId` 가 그렇게 들어갔다
- 멤버 이름이 나오는 곳에는 아바타를 같이 둔다: 대시보드(근무 중 — 초록 점, 멤버별 행), 멤버 목록, 멤버 상세, 초대 사용자, 내 정보

## 4. 바꾸면 같이 고칠 것

- 이 문서의 표 (메뉴·아이콘·크기)
- 화면이 바뀌었으면 `work-history` 스킬 3절대로 배포·README·히스토리까지 반영한다
