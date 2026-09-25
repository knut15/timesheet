# 디자인 컴포넌트 가이드 — 명세 (`/guide`)

[디자인 문서](README.md) · [timesheet-ui 스킬](../../.claude/skills/timesheet-ui/SKILL.md) · [근무 달력 명세](calendar.md) · 작업 카드 [TS-003](../team/tasks/TS-003-component-guide.md)

웹 앱 `/guide` 에 올릴 컴포넌트 가이드의 내용 명세다. 개발팀은 이 문서의 각 절을 MDX 페이지 하나(`/guide/components/<slug>`)로 옮긴다.

- **형식만** shadcn/ui 문서 페이지(<https://ui.shadcn.com/docs/components/base/avatar>)를 따른다. 컴포넌트 코드는 바꾸지 않고, shadcn·Base UI 를 도입하지 않는다 (사용자 결정 2026-09-25).
- 여기 적은 props·기본값·클래스는 2026-09-25 `feature/component-guide` 의 코드에서 옮겼다. 코드가 바뀌면 코드가 맞고, 이 문서를 고친다.
- 화면 규칙(헤더 제목, 메뉴 구성, 아바타 seed 규칙 등)의 원본은 timesheet-ui 스킬이다. 이 문서는 규칙을 **복제하지 않고** 스킬의 절을 가리킨다.
- 예시 데이터는 전부 가짜다. 이름은 `김하늘`·`이서준`·`박도윤`·`최유나`·`Alex Kim`·`Mia`, id 는 `user-demo-01` ~ `user-demo-08`, 매장은 `데모 카페 성수점` 만 쓴다. 실제 사용자·매장 데이터를 가져오지 않는다.

---

## 1. 가이드 전체 구조

### 1-1. 경로

| 경로 | 페이지 |
|---|---|
| `/guide` | 첫 화면 — 소개, 기초 토큰 요약, 컴포넌트 목록 |
| `/guide/foundations` | 기초 — 색·타이포·간격·모서리·아이콘 (§2) |
| `/guide/components/<slug>` | 컴포넌트 페이지 21개 (§4) |

### 1-2. `/guide` 첫 화면

위에서 아래로:

1. **제목** `timesheet 컴포넌트` + 한 줄 설명 `출퇴근·급여 화면을 만드는 컴포넌트와 규칙. 미리보기는 실제 앱 컴포넌트다.`
2. **이 가이드를 읽는 법** 세 줄
   - 새 화면은 여기 있는 컴포넌트를 조립해서 만든다. 헤더·내비·아바타를 화면마다 새로 그리지 않는다 → [timesheet-ui 스킬](../../.claude/skills/timesheet-ui/SKILL.md) 머리말
   - 미리보기는 `web/src/components/` 의 실제 컴포넌트를 그대로 렌더한다. 코드 탭은 그 예시의 원본이다
   - 가이드와 코드가 다르면 코드가 맞다
3. **기초 토큰 요약** — 색 토큰 7개 견본(라이트·다크 나란히, §2-1 표의 값) + `기초 전체 보기 →` 링크(`/guide/foundations`)
4. **컴포넌트 목록** — §1-3 의 묶음 순서대로 카드 격자. 카드 한 장 = 이름 + 한 줄 설명 + 작은 미리보기(선택). 누르면 해당 페이지

### 1-3. 목차(사이드바)와 페이지 순서

넓은 화면은 왼쪽 고정 목차, 좁은 화면(390px)은 상단에 접히는 목차(`목차` 버튼 → 펼침 목록). 항목 순서와 묶음은 같다. 현재 페이지는 `aria-current="page"` + `text-accent`.

| 묶음 | 순서 · slug | 목차에 보이는 이름 |
|---|---|---|
| 시작 | `/guide` | 소개 |
| | `/guide/foundations` | 기초 |
| 셸 | `app-header` | App Header |
| | `bottom-nav` | Bottom Nav |
| | `icon-button` | Icon Button |
| | `avatar` | Avatar |
| 표시 | `avatar-stack` | Avatar Stack |
| | `status-pill` | Status Pill |
| | `card` | Card |
| | `spinner` | Spinner |
| | `skeleton` | Skeleton |
| | `progress-bar` | Progress Bar |
| 입력 | `field` | Field |
| | `error-text` | Error Text |
| | `month-picker` | Month Picker |
| | `dialog` | Dialog |
| 달력 | `month-grid` | Month Grid |
| | `calendar-legend` | Calendar Legend |
| | `view-toggle` | View Toggle |
| 화면 조각 | `clock-card` | Clock Card |
| | `today-dashboard` | Today Dashboard |
| | `pay-view` | Pay View |

- 목차 이름은 영문 컴포넌트 이름(코드 식별자와 같은 뜻)으로 두고, 각 페이지 제목 아래 설명은 한글이다.
- 페이지 맨 아래에 이전·다음 링크(이 표의 순서).

### 1-4. 컴포넌트 페이지 틀 (모든 slug 공통)

shadcn Avatar 페이지와 같은 순서다. "설치" 는 timesheet 에서 **파일 위치·import** 로 바꾼다.

| 순서 | 절 | 내용 |
|---|---|---|
| 1 | 제목 + 한 줄 설명 | 컴포넌트 이름(H1)과 설명 한 줄 |
| 2 | 미리보기 / 코드 탭 | 첫 예시(Basic)를 크게. 탭 `미리보기` · `코드` |
| 3 | 파일 위치·import | 파일 경로, import 한 줄. 설치 명령은 없다(모두 앱 안의 파일) |
| 4 | 사용법 | 최소 코드 한 덩어리 |
| 5 | 구성 | 하위 요소 계층을 들여쓴 트리로. 내부 전용(export 안 됨)이면 `(내부)` 표시 |
| 6 | 예시 | 예시마다 H2 제목 + 한 줄 설명 + 미리보기/코드 탭 (shadcn 처럼 예시 이름이 곧 H2) |
| 7 | 사용 규칙 | 스킬·달력 명세의 해당 절 링크. 규칙 본문을 복제하지 않는다 |
| 8 | 하지 말 것 | 이 컴포넌트에서 실제로 틀리기 쉬운 것 |
| 9 | API 레퍼런스 | props 표 `Prop · Type · Default · 설명`. 하위 컴포넌트·함수가 있으면 H3 로 나눠 표를 하나씩 |

- Default 가 코드에 없으면 `—`, 필수 prop 은 설명 칸 앞에 **필수**.
- 미리보기 틀은 배경 `bg-background`, 안쪽 여백 24px, 폭은 컴포넌트가 쓰이는 본문 폭(멤버 `max-w-md` 또는 마스터 `max-w-3xl`)을 예시마다 지정한다.

### 1-5. 개발팀 공통 주의 (미리보기 틀)

| 항목 | 요구 | 이유 |
|---|---|---|
| `fixed`·`sticky` 컴포넌트 | 미리보기 틀에 `transform`(예 `[transform:translateZ(0)]`)과 고정 높이(예 `h-72 overflow-hidden`)를 준다 | `BottomNav` 는 `fixed inset-x-0 bottom-0`, `AppHeader` 는 `sticky top-0` 이다. 틀이 없으면 가이드 화면 맨 아래에 붙는다 |
| 시간 고정 | `MonthGrid` 의 `todayKey`, `PayView` 의 `now` 는 예시에 고정값을 넣는다(`"2026-09-25"`, `new Date(2026, 8, 25, 18, 0).getTime()`) | 오늘 날짜로 두면 미리보기가 날마다 바뀐다 |
| 상태를 가진 예시 | `onChange`·`onSelect` 가 필요한 예시는 `useState` 로 감싼 작은 예시 컴포넌트로 만들고, 코드 탭에 그 원본을 보인다 | 컴포넌트가 제어 컴포넌트다 |
| 링크 이동 | `BottomNav` 예시는 `onSelect` 방식만 쓴다 | `href` 방식은 `next/link` 로 실제 이동한다 |
| 다크 모드 | 토큰은 `prefers-color-scheme` 로만 바뀐다(클래스 전환 없음). 가이드에 테마 전환 버튼을 두지 않는다. 다크 값은 §2-1 의 hex 견본으로만 보인다 | 코드 변경 없이는 한 화면에서 두 테마를 동시에 렌더할 수 없다 |

---

## 2. 기초 (`/guide/foundations`)

### 2-1. 색 토큰

원본: `web/src/app/globals.css`. `@theme inline` 으로 Tailwind 색 이름(`bg-surface`, `text-muted`, `border-line` …)이 된다. 다크는 `@media (prefers-color-scheme: dark)`.

| 토큰 | Tailwind | 라이트 | 다크 | 쓰는 곳 |
|---|---|---|---|---|
| `--background` | `bg-background` | `#f5f5f4` | `#0c0a09` | 페이지 바탕, 입력칸(`.field`), 보기 전환 틀 |
| `--foreground` | `text-foreground` | `#1c1917` | `#f5f5f4` | 본문 글자 |
| `--surface` | `bg-surface` | `#ffffff` | `#1c1917` | 카드, 하단 내비, 아바타 겹침 경계(`ring-surface`) |
| `--line` | `border-line` | `#e7e5e4` | `#292524` | 카드·헤더·내비 경계선, 중립 배지 바탕 |
| `--muted` | `text-muted` | `#78716c` | `#a8a29e` | 보조 글자, 비활성 메뉴, 점선 테두리 |
| `--accent` | `text-accent` `bg-accent` | `#2563eb` | `#3b82f6` | 활성 메뉴, 오늘·선택, 입력 포커스 |
| `--warn` | `text-warn` `bg-warn` | `#dc2626` | `#f87171` | 오류 글자, 대기 배지, 거절 상태, 퇴근 기록 없음 |

토큰 밖에서 쓰는 색 (새 토큰 없이 Tailwind 색을 직접 쓴다):

| 색 | 쓰는 곳 | 근거 |
|---|---|---|
| 아바타 8색 `#2563eb` `#7c3aed` `#db2777` `#dc2626` `#c2410c` `#15803d` `#0f766e` `#4338ca` | `Avatar` 배경 (`shell.tsx` `AVATAR_COLORS`) | 흰 글자 대비 4.5:1 이상 — [스킬 §3](../../.claude/skills/timesheet-ui/SKILL.md#3-멤버-아바타--avatar) |
| `amber-500/15` 바탕 + `amber-600` / `dark:amber-400` 글자 | `StatusPill` 대기 상태 | `ui.tsx` `STATUS` |
| `green-500/15` 바탕 + `green-700` / `dark:green-400` 글자 | `StatusPill` 승인 | 같음 |
| `green-600` / `dark:green-400` | 근무 중 점 `OpenDot` | [달력 명세 §8](calendar.md#8-다크-모드--새-토큰-없음) |
| `amber-700` / `dark:amber-400` | 요청 대기 아이콘 `Hourglass` | 같음 |

견본 표시: 칸마다 색 사각형 + 토큰 이름 + hex. 라이트·다크 두 열. 다크 견본은 hex 를 직접 칠한다(§1-5).

### 2-2. 타이포

- 글꼴: 본문은 **Pretendard**(가변, `next/font/local` 로 앱이 직접 제공 — `layout.tsx` 의 `--font-pretendard`, `font-sans` 도 같은 글꼴). 없을 때만 `system-ui` 계열로 떨어진다. 코드는 `font-mono` = Geist Mono.
- 숫자(금액·시간·날짜)는 `tabular-nums`.

| 크기 | 클래스 | 실제 쓰는 곳 |
|---|---|---|
| 9px | `text-[9px]` | `Avatar` xs 이니셜, `+N` |
| 10px | `text-[10px]` | 내비 배지 숫자, 달력 칸 휴가 글자 |
| 11px | `text-[11px]` | 내비 이름, 요일 줄, 범례, 달력 칸 시간 |
| 12px | `text-xs` | 헤더 위 작은 줄, `StatusPill`, `Avatar` sm |
| 14px | `text-sm` | `Field` 이름, 보조 설명, `ErrorText`, 보기 전환 |
| 16px | `text-base` | 입력칸 `.field` (iOS 확대 방지 크기) |
| 20px | `text-xl` | 헤더 제목(`font-bold tracking-tight`), `Avatar` lg |
| 30px | `text-3xl` | 급여 총액(`font-bold`) |

굵기: `font-medium`(메뉴·배지) · `font-semibold`(카드 소제목·금액·아바타) · `font-bold`(화면 제목·총액·오늘 숫자).

### 2-3. 간격·모서리·높이

| 항목 | 값 | 쓰는 곳 |
|---|---|---|
| 본문 가로 여백 | `px-5` (20px) | 헤더 안쪽, `main` |
| 본문 아래 여백 | `pb-28` (112px) | 하단 내비(64px + 안전 영역)에 가리지 않게 |
| 카드 안쪽 | `p-5` (20px) | `Card` 기본. 달력 격자만 `px-2 py-3` |
| 카드 사이 | `space-y-4` (16px) | `PayView` |
| 본문 폭 | 멤버 `max-w-md`(448px) · 마스터 `max-w-3xl`(768px) | [스킬 §1](../../.claude/skills/timesheet-ui/SKILL.md#1-헤더--appheader) |
| 모서리 | `rounded-2xl`(16px) 카드 · `rounded-xl`(12px) 입력칸·보기 전환 틀 · `rounded-lg`(8px) 달력 칸·전환 버튼 · `rounded-full` 아바타·배지·아이콘 버튼 | |
| 누르는 높이 | 아이콘 버튼 40×40, 보기 전환 40, 내비 항목 64, 달력 칸 52/60 | 터치 영역 40px 이상 |

### 2-4. 아이콘

- **lucide-react 만** 쓴다. 규칙·확인 명령은 [스킬 §2 "아이콘은 lucide-react 만"](../../.claude/skills/timesheet-ui/SKILL.md#아이콘은-lucide-react-만). 설치 버전 1.47.0.
- 크기는 쓰는 곳이 정한다: 내비 22 · 아이콘 버튼 20 · 보기 전환 16 · 달력 표시·범례 10.
- 선 굵기: 활성 2.4 / 비활성 내비 1.8 / 비활성 보기 전환 2.
- 아이콘은 항상 `aria-hidden`, 접근 이름은 옆 글자나 `aria-label` 이 가진다.
- 페이지에 지금 쓰는 아이콘 목록을 격자로 보인다: `Clock` `CalendarDays` `ClipboardList` `Wallet` `UserRound`(멤버 내비) · `LayoutDashboard` `Inbox` `Users` `Store`(마스터 내비) · `LogOut` · `List` · `Hourglass` `TriangleAlert`(달력). 2026-09-25 에 전부 `typeof === "object"` 확인.

---


### 2-5. 스크롤 영역·화살표

- 화면 안에서 따로 스크롤되는 곳(코드 블록·넓은 표·긴 목차)은 shadcn **ScrollArea** (`@/components/ui/scroll-area`, Base UI·base-nova 원본). 브라우저 기본 스크롤바(`overflow-auto`)를 쓰지 않는다. 페이지 전체 스크롤은 대상이 아니다
- 월 이동 같은 좌우 화살표는 lucide `ChevronLeft`/`ChevronRight` 를 `IconButton` 으로. `◀` `▶` 글자를 쓰지 않는다
- 규칙 원본: timesheet-ui 스킬 §0·§2

## 3. 컴포넌트 목록

| slug | 컴포넌트 (export) | 파일 | 예시 수 |
|---|---|---|---|
| `app-header` | `AppHeader` | `shell.tsx` | 4 |
| `bottom-nav` | `BottomNav`, 타입 `NavItem` | `shell.tsx` | 5 |
| `icon-button` | `IconButton` | `shell.tsx` | 2 |
| `avatar` | `Avatar`, 함수 `initials` | `shell.tsx` | 5 |
| `avatar-stack` | `AvatarStack` | `calendar/AvatarStack.tsx` | 4 |
| `status-pill` | `StatusPill` | `ui.tsx` | 2 |
| `card` | `Card` | `ui.tsx` | 2 |
| `spinner` | `Spinner` (앱에서는 더 쓰지 않음 — Skeleton) | `ui.tsx` | 1 |
| `skeleton` | shadcn `Skeleton` 원본 + `Bone`·`Loading`, 셸 `HeaderSkeleton`·`BottomNavSkeleton` | `ui/skeleton.tsx`, `ui.tsx`, `shell.tsx` | 1 |
| `button` | 클래스 묶음 `BTN_ACCENT`·`BTN_WARN`·`ACT_*`·`BLOCK_*` (shadcn `buttonVariants`) | `buttons.ts` | 1 |
| `progress-bar` | `ProgressBar` | `ui.tsx` | 3 |
| `field` | `Field` + CSS 클래스 `.field` | `ui.tsx`, `globals.css` | 4 |
| `error-text` | `ErrorText` | `ui.tsx` | 2 |
| `month-picker` | `MonthPicker`, 훅 `useMonthCursor` | `ui.tsx` | 2 |
| `dialog` | shadcn `Dialog`·`DialogContent`·`DialogHeader`·`DialogTitle`·`DialogFooter` (원본 그대로, 닫기 버튼은 `ui/button.tsx`) | `ui/dialog.tsx` | 1 |
| `month-grid` | `MonthGrid`, 타입 `Marks`, `OpenDot` | `calendar/MonthGrid.tsx` | 7 |
| `calendar-legend` | `CalendarLegend` | `calendar/CalendarLegend.tsx` | 2 |
| `view-toggle` | `ViewToggle` | `calendar/ViewToggle.tsx` | 2 |
| `clock-card` | `ClockCard`, 타입 `ClockState` | `TodayDashboard.tsx` | 10 |
| `today-dashboard` | `TodayDashboard` | `TodayDashboard.tsx` | 8 |
| `pay-view` | `PayView`, 함수 `holidayStatus` | `PayView.tsx` | 5 |

페이지를 두지 않는 export (`ui.tsx`): 표시 함수 `won` `hm` `time` `date` `dayLabel` `toLocalInput`, 변환 `toShift` `monthRange` `keyed`, 훅 `useNow`. 화면 요소가 아니므로 컴포넌트 목록에 싣지 않는다. 예시 코드에서 쓰면 import 만 보인다.
`AuthForm`·`TimesheetApp`·`member/*`·`SessionBoot`·`useSelectedDay` 는 화면·로직이라 가이드 대상이 아니다.

---

## 4. 컴포넌트 페이지

### 4-1. `app-header` — App Header

**설명**: 모든 화면의 머리. 위 작은 줄(매장·역할)과 화면 제목, 오른쪽에 동작과 내 아바타.

**파일·import**: `web/src/components/shell.tsx`

```tsx
import { AppHeader } from "@/components/shell";
```

**사용법**

```tsx
<AppHeader eyebrow="데모 카페 성수점" title="출퇴근" me={{ id: "user-demo-01", nickname: "김하늘" }} width="max-w-md" />
```

**구성**

```
AppHeader  <header sticky top-0, border-b, bg-background/90 blur>
└─ 폭 틀  <div mx-auto {width} px-5 py-3>
   ├─ 글자 묶음
   │  ├─ eyebrow  <p text-xs text-muted, 한 줄 자름>
   │  └─ title    <h1 text-xl font-bold, 한 줄 자름>
   └─ 오른쪽 묶음
      ├─ actions  (넘긴 그대로)
      └─ Avatar md, label "<nickname> (나)"
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 · 틀 폭 |
|---|---|---|
| Basic — 멤버 | 멤버 화면 머리 | `eyebrow="데모 카페 성수점"` `title="출퇴근"` `me={{ id: "user-demo-01", nickname: "김하늘" }}` `width="max-w-md"` |
| 마스터 + 로그아웃 | `actions` 에 `IconButton` | `eyebrow="데모 카페 성수점 · 사장님"` `title="대시보드"` `me={{ id: "user-demo-08", nickname: "Alex Kim" }}` `actions={<IconButton icon={LogOut} label="로그아웃" onClick={() => {}} />}` 기본 폭 |
| 긴 글자 자르기 | 매장·제목이 길면 한 줄에서 말줄임 | `eyebrow="데모 카페 성수점 2층 테라스 별관 · 사장님"` `title="멤버"` 틀 폭 320px |
| 제목은 활성 메뉴 | `BottomNav` 와 함께 두어 제목 = 활성 메뉴 이름임을 보인다 | 멤버 5메뉴, `active="records"` ↔ `title="기록"` |

**사용 규칙**: [스킬 §1 헤더](../../.claude/skills/timesheet-ui/SKILL.md#1-헤더--appheader) (eyebrow·title·width 값).

**하지 말 것**
- 화면마다 `<header>` 를 새로 만들지 않는다.
- `me.id` 에 이름을 넣지 않는다 — 아바타 색이 화면마다 달라진다.
- `width` 를 본문 폭과 다르게 주지 않는다.

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `eyebrow` | `string` | — | **필수** 위 작은 줄 |
| `title` | `string` | — | **필수** 화면 제목(`h1`) |
| `me` | `{ id: string; nickname: string }` | — | **필수** 내 아바타. `id` 가 색 seed |
| `actions` | `React.ReactNode` | — | 아바타 앞 동작 |
| `width` | `string` (Tailwind max-w 클래스) | `"max-w-3xl"` | 안쪽 폭 |

---

**하위 화면 (2026-09-25)**: `crumbs` prop — 제목 앞에 상위 화면 링크(`멤버 › 근무 기록`). 헤더 아래 `SubHeader`(헤더와 같은 폭의 `bg-surface` 띠 + 아래 선, 뒤로 가기 h-11)로 본문과 나눈다. 사장 멤버 상세·초대 코드가 쓴다(`admin/layout.tsx` `subPage`). eyebrow 줄은 `h-5` 고정 — 로고 유무와 상관없이 헤더 높이가 같다. 예시 `app-header/breadcrumb`.

### 4-2. `bottom-nav` — Bottom Nav

**설명**: 화면 하단 고정 내비게이션. 아이콘 위, 이름 아래. 모든 로그인 화면의 푸터.

**파일·import**

```tsx
import { BottomNav, type NavItem } from "@/components/shell";
```

**사용법**

```tsx
const [tab, setTab] = useState("clock");
const items: NavItem[] = [
  { key: "clock", label: "출퇴근", icon: Clock, onSelect: () => setTab("clock") },
  { key: "records", label: "기록", icon: CalendarDays, onSelect: () => setTab("records") },
];
<BottomNav items={items} active={tab} width="max-w-md" />
```

**구성**

```
BottomNav  <nav aria-label="주요 메뉴", fixed bottom-0, bg-surface/95, 안전 영역 여백>
└─ <ul grid, 열 수 = items.length>
   └─ <li> × items
      └─ <Link href> 또는 <button onSelect>   aria-current="page" (활성)
         ├─ 활성 윗선  <span h-0.5 bg-accent> (활성만)
         ├─ 아이콘 틀
         │  ├─ Icon 22px (선 2.4 활성 / 1.8)
         │  └─ 배지  <span bg-warn, 9 초과는 "9+"> (badge > 0 일 때)
         ├─ label
         └─ sr-only " (처리할 것 N건)" (badge > 0 일 때)
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic — 멤버 | 멤버 5메뉴, `onSelect` 로 활성 전환 | `Clock 출퇴근` `CalendarDays 기록` `ClipboardList 요청` `Wallet 급여` `UserRound 내 정보`, key `clock·records·requests·pay·me`, 처음 활성 `clock`, `width="max-w-md"` |
| 마스터 | 마스터 5메뉴 | `LayoutDashboard 대시보드` `CalendarDays 달력` `Inbox 요청` `Users 멤버` `Store 매장`, 활성 `요청`. 미리보기는 `onSelect` 로 바꿔 쓴다(§1-5) |
| 배지 | 처리할 요청 수 | 요청 항목 `badge: 3` |
| 배지 9+ | 10 이상은 `9+`, 읽는 글자는 실제 수 | `badge: 12` → 보이는 글자 `9+`, 스크린리더 `(처리할 것 12건)` |
| 항목 3개 | 최소 구성 | `출퇴근` `기록` `내 정보` |

**사용 규칙**: [스킬 §2 푸터](../../.claude/skills/timesheet-ui/SKILL.md#2-푸터--bottomnav) (메뉴·아이콘 표, 항목 수, 하위 경로 활성, 본문 `pb-28`).

**하지 말 것**
- 아이콘에 `aria-label` 을 따로 달지 않는다 — 이름 글자가 접근 이름이다.
- 한 목록에 `href` 항목과 `onSelect` 항목을 섞지 않는다 (코드는 허용하지만 실제 화면은 역할별로 한 방식만 쓴다: 멤버 `onSelect`, 마스터 `href`).
- `badge: 0` 으로 배지를 숨기려 하지 않아도 된다 — 0·`undefined` 는 원래 안 보인다.

**API 레퍼런스**

`BottomNav`

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `items` | `NavItem[]` | — | **필수** 메뉴 항목 |
| `active` | `string` | — | **필수** 활성 항목의 `key` |
| `width` | `string` | `"max-w-3xl"` | 안쪽 폭 |

`NavItem` (타입)

| 필드 | Type | Default | 설명 |
|---|---|---|---|
| `key` | `string` | — | **필수** 항목 식별자, `active` 와 비교 |
| `label` | `string` | — | **필수** 이름 글자 |
| `icon` | `LucideIcon` | — | **필수** lucide 아이콘 컴포넌트 |
| `badge` | `number` | — | 0 보다 크면 배지. 9 초과는 `9+` |
| `href` | `string` | — | `href` 와 `onSelect` 중 **하나만**. `href` 면 `next/link` |
| `onSelect` | `() => void` | — | 버튼으로 그린다 |

---

### 4-3. `icon-button` — Icon Button

**설명**: 헤더 오른쪽에 두는 아이콘만 있는 둥근 버튼. 이름은 `aria-label` 과 `title` 로 붙는다.

**import**: `import { IconButton } from "@/components/shell";`

**사용법**

```tsx
<IconButton icon={LogOut} label="로그아웃" onClick={() => logout()} />
```

**구성**

```
IconButton  <button type="button" aria-label={label} title={label}, 40×40 rounded-full>
└─ Icon 20px aria-hidden
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 로그아웃 | `icon={LogOut}` `label="로그아웃"` `onClick` 은 미리보기 아래 `"로그아웃 눌림"` 글자 표시 |
| 헤더 안 | `AppHeader` `actions` 자리 | §4-1 "마스터 + 로그아웃" 과 같은 데이터 |

**사용 규칙**: [스킬 §2 아이콘](../../.claude/skills/timesheet-ui/SKILL.md#아이콘은-lucide-react-만) 마지막 줄.

**하지 말 것**
- 아이콘 버튼을 `<button><Icon/></button>` 로 직접 만들지 않는다.
- `label` 을 비우지 않는다.

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `icon` | `LucideIcon` | — | **필수** |
| `label` | `string` | — | **필수** `aria-label`·`title` |
| `onClick` | `() => void` | — | **필수** |

---

### 4-4. `avatar` — Avatar

**설명**: 멤버 아바타. 사진 없이 이름 이니셜과 사용자 id 로 고정된 배경색.

**import**: `import { Avatar, initials } from "@/components/shell";`

**사용법**

```tsx
<Avatar name="김하늘" seed="user-demo-01" />
```

**구성**

```
Avatar  <span rounded-full, 흰 글자, 배경 = AVATAR_COLORS[hash(seed) % 8]>
└─ initials(name)
   role="img" + aria-label (label 있을 때) / aria-hidden (없을 때)
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 기본 크기 md(40px) | `name="김하늘" seed="user-demo-01"` |
| 한글·로마자 이니셜 | 한글은 첫 글자, 로마자는 두 글자 대문자 | `김하늘`→`김` · `Alex Kim`→`AK` · `Mia`→`MI` · `" "`(공백)→`?`. 각각 seed `user-demo-01`·`-08`·`-02`·`-03` |
| Sizes | xs 18 · sm 32 · md 40 · lg 64 | 4개 모두 `name="이서준" seed="user-demo-05"` |
| 색 고정 | 같은 seed 는 이름이 달라도 같은 색, 8색 전부 | 윗줄: `seed="user-demo-06"` 에 이름 `박도윤`·`Doyun Park` 두 개 (같은 색). 아랫줄: `user-demo-01`~`user-demo-08` 8개 — 8색이 하나씩 나온다(2026-09-25 hash 계산 확인) |
| 접근성 | `label` 유무에 따른 읽힘 | 왼쪽: 이름 글자 옆 장식 `<Avatar name="최유나" seed="user-demo-04" /> 최유나`. 오른쪽: 혼자 `label="최유나"`. 각 아래에 캡션 "스크린리더: 이름 글자만 읽음" / "스크린리더: 최유나, 이미지" |

`initials` 함수는 예시 "한글·로마자 이니셜" 아래에 입력→출력 표로 함께 보인다.

**사용 규칙**: [스킬 §3 멤버 아바타](../../.claude/skills/timesheet-ui/SKILL.md#3-멤버-아바타--avatar) (seed = 사용자 id, 크기별 쓰는 곳, 이름 옆 배치).

**하지 말 것**
- `seed` 에 이름·닉네임을 넣지 않는다.
- `className`·`style` 로 색·크기를 덮지 않는다 — props 에 없다. 새 크기가 필요하면 `SIZES` 에 추가를 요청한다.
- 사진 `<img>` 를 섞지 않는다 (사진 업로드 기능이 없다).

**API 레퍼런스**

`Avatar`

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `name` | `string` | — | **필수** 이니셜의 원본 |
| `seed` | `string` | — | **필수** 색을 정하는 값. 사용자 id |
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` | 18 / 32 / 40 / 64px, 글자 9px / 12 / 14 / 20 |
| `label` | `string` | — | 있으면 `role="img"` + `aria-label`, 없으면 `aria-hidden` |

`initials(name: string): string`

| 입력 | 출력 |
|---|---|
| 빈 문자열·공백 | `"?"` |
| 로마자로 시작, 두 단어 이상 | 앞 두 단어 첫 글자, 대문자 |
| 로마자로 시작, 한 단어 | 앞 두 글자, 대문자 |
| 그 밖(한글 등) | 첫 글자 |

---

### 4-5. `avatar-stack` — Avatar Stack

**설명**: 마스터 달력 칸의 아바타 겹침. 3명까지 다 보이고, 4명 이상이면 2명 + `+N`.

**import**: `import { AvatarStack } from "@/components/calendar/AvatarStack";`

**사용법**

```tsx
<AvatarStack people={[{ userId: "user-demo-01", nickname: "김하늘" }, { userId: "user-demo-05", nickname: "이서준" }]} />
```

**구성**

```
AvatarStack  <span aria-hidden flex>
├─ 겹침 틀 <span ring-2 ring-surface, 둘째부터 -ml-1.5> × 보이는 인원
│  └─ Avatar xs
└─ +N  <span 18px rounded-full bg-line text-[9px]> (남은 인원 > 0, 최대 +99)
```

**예시** — 미리보기 틀은 `bg-surface`(칸 배경과 같게, `ring-surface` 경계가 보이도록).

| 예시 (H2) | 설명 | 가짜 데이터 (`userId` · `nickname`) |
|---|---|---|
| Basic — 1명 | | `user-demo-01` 김하늘 |
| 3명 | 다 보인다 | + `user-demo-05` 이서준, `user-demo-06` 박도윤 |
| 4명 이상 | 2명 + `+N` | 위 3명 + `user-demo-04` 최유나, `user-demo-08` Alex Kim → `김` `이` `+3` |
| 달력 칸 안 | 칸 폭 약 44px 안에 들어감 | `MonthGrid` 마스터 예시의 한 칸 (§4-12) |

**사용 규칙**: [달력 명세 §3 마스터 칸 — 아바타 겹침](calendar.md#마스터-칸--아바타-겹침), [스킬 §4](../../.claude/skills/timesheet-ui/SKILL.md#4-달력).

**하지 말 것**
- 인원수 글자(`3명`)를 칸에 따로 쓰지 않는다 — 읽는 이름과 상세에 있다.
- 겹침 안의 아바타에 `label` 을 주지 않는다 — 전체가 `aria-hidden`, 읽는 이름은 칸 버튼이 가진다.

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `people` | `{ userId: string; nickname: string }[]` | — | **필수** 먼저 출근한 순서로 넘긴다 |
| `max` | `3` | `3` | 타입이 리터럴 `3` 이라 다른 값은 넣을 수 없다 |

---

### 4-6. `status-pill` — Status Pill

**설명**: 요청 상태 배지. 수정 요청·휴가·대타가 같이 쓴다.

**import**: `import { StatusPill } from "@/components/ui";`

**사용법**: `<StatusPill status="pending" />`

**구성**: `<span rounded-full px-2 py-0.5 text-xs font-medium {tone}>` 안에 상태 이름 글자 하나.

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| 전체 상태 | 7개 상태를 한 줄에 | 아래 표의 `status` 7개 |
| 모르는 값 | 표에 없는 값은 그 글자 그대로 중립 색 | `status="expired"` → `expired` |

| `status` | 글자 | 색 |
|---|---|---|
| `pending` | 승인 대기 | amber |
| `requested` | 동료 수락 대기 | amber |
| `accepted` | 승인 대기 | amber |
| `approved` | 승인 | green |
| `rejected` | 거절 | warn |
| `declined` | 동료 거절 | warn |
| `canceled` | 취소 | line/muted |

**사용 규칙**: 상태 흐름은 [PRD 08](../prd/08-correction-requests.md)·[PRD 09](../prd/09-leave-substitution.md).

**하지 말 것**
- 상태 글자를 화면에서 따로 쓰지 않는다 — 글자를 바꾸려면 `ui.tsx` `STATUS` 한 곳을 고친다.
- `pending` 과 `accepted` 는 글자가 같다(`승인 대기`). 둘을 구별해야 하는 화면이면 배지 밖 글자로 보충한다.

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `status` | `string` | — | **필수** 위 표의 값. 그 밖은 원문 표시 |

---

### 4-7. `card` — Card

**설명**: 흰 바탕 둥근 상자. 화면 본문을 묶는 기본 단위.

**import**: `import { Card } from "@/components/ui";`

**사용법**

```tsx
<Card>
  <p className="text-sm text-muted">이번 주 근무</p>
  <p className="mt-1 text-2xl font-bold tabular-nums">18시간 30분</p>
</Card>
```

**구성**: `<section rounded-2xl border border-line bg-surface p-5 {className}>` + `children`.

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 제목 + 값 | 위 사용법 그대로 |
| 여백 덮기 | `className` 으로 안쪽 여백을 바꾼다 (달력 격자가 쓰는 방식) | `className="px-2 py-3"`, 안에 `데모 카페 성수점` 글자 |

**하지 말 것**
- 카드 안에 카드를 넣지 않는다.
- `className` 으로 배경·테두리 색을 바꾸지 않는다 — 여백·간격 조정에만 쓴다.

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `children` | `React.ReactNode` | — | **필수** |
| `className` | `string` | `""` | 뒤에 덧붙는다 |

---

### 4-8. `spinner` — Spinner

**설명**: 불러오는 중 자리 표시. 회전 그림 없이 글자 `불러오는 중…`.

**import**: `import { Spinner } from "@/components/ui";`

**사용법**: `if (!data) return <Spinner />;`

**구성**: `<div flex-1 가운데 py-20 text-sm text-muted>불러오는 중…</div>`

**예시**

| 예시 (H2) | 설명 |
|---|---|
| Basic | 높이 240px 틀 안 |

**하지 말 것**: 앱 화면에서 쓰지 않는다 — 2026-09-25 부터 불러오는 중은 전부 Skeleton(§4-20)이다. 글자 로딩은 화면이 움직인다.

**API 레퍼런스**: props 없음.

---

### 4-9. `field` — Field

> 입력칸 규칙(2026-09-25): 종류와 상관없이 높이 44px(`h-11`), 격자 안에서 줄어들 수 있게 `min-w-0`, 날짜 칸은 기본 모양을 끄고 왼쪽 정렬, select 는 기본 화살표 대신 lucide chevron-down. 모바일 요청 화면에서 날짜 두 칸이 겹치고 날짜·선택 높이가 달랐던 것을 고친 규칙이다. 선택 예시는 "날짜 + 선택" 두 칸.

**설명**: 입력칸 이름표. 이름 글자 아래에 입력 요소를 둔다. 입력 요소 자체는 CSS 클래스 `.field` 로 꾸민다.

**파일**: `Field` 는 `web/src/components/ui.tsx`, `.field` 는 `web/src/app/globals.css` `@layer components`.

**import**: `import { Field } from "@/components/ui";`

**사용법**

```tsx
<Field label="닉네임">
  <input className="field" defaultValue="김하늘" />
</Field>
```

**구성**

```
Field  <label block text-sm>
├─ <span text-muted>{label}</span>
└─ <div mt-1>{children}</div>
     └─ (넘긴 입력 요소, 보통 className="field")
.field = w-full rounded-xl border border-line bg-background px-3 py-2.5 text-base, 포커스 시 border-accent
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic — 글자 | | `label="닉네임"`, 값 `김하늘` |
| 날짜 | `type="date"` | `label="시작일"`, 값 `2026-09-28` / `label="종료일"`, 값 `2026-09-29` 두 칸 |
| 선택 | `<select className="field">` | `label="대타 동료"`, 선택지 `이서준`·`박도윤`·`Mia` |
| 오류와 함께 | 아래에 `ErrorText` | `label="초대 코드"`, 값 `DEMO-0000`, 오류 `초대 코드를 찾을 수 없어요.` |

**하지 말 것**
- `Field` 안에 입력 요소를 두 개 넣지 않는다 — `label` 하나가 입력 하나를 가리킨다.
- 입력칸 글자를 16px 아래로 줄이지 않는다(`.field` 는 `text-base`).

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `label` | `string` | — | **필수** 이름 글자 |
| `children` | `React.ReactNode` | — | **필수** 입력 요소 |

---

### 4-10. `error-text` — Error Text

**설명**: 오류 한 줄. 내용이 없으면 아무것도 그리지 않는다.

**import**: `import { ErrorText } from "@/components/ui";`

**사용법**: `<ErrorText>{error}</ErrorText>`

**구성**: `children` 이 있으면 `<p text-sm text-warn>`, 없으면 `null`.

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | | `근무 기록을 불러오지 못했어요.` |
| 빈 값 | 오류가 없을 때 자리를 차지하지 않는다 | `error = ""` → 아무것도 안 보임. 미리보기에 "이 아래에 아무것도 없다" 캡션 |

**하지 말 것**: 오류를 `text-red-*` 로 직접 칠하지 않는다 — `ErrorText` 또는 `text-warn`.

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `children` | `React.ReactNode` | — | **필수** 거짓 값(빈 문자열·`null`·`undefined`)이면 렌더 안 함 |

---

### 4-11. `month-picker` — Month Picker

**설명**: 달 이동. 왼쪽·오른쪽 버튼과 가운데 `2026년 9월`.

**import**: `import { MonthPicker, useMonthCursor } from "@/components/ui";`

**사용법**

```tsx
const [cursor, setCursor] = useMonthCursor(); // 오늘이 든 달로 시작
<MonthPicker cursor={cursor} onChange={setCursor} />
```

**구성**

```
MonthPicker  <div flex justify-between>
├─ <IconButton icon={ChevronLeft} label="이전 달" />
├─ <p font-semibold>{year}년 {month + 1}월</p>
└─ <IconButton icon={ChevronRight} label="다음 달" />
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 달 이동 | 시작 `{ year: 2026, month: 8 }` (= 2026년 9월). 예시는 `useState` 로 고정 시작값을 쓴다 (`useMonthCursor` 는 오늘 기준이라 미리보기가 바뀐다) |
| 해 넘김 | 12월 → 1월 | 시작 `{ year: 2026, month: 11 }` → 다음 누르면 `2027년 1월` |

**사용 규칙**: `month` 는 0~11 (`Date#getMonth` 와 같다). 달력과 함께 쓸 때는 [달력 명세 §7](calendar.md#7-접근성) 키보드 항목.

**하지 말 것**
- `month` 에 1~12 를 넣지 않는다.
- `<form>` 안에 두지 않는다 — 두 버튼에 `type` 이 없어 form 안에서는 submit 으로 동작한다.

**API 레퍼런스**

`MonthPicker`

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `cursor` | `{ year: number; month: number }` | — | **필수** `month` 0~11 |
| `onChange` | `(c: { year: number; month: number }) => void` | — | **필수** 새 달 |

`useMonthCursor()` → `[cursor, setCursor]` (`useState` 반환 그대로). 처음 값은 오늘이 든 달.

---

### 4-12. `month-grid` — Month Grid

**설명**: 월요일 시작 월 격자. 날짜 칸은 버튼이고, 칸 내용은 부르는 쪽이 `cell` 로 채운다. 멤버·마스터 달력이 같이 쓴다.

**import**: `import { MonthGrid, OpenDot, type Marks } from "@/components/calendar/MonthGrid";`

**사용법**

```tsx
const [selected, setSelected] = useState<string | null>("2026-09-25");
<MonthGrid
  year={2026}
  month={8}
  todayKey="2026-09-25"
  selectedKey={selected}
  onSelect={setSelected}
  cellHeight={56}
  cell={(key) => ({ label: dateLabel(key), marks: {}, body: null })}
/>
```

(`dateLabel`·`dayAriaLabel`·`compactHours` 는 `@/lib/calendar`, 실제 화면은 `dayAriaLabel` 로 `label` 을 만든다.)

**구성**

```
MonthGrid  Card className="px-2 py-3"
├─ 격자  <div role="group" aria-label="2026년 9월 달력" aria-busy={busy}>  (busy 면 sr-only role="status" "불러오는 중")
│  ├─ 요일 줄  <div aria-hidden grid-cols-7> 월 화 수 목 금 토 일
│  └─ 칸 줄  <div grid-cols-7>
│     ├─ 이번 달 밖  <div aria-hidden opacity-40> 숫자만
│     └─ 날짜 칸  <button aria-label={label} aria-pressed={selected} aria-current="date"(오늘)>
│        ├─ 1줄
│        │  ├─ 날짜 숫자 (오늘이면 ring-accent 원, 선택이면 굵게)
│        │  └─ 표시 자리 aria-hidden: OpenDot(open="today") · TriangleAlert(open="stale") · Hourglass(pending)
│        └─ 본문 aria-hidden: cell(key).body (busy 면 대신 Bone h-2.5 w-6)
└─ footer  <div mt-2> (있을 때)
테두리: 점선 marks.dashed 또는 투명. 선택은 테두리 없이 bg-accent/10 + 날짜 숫자 font-bold (점선은 선택돼도 유지)
포커스: focus-visible:outline-2 outline-offset-1 outline-accent — 키보드 이동 때만 보이는 바깥 선
```

**예시** — 전부 2026년 9월, `todayKey="2026-09-25"`, 선택 시작값 `"2026-09-25"`. 칸 데이터는 아래 표만 채우고 나머지 날은 `marks: {}` · `body: null`.

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 빈 달, 오늘·선택만 | 모든 칸 빈 값, `cellHeight={56}` |
| 멤버 달력 | 시간·휴가 글자·상태 표시 + 범례 | `cellHeight={56}`, `footer={<CalendarLegend role="member" />}`. 칸(시간 글자는 `compactHours(분)`): `09-22` 270분 → `4.5h` · `09-23` 540분 → `9h`, `marks={{ open: "stale", pending: true }}` · `09-24` 글자 `유급`, `marks={{ dashed: true }}` · `09-25` 130분 → `2.2h`, `marks={{ open: "today" }}` · `09-26` 글자 `대타`, `dashed`. `label` 은 [달력 명세 §7 읽는 이름 예시](calendar.md#읽는-이름-예시--dayarialabel) 표의 멤버 문장 그대로 |
| 마스터 달력 | 아바타 겹침 + 시간 | `cellHeight={64}`, `footer={<CalendarLegend role="master" />}`. 칸: `09-22` `AvatarStack`(김하늘·이서준·박도윤) + 870분 → `15h`, `marks={{ dashed: true, pending: true }}` · `09-24` 5명(+ 최유나·Alex Kim) + 900분 → `15h` · `09-25` 2명(김하늘·Mia) + 240분 → `4h`, `open: "today"` · `09-27` 글자 `쉼 1`, `dashed`. `Mia` 의 id 는 `user-demo-02` |
| 불러오는 중 | `busy` 면 칸 내용·표시 대신 작은 막대, `aria-busy`. 칸 높이가 그대로라 격자가 움직이지 않는다. 범례는 데이터와 무관해 그대로 둔다 — `불러오는 중…` 글자는 없다 | `busy`, `footer={<CalendarLegend role="member" />}` |
| 선택과 점선 | 점선 칸을 선택해도 점선은 남고 연한 배경·굵은 날짜가 더해진다. 파란 테두리는 없다 | 멤버 달력 데이터, 선택 `"2026-09-24"`(유급 휴가 칸) |
| 키보드 포커스 | Tab 으로 칸에 가면 바깥 선(accent)이 보인다. 마우스·터치 선택에는 없다 | 멤버 달력 데이터. 미리보기 캡션 "Tab 으로 칸을 옮겨 보세요" |
| 6줄 달 | 줄 수는 달마다 4~6 | `year={2026} month={10}`(2026년 11월, 6줄), 빈 값, `todayKey` 는 이 달 밖 |

`OpenDot` 은 이 페이지 "구성" 아래에 단독 미리보기 하나(`<OpenDot /> 근무 중`)로 보인다. 별도 페이지는 두지 않는다.

> 선택 표시 (2026-09-25 사용자 요청 "선택 시 파란 라인 제거"): 테두리 없이 `bg-accent/10` + 날짜 숫자 `font-bold`. 휴가·대타 점선은 선택돼도 남고, 키보드 `focus-visible` 바깥 선은 그대로다.

**사용 규칙**: [달력 명세 §3 월 격자](calendar.md#3-월-격자) (치수·칸 배치·상태 표), [§7 접근성](calendar.md#7-접근성), [스킬 §4 달력](../../.claude/skills/timesheet-ui/SKILL.md#4-달력).

**하지 말 것**
- `body` 에 긴 글자(`4시간 30분`)를 넣지 않는다 — `compactHours` 로 줄이고 정확한 값은 `label` 에 둔다.
- `label` 을 날짜만으로 두지 않는다 — 칸 내용이 `aria-hidden` 이라 `label` 이 유일한 읽는 글자다.
- 오늘 칸을 accent 로 채우지 않는다 ([달력 명세 §8](calendar.md#8-다크-모드--새-토큰-없음)).
- 선택 칸에 테두리(`border-accent` 등)를 다시 넣지 않는다. 포커스 바깥 선(`focus-visible`)을 지우지 않는다.

**API 레퍼런스**

`MonthGrid`

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `year` | `number` | — | **필수** |
| `month` | `number` | — | **필수** 0~11 |
| `todayKey` | `string` | — | **필수** `YYYY-MM-DD` (`dayKey`) |
| `selectedKey` | `string \| null` | — | **필수** 선택한 날 |
| `onSelect` | `(key: string) => void` | — | **필수** 칸을 누르면 그 날 키 |
| `busy` | `boolean` | `false` | `aria-busy`, 칸 내용·표시 숨김 |
| `cellHeight` | `56 \| 64` | — | **필수** 멤버 56, 마스터 64 (버튼 높이 52 / 60) |
| `cell` | `(key: string) => { label: string; marks: Marks; body: React.ReactNode }` | — | **필수** 이번 달 날짜마다 불린다 |
| `footer` | `React.ReactNode` | — | 격자 아래 (범례·빈 달 문구) |

`Marks` (타입)

| 필드 | Type | Default | 설명 |
|---|---|---|---|
| `open` | `"today" \| "stale"` | — | 근무 중 점 / 퇴근 기록 없음 아이콘 |
| `pending` | `boolean` | — | 요청 대기 아이콘 |
| `dashed` | `boolean` | — | 점선 테두리 (휴가·대타) |

`OpenDot` — props 없음. 6px 초록 점, `aria-hidden`.

---

### 4-13. `calendar-legend` — Calendar Legend

**설명**: 달력 범례. 칸에 쓰는 것과 같은 표시 요소 + 보이는 설명 글자.

**import**: `import { CalendarLegend } from "@/components/calendar/CalendarLegend";`

**사용법**: `<CalendarLegend role="member" />`

**구성**

```
CalendarLegend  <div text-[11px] text-muted>
├─ <ul flex-wrap>
│  ├─ OpenDot + "근무 중"
│  ├─ TriangleAlert 10px + "퇴근 기록 없음"
│  ├─ Hourglass 10px + "요청 대기"
│  └─ 점선 상자 12×10 + "휴가·대타"(member) / "쉰 사람 있음"(master)
└─ <p> "유급·무급: 휴가 · 대타: 대타로 쉰 날" (member 만)
```

**예시**

| 예시 (H2) | 설명 |
|---|---|
| 멤버 | `role="member"` — 두 줄 |
| 마스터 | `role="master"` — 한 줄 |

**사용 규칙**: [달력 명세 §3 범례](calendar.md#범례-calendarlegend).

**하지 말 것**: 범례 글자를 `aria-hidden` 하지 않는다 — 표시 모양만 숨긴다.

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `role` | `"member" \| "master"` | — | **필수** 넷째 항목 글자와 둘째 줄 유무 |

---

### 4-14. `view-toggle` — View Toggle

**설명**: 멤버 기록 탭의 달력·목록 전환. 두 칸 짜리 눌림 버튼 묶음.

**import**: `import { ViewToggle } from "@/components/calendar/ViewToggle";`

**사용법**

```tsx
const [view, setView] = useState<"calendar" | "list">("calendar");
<ViewToggle value={view} onChange={setView} />
```

**구성**

```
ViewToggle  <div role="group" aria-label="보기", rounded-xl border bg-background p-1>
└─ <button aria-pressed> × 2  (선택: bg-surface shadow-sm)
   ├─ Icon 16px (CalendarDays / List)
   └─ "달력" / "목록"
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 달력 선택 | 시작 `"calendar"` |
| 목록 선택 | | 시작 `"list"` |

**사용 규칙**: [달력 명세 §2 보기 전환](calendar.md#보기-전환-viewtoggle).

**하지 말 것**: 두 값 밖의 보기를 넣으려고 복사해 새 전환을 만들지 않는다 — 값 목록(`VIEWS`)이 컴포넌트 안에 고정이다. 필요하면 개발에 요청한다.

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `value` | `"calendar" \| "list"` | — | **필수** |
| `onChange` | `(v: "calendar" \| "list") => void` | — | **필수** |

---

### 4-15. `pay-view` — Pay View

**설명**: 월 급여 요약 카드와 주별 내역 카드. 멤버 급여 탭과 마스터 멤버 상세가 같이 쓴다. 계산은 `lib/pay.ts` 가 하고 이 컴포넌트는 보여주기만 한다.

**import**: `import { PayView, PayViewSkeleton, holidayStatus } from "@/components/PayView";`

**사용법**

```tsx
<PayView shifts={shifts} settings={settings} year={2026} month={8} now={now} />
```

**구성**

```
PayView  <div space-y-4>
├─ 요약 Card
│  ├─ "예상 급여 (세전)" + 총액 text-3xl
│  ├─ <dl> 기본급(시간) · 주휴수당 · 휴가수당(있을 때만) · 연장 가산(시간)
│  └─ 안내 글자 (합산 기준·미반영 항목)
├─ 빈 달 글자 "이 달 기록이 없어요." (주가 0개일 때)
└─ WeekCard (내부) × 주
   ├─ 기간 `date(주 시작) ~ date(주 끝 − 1ms)` + 주 합계
   ├─ <dl> 근무 · 기본급 · 휴가수당(있을 때) · 주휴수당 · holidayStatus · 연장(5인 미만 표시)
   └─ 한도 경고 text-warn (연장 12시간 초과)
```

**예시 공통 가짜 데이터**

```ts
const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m).getTime(); // 2026년 9월 d일
const now = at(30, 18);                                 // 9월 30일 18:00 고정
const settings = { hourlyWage: 10320, weeklyHours: 20, workDaysPerWeek: 5, fivePlus: false };
// 시급은 lib/pay.ts MINIMUM_WAGE(2026) 와 같은 값. 바뀌면 여기도 고친다
```

`Shift` 는 `{ id, start, end }`, id 는 `shift-demo-01` 부터 차례로.

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 주 5일 × 4시간, 한 달 | 9/1~9/4(화~금), 9/7~9/11, 9/14~9/18, 9/21~9/25 평일, 각 `at(d, 10)` ~ `at(d, 14)`. 9/28 주는 일요일(10/4)이 10월이라 9월 합산에 들지 않으므로 넣지 않는다 |
| 주휴 미충족 | 주 3일만 일한 지난 주 → `미충족 (3/5일)` | 9/7·9/8·9/9 만 `10~14시` |
| 휴가 포함 | 휴가 날이 개근을 채운다, 휴가수당 줄이 생긴다 | 9/14~9/16 근무 + `absences: [{ date: "2026-09-17", kind: "paid_leave" }, { date: "2026-09-18", kind: "substitution" }]` |
| 연장 한도 초과 (5인 이상) | 주 12시간 넘는 연장 → 경고 줄 | `settings.fivePlus = true`, 9/21~9/25 매일 `9~17시`(8시간) |
| 빈 달 | 기록 없음 | `shifts: []` → 요약 카드 0원 + `이 달 기록이 없어요.` |
| 불러오는 중 | `PayViewSkeleton` — 요약 카드와 주 카드 4장을 같은 틀·줄 높이에 막대로. Basic 과 높이가 같다 | `year={2026} month={8}`, `now` 같음 |

금액은 이 문서에 적지 않는다. 미리보기가 `pay.ts` 로 계산한 값이 곧 정답이다.

**사용 규칙**: 계산식은 [PRD 02](../prd/02-pay.md)·[PRD 03](../prd/03-overtime.md), 휴가는 [PRD 09](../prd/09-leave-substitution.md). 프로젝트 규칙 "화면 컴포넌트에서 금액을 계산하지 않는다"(`CLAUDE.md` §2).

**하지 말 것**
- 예시에서 금액을 손으로 적어 넣지 않는다.
- `now` 를 `Date.now()` 로 두지 않는다 (§1-5).
- `WeekCard` 를 따로 쓰려 하지 않는다 — export 되지 않는다.

**API 레퍼런스**

`PayView`

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `shifts` | `Shift[]` (`{ id: string; start: number; end: number \| null }`) | — | **필수** ms 타임스탬프. 서버 응답은 `toShift` 로 바꾼다 |
| `settings` | `PaySettings` (`{ hourlyWage; weeklyHours; workDaysPerWeek; fivePlus }`) | — | **필수** |
| `year` | `number` | — | **필수** |
| `month` | `number` | — | **필수** 0~11 |
| `now` | `number` | — | **필수** 진행 중 근무와 주 진행 여부 기준 시각 |
| `absences` | `Absence[]` (`{ date: "YYYY-MM-DD"; kind: "paid_leave" \| "unpaid_leave" \| "substitution" }`) | `[]` | 승인된 휴가·대타 |

`PayViewSkeleton` — 기록·휴가를 읽는 동안의 자리. 요약 카드(값 3줄 + 안내 글자 그대로)와 주 카드(값 4줄)를 PayView 와 같은 틀·줄 높이에 `Bone` 으로, 전체를 `Loading` 으로 감싼다. 주 카드 수는 "일요일이 이 달에 있고 `now` 까지 시작한 주" 수. 휴가수당 줄·한도 경고는 없는 것으로 둔다.

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `year` | `number` | — | **필수** |
| `month` | `number` | — | **필수** 0~11 |
| `now` | `number` | — | **필수** 주 카드 수의 기준 시각 |

`holidayStatus(week: WeekPay, settings: PaySettings, now: number): string` — 주휴 상태 글자. 결과는 `대상 아님 (주 15시간 미만)` · `개근` · `대상 아님 (그 주 전부 휴가)` · `진행 중 (n/m일)` · `미충족 (n/m일)` 중 하나.

---

### 4-16. `progress-bar` — Progress Bar

**설명**: 값이 목표의 어디쯤인지 보이는 가로 막대. 오늘 근무 카드의 "이번 주 근무 시간" 이 쓴다. 숫자는 옆 글자가 말하고, 막대는 보조다.

**import**: `import { ProgressBar } from "@/components/ui";`

**사용법**: `<ProgressBar value={840} max={1200} label="이번 주 근무 시간" valueText="14시간 / 20시간" />`

**구성**

```
ProgressBar  <div role="progressbar" h-2 w-full overflow-hidden rounded-full bg-line>
│            aria-label={label} aria-valuemin={0} aria-valuemax={max}
│            aria-valuenow={min(value, max)} aria-valuetext={valueText}
└─ 채움  <div h-full rounded-full bg-accent style={{ width: pct% }}>
   pct = max > 0 ? min(100, value / max × 100) : 0
```

**예시** (틀 폭 `max-w-md`)

| 예시 (H2) | 설명 | 데이터 |
|---|---|---|
| Basic | 이번 주 근무 시간 | `value={840} max={1200}` `valueText="14시간 / 20시간"` |
| 빈 값 | 0 | `value={0} max={1200}` `valueText="0시간 / 20시간"` |
| 넘침 | 가득 차고 글자가 실제 값 | `value={1528} max={1200}` `valueText="25시간 28분 / 20시간"` |

**접근성**: `role="progressbar"` + `aria-label` + `aria-valuemin/max/now` + `aria-valuetext`. `aria-valuenow` 는 `max` 를 넘지 않게 자르고, 넘친 실제 값은 `valueText` 가 말한다.

**사용 규칙**: [오늘 근무 대시보드 명세 §5-4](member-today.md#5-4-progressbar-webscomponentsuitsx), [§8 색](member-today.md#8-다크-모드와-색--새-토큰-없음).

**하지 말 것**
- `<progress>` 로 바꾸지 않는다 — 브라우저마다 모양이 다르고 다크 모드 색을 토큰으로 맞추기 어렵다.
- 움직임(transition)을 넣지 않는다.
- `valueText` 를 비우거나 숫자만 넣지 않는다.

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `value` | `number` | — | **필수** 현재 값 |
| `max` | `number` | — | **필수** 0 이하이면 빈 막대 |
| `label` | `string` | — | **필수** `aria-label` |
| `valueText` | `string` | — | **필수** `aria-valuetext` — 스크린리더는 숫자 대신 이 글자를 읽는다 |

---

### 4-17. `clock-card` — Clock Card

**설명**: 멤버 출퇴근 탭의 시계 카드. 날짜, 한 줄 시계, 지금 상태, 출근·퇴근 버튼을 한 카드에 둔다. API 를 부르지 않는 표시 컴포넌트다.

**import**: `import { ClockCard, type ClockState } from "@/components/TodayDashboard";`

**사용법**

```tsx
<ClockCard now={now} minuteNow={minuteNow} state={state} busy={busy} error={error} onPunch={punch} onRetry={reload} />
```

**구성**: [오늘 근무 대시보드 명세 §2-1](member-today.md#2-1-구성-가운데-정렬-card-classnametext-center) 트리 그대로. 상태별 알약·설명·버튼은 [§2-3](member-today.md#2-3-네-상태-td-1--색만으로-구별하지-않는다)·[§2-4](member-today.md#2-4-로딩오류).

**예시 공통 가짜 데이터** — `_examples/today-dashboard/demo-data.tsx` 하나를 Today Dashboard 예시와 같이 쓴다. 값은 [명세 §5-5](member-today.md#5-5-컴포넌트-가이드에-넣을-것-guide) 그대로: `now = new Date(2026, 8, 25, 14, 32, 7).getTime()`(금), `minuteNow = toMinute(now)`, `settings = { hourlyWage: 10320, weeklyHours: 20, workDaysPerWeek: 5, fivePlus: false }`, 기록 `DEMO_SHIFTS`(`s1`~`s4`), 기본 absence `{ date: "2026-09-24", kind: "substitution" }`. `onPunch`·`onRetry` 는 아무것도 안 하는 함수.

| 예시 (H2) | 설명 | `state` |
|---|---|---|
| Basic (출근 전) | 채운 `출근` | `{ kind: "before" }` |
| 근무 중 | 초록 점 + `퇴근` | `{ kind: "working", open: s4 }` → `오후 01:30 출근 · 지금까지 1시간 2분` |
| 근무 중 — 어제 출근 | 날짜가 붙는 설명 | `open = { id: "x", start: 9/24 22:00, end: null }` → `9. 24. 오후 10:00 출근 · 지금까지 16시간 32분` |
| 오늘 퇴근함 | 비활성 `출근` + 내일 안내 | `{ kind: "done", lastEnd: 9/25 18:05 }` |
| 오늘 휴가 | 점선 알약, 유급 문구 | `{ kind: "off", absence: "paid_leave" }` |
| 오늘 대타 | 점선 알약, 대타 문구 | `{ kind: "off", absence: "substitution" }` |
| 불러오는 중 | 알약·버튼 자리에 같은 크기 막대 — 출근 전과 높이가 같다 | `{ kind: "loading" }` |
| 불러오기 실패 | `다시 불러오기` | `{ kind: "error" }` |
| 저장 실패 | 버튼 아래 오류 글자 | `before` + `error="저장하지 못했어요. 다시 시도해 주세요."` |
| 320px 한 줄 | 좁은 폭에서도 시계가 한 줄 | 래퍼 `w-[320px] px-5`(카드 280px, 안쪽 240px), `before` |

**접근성**: 상태는 아이콘 모양 + 상태 이름 + 버튼 글자로 구별하고 휴가·대타는 점선 테두리까지 — 색은 보조. 상태 알약 `role="status"`, 불러오는 중에는 `Loading` 이 `상태 확인 중` 을 읽는다. 시계에는 live 영역 없음. 아이콘은 전부 `aria-hidden`. ([명세 §7](member-today.md#7-접근성-요약))

**사용 규칙**: [오늘 근무 대시보드 명세 §2](member-today.md#2-시계-카드--clockcard-t-1), [PRD 12](../prd/12-member-today.md).

**하지 말 것**
- 경과 시간을 `now`(1초)로 계산하지 않는다 — `minuteNow` 를 넘긴다.
- 시계 글자에 `aria-live` 를 걸지 않는다.
- 상태 알약에 색 바탕을 쓰지 않는다 ([명세 §8](member-today.md#8-다크-모드와-색--새-토큰-없음)).
- 예시에서 `now` 를 `Date.now()` 로 두지 않는다 (§1-5).

**API 레퍼런스**

`ClockCard`

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `now` | `number` | — | **필수** 1초 단위 시각(시계용) |
| `state` | `TodayState \| { kind: "loading" } \| { kind: "error" }` | — | **필수** 타입 이름 `ClockState` |
| `minuteNow` | `number` | — | **필수** 경과 시간 계산용 |
| `busy` | `boolean` | `false` | 저장 중 — 버튼 비활성(`disabled:opacity-50`) |
| `error` | `string \| null` | `null` | 저장 실패 글자 → `ErrorText` |
| `onPunch` | `(kind: "in" \| "out") => void` | — | **필수** working 이면 `"out"`, 그 밖은 `"in"` |
| `onRetry` | `() => void` | — | **필수** error 상태의 `다시 불러오기` |

`ClockCardSkeleton()` — props 없음. 로그인 확인 전 첫 화면용: loading 모양에 날짜(`h-5` 칸)·시계(`h-12` 칸) 글자까지 막대. 서버 렌더되는 자리라 시각을 그리지 않는다(hydration).

`todayState(shifts, absences, now): TodayState`·`toMinute(t)` — `@/lib/today`. 판정 순서는 열린 기록 → 오늘 기록 → 오늘 absence → 출근 전.

---

### 4-18. `today-dashboard` — Today Dashboard

**설명**: 멤버 출퇴근 탭의 오늘 근무 카드. 오늘 → 처리할 것 → 이번 주 → 이번 달 네 구역. 숫자는 전부 `lib/pay.ts` 가 계산하고 이 컴포넌트는 보여주기만 한다.

**import**: `import { TodayDashboard } from "@/components/TodayDashboard";`

**사용법**

```tsx
<TodayDashboard shifts={shifts} absences={absences} requests={requests} settings={settings} now={minuteNow} status="ready" onRetry={reload} onOpenPay={openPay} onOpenRequests={openRequests} />
```

**구성**

```
TodayDashboard  Card p-0 divide-y divide-line
├─ ① 오늘  h2 + 합계, <ul> 오늘 출근한 기록 × 행 (없으면 안내 한 줄)
├─ ② 처리할 것  (0건이면 구역째 없음) TodoRow (내부) <button min-h-11> × 2
├─ ③ 이번 주  h2 + 기간, <dl> 근무 시간 · ProgressBar · 근무한 날 · 주휴수당
└─ ④ 이번 달  <button min-h-11> "{월}월 예상 급여 (세전)" + 금액 + "급여 탭에서 자세히"
status 가 loading 이면 같은 구역 틀에 막대(TodayDashboardSkeleton), error 면 구역 없이 오류 + 다시 불러오기
```

**예시 공통 가짜 데이터**: Clock Card 와 같은 `_examples/today-dashboard/demo-data.tsx`. `now` 에는 `minuteNow` 를 넘긴다. `requests` 빈 값은 `{ corrections: [], leaves: [], substitutionsOut: [], substitutionsIn: [] }`(`MyRequests`). 요청자·내 이름은 가짜 이름(`김하늘` `user-demo-01` 이 나, `이서준` `user-demo-05`, `박도윤` `user-demo-06`).

| 예시 (H2) | 설명 | 데이터 |
|---|---|---|
| Basic — 두 번 나눠 근무 | 오늘 합계 4시간 30분 = 3시간 28분 + 1시간 2분 | `DEMO_SHIFTS`, 기본 absence, `requests` 전부 빈 배열 |
| 처리할 것 | 받은 대타 2 · 내 대기 1 | Basic + `substitutionsIn` `requested` 2건(요청자 `이서준`·`박도윤`), `leaves` `pending` 1건 |
| 가입 첫날 | 기록 0, 모든 값 0 | `shifts=[]` `absences=[]` |
| 오늘 휴가 | 오늘 목록 대신 `오늘은 쉬는 날이에요.` | `s3`·`s4` 빼고 absence `{ date: "2026-09-25", kind: "paid_leave" }` 추가 |
| 소정 초과 | 막대 가득, `25시간 28분 / 20시간`, 주휴 `개근` | `s4` 를 18:00 퇴근으로, `s5` 9/26(토) 09:00~17:00 추가, `now` 9/26 18:00 |
| 주 15시간 미만 | 주휴 `대상 아님 (주 15시간 미만)` | Basic + `weeklyHours: 14` |
| 불러오는 중 | ready 와 같은 구역·줄 높이에 값 대신 막대. 구역 이름은 글자 그대로. 오늘 2행, 처리할 것 없음 — Basic 과 높이가 같다 | `status="loading"` |
| 불러오기 실패 | 오류 + `다시 불러오기` | `status="error"` |

금액은 이 문서에 적지 않는다. 미리보기가 `pay.ts` 로 계산한 값이 곧 정답이다(명세 §5-5 의 대조값은 검증용).

**접근성**: 구역 `h2` 셋(오늘·처리할 것·이번 주), ④ 이번 달은 구역 전체가 버튼이라 버튼 이름으로 읽힌다. 처리할 것 행은 `sr-only` ` — 요청 탭에서 보기`. 누르는 곳 44px 이상. 아이콘 전부 `aria-hidden`. 390px 가로 스크롤 없음. ([명세 §7](member-today.md#7-접근성-요약))

**사용 규칙**: [오늘 근무 대시보드 명세 §3](member-today.md#3-오늘-근무-카드--todaydashboard-t-2t-5), 계산식은 [PRD 02](../prd/02-pay.md). 프로젝트 규칙 "화면 컴포넌트에서 금액을 계산하지 않는다"(`CLAUDE.md` §2).

**하지 말 것**
- `now` 에 1초 단위 시각을 넘기지 않는다 — `minuteNow`.
- 주휴 글자를 새로 만들지 않는다 — `holidayStatus` 를 쓴다.
- 예시에서 금액·시간을 손으로 적어 넣지 않는다.
- 이 카드를 시계 카드 안에 넣지 않는다 (§4-7 카드 안에 카드 금지).

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `shifts` | `Shift[]` | — | **필수** 이번 달 조회 범위(`monthRange(이번 해, 이번 달)`)의 내 기록. 이번 주 전부를 포함한다 |
| `absences` | `Absence[]` | — | **필수** 같은 범위의 내 휴가·대타 |
| `requests` | `MyRequests \| null \| undefined` | — | 없으면 ② 처리할 것 숨김 |
| `settings` | `PaySettings` | — | **필수** |
| `now` | `number` | — | **필수** `minuteNow` 를 넘긴다 |
| `status` | `"loading" \| "error" \| "ready"` | — | **필수** |
| `onRetry` | `() => void` | — | **필수** |
| `onOpenPay` | `() => void` | — | **필수** 급여 탭(이번 달)으로 |
| `onOpenRequests` | `() => void` | — | **필수** 요청 탭으로 |

`TodayDashboardSkeleton` — `status="loading"` 일 때 그리는 모양. settings 가 아직 없는 로그인 확인 전 첫 화면에서 직접 쓴다(`now` 없이).

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `now` | `number` | — | `{월}월 예상 급여` 의 월. 없으면(서버 렌더되는 로그인 확인 전) 그 글자도 막대 |
| `progress` | `boolean` | `true` | 이번 주 진행 막대 줄 — `settings.weeklyHours > 0` |

---

### 4-19. `dialog` — Dialog

**설명**: 화면 위 모달. 멤버 카드 "조건 수정" 이 쓴다 (2026-09-25 사용자 요청 "조건 수정은 모달로", shadcn Dialog 지정). 원본(`https://ui.shadcn.com/r/styles/base-nova/dialog.json`, `button.json`)을 그대로 두고 바깥 `className` 으로 맞춘다 — 타임시트 스킬 §0 "shadcn 컴포넌트를 들일 때".

**패키지**: `class-variance-authority`(Button), `tw-animate-css`(열고 닫힘 움직임) — 2026-09-25 사용자 승인 뒤 설치.

**맞춤**: `DialogContent` 에 `bg-surface p-5 sm:max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto`, `DialogFooter` 에 `-mx-5 -mb-5 flex-row border-line bg-transparent px-5 py-4`. 푸터 버튼은 `h-9 flex-1 rounded-lg text-sm font-semibold`(취소 테두리 · 저장 accent 채움). 원본의 `bg-muted` 는 우리 `muted`(글자색)와 이름이 겹쳐 잇지 않고 덮는다.

| 예시 (H2) | 설명 |
|---|---|
| Basic | 작은 "조건 수정" 버튼으로 열고, 시급 입력칸(천 단위 쉼표) + 취소·저장 |

### 4-20. `skeleton` — Skeleton

**설명**: 불러오는 동안 불러온 뒤와 **같은 크기**로 자리를 잡는 막대. layout shift 없음 (2026-09-25 사용자 요청 "모든 디자인에 layout shift 없도록 원래 사이즈에서 스켈레톤", shadcn Skeleton 지정). 원본(`https://ui.shadcn.com/r/styles/base-nova/skeleton.json`)은 그대로, 앱은 `Bone`(바탕 `bg-line` — 원본 `bg-muted` 는 우리 쪽 글자색)과 `Loading`(aria-busy + sr-only "불러오는 중")을 쓴다.

**크기 규칙**: 같은 틀(Card·padding·gap)에 글자 줄은 줄 높이 칸(`text-xs` h-4, `text-sm` h-5, `text-base` h-6, `text-lg·xl` h-7, `text-2xl` h-8) 안에 막대. 버튼·입력칸은 같은 높이·모서리. 개수가 바뀌는 목록은 흔한 개수(2~3행). 데이터와 무관한 고정 글자(구역 이름·안내문)는 글자 그대로 둔다 — 줄바꿈까지 같아진다.

**화면별 스켈레톤 위치**: 멤버 — `TodayDashboard.tsx`(`ClockCardSkeleton`·`TodayDashboardSkeleton`), `PayView.tsx`(`PayViewSkeleton`), `member/*`. 사장 — `web/src/app/admin/_skeletons.tsx`. 로그인 확인 전 셸 — `shell.tsx` `HeaderSkeleton`·`BottomNavSkeleton`.

| 예시 (H2) | 설명 |
|---|---|
| Basic | 불러온 카드와 스켈레톤 카드를 나란히 — 높이가 같다 |

### 4-21. `button` — Button

**설명**: 앱 버튼 모양 클래스 묶음(`web/src/components/buttons.ts`) — shadcn `buttonVariants` 위에 크기만. 색 테두리(파랑·빨강)를 쓰지 않는다 (2026-09-25 "버튼 디자인이 너무 촌스럽다 파랑 빨강. 모던하게"). 주 색 `primary` 는 `foreground` 로 잇는다(라이트 검정·다크 흰색).

| 이름 | 모양 | 쓰는 곳 |
|---|---|---|
| `BTN_ACCENT` | secondary(회색 채움) h-8 text-xs | 카드 안 보통 동작 |
| `BTN_WARN` | ghost, 회색 글자 → 올리면 빨강 | 삭제·퇴사처리·초대 취소 |
| `ACT_SAVE`·`ACT_CANCEL` | default·secondary h-9 flex-1 | 폼 저장·취소 (승인·거절·수락은 h-10 으로 덮어 씀) |
| `BLOCK_PRIMARY`·`BLOCK_SECONDARY` | h-12 w-full | 화면 주 동작·보조 동작 |

예외: 멤버 출퇴근 카드의 출근·퇴근 큰 버튼과 50m 배너는 상태 구별 색이라 [member-today](member-today.md) §2-3 그대로.

| 예시 (H2) | 설명 |
|---|---|
| Variants | 네 모양 |

## 5. 개발팀 전달 요점

1. 페이지 21개 + `/guide` + `/guide/foundations`. slug·순서·묶음은 §1-3 표 그대로.
2. 페이지 틀은 §1-4 의 9절 순서. 예시 이름이 곧 H2.
3. 미리보기는 실제 컴포넌트를 import 한다. 가이드용 복제 컴포넌트를 만들지 않는다.
4. `BottomNav`·`AppHeader` 미리보기는 `transform` 틀 안에 넣는다 (§1-5).
5. 날짜·시각은 예시마다 고정값. `useMonthCursor`·`Date.now()` 를 예시에 쓰지 않는다.
6. 다크 모드 전환 버튼은 두지 않는다. 다크 값은 기초 페이지 견본으로만.
7. 예시 데이터는 이 문서의 가짜 이름·id 만.
8. 규칙 본문은 스킬·달력 명세 링크로 걸고 복제하지 않는다.
