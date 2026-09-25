# 근무 달력 — 화면·상태 명세

[← 디자인 문서](README.md) · 요구사항 [PRD 10](../prd/10-calendar.md) · 셸 규칙 [timesheet-ui](../../.claude/skills/timesheet-ui/SKILL.md) · 작업 카드 [TS-002](../team/tasks/TS-002-calendar.md)

2026-09-25 작성. 기준 폭은 390px(아이폰 14·15). 시각 검증은 아직 하지 않았다 — 구현 뒤 실화면에서 확인한다.

## 0. 한눈에

| 누가 | 어디 | 날짜 칸에 보이는 것 | 날짜를 누르면 |
|---|---|---|---|
| 멤버 | 기록 탭, 기본 보기가 달력 (목록으로 전환) | 근무시간 합, 휴가·대타 글자 | 그날 기록 목록 + 수정 요청 |
| 마스터 | **하단 내비 "달력"** (`/admin/calendar`) | 일한 멤버 아바타(최대 3), 시간 합 | 멤버별 행 → 멤버 상세 |

새 API 는 없다. 새 색 토큰도 없다(§8).

---

## 1. 마스터 달력 진입점 — 결정

**결정: 하단 내비의 "초대"를 빼서 멤버 화면 안으로 옮기고, 그 자리에 "달력"을 넣는다.**

내비 순서: `대시보드 · 달력 · 요청 · 멤버 · 매장`

### 비교한 대안

| 안 | 방법 | 좋은 점 | 나쁜 점 |
|---|---|---|---|
| **A. 초대 → 멤버 안으로, 달력을 내비에** (채택) | 멤버 화면 맨 위에 "초대 코드" 줄, `/admin/invites` 는 그대로 두고 멤버의 하위 화면으로 본다 | 달력이 한 번에 열린다. 초대는 "멤버를 늘리는 일"이라 멤버 화면에 있어도 뜻이 맞다. 멤버가 0명일 때 이미 멤버·대시보드 화면이 초대로 링크한다 | 초대까지 한 번 더 누른다 (멤버 → 초대 코드) |
| B. 매장 → 헤더 톱니 아이콘으로, 달력을 내비에 | 헤더 `actions` 에 `Settings` `IconButton` | 매장 설정은 거의 안 연다 | 헤더 제목 = 활성 메뉴 이름 규칙이 깨진다(매장 화면에 활성 메뉴가 없다). 로그아웃 옆에 아이콘이 둘이 되어 누르기 헷갈린다 |
| C. 대시보드 안에 달력 블록 | 대시보드 카드들 사이에 월 격자 | 내비를 안 건드린다. 대시보드에 이미 월 선택이 있다 | 390px 에서 대시보드가 격자(약 380px)+상세만큼 길어진다. "지금 누가 일하나"와 "한 달을 훑는다"는 목적이 섞인다. 인건비 카드의 월 선택과 달력의 월 선택이 둘이 된다 |
| D. 멤버 화면에 탭 (목록 / 달력) | 멤버 화면 위에 두 탭 | 내비를 안 건드린다 | 멤버 화면은 **급여 조건 관리**이고 달력은 **전 멤버 근무**다. 탭 하나에 뜻이 다른 둘을 넣는다. 찾기 어렵다 |

### 이유

1. 사장님이 달력을 여는 빈도(주·월마다 근무 확인)가 초대 코드 발급(새 사람을 뽑을 때만)보다 훨씬 높다. 자주 여는 것을 내비에 둔다.
2. 초대는 멤버를 늘리는 동작이다. 멤버 화면 안에 두면 "멤버가 없어요 → 초대" 흐름이 한 화면에서 끝난다.
3. B 는 헤더 규칙(제목 = 활성 메뉴)을 깨고, C·D 는 목적이 다른 두 화면을 섞는다.

### 구현 요점 (시니어)

| 곳 | 바꿀 것 |
|---|---|
| `app/admin/layout.tsx` `NAV` | `{ key: "/admin/calendar", href: "/admin/calendar", label: "달력", icon: CalendarDays }` 를 두 번째에 넣고, 초대 항목을 뺀다 |
| 같은 파일, 활성 계산 | `/admin/invites` 는 **멤버**(`/admin/members`)를 활성으로 본다. 헤더 제목도 "멤버" |
| `app/admin/members/page.tsx` | 목록 위에 초대 줄(아래 와이어프레임). 멤버 0명일 때 빈 상태 카드의 링크는 그대로 |
| `app/admin/invites/page.tsx` | 맨 위에 `← 멤버` 링크(`/admin/members`) — 내비에서 사라졌으므로 돌아갈 길을 둔다 |
| `app/admin/calendar/page.tsx` | 신규. §5 마스터 화면 |

멤버 화면 맨 위 초대 줄:

```
┌──────────────────────────────────────────┐
│ [🎫] 초대 코드            발급·관리  ›   │  ← Link /admin/invites, 높이 56, Card
└──────────────────────────────────────────┘
```

- 아이콘 `TicketPlus` 20px `text-accent`, 제목 `font-semibold`, 오른쪽 `text-sm text-muted` + `ChevronRight` 16px
- 사용 가능한 코드가 있으면 오른쪽 글자를 `사용 가능 1개` 로 바꿔도 된다 (초대 API 를 한 번 더 부르게 되므로 선택. 기본은 고정 글자 "발급·관리")

---

## 2. 멤버 기록 탭 — 달력 기본 + 목록 전환

```
390px ───────────────────────────────────────
│ 스타벅스 강남                        (나) │  AppHeader  title="기록"
│ 기록                                      │
├───────────────────────────────────────────┤
│  ◀          2026년 9월           ▶        │  MonthPicker (그대로)
│ ┌───────────────────┬───────────────────┐ │
│ │ ▦ 달력  (선택)    │ ☰ 목록            │ │  ViewToggle  h-10
│ └───────────────────┴───────────────────┘ │
│ ┌───────────────────────────────────────┐ │
│ │ 월  화  수  목  금  토  일             │ │  MonthGrid (§3)
│ │ …                                     │ │
│ │ 범례                                  │ │  CalendarLegend
│ └───────────────────────────────────────┘ │
│  9월 22일 화요일 · 4시간 30분              │  DayDetail (§4)
│ ┌───────────────────────────────────────┐ │
│ │ 09:00 ~ 13:30 · 4시간 30분     ✎  🗑  │ │  기존 기록 행 재사용
│ └───────────────────────────────────────┘ │
│ [ + 빠진 기록 추가 요청 ]                 │  기존 버튼 재사용
│ 요청은 사장님이 승인하면 …                │  기존 안내 문구
├───────────────────────────────────────────┤
│  출퇴근   기록   요청   급여   내 정보    │  BottomNav
```

### 보기 전환 `ViewToggle`

| 항목 | 값 |
|---|---|
| 모양 | 두 칸 세그먼트. 바깥 `rounded-xl border border-line bg-background p-1`, 칸 `h-10 flex-1 rounded-lg text-sm font-medium` |
| 켜진 칸 | `bg-surface text-foreground shadow-sm` + 아이콘 선 굵기 2.4 |
| 꺼진 칸 | `text-muted` |
| 아이콘 | 달력 `CalendarDays`, 목록 `List` (16px, `aria-hidden`) — 글자가 접근 이름 |
| 접근성 | `<div role="group" aria-label="보기">` 안에 `<button aria-pressed>` 두 개 |
| 기본값 | 달력. 기억하지 않는다 — 탭을 다시 열면 달력 |
| 목록 | 지금 `RecordsPanel` 화면 그대로 |

- 월 이동(`MonthPicker`)은 두 보기가 같은 `cursor` 를 쓴다. 보기를 바꿔도 달은 유지된다.
- 선택된 날짜도 보기를 바꿨다 돌아오면 유지한다(`RecordsPanel` 안 상태).

### 선택된 날짜 규칙

| 상황 | 선택 |
|---|---|
| 탭을 처음 열 때 (이번 달) | **오늘** (CAL-6) |
| 다른 달로 넘김 | 없음 → 상세 자리에 안내 "날짜를 누르면 그날 기록이 나와요" |
| 이번 달로 돌아옴 | 오늘 |
| 선택한 날을 다시 누름 | 선택 유지 (해제하지 않는다) |

마스터 달력도 같은 규칙이다.

---

## 3. 월 격자

### 치수 (390px)

| 항목 | 값 | 계산 |
|---|---|---|
| 본문 폭 | 350px | 390 − 본문 `px-5` 20×2 |
| 격자 카드 안쪽 여백 | 가로 8px, 세로 12px | `Card className="px-2 py-3"` (Card 기본 p-5 를 덮는다) |
| 격자 폭 | 334px | 350 − 8×2 |
| **칸 폭** | **약 47.7px** | 334 ÷ 7, `grid-cols-7 gap-0` |
| 칸 높이 | 멤버 **56px**, 마스터 **64px** | 터치 영역 47×56 / 47×64 — 40px 이상(CAL-8) |
| 칸 안쪽 여백 | 2px | 칸 테두리가 이웃과 붙지 않게 버튼에 `m-0.5`(표시 폭 약 43.7px) |
| 요일 줄 | 높이 24px, `text-[11px] text-muted` 가운데 | `월 화 수 목 금 토 일` — **월요일 시작**(CAL-1) |
| 주 수 | 그 달에 필요한 만큼 (4~6줄) | 칸 높이 × 줄 수. 멤버 6줄 = 336px |

넓은 화면(마스터 `max-w-3xl` = 768px)에서는 칸 폭만 늘어나고 높이는 그대로 둔다. 칸 안 배치는 같다.

### 칸 안 배치

```
멤버 칸 47×56                     마스터 칸 47×64
┌─────────────┐                  ┌─────────────┐
│22        ⧗  │ ← 1줄 12px        │22       ● ⧗ │ ← 1줄: 날짜 + 표시(최대 2)
│             │                  │ (A)(B)(C)   │ ← 2줄: 아바타 18px 겹침
│  4.5h       │ ← 2줄 시간        │   14h       │ ← 3줄: 시간 합
│  유급       │ ← 3줄 휴가·대타    └─────────────┘
└─────────────┘
```

| 자리 | 글자 | 스타일 |
|---|---|---|
| 날짜 숫자 | `22` | 왼쪽 위, `text-xs font-medium tabular-nums`, 숫자 둘레 20×20 원 자리 (오늘 표시용) |
| 표시 자리 | 아이콘·점 최대 2개 | 오른쪽 위, 10px, 간격 2px. 순서: 근무 상태(● 또는 !) → 요청 대기(⧗) |
| 시간 | `4.5h`, `14h` | 가운데, `text-[11px] font-semibold tabular-nums text-foreground` |
| 휴가·대타 글자 | `유급` `무급` `대타` | 가운데, `text-[10px] text-muted` |

**시간 줄임 규칙** `compactHours(min)` — 칸이 좁아 `4시간 30분` 이 들어가지 않는다.

| 분 | 표시 |
|---|---|
| 0 | (표시 안 함) |
| 1분 ~ 10시간 미만 | 시간 단위 소수 한 자리 반올림, `.0` 은 뗀다 — 45분 `0.8h`, 4시간 `4h`, 4시간 30분 `4.5h` |
| 10시간 이상 | 정수 반올림 — 14시간 `14h`, 14시간 30분 `15h` |

정확한 값은 읽는 이름(§7)과 상세(§4)에 `hm()` 으로 쓴다.

### 칸 상태 — 색만으로 구별하지 않는다

| 상태 | 모양 (색이 없어도 보이는 것) | 색 | 글자·읽는 이름 |
|---|---|---|---|
| 근무 있음 | 시간 글자 `4.5h` | foreground | "4시간 30분 근무" |
| 휴가(유급) | 칸 테두리 **점선** 1px + 글자 `유급` | 테두리 `border-muted`, 글자 muted | "유급 휴가" |
| 휴가(무급) | 점선 + 글자 `무급` | 같음 | "무급 휴가" |
| 대타로 쉼 | 점선 + 글자 `대타` | 같음 | "대타로 쉼" |
| 진행 중 (오늘 출근, 퇴근 안 찍음) | 오른쪽 위 **채운 점 ●** 6px | `bg-green-600 dark:bg-green-400` | "근무 중" |
| 퇴근 안 찍힘 (지난 날 출근, 아직 열림) | 오른쪽 위 **`TriangleAlert`** 10px | `text-warn` | "퇴근 기록 없음" |
| 수정 요청 대기 | 오른쪽 위 **`Hourglass`** 10px | `text-amber-700 dark:text-amber-400` | "수정 요청 대기 중" |
| 오늘 | 날짜 숫자 둘레 **원 테두리** 1.5px + 숫자 굵게 | `ring-accent`, 숫자 `text-accent font-bold` | "오늘" + `aria-current="date"` |
| 선택됨 | 옅은 배경 + **날짜 숫자 굵게** (테두리 없음 — 2026-09-25 사용자 요청 "선택 시 파란 라인 제거") | `bg-accent/10`, 숫자 `font-bold` | `aria-pressed="true"` |
| 이번 달 밖 | 숫자만, 흐리게. 누를 수 없다 | `text-muted opacity-40` | 버튼 아님, `aria-hidden` |
| 기록 없음 (이번 달) | 숫자만 | — | "기록 없음" |

- 오늘(숫자 둘레 원)과 선택됨(옅은 배경 + 굵은 숫자)은 둘이 겹치면 둘 다 보인다.
- 선택된 칸은 휴가·대타의 점선 테두리를 그대로 두고 배경만 더한다. 색 외의 선택 신호는 굵은 날짜와 아래 상세 머리의 날짜다.
- 오늘을 accent 로 **채우지 않는다.** 다크 모드에서 흰 글자/`#3b82f6` 대비가 3.68 로 4.5 에 못 미친다(§8).
- 근무와 휴가가 같은 날 겹치면(예: 반차처럼 휴가 날에 기록이 있음) 멤버 칸은 시간(2줄)과 휴가 글자(3줄)를 둘 다, 마스터 칸은 시간 + 점선 테두리를 둘 다 보인다.
- 날짜 기준: 기록은 **출근 시각의 날**(`dayKey(s.start)`)에 붙는다. `pay.ts` 가 주를 나누는 기준과 같다. 자정을 넘긴 근무도 출근한 날 한 칸에만 나온다.
- 진행 중인 근무의 시간은 지금 시각까지로 센다 (`shiftMinutes(s, now)`, `useNow(60_000)`).

### 마스터 칸 — 아바타 겹침

| 일한 인원 | 보이는 것 | 가로 폭 |
|---|---|---|
| 1 | (A) | 18px |
| 2 | (A)(B) | 18 + 12 = 30px |
| 3 | (A)(B)(C) | 42px |
| 4 이상 | (A)(B)(+N) — N = 인원 − 2 | 42px |

- 아바타는 새 크기 `xs` 18px(§9). 겹침은 `-ml-1.5`(6px), 각 아바타에 `ring-2 ring-surface` 로 경계를 둔다.
- `+N` 은 같은 18px 원, `bg-line text-foreground text-[9px] font-semibold`. 99 초과는 `+99`.
- 순서: 그날 **먼저 출근한 사람**부터.
- 칸 표시 폭이 약 43.7px 이므로 42px 가 상한이다. 인원을 글자(`3명`)로 칸에 따로 쓰지 않는다 — 아바타 수와 `+N` 으로 인원이 보이고, 정확한 수는 읽는 이름과 상세 머리에 있다.
- 일한 사람은 없고 휴가·대타만 있는 날: 2줄 비움, 3줄에 `쉼 N`(`text-[10px] text-muted`), 칸 점선.
- 마스터 칸은 유급·무급·대타를 칸에서 가르지 않는다(여러 사람이 섞인다). 점선으로 "쉰 사람이 있다"만 알리고, 종류는 상세에서 본다.

### 범례 `CalendarLegend`

격자 카드 맨 아래, 위와 8px 띄워 한 줄(좁으면 두 줄로 감긴다). `text-[11px] text-muted`, 항목 간격 12px. 항상 보인다.

```
멤버:   ● 근무 중   ⚠ 퇴근 기록 없음   ⧗ 요청 대기   ┆점선┆ 휴가·대타
마스터: ● 근무 중   ⚠ 퇴근 기록 없음   ⧗ 요청 대기   ┆점선┆ 쉰 사람 있음
```

- 각 항목 앞 표시는 칸에 쓰는 것과 **같은 요소**(점·아이콘·점선 상자 12×10)를 그대로 쓴다. 표시는 `aria-hidden`, 글자가 설명이다.
- 멤버 범례에 한 줄 더: `유급·무급: 휴가 · 대타: 대타로 쉰 날` — "대타" 가 누구 쪽인지 헷갈리지 않게. 대타로 **일한** 날은 보통 근무로 보인다.

---

## 4. 멤버 — 날짜 상세

달력 카드 바로 아래, 간격 16px(`space-y-4`). 별도 카드로 감싸지 않고 기존 목록 행 모양을 그대로 쓴다.

```
 9월 22일 화요일 · 4시간 30분                  ← h2 text-sm font-semibold, 오른쪽에 없음
┌─────────────────────────────────────────┐
│ 09:00 ~ 13:30 · 4시간 30분       ✎  🗑  │  ← 기존 기록 행 (날짜 줄 없이 시간만)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 18:00 ~ 근무 중 · 1시간 10분  [승인 대기]│  ← 대기 중이면 버튼 대신 StatusPill
└─────────────────────────────────────────┘
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
  유급 휴가                                  ← 기존 휴가 행 (점선)
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
  추가 요청 · 10:00 ~ 12:00      [승인 대기]  ← 그날 출근으로 들어간 대기 중 추가 요청
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
[ + 빠진 기록 추가 요청 ]
```

| 요소 | 규칙 |
|---|---|
| 머리 | `date()` 형식 날짜 + 그날 근무 합 `hm()`. 근무가 없으면 날짜만. `aria-live="polite"` — 날짜를 누르면 화면 읽기 프로그램이 새 머리를 읽는다 |
| 기록 행 | 목록 보기의 기록 행을 **컴포넌트로 빼서 재사용**. 수정·삭제 요청 버튼, 펼쳐지는 `CorrectionForm`, 대기 중이면 `StatusPill status="pending"` 까지 같다. 상세에서는 날짜 줄을 빼고 시간 줄을 굵게 올린다(`showDate={false}`) |
| 순서 | 기록(출근 이른 순) → 대기 중 추가 요청 → 휴가·대타 |
| 추가 요청 버튼 | 목록 보기의 "빠진 기록 추가 요청" 버튼과 같다. 날짜를 미리 채우지 않는다(지금 동작 유지) |
| 요청 뒤 | `onChange()` 로 다시 읽으면 그 칸에 ⧗ 가 생긴다. 선택은 유지 |

---

## 5. 마스터 — 달력 화면 `/admin/calendar`

```
768px 이하 ──────────────────────────────────
│ 스타벅스 강남 · 사장님              ⎋ (나) │  title="달력"
├───────────────────────────────────────────┤
│  ◀          2026년 9월           ▶        │  MonthPicker
│  이번 달 12명 · 312시간                   │  text-sm text-muted (그 달 일한 인원·시간 합)
│ ┌───────────────────────────────────────┐ │
│ │ 월  화  수  목  금  토  일             │ │
│ │ ┌────┐┌────┐                           │ │
│ │ │ 1 ●││ 2  │ …                         │ │
│ │ │ⒶⒷⒸ ││ⒶⒷ⊕ │                           │ │
│ │ │14h ││22h │                           │ │
│ │ └────┘└────┘                           │ │
│ │ 범례                                  │ │
│ └───────────────────────────────────────┘ │
│  9월 22일 화요일 · 3명 · 14시간 30분       │  DayDetail 머리
│ ┌───────────────────────────────────────┐ │  Card p-0, divide-y
│ │ (A) 민지    09:00 ~ 13:30 · 4시간 30분 › │ │
│ │ (B) 준호    12:00 ~ 18:00 · 6시간       › │ │
│ │             19:00 ~ 21:00 · 2시간         │ │  ← 같은 사람 두 번째 근무는 아래 줄
│ │ (C) 서연    18:00 ~ 근무 중 · 2시간  ●  › │ │
│ │ (D) 도윤    유급 휴가                   › │ │  ← 휴가·대타 줄: 글자 muted, 행 왼쪽 점선 표시
│ │ (E) 하린    대타로 쉼                   › │ │
│ └───────────────────────────────────────┘ │
├───────────────────────────────────────────┤
│ 대시보드  달력  요청  멤버  매장           │
```

| 요소 | 규칙 |
|---|---|
| 달 요약 줄 | 그 달 칸들의 합. `이번 달 N명 · H시간`(`hm` 을 시간 단위로 반올림). 기록 0 이면 줄을 빼고 빈 달 상태(§6) |
| 상세 머리 | `date()` + `N명` + `hm(합)`. 쉰 사람만 있으면 `쉼 N명` |
| 멤버 행 | `Link href=/admin/members/[userId]`, `flex items-center gap-3 px-5 py-4 hover:bg-background` — 대시보드 멤버별 행과 같은 모양. 왼쪽 `Avatar size="sm"`, 이름 `font-medium`, 시각 `text-sm text-muted tabular-nums`, 오른쪽 `ChevronRight` 16px muted |
| 한 사람 여러 근무 | 이름 줄 하나, 시각 줄을 근무마다 한 줄씩 |
| 진행 중 | 시각 `HH:MM ~ 근무 중`, 아바타 오른쪽 아래 초록 점(대시보드 "지금 근무 중" 과 같은 표시) |
| 퇴근 안 찍힘(지난 날) | 시각 줄 뒤 `TriangleAlert` 14px + 글자 `퇴근 기록 없음` `text-warn` |
| 수정 요청 대기 | 그 근무 줄 오른쪽에 `StatusPill status="pending"` (승인 대기) |
| 휴가·대타 줄 | 근무 행 뒤에. 시각 자리에 `유급 휴가` / `무급 휴가` / `대타로 쉼` (`RecordsPanel` 의 `ABSENCE_LABEL` 과 같은 말) |
| 정렬 | 근무한 사람(첫 출근 이른 순) → 쉰 사람(이름순) |
| 대타 | 쉰 쪽은 "대타로 쉼" 줄로, 대신 일한 쪽은 보통 근무 줄로 나온다. 누가 누구 대신인지는 이 화면에서 잇지 않는다(대시보드 응답에 연결 정보가 없다) |

### 데이터

| 무엇 | 어디서 |
|---|---|
| 멤버·기록·휴가 | `GET /api/stores/me/dashboard?month=YYYY-MM` (PRD 10 그대로). `role === "member"` 만 센다(대시보드와 같다) |
| 수정 요청 대기 ⧗ | `GET /api/stores/me/requests` 의 `corrections` 중 `status === "pending"`. 날짜는 `current.start`(수정·삭제) 또는 `start`(추가)의 `dayKey`. **기존 API** 이지만 PRD 10 데이터 표에는 없다 — 부모가 PRD 에 한 줄 보탠다 |

---

## 6. 상태

| 상태 | 멤버 | 마스터 |
|---|---|---|
| 로딩 (처음·달 이동) | 격자는 날짜 숫자만 그린 채 바로 보인다(날짜는 기기에서 계산). 칸 내용·표시는 비운다. 격자 컨테이너 `aria-busy="true"`, 칸은 작은 스켈레톤 막대, 범례는 그대로(데이터와 무관). 상세 자리는 같은 크기 스켈레톤 1행(`Bone`, `Loading`) — 글자 "불러오는 중…" 은 쓰지 않는다 | 격자는 날짜 숫자만 그린 채 바로 보이고 칸 내용·표시는 비운다(`aria-busy="true"`). 글자 대신 불러온 뒤와 같은 크기의 스켈레톤(`Bone`): 달 요약 줄 자리 한 줄(`h-5`), 범례 자리 한 줄(`h-4`), 상세 자리 멤버 행 2개(`MemberDayRow` 와 같은 `px-5 py-4` 카드, `Loading` 으로 감싼다). 코드 `web/src/app/admin/_skeletons.tsx` |
| 빈 달 (기록·휴가 0) | 격자는 그대로(숫자만). 범례 위에 한 줄 `이 달 기록이 없어요.` (`text-sm text-muted` 가운데). 오늘·선택 표시는 유지 | `이 달 근무 기록이 없어요.` 멤버가 0명이면 대신 `아직 멤버가 없어요. 초대 코드를 발급해 보세요.` + `/admin/invites` 링크 (대시보드 문구와 같게) |
| 오류 | 격자 카드 대신 `Card` 하나: `ErrorText` "기록을 불러오지 못했어요." + `다시 시도` 버튼(`reload`, `rounded-xl border border-line py-2.5 text-sm w-full`) | 같음, 문구 "근무 기록을 불러오지 못했어요." |
| 선택한 날 비어 있음 | 머리 `9월 24일 목요일` + `이 날 기록이 없어요.`(`text-sm text-muted`) + 추가 요청 버튼 | 머리 + `이 날 일한 사람이 없어요.` |
| 선택 없음 (다른 달) | `날짜를 누르면 그날 기록이 나와요.` | `날짜를 누르면 그날 근무가 나와요.` |

주의 — **로딩 판정.** `useApi` 는 키가 바뀌어도 이전 달 `data` 를 지우지 않는다. 달을 넘긴 직후 이전 달 데이터로 새 달을 그리면 전부 "기록 없음"으로 보였다가 채워진다(빈 달과 구별 불가). 구현은 "지금 `data` 가 어느 달 키로 읽은 것인지"를 따로 들고, 키가 다르면 로딩으로 본다. `useApi` 자체를 고칠지는 시니어가 정한다.

---

## 7. 접근성

| 항목 | 규칙 |
|---|---|
| 구조 | 격자는 `<div role="group" aria-label="2026년 9월 달력">`. 요일 줄은 `aria-hidden` (읽는 이름에 요일이 들어간다) |
| 날짜 칸 | 이번 달 날짜는 `<button type="button">`. 이번 달 밖은 `<div aria-hidden>` |
| 읽는 이름 | `aria-label` 로 준다. 칸 안 글자(`4.5h`)는 줄임이라 읽히지 않게 한다 |
| 선택 | `aria-pressed={selected}` (CAL-9) |
| 오늘 | `aria-current="date"` + 이름에 "오늘" |
| 키보드 | **화살표 이동은 넣지 않는다.** 날짜마다 평범한 버튼이라 Tab 으로 차례대로 가고 Enter·Space 로 선택한다. `role="grid"` 와 roving tabindex 는 구현·검증 비용에 비해 이 화면(한 달 최대 31칸, 누르면 아래 상세)에서 얻는 것이 적다. 대신 `MonthPicker` 버튼이 격자 앞에 있어 달 이동은 Tab 한 번 거리다 |
| 포커스 | `focus-visible:outline-2 outline-accent outline-offset-1` — 키보드로 이동할 때만 보이는 바깥 선. 마우스·터치 선택에는 나오지 않는다 |
| 상세 | 상세 머리에 `aria-live="polite"` — 날짜를 바꾸면 새 날짜와 합이 읽힌다 |
| 범례 | 보이는 글자로 둔다(`aria-hidden` 은 표시 모양에만) |

### 읽는 이름 예시 — `dayAriaLabel`

순서: `M월 D일 요일` → `오늘` → 근무 → 휴가·대타 → 상태 → 요청. 쉼표로 잇는다.

| 칸 | 읽는 이름 |
|---|---|
| 멤버, 근무 | `9월 22일 화요일, 4시간 30분 근무` |
| 멤버, 오늘 진행 중 | `9월 25일 금요일, 오늘, 2시간 10분 근무, 근무 중` |
| 멤버, 지난 날 열림 + 요청 대기 | `9월 23일 수요일, 9시간 근무, 퇴근 기록 없음, 수정 요청 대기 중` |
| 멤버, 휴가 | `9월 24일 목요일, 유급 휴가` |
| 멤버, 대타 | `9월 26일 토요일, 대타로 쉼` |
| 멤버, 빈 날 | `9월 27일 일요일, 기록 없음` |
| 마스터 | `9월 22일 화요일, 3명 근무 14시간 30분, 휴가·대타 2명, 근무 중 1명, 수정 요청 대기 1건` |
| 마스터, 빈 날 | `9월 27일 일요일, 근무 없음` |

---

## 8. 다크 모드 — 새 토큰 없음

기존 토큰(`globals.css`)과 기존 화면이 이미 쓰는 Tailwind 색(대시보드의 초록 점, `StatusPill` 의 amber)만으로 된다. 대비는 WCAG 공식으로 계산했다 (글자 4.5:1, 아이콘·테두리 3:1 기준).

| 쓰임 | 라이트 | 다크 | 대비 (라이트 / 다크, 배경 surface) |
|---|---|---|---|
| 오늘 숫자·원 | `--accent` #2563eb | #3b82f6 | 5.17 / 4.75 ✓ |
| 선택 배경 | `--accent` 10% | 같음 | 글자 대비는 배경 위 `foreground` 로 유지 |
| 선택 배경 | `bg-accent/10` | 같음 | 배경이라 대비 대상 아님 |
| 점선 테두리 (휴가·대타) | `--muted` #78716c | #a8a29e | 4.80 / 6.93 ✓ — `--line` 은 1.26 / 1.15 라 **쓰지 않는다** |
| 근무 중 점 | `green-600` #16a34a | `green-400` #4ade80 | 3.30 / 10.04 ✓ — 대시보드의 `green-500` 은 흰 배경에서 2.28 이라 달력에서는 600 을 쓴다 |
| 퇴근 기록 없음 | `--warn` #dc2626 | #f87171 | 4.83 / 6.32 ✓ |
| 요청 대기 아이콘 | `amber-700` | `amber-400` #fbbf24 | 3:1 이상 / 10.48 ✓ (amber-600 은 3.19 로 아슬해서 한 단계 진하게) |
| 이번 달 밖 숫자 | `text-muted opacity-40` | 같음 | 누를 수 없는 요소라 대비 기준 대상 아님 |

하지 않을 것: 오늘 칸을 accent 로 채우고 흰 글자 — 다크에서 3.68.

---

## 9. 컴포넌트 명세 (시니어 구현용)

파일은 작업 카드의 허용 범위 — `web/src/components/calendar/*`, `web/src/lib/calendar.ts`.

### `lib/calendar.ts` — 계산 (단위 테스트 대상)

```ts
/** 그 달을 덮는 월요일 시작 칸들. 줄 수만큼(28·35·42개). month 는 0~11 (useMonthCursor 와 같다) */
export function monthCells(year: number, month: number): { key: string; day: number; inMonth: boolean }[];

/** 칸에 쓰는 줄인 시간. 0 → "", 45 → "0.8h", 240 → "4h", 270 → "4.5h", 870 → "15h" (10시간 이상은 정수) */
export function compactHours(minutes: number): string;

/** 멤버: 날짜 키 → 그날 요약 */
export type MemberDay = { minutes: number; open: "today" | "stale" | null; absence: Absence["kind"] | null; pending: boolean };
export function memberDays(shifts: Shift[], absences: Absence[], pendingCorrections: Correction[], now: number): Map<string, MemberDay>;

/** 마스터: 날짜 키 → 그날 요약. people 은 첫 출근 이른 순 */
export type MasterDay = {
  people: { userId: string; nickname: string }[];
  minutes: number;
  openCount: number; staleCount: number;   // 오늘 진행 중 / 지난 날 열림
  absentCount: number;
  pendingCount: number;
};
export function masterDays(dash: DashboardDto, pendingCorrections: Correction[], now: number): Map<string, MasterDay>;

export function dayAriaLabel(key: string, isToday: boolean, summary: MemberDay | MasterDay | undefined, role: "member" | "master"): string;
```

- 날짜 키는 `pay.ts` 의 `dayKey`·`parseDay` 를 쓴다. 새로 만들지 않는다.
- `open`: `end === null` 이고 출근한 날이 오늘이면 `"today"`, 그 전이면 `"stale"`.
- 테스트할 것: 2026-09(화요일 1일 → 앞에 월 1칸), 2026-02(일요일 1일 → 앞 6칸, 줄 수 6이 아니라 필요한 만큼), 2027-02(월요일 1일, 28일 → 4줄), 자정 넘긴 근무가 출근 날에만 들어감, `compactHours` 경계(0·59·60·599·600).

### `components/calendar/MonthGrid.tsx`

```ts
type Marks = { open?: "today" | "stale"; pending?: boolean; dashed?: boolean };
export function MonthGrid(props: {
  year: number; month: number;
  todayKey: string;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  busy?: boolean;                 // aria-busy, 칸 내용 숨김
  cellHeight: 56 | 64;            // 멤버 56, 마스터 64
  cell: (key: string) => { label: string; marks: Marks; body: React.ReactNode };  // body = 2·3줄
  footer?: React.ReactNode;       // 범례·빈 달 문구
}): JSX.Element;
```

- `Card className="px-2 py-3"` 로 감싼다. 요일 줄, 칸, `footer` 순서.
- 칸 버튼: `relative m-0.5 flex flex-col rounded-lg border text-left` + 상태별 클래스(§3 표). 테두리 기본 `border-transparent`, 점선 `border-dashed border-muted`, 선택 `bg-accent/10` + 날짜 `font-bold` (테두리 없음, 점선은 유지).
- 오늘 숫자: `inline-flex h-5 w-5 items-center justify-center rounded-full ring-[1.5px] ring-accent text-accent font-bold`.

### `components/calendar/AvatarStack.tsx`

```ts
export function AvatarStack(props: { people: { userId: string; nickname: string }[]; max?: 3 }): JSX.Element;
```
- 4명 이상이면 2명 + `+N`. `aria-hidden` (읽는 이름은 칸 버튼이 가진다).
- `Avatar` 에 `xs` 크기가 필요하다 → `shell.tsx` `SIZES` 에 `xs: "h-[18px] w-[18px] text-[9px]"` 추가 (시니어 소유 파일, 스킬 표도 이번에 반영함).

### `components/calendar/CalendarLegend.tsx`

```ts
export function CalendarLegend(props: { role: "member" | "master" }): JSX.Element;
```

### `components/calendar/ViewToggle.tsx`

```ts
export function ViewToggle(props: { value: "calendar" | "list"; onChange: (v: "calendar" | "list") => void }): JSX.Element;
```

### 기존 코드에서 뺄 것

| 무엇 | 어디로 |
|---|---|
| 기록 행(`li` + 수정·삭제 버튼 + `CorrectionForm`) | `RecordsPanel.tsx` 안 `RecordRow({ shift, pending, form, setForm, onChange, showDate })` 로 빼서 목록·상세가 같이 쓴다 |
| 휴가 행 | `AbsenceRow({ absence, showDate })` |
| `ABSENCE_LABEL` | 마스터 상세도 쓰므로 `lib/calendar.ts` 로 옮기고 `RecordsPanel` 은 그것을 import |

재사용하는 기존 것: `Card`, `MonthPicker`, `StatusPill`, `Avatar`, `ErrorText`, `hm`, `time`, `date`, `useNow`, `useMonthCursor`, `dayKey`, `parseDay`, `shiftMinutes`.

---

## 10. 검수 체크리스트 (구현 뒤)

- [ ] 390px 에서 가로 스크롤 없음, 칸 폭 약 47px, 칸 높이 56(멤버)·64(마스터)
- [ ] 흑백(회색조) 화면 캡처로도 근무·휴가·진행 중·퇴근 없음·요청 대기·오늘·선택이 구별된다
- [ ] VoiceOver 로 날짜 칸 이름이 §7 예시 형식으로 읽힌다, 선택 칸 "선택됨"(pressed)
- [ ] 다크 모드에서 오늘·선택·점선이 보인다
- [ ] 달을 넘긴 직후 이전 달 데이터가 새 달 칸에 섞이지 않는다
- [ ] 마스터 내비 5개, `/admin/invites` 에서 "멤버" 가 활성

시각 검증: 미실시 (구현 전 명세).
