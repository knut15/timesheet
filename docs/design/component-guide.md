# 디자인 컴포넌트 가이드 — 명세 (`/guide`)

[디자인 문서](README.md) · [timesheet-ui 스킬](../../.claude/skills/timesheet-ui/SKILL.md) · [근무 달력 명세](calendar.md) · 작업 카드 [TS-003](../team/tasks/TS-003-component-guide.md)

웹 앱 `/guide` 에 올릴 컴포넌트 가이드의 내용 명세다. 개발팀은 이 문서의 각 절을 MDX 페이지 하나(`/guide/components/<slug>`)로 옮긴다.

- **형식만** shadcn/ui 문서 페이지(<https://ui.shadcn.com/docs/components/base/avatar>)를 따른다. 컴포넌트 코드는 바꾸지 않고, shadcn·Base UI 를 도입하지 않는다 (사용자 결정 2026-09-25).
- 여기 적은 props·기본값·클래스는 2026-09-25 `feature/component-guide` 의 코드에서 옮겼고, 2026-10-15 디자인 B(가는 선·작은 모서리·고정폭 숫자·GSAP 모션·lucide 장면 일러스트)에 맞춰 고쳤다. 코드가 바뀌면 코드가 맞고, 이 문서를 고친다.
- 화면 규칙(헤더 제목, 메뉴 구성, 아바타 seed 규칙 등)의 원본은 timesheet-ui 스킬이다. 이 문서는 규칙을 **복제하지 않고** 스킬의 절을 가리킨다.
- 예시 데이터는 전부 가짜다. 이름은 `김하늘`·`이서준`·`박도윤`·`최유나`·`Alex Kim`·`Mia`, id 는 `user-demo-01` ~ `user-demo-08`, 매장은 `데모 카페 성수점` 만 쓴다. 실제 사용자·매장 데이터를 가져오지 않는다.

---

## 1. 가이드 전체 구조

### 1-1. 경로

| 경로 | 페이지 |
|---|---|
| `/guide` | 첫 화면 — 소개, 기초 토큰 요약, 컴포넌트 목록 |
| `/guide/foundations` | 기초 — 색·타이포·간격·모서리·움직임·아이콘·일러스트 (§2) |
| `/guide/components/<slug>` | 컴포넌트 페이지 25개 (§4) |

### 1-2. `/guide` 첫 화면

위에서 아래로:

1. **제목** `timesheet 컴포넌트` + 한 줄 설명 `출퇴근·급여 화면을 만드는 컴포넌트와 규칙. 미리보기는 실제 앱 컴포넌트다.`
2. **이 가이드를 읽는 법** 세 줄
   - 새 화면은 여기 있는 컴포넌트를 조립해서 만든다. 헤더·내비·아바타를 화면마다 새로 그리지 않는다 → [timesheet-ui 스킬](../../.claude/skills/timesheet-ui/SKILL.md) 머리말
   - 미리보기는 `web/src/components/` 의 실제 컴포넌트를 그대로 렌더한다. 코드 탭은 그 예시의 원본이다
   - 가이드와 코드가 다르면 코드가 맞다
3. **기초 토큰 요약** — 색 토큰 10개 견본(라이트·다크 나란히, §2-1 표의 값) + `기초 전체 보기 →` 링크(`/guide/foundations`)
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
| | `section-label` | Section Label |
| | `scene` | Scene |
| | `spinner` | Spinner |
| | `skeleton` | Skeleton |
| | `progress-bar` | Progress Bar |
| 입력 | `button` | Button |
| | `field` | Field |
| | `error-text` | Error Text |
| | `month-picker` | Month Picker |
| | `dialog` | Dialog |
| 달력 | `month-grid` | Month Grid |
| | `calendar-legend` | Calendar Legend |
| | `view-toggle` | View Toggle |
| 움직임 | `motion` | Motion |
| 화면 조각 | `clock-card` | Clock Card |
| | `today-dashboard` | Today Dashboard |
| | `pay-view` | Pay View |
| | `work-terms-charts` | Work Terms Charts |

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

값의 원본은 루트 [DESIGN.md](../../DESIGN.md) §2, 코드는 `web/src/app/globals.css`. `@theme inline` 으로 Tailwind 색 이름(`bg-surface`, `text-muted`, `border-line` …)이 된다. 다크는 `@media (prefers-color-scheme: dark)`.

중립색 다섯(바탕·글자·카드·선·보조 글자)은 2026-10-15 사용자 결정 "컬러도 바꿔줘 시안처럼" 으로 청록 기운 없는 회색이 됐다. 강조색·상태색은 그대로다. 대비 값은 DESIGN.md §2 표에 있다 — 예를 들어 보조 글자는 바탕 위 5.05(라이트) / 7.76(다크).

| 토큰 | Tailwind | 라이트 | 다크 | 쓰는 곳 |
|---|---|---|---|---|
| `--background` | `bg-background` | `#fafafa` | `#09090b` | 페이지 바탕, 하단 내비 활성 칩, 주 버튼(`BTN.primary`) 글자 |
| `--foreground` | `text-foreground` | `#18181b` | `#fafafa` | 본문 글자, 하단 내비 활성 글자, 주 버튼(`BTN.primary`) 바탕 |
| `--surface` | `bg-surface` | `#ffffff` | `#18181b` | 카드, 헤더, 하단 내비, 입력칸(`.field`), 선 버튼, 아바타 겹침 경계(`ring-surface`) |
| `--line` | `border-line` | `#e4e4e7` | `#27272a` | 카드·헤더·내비·버튼 경계선, 중립 배지 바탕, 보기 전환 틀(60%) |
| `--muted` | `text-muted` | `#6b6b74` | `#a1a1aa` | 보조 글자, 비활성 메뉴, 구역 머리(`SectionLabel`), 점선 테두리, 장면 소품 |
| `--accent` | `text-accent` `bg-accent` | `#0f766e` | `#2dd4bf` | 오늘·선택, 입력 포커스(테두리 + 15% 고리), 시계·큰 급여 숫자, 장면 원(10% 바탕), 강조 버튼 바탕 |
| `--on-accent` | `text-on-accent` `bg-on-accent` | `#ffffff` | `#05201d` | 강조 버튼 글자, 출근 알림 카드 안 반전 버튼 |
| `--warn` | `text-warn` `bg-warn` | `#b91c1c` | `#f87171` | 오류 글자, 내비 배지(글자 `text-background`), 거절 상태, 퇴근 기록 없음 |
| `--ok` | `text-ok` `bg-ok` | `#166534` | `#4ade80` | `StatusPill` 승인, 근무 중 점 |
| `--caution` | `text-caution` `bg-caution` | `#92400e` | `#fbbf24` | `StatusPill` 대기, 요청 대기 아이콘 `Hourglass` |

토큰 밖에서 쓰는 색 — 이것 말고는 없다 (`web/src/lib/design-tokens.test.mjs` 가 막는다):

| 색 | 쓰는 곳 | 근거 |
|---|---|---|
| 아바타 8색 `#2563eb` `#7c3aed` `#db2777` `#dc2626` `#c2410c` `#15803d` `#0f766e` `#4338ca` | `Avatar` 배경 (`shell.tsx` `AVATAR_COLORS`) | 흰 글자 대비 4.5:1 이상 — [스킬 §3](../../.claude/skills/timesheet-ui/SKILL.md#3-멤버-아바타--avatar) |
| `bg-white` | 출근 알림 토글 손잡이 | 켜짐(accent)·꺼짐(line) 두 바탕 위에서 같은 손잡이 |

견본 표시: 칸마다 색 사각형 + 토큰 이름 + hex. 라이트·다크 두 열. 다크 견본은 hex 를 직접 칠한다(§1-5).

### 2-2. 타이포

- 글꼴: 본문은 **Pretendard**(가변, `next/font/local` 로 앱이 직접 제공 — `layout.tsx` 의 `--font-pretendard`, `font-sans` 도 같은 글꼴). 없을 때만 `system-ui` 계열로 떨어진다. 코드는 `font-mono` = Geist Mono.
- 숫자(시각·시간·금액·날짜)는 고정폭 글꼴. `ui.tsx` 의 `NUM` 상수(`font-mono tabular-nums`)를 붙인다 — 자릿수가 바뀌어도 글자 폭이 같아 숫자가 흔들리지 않는다. 시계·큰 급여 숫자는 여기에 `text-accent` 를 더한다 (2026-10-15 사용자 결정).

| 크기 | 클래스 | 실제 쓰는 곳 |
|---|---|---|
| 9px | `text-[9px]` | `Avatar` xs 이니셜, `+N` |
| 10px | `text-[10px]` | 내비 배지 숫자, 달력 칸 휴가 글자 |
| 11px | `text-[11px]` | 내비 이름, `StatusPill`, 요일 줄, 범례, 달력 칸 시간 |
| 12px | `text-xs` | `Field` 이름(`font-semibold`), `SectionLabel`, 작은 버튼(`BTN.small`), `Avatar` sm |
| 14px | `text-sm` | 보조 설명, `ErrorText`, 보기 전환, 선 버튼(`BTN.secondary`) |
| 15px | `text-[15px]` | 헤더 매장 이름(`font-medium`), 주 버튼(`BTN.primary`) |
| 16px | `text-base` | 입력칸 `.field` (iOS 확대 방지 크기) |
| 18px | `text-lg` | 헤더 화면 이름(`font-bold tracking-tight`) |
| 20px | `text-xl` | `Avatar` lg |
| 28px | `text-[28px]` | 대시보드 인건비(`font-semibold text-accent`, `NUM`) |
| 30px | `text-[30px]` | 급여 총액(`font-semibold text-accent`, `NUM`) |
| 40px | `text-[40px]` | 출퇴근 시계(`font-semibold text-accent`, `NUM`) |

굵기: `font-medium`(메뉴) · `font-semibold`(배지·구역 머리·금액·시계·큰 급여 숫자·아바타) · `font-bold`(화면 이름·오늘·선택한 날 숫자).

### 2-3. 간격·모서리·높이

| 항목 | 값 | 쓰는 곳 |
|---|---|---|
| 본문 가로 여백 | `px-5` (20px) | 헤더 안쪽, `main` |
| 본문 아래 여백 | `pb-28` (112px) | 하단 내비(64px + 안전 영역)에 가리지 않게 |
| 카드 안쪽 | `p-4` (16px) | `Card` 기본. 구역을 나누면 `divide-y divide-line p-0` + 구역마다 `px-4 py-3.5`. 달력 격자는 `p-2.5` |
| 카드 사이 | `space-y-4` (16px) | `PayView` |
| 본문 폭 | 멤버 `max-w-md`(448px) · 마스터 `max-w-3xl`(768px) | [스킬 §1](../../.claude/skills/timesheet-ui/SKILL.md#1-헤더--appheader) |
| 누르는 높이 | 버튼 44(작은 버튼 32), 아이콘 버튼 44×44, 보기 전환 40, 내비 항목 64, 달력 칸 52/60 | 터치 영역 44px 이상이 기준(DESIGN.md §6). 작은 버튼·보기 전환·달력 칸은 폭·높이 한계로 예외 |

**모서리** — 선은 가늘게, 모서리는 작게 (2026-10-15 디자인 B). `globals.css` `@theme` 에서 Tailwind 이름의 값을 바꿨으므로 같은 클래스가 예전보다 덜 둥글다.

| 클래스 | 값 | 쓰는 곳 |
|---|---|---|
| `rounded-2xl` | 8px (예전 14px) | `Card`, 가이드 미리보기 틀 |
| `rounded-xl` | 6px (예전 10px) | 버튼(`BTN`), 입력칸(`.field`), `IconButton`, 하단 내비 활성 칩, 보기 전환 틀 |
| `rounded-md` | 4px (새로 정함) | `StatusPill`, 내비 배지, 달력 칸, 보기 전환 버튼 |
| `rounded-[4px]`~`rounded-[12px]` | 크기별 4 · 6 · 8 · 12px | `Avatar` xs · sm · md · lg — 둥근 사각형. 아바타 겹침의 `+N` 도 4px |
| `rounded-full` | 원 | 장면 일러스트의 원, 근무 중 점 |

### 2-4. 아이콘

- **lucide-react 만** 쓴다. 규칙·확인 명령은 [스킬 §2 "아이콘은 lucide-react 만"](../../.claude/skills/timesheet-ui/SKILL.md#아이콘은-lucide-react-만). 설치 버전 1.47.0.
- 크기는 쓰는 곳이 정한다: 내비 20 · 아이콘 버튼 20(outline 18) · 보기 전환 16 · 카드 구역 머리(`SectionLabel`) 15 · 달력 표시·범례 10.
- 선 굵기: 내비 활성 2.2 / 비활성 1.8 · 구역 머리 1.75 · 장면 일러스트 1.5 · 비활성 보기 전환 2.
- 아이콘은 항상 `aria-hidden`, 접근 이름은 옆 글자나 `aria-label` 이 가진다.
- 페이지에 지금 쓰는 아이콘 목록을 격자로 보인다: `Clock` `CalendarDays` `ClipboardList` `Wallet` `UserRound`(멤버 내비) · `LayoutDashboard` `Inbox` `Users` `Store`(마스터 내비) · `LogOut` · `List` · `Hourglass` `TriangleAlert`(달력). 2026-09-25 에 전부 `typeof === "object"` 확인. 장면 일러스트와 구역 머리 아이콘은 화면마다 골라 쓰므로 이 격자에 싣지 않는다.

---


### 2-5. 스크롤 영역·화살표

- 화면 안에서 따로 스크롤되는 곳(코드 블록·넓은 표·긴 목차)은 shadcn **ScrollArea** (`@/components/ui/scroll-area`, Base UI·base-nova 원본). 브라우저 기본 스크롤바(`overflow-auto`)를 쓰지 않는다. 페이지 전체 스크롤은 대상이 아니다
- 월 이동 같은 좌우 화살표는 lucide `ChevronLeft`/`ChevronRight` 를 `IconButton` 으로. `◀` `▶` 글자를 쓰지 않는다
- 규칙 원본: timesheet-ui 스킬 §0·§2

### 2-6. 움직임

움직임은 두 가지로 나뉜다. 매번 손에 닿는 누름 반응은 CSS 가 맡고, 화면이 바뀌거나 무언가 끝나는 순간은 GSAP 3.15 모션이 맡는다 (2026-10-15 사용자 결정). 기준의 원본은 [DESIGN.md](../../DESIGN.md).

GSAP 모션 4종 — 코드 `web/src/components/motion.tsx`, 페이지 §4-24.

| 이름 | 언제 | 움직임 |
|---|---|---|
| `Enter` | 화면 진입 | 바로 아래 자식들이 8px 아래에서 올라오며 차례로. 0.32초, 0.06초 간격 |
| `CountUp` | 숫자 변화(급여·시간) | 이전 값(처음은 0)에서 새 값까지 0.6초 |
| `SwapText` | 글자 바뀜(출퇴근 상태) | 새 글자가 아래에서 올라오며 나타난다. 0.22초 |
| `useAppear` | 완료 상자·저장 알림 | 마운트될 때 10px 아래에서 올라온다. 0.35초 |

- 곡선은 `power2.out`(`motion.tsx` 의 `EASE`) — CSS `--ease-out` 과 같은 성격.
- 모션 줄이기(`prefers-reduced-motion`)면 4종 모두 이동 없이 투명도만. `CountUp` 은 새 값을 바로 보인다.
- 탭 전환처럼 하루 수십 번 보는 것에는 걸지 않는다.

CSS 누름·등장 (`globals.css`) — 그대로 둔다.

- 곡선 `--ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`). `ease-in`·`transition-all` 금지.
- 버튼·하단 주요 메뉴 누름 `scale(0.97)` 120ms, 색 변화 150ms `ease`. 목록 행·카드·목차 링크는 뺀다. 누름 대상에 Tailwind `transition` 을 따로 주지 않는다.
- 레이아웃 속성은 전환하지 않는다 — 토글 손잡이는 `translate-x`.
- 오류 문구(`ErrorText`)·온보딩 카드는 `.appear` 200ms(위로 4px), 여러 개면 50ms 간격.
- 모션 줄이기면 누름 축소 끔, `.appear` 는 투명도만.

### 2-7. 일러스트

빈 화면·로그인·온보딩처럼 잠깐 머무는 자리에 lucide 아이콘을 엮은 작은 장면을 둔다 (2026-10-15 사용자 결정). 그림 파일을 들이지 않고, **사람 그림은 쓰지 않는다** — 뜻은 사물로 보인다(출퇴근 = 시계 + 커피 잔 + 해).

- 가운데 옅은 강조색 원(`bg-accent/10`, `border-accent/20`)에 주인공 아이콘(강조색), 네 모서리 중 1~2곳에 소품(`text-muted`). 선 굵기 1.5.
- 크기 `md` 원 64·주인공 30·소품 16px, `sm` 원 44·주인공 22·소품 13px.
- 처음 그릴 때 원이 올라오고 소품이 0.08초 간격으로 튀어나온다. 장식이라 `aria-hidden`.
- 한 화면에 하나. 작은 구역의 빈 상태는 글자만.
- 코드 `web/src/components/illust.tsx`, 페이지 §4-23.

## 3. 컴포넌트 목록

| slug | 컴포넌트 (export) | 파일 | 예시 수 |
|---|---|---|---|
| `app-header` | `AppHeader`, `SubHeader`, 타입 `Crumb` | `shell.tsx` | 6 |
| `bottom-nav` | `BottomNav`, 타입 `NavItem` | `shell.tsx` | 5 |
| `icon-button` | `IconButton` | `shell.tsx` | 3 |
| `avatar` | `Avatar`, 함수 `initials` | `shell.tsx` | 5 |
| `avatar-stack` | `AvatarStack` | `calendar/AvatarStack.tsx` | 4 |
| `status-pill` | `StatusPill` | `ui.tsx` | 2 |
| `card` | `Card` | `ui.tsx` | 3 |
| `section-label` | `SectionLabel` | `ui.tsx` | 4 (하나는 Card 와 같은 예시) |
| `scene` | `Scene`, 타입 `Accent`, `EmptyState` | `illust.tsx` | 3 |
| `spinner` | `Spinner` (앱에서는 더 쓰지 않음 — Skeleton) | `ui.tsx` | 1 |
| `skeleton` | shadcn `Skeleton` 원본 + `Bone`·`Loading`, 셸 `HeaderSkeleton`·`BottomNavSkeleton` | `ui/skeleton.tsx`, `ui.tsx`, `shell.tsx` | 1 |
| `progress-bar` | `ProgressBar` | `ui.tsx` | 3 |
| `button` | 상수 `BTN` + 옛 이름(별칭) `BTN_ACCENT`·`BTN_WARN`·`ACT_*`·`BLOCK_*` | `styles.ts`(`ui.tsx` 가 다시 내보냄), `buttons.ts` | 4 |
| `field` | `Field` + CSS 클래스 `.field` | `ui.tsx`, `globals.css` | 4 |
| `error-text` | `ErrorText` | `ui.tsx` | 2 |
| `month-picker` | `MonthPicker`, 훅 `useMonthCursor` | `ui.tsx` | 2 |
| `dialog` | shadcn `Dialog`·`DialogContent`·`DialogHeader`·`DialogTitle`·`DialogDescription`·`DialogFooter` (원본 그대로, 닫기 버튼은 `ui/button.tsx`) | `ui/dialog.tsx` | 2 |
| `month-grid` | `MonthGrid`, 타입 `Marks`, `OpenDot` | `calendar/MonthGrid.tsx` | 7 |
| `calendar-legend` | `CalendarLegend` | `calendar/CalendarLegend.tsx` | 2 |
| `view-toggle` | `ViewToggle` | `calendar/ViewToggle.tsx` | 2 |
| `motion` | `Enter`, `CountUp`, `SwapText`, 훅 `useAppear` | `motion.tsx` | 4 |
| `clock-card` | `ClockCard`, 타입 `ClockState` | `TodayDashboard.tsx` | 10 |
| `today-dashboard` | `TodayDashboard` | `TodayDashboard.tsx` | 8 |
| `pay-view` | `PayView`, `PayViewSkeleton`, `DotRow`, 함수 `holidayStatus`·`holidayTone` | `PayView.tsx` | 7 |
| `work-terms-charts` | `WeekRhythm`, `WeeklyHoursGauge`, `WorkDayDots` | `member/WorkTermsCharts.tsx` | 4 |

페이지를 두지 않는 export (`ui.tsx`): 표시 함수 `won` `hm` `time` `date` `dayLabel` `toLocalInput`, 변환 `toShift` `monthRange` `keyed`, 훅 `useNow`. 숫자 글꼴 상수 `NUM` 은 §2-2 에서 다룬다. 화면 요소가 아니므로 컴포넌트 목록에 싣지 않는다. 예시 코드에서 쓰면 import 만 보인다.
`AuthForm`·`TimesheetApp`·`member/*`·`SessionBoot`·`useSelectedDay` 는 화면·로직이라 가이드 대상이 아니다.

---

## 4. 컴포넌트 페이지

§4 의 번호는 추가한 순서다. 목차 순서는 §1-3 표를 따른다 (§4-16~4-21 은 2026-09-25, §4-22~4-24 는 2026-10-15 디자인 B, §4-25 는 2026-10-15 근무 조건 그림에서 추가). 디자인 B 의 `buttons` 는 §4-21 `button` 으로 합쳤다.

### 4-1. `app-header` — App Header

**설명**: 모든 화면의 머리. 한 줄에 `매장 / 화면 이름` 을 두고 화면 이름을 굵게 강조한다 (2026-10-15 디자인 B). 오른쪽에 동작과 내 아바타.

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
AppHeader  <header sticky top-0, border-b, bg-surface/95 blur>
└─ 폭 틀  <div mx-auto {width} h-16 px-5>
   ├─ 한 줄 묶음  <div flex h-7 items-center gap-1.5>
   │  ├─ 로고 <img alt={logoAlt} h-5 max-w-24> (logoUrl 있을 때 — 매장 이름 글자를 대신)
   │  ├─ eyebrow  <span text-[15px] font-medium text-muted, 한 줄 자름> (값이 있을 때)
   │  ├─ 나눔 "/"  <span aria-hidden text-muted/50> (로고나 eyebrow 가 있을 때)
   │  ├─ title    <h1 text-lg(18px) font-bold, 줄어들지 않음> (crumbs 가 없을 때)
   │  └─ 브레드크럼  <nav aria-label="현재 위치"><ol> (crumbs 가 있을 때)
   │     ├─ 상위 화면 <Link text-[15px] font-medium text-muted> + ChevronRight 15px × crumbs
   │     └─ title  <h1 aria-current="page" text-lg font-bold, 한 줄 자름>
   └─ 오른쪽 묶음  <div gap-1>
      ├─ actions  (넘긴 그대로)
      └─ Avatar sm(32px), label "<nickname> (나)"
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 · 틀 폭 |
|---|---|---|
| Basic — 멤버 | 멤버 화면 머리 | `eyebrow="데모 카페 성수점"` `title="출퇴근"` `me={{ id: "user-demo-01", nickname: "김하늘" }}` `width="max-w-md"` |
| 마스터 + 로그아웃 | `actions` 에 `IconButton` | `eyebrow="데모 카페 성수점 · 사장님"` `title="대시보드"` `me={{ id: "user-demo-08", nickname: "Alex Kim" }}` `actions={<IconButton icon={LogOut} label="로그아웃" onClick={() => {}} />}` 기본 폭 |
| 긴 글자 자르기 | 자리가 모자라면 매장 이름 쪽만 말줄임, 화면 이름은 끝까지 | `eyebrow="데모 카페 성수점 2층 테라스 별관 · 사장님"` `title="멤버"` 틀 폭 320px |
| 제목은 활성 메뉴 | `BottomNav` 와 함께 두어 제목 = 활성 메뉴 이름임을 보인다 | 멤버 5메뉴, `active="records"` ↔ `title="기록"` |

**사용 규칙**: [스킬 §1 헤더](../../.claude/skills/timesheet-ui/SKILL.md#1-헤더--appheader) (eyebrow·title·width 값).

**하지 말 것**
- 화면마다 `<header>` 를 새로 만들지 않는다.
- `me.id` 에 이름을 넣지 않는다 — 아바타 색이 화면마다 달라진다.
- `width` 를 본문 폭과 다르게 주지 않는다.
- `AppHeader` 를 `max-w-*` 틀 안에 넣지 않는다 — 바탕이 화면 끝까지 닿아야 한다. 폭 제한은 `main` 에 준다 (2026-10-08)

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `eyebrow` | `string` | — | **필수** 제목 앞 매장 자리(15px 회색). 로고도 eyebrow 도 없으면 나눔 `/` 를 그리지 않는다 |
| `title` | `string` | — | **필수** 화면 이름(`h1`, 18px 굵게). 줄어들지 않는다 |
| `me` | `{ id: string; nickname: string }` | — | **필수** 내 아바타(sm 32px). `id` 가 색 seed |
| `actions` | `React.ReactNode` | — | 아바타 앞 동작 |
| `width` | `string` (Tailwind max-w 클래스) | `"max-w-3xl"` | 안쪽 폭 |
| `logoUrl` | `string \| null` | — | 매장 로고 주소. 있으면 한 줄 맨 앞에 두고 매장 이름 글자를 대신한다 |
| `logoAlt` | `string` | `""` | 로고의 대체 텍스트 — 매장 이름 |
| `crumbs` | `Crumb[]` (`{ label: string; href: string }`) | — | 상위 화면 링크. 있으면 한 줄이 `매장 / 멤버 › 근무 기록` 모양이 된다 |

---

**하위 화면 (2026-09-25)**: `crumbs` prop — 같은 한 줄에서 제목 앞에 상위 화면 링크를 붙인다(`데모 카페 성수점 / 멤버 › 근무 기록`). 상위 화면은 15px 회색 링크, 마지막 화면 이름만 18px 굵게. 헤더 아래 `SubHeader`(헤더와 같은 폭의 `bg-surface` 띠 + 아래 선, 뒤로 가기 작은 버튼 h-8 text-xs, 띠 py-1.5)로 본문과 나눈다. 사장 멤버 상세·초대 코드가 쓴다(`admin/layout.tsx` `subPage`). 한 줄 묶음은 `h-7` 고정이라 로고·브레드크럼 유무와 상관없이 헤더 높이(64px)가 같다. 예시 `app-header/breadcrumb`.

### 4-2. `bottom-nav` — Bottom Nav

**설명**: 화면 하단 고정 내비게이션. 아이콘 위, 이름 아래. 활성 항목은 옅은 바탕 칩과 진한 글자 (2026-10-15 디자인 B — 윗선 없음). 모든 로그인 화면의 푸터.

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
         │  글자 11px — 활성 font-semibold text-foreground / 비활성 font-medium text-muted
         ├─ 활성 칩  <span aria-hidden absolute inset-x-1 inset-y-1.5 rounded-xl bg-background> (활성만)
         ├─ 아이콘 틀
         │  ├─ Icon 20px (선 2.2 활성 / 1.8)
         │  └─ 배지  <span rounded-md bg-warn, 9 초과는 "9+"> (badge > 0 일 때)
         ├─ label  <span relative> (칩 위에 그린다)
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

**설명**: 아이콘만 있는 버튼. 헤더에는 테두리 없는 `ghost`, 월 이동처럼 본문 안에는 테두리 있는 `outline` 을 쓴다. 이름은 `aria-label` 과 `title` 로 붙는다.

**import**: `import { IconButton } from "@/components/shell";`

**사용법**

```tsx
<IconButton icon={LogOut} label="로그아웃" onClick={() => logout()} />
```

**구성**

```
IconButton  <button type="button" aria-label={label} title={label}, 44×44 rounded-xl(6px)>
│  ghost   text-muted, 마우스를 올리면 bg-line/60
│  outline border border-line bg-surface text-foreground, 마우스를 올리면 bg-background
└─ Icon aria-hidden — ghost 20px / outline 18px
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 로그아웃 | `icon={LogOut}` `label="로그아웃"` `onClick` 은 미리보기 아래 `"로그아웃 눌림"` 글자 표시 |
| 헤더 안 | `AppHeader` `actions` 자리 | §4-1 "마스터 + 로그아웃" 과 같은 데이터 |
| Outline | `variant="outline"` — 본문 안 화살표. `MonthPicker` 가 이 모양 | `ChevronLeft`/`ChevronRight`, `label` "이전"/"다음", 가운데 숫자 0 에서 ±1 |

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
| `variant` | `"ghost" \| "outline"` | `"ghost"` | `ghost` 테두리 없음(헤더), `outline` 가는 선 + 흰 바탕(본문 안) |

---

### 4-4. `avatar` — Avatar

**설명**: 멤버 아바타. 사진 없이 이름 이니셜과 사용자 id 로 고정된 배경색. 모양은 둥근 사각형이다 (2026-10-15 디자인 B).

**import**: `import { Avatar, initials } from "@/components/shell";`

**사용법**

```tsx
<Avatar name="김하늘" seed="user-demo-01" />
```

**구성**

```
Avatar  <span 둥근 사각형(크기별 모서리), 흰 글자, 배경 = AVATAR_COLORS[hash(seed) % 8]>
└─ initials(name)
   role="img" + aria-label (label 있을 때) / aria-hidden (없을 때)
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 기본 크기 md(40px) | `name="김하늘" seed="user-demo-01"` |
| 한글·로마자 이니셜 | 한글은 첫 글자, 로마자는 두 글자 대문자 | `김하늘`→`김` · `Alex Kim`→`AK` · `Mia`→`MI` · `" "`(공백)→`?`. 각각 seed `user-demo-01`·`-08`·`-02`·`-03` |
| Sizes | xs 18 · sm 32 · md 40 · lg 64, 모서리 4 · 6 · 8 · 12 | 4개 모두 `name="이서준" seed="user-demo-05"` |
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
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` | 18 / 32 / 40 / 64px, 글자 9px / 12 / 14 / 20, 모서리 4px / 6 / 8 / 12 |
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
└─ +N  <span 18px rounded-[4px] bg-line text-[9px]> (남은 인원 > 0, 최대 +99)
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

**설명**: 요청 상태 배지. 높이 20px 작은 사각 배지다. 수정 요청·휴가·대타가 같이 쓴다.

**import**: `import { StatusPill } from "@/components/ui";`

**사용법**: `<StatusPill status="pending" />`

**구성**: `<span inline-flex h-5 rounded-md(4px) px-1.5 text-[11px] font-semibold {tone}>` 안에 상태 이름 글자 하나.

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| 전체 상태 | 7개 상태를 한 줄에 | 아래 표의 `status` 7개 |
| 모르는 값 | 표에 없는 값은 그 글자 그대로 중립 색 | `status="expired"` → `expired` |

| `status` | 글자 | 색 |
|---|---|---|
| `pending` | 승인 대기 | caution |
| `requested` | 동료 수락 대기 | caution |
| `accepted` | 승인 대기 | caution |
| `approved` | 승인 | ok |
| `rejected` | 거절 | warn |
| `declined` | 동료 거절 | warn |
| `canceled` | 취소 | line 60% 바탕 / muted 글자 |

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

**설명**: 흰 바탕에 가는 선을 두른 상자. 화면 본문을 묶는 기본 단위.

**import**: `import { Card } from "@/components/ui";`

**사용법**

```tsx
<Card>
  <p className="text-sm text-muted">이번 주 근무</p>
  <p className={`mt-1 text-2xl font-bold ${NUM}`}>18시간 30분</p>
</Card>
```

**구성**: `<section rounded-2xl(8px) border border-line bg-surface p-4 {className}>` + `children`.

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 제목 + 값 | 위 사용법 그대로 |
| 여백 덮기 | `className` 으로 안쪽 여백을 바꾼다 (달력 격자가 쓰는 방식) | `className="p-2.5"`, 안에 `데모 카페 성수점` 글자 |
| 구역 나누기 | `className="divide-y divide-line p-0"` + 구역마다 `<div className="px-4 py-3.5">`, 구역 머리는 `SectionLabel` | 구역 둘: `CalendarDays` `01` `이번 주 근무` 오른쪽 `5일` / 값 `18시간 30분` · `Wallet` `02` `예상 급여` / 값 `190,920원` |

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

**설명**: 입력칸 이름표. 이름 글자 아래에 입력 요소를 둔다. 입력 요소 자체는 CSS 클래스 `.field` 로 꾸민다 — 흰 바탕에 가는 선, 누르면 강조색 테두리와 옅은 고리 (2026-10-15 디자인 B).

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
Field  <label block min-w-0 text-sm>
├─ <span text-xs(12px) font-semibold text-muted>{label}</span>
└─ <span block mt-1.5>{children}</span>
     └─ (넘긴 입력 요소, 보통 className="field")
.field = h-11 w-full min-w-0 rounded-xl(6px) border border-line bg-surface px-3 text-base
         포커스 시 border-accent + 바깥 고리 ring-3 ring-accent/15
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

**설명**: 달 이동. 테두리 있는 왼쪽·오른쪽 화살표 버튼과 가운데 `2026년 9월`. 숫자는 고정폭 글꼴이라 달이 바뀌어도 글자 폭이 흔들리지 않는다.

**import**: `import { MonthPicker, useMonthCursor } from "@/components/ui";`

**사용법**

```tsx
const [cursor, setCursor] = useMonthCursor(); // 오늘이 든 달로 시작
<MonthPicker cursor={cursor} onChange={setCursor} />
```

**구성**

```
MonthPicker  <div flex justify-between>
├─ <IconButton variant="outline" icon={ChevronLeft} label="이전 달" />
├─ <p font-semibold {NUM}>{year}년 {month + 1}월</p>   NUM = font-mono tabular-nums
└─ <IconButton variant="outline" icon={ChevronRight} label="다음 달" />
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 달 이동 | 시작 `{ year: 2026, month: 8 }` (= 2026년 9월). 예시는 `useState` 로 고정 시작값을 쓴다 (`useMonthCursor` 는 오늘 기준이라 미리보기가 바뀐다) |
| 해 넘김 | 12월 → 1월 | 시작 `{ year: 2026, month: 11 }` → 다음 누르면 `2027년 1월` |

**사용 규칙**: `month` 는 0~11 (`Date#getMonth` 와 같다). 달력과 함께 쓸 때는 [달력 명세 §7](calendar.md#7-접근성) 키보드 항목.

**하지 말 것**
- `month` 에 1~12 를 넣지 않는다.

**API 레퍼런스**

`MonthPicker`

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `cursor` | `{ year: number; month: number }` | — | **필수** `month` 0~11 |
| `onChange` | `(c: { year: number; month: number }) => void` | — | **필수** 새 달 |

`useMonthCursor()` → `[cursor, setCursor]` (`useState` 반환 그대로). 처음 값은 오늘이 든 달.

두 화살표는 `IconButton` 이라 `type="button"` 을 가진다. `<form>` 안에 두어도 누를 때 form 이 제출되지 않는다.

---

### 4-12. `month-grid` — Month Grid

**설명**: 월요일 시작 월 격자. 날짜 칸은 작은 모서리(`rounded-md` 4px)의 버튼이고, 칸 내용은 부르는 쪽이 `cell` 로 채운다. 오늘은 강조색 테두리, 선택한 날은 진한 바탕 (2026-10-15 디자인 B). 멤버·마스터 달력이 같이 쓴다.

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
MonthGrid  Card className="p-2.5"
├─ 격자  <div role="group" aria-label="2026년 9월 달력" aria-busy={busy}>  (busy 면 sr-only role="status" "불러오는 중")
│  ├─ 요일 줄  <div aria-hidden grid-cols-7 gap-[3px]> 월 화 수 목 금 토 일 (11px font-semibold text-muted)
│  └─ 칸 줄  <div grid-cols-7 gap-[3px]>
│     ├─ 이번 달 밖  <div aria-hidden opacity-40> 숫자만
│     └─ 날짜 칸  <button rounded-md border aria-label={label} aria-pressed={selected} aria-current="date"(오늘)>
│        ├─ 1줄
│        │  ├─ 날짜 숫자 11px NUM — 보통 font-semibold, 오늘 font-bold text-accent, 선택 font-bold
│        │  └─ 표시 자리 aria-hidden: OpenDot(open="today") · TriangleAlert(open="stale") · Hourglass(pending)
│        └─ 본문 <span data-body aria-hidden>: cell(key).body (busy 면 대신 Bone h-2.5 w-6)
└─ footer  <div mt-2.5> (있을 때)
테두리: 점선(marks.dashed) border-dashed border-muted → 오늘 border-accent → 선택 border-foreground → 보통 border-line
오늘: 테두리에 더해 안쪽 고리 ring-1 ring-inset ring-accent (선택과 겹치면 진한 바탕 둘레에 강조색 테두리)
바탕: 선택 bg-foreground text-background / 기록 있는 날(본문에 그린 것이 있으면, busy 가 아닐 때) bg-background / 그 밖 bg-surface
선택 칸 반전: 본문의 text-foreground·text-muted 글자를 바탕색으로 뒤집고, 근무 중 점·아이콘도 바탕색으로 그린다
포커스: focus-visible:outline-2 outline-offset-1 outline-accent — 키보드 이동 때만 보이는 바깥 선
```

**예시** — 전부 2026년 9월, `todayKey="2026-09-25"`, 선택 시작값 `"2026-09-25"`. 칸 데이터는 아래 표만 채우고 나머지 날은 `marks: {}` · `body: null`.

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 빈 달, 오늘·선택만 | 모든 칸 빈 값, `cellHeight={56}` |
| 멤버 달력 | 시간·휴가 글자·상태 표시 + 범례 | `cellHeight={56}`, `footer={<CalendarLegend role="member" />}`. 칸(시간 글자는 `compactHours(분)`): `09-22` 270분 → `4.5h` · `09-23` 540분 → `9h`, `marks={{ open: "stale", pending: true }}` · `09-24` 글자 `유급`, `marks={{ dashed: true }}` · `09-25` 130분 → `2.2h`, `marks={{ open: "today" }}` · `09-26` 글자 `대타`, `dashed`. `label` 은 [달력 명세 §7 읽는 이름 예시](calendar.md#읽는-이름-예시--dayarialabel) 표의 멤버 문장 그대로 |
| 마스터 달력 | 아바타 겹침 + 시간 | `cellHeight={64}`, `footer={<CalendarLegend role="master" />}`. 칸: `09-22` `AvatarStack`(김하늘·이서준·박도윤) + 870분 → `15h`, `marks={{ dashed: true, pending: true }}` · `09-24` 5명(+ 최유나·Alex Kim) + 900분 → `15h` · `09-25` 2명(김하늘·Mia) + 240분 → `4h`, `open: "today"` · `09-27` 글자 `쉼 1`, `dashed`. `Mia` 의 id 는 `user-demo-02` |
| 불러오는 중 | `busy` 면 칸 내용·표시 대신 작은 막대, `aria-busy`. 칸 높이가 그대로라 격자가 움직이지 않는다. 범례는 데이터와 무관해 그대로 둔다 — `불러오는 중…` 글자는 없다 | `busy`, `footer={<CalendarLegend role="member" />}` |
| 선택과 점선 | 점선 칸을 선택해도 점선은 남고 진한 바탕·굵은 날짜가 더해진다. 칸 안 글자는 바탕색으로 뒤집힌다 | 멤버 달력 데이터, 선택 `"2026-09-24"`(유급 휴가 칸) |
| 키보드 포커스 | Tab 으로 칸에 가면 바깥 선(accent)이 보인다. 마우스·터치 선택에는 없다 | 멤버 달력 데이터. 미리보기 캡션 "Tab 으로 칸을 옮겨 보세요" |
| 6줄 달 | 줄 수는 달마다 4~6 | `year={2026} month={10}`(2026년 11월, 6줄), 빈 값, `todayKey` 는 이 달 밖 |

`OpenDot` 은 이 페이지 "구성" 아래에 단독 미리보기 하나(`<OpenDot /> 근무 중`)로 보인다. 별도 페이지는 두지 않는다.

> 선택 표시 (2026-09-25 사용자 요청 "선택 시 파란 라인 제거", 2026-10-15 디자인 B): 색 테두리 없이 진한 바탕 `bg-foreground text-background` + 날짜 숫자 `font-bold`, 칸 안 표시도 바탕색으로 뒤집는다. 휴가·대타 점선은 선택돼도 남고, 키보드 `focus-visible` 바깥 선은 그대로다. 오늘은 `border-accent ring-1 ring-inset ring-accent` + 숫자 `text-accent font-bold`.
>
> 칸 본문 글자는 `text-foreground`(시간)·`text-muted`(휴가 글자)로 칠한다. 선택 칸이 이 두 색 이름을 찾아 바탕색으로 뒤집기 때문이다.

**사용 규칙**: [달력 명세 §3 월 격자](calendar.md#3-월-격자) (치수·칸 배치·상태 표), [§7 접근성](calendar.md#7-접근성), [스킬 §4 달력](../../.claude/skills/timesheet-ui/SKILL.md#4-달력).

**하지 말 것**
- `body` 에 긴 글자(`4시간 30분`)를 넣지 않는다 — `compactHours` 로 줄이고 정확한 값은 `label` 에 둔다.
- `label` 을 날짜만으로 두지 않는다 — 칸 내용이 `aria-hidden` 이라 `label` 이 유일한 읽는 글자다.
- 오늘 칸을 accent 로 채우지 않는다 — 채우는 것은 선택(진한 바탕)이다 ([달력 명세 §8](calendar.md#8-다크-모드--새-토큰-없음)).
- 선택 칸에 색 테두리(`border-accent` 등)를 넣지 않는다. 포커스 바깥 선(`focus-visible`)을 지우지 않는다.
- 칸 본문 글자를 `text-foreground`·`text-muted` 밖의 색으로 칠하지 않는다 — 선택 칸에서 뒤집히지 않아 진한 바탕 위에서 안 보인다.

**API 레퍼런스**

`MonthGrid`

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `year` | `number` | — | **필수** |
| `month` | `number` | — | **필수** 0~11 |
| `todayKey` | `string` | — | **필수** `YYYY-MM-DD` (`dayKey`) |
| `selectedKey` | `string \| null` | — | **필수** 선택한 날 |
| `onSelect` | `(key: string) => void` | — | **필수** 칸을 누르면 그 날 키 |
| `busy` | `boolean` | `false` | `aria-busy`, 칸 내용·표시 대신 막대 |
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
│  ├─ TriangleAlert 12px text-warn + "퇴근 기록 없음"
│  ├─ Hourglass 12px text-caution + "요청 대기"
│  └─ 점선 상자 12×10 rounded-[2px] + "휴가·대타"(member) / "쉰 사람 있음"(master)
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

**설명**: 멤버 기록 탭의 달력·목록 전환. 회색 바탕 위 두 칸짜리 눌림 버튼 묶음이고, 선택한 칸만 흰 바탕과 굵은 글자로 떠오른다 (2026-10-15 디자인 B).

**import**: `import { ViewToggle } from "@/components/calendar/ViewToggle";`

**사용법**

```tsx
const [view, setView] = useState<"calendar" | "list">("calendar");
<ViewToggle value={view} onChange={setView} />
```

**구성**

```
ViewToggle  <div role="group" aria-label="보기", grid 두 칸 같은 폭, rounded-xl(6px) bg-line/60 p-0.5>
└─ <button aria-pressed> × 2  h-10 rounded-md(4px) text-[13px]
   │  선택: bg-surface font-semibold text-foreground shadow-sm / 아님: font-medium text-muted
   ├─ Icon 15px (CalendarDays / List), 선 2.2 선택 / 1.8
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

**설명**: 월 급여 요약 카드와 주별 내역 카드. 큰 급여 숫자는 강조색이고, 바뀔 때 숫자가 올라가며 바뀐다 (2026-10-15 디자인 B). 멤버 급여 탭과 마스터 멤버 상세가 같이 쓴다. 계산은 `lib/pay.ts` 가 하고 이 컴포넌트는 보여주기만 한다.

**import**: `import { DotRow, PayView, PayViewSkeleton, holidayStatus, holidayTone } from "@/components/PayView";`

**사용법**

```tsx
<PayView shifts={shifts} settings={settings} year={2026} month={8} now={now} />
```

**구성**

```
PayView  <Enter space-y-3>   카드가 차례로 나타난다(마운트될 때 한 번 — 불러오는 동안은 PayViewSkeleton 이 그려지므로 불러오기가 끝나면 다시 나타난다)
├─ 요약 Card
│  ├─ SectionLabel PiggyBank "예상 급여 (세전)"
│  ├─ 총액 <p text-[30px] font-semibold text-accent NUM> <CountUp value={total} format={won} />
│  ├─ <dl text-[13px]> DotRow × 기본급(시간) · 주휴수당 · 휴가수당(있을 때만) · 연장 가산(시간)
│  │     금액이 0원인 줄은 muted
│  └─ 안내 글자 text-xs (합산 기준·미반영 항목)
├─ 빈 달 글자 "이 달 기록이 없어요." (주가 0개일 때)
└─ WeekCard (내부) × 주
   ├─ SectionLabel CalendarDays "10/13 (월) ~ 10/19 (일)" 오른쪽 = 주 합계
   ├─ <dl> DotRow × 근무 · 기본급 · 휴가수당(있을 때) · 주휴수당 · holidayStatus · 연장(5인 미만 표시)
   │     주휴 상태 글자색 holidayTone: 개근 text-ok, 진행 중 text-caution
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
| 점선 이음 줄 — DotRow | `DotRow` 단독. 0 인 줄은 `muted` | `시급` `won(10320)` · `근무` `hm(1110) · 5일` · `연장` `hm(0)`(muted). 계산한 금액은 넣지 않는다 |

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

`DotRow` — `이름 ··· 값` 한 줄. `<dl className="mt-2.5 grid gap-1.5 text-[13px]">` 안에 쌓는다. 점선은 줄의 `::after` 라 `dt`·`dd` 구조를 해치지 않는다.

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `term` | `React.ReactNode` | — | **필수** 왼쪽 이름(`dt`, muted) |
| `children` | `React.ReactNode` | — | **필수** 오른쪽 값(`dd`). 숫자면 `NUM` |
| `muted` | `boolean` | `false` | 값을 옅게(`font-medium text-muted`). 0원 줄. 아니면 `font-semibold` |

`PayViewSkeleton` — 기록·휴가를 읽는 동안의 자리. 요약 카드(값 3줄 + 안내 글자 그대로)와 주 카드(값 4줄)를 PayView 와 같은 틀·줄 높이에 `Bone` 으로, 전체를 `Loading` 으로 감싼다. 주 카드 수는 "일요일이 이 달에 있고 `now` 까지 시작한 주" 수. 휴가수당 줄·한도 경고는 없는 것으로 둔다.

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `year` | `number` | — | **필수** |
| `month` | `number` | — | **필수** 0~11 |
| `now` | `number` | — | **필수** 주 카드 수의 기준 시각 |

`holidayStatus(week: WeekPay, settings: PaySettings, now: number): string` — 주휴 상태 글자. 결과는 `대상 아님 (주 15시간 미만)` · `개근` · `대상 아님 (그 주 전부 휴가)` · `진행 중 (n/m일)` · `미충족 (n/m일)` 중 하나.

`holidayTone(status: string): string` — 주휴 상태 글자의 색 클래스. `개근` → `text-ok`, `진행 중 …` → `text-caution`, 그 밖은 `""`. 색은 보조라 글자와 함께만 쓴다. Today Dashboard 03 이번 주도 쓴다.

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

**설명**: 멤버 출퇴근 탭의 시계 카드. 왼쪽 정렬로 날짜와 상태 태그를 한 줄에 두고, 그 아래 강조색 한 줄 시계(40px), 상태 설명, 출근·퇴근 버튼(h-11 `BTN`)을 둔다 (2026-10-15 디자인 B). 퇴근한 뒤에는 `Scene` 장면이 든 완료 상자가 나타난다. API 를 부르지 않는 표시 컴포넌트다.

**import**: `import { ClockCard, type ClockState } from "@/components/TodayDashboard";`

**사용법**

```tsx
<ClockCard now={now} minuteNow={minuteNow} state={state} busy={busy} error={error} onPunch={punch} onRetry={reload} />
```

**구성**: [오늘 근무 대시보드 명세 §2-1](member-today.md#2-1-구성-왼쪽-정렬-card) 트리 그대로. 요약하면 아래와 같다.

```
ClockCard  Card (왼쪽 정렬)
├─ 머리 줄  <div flex min-h-6 justify-between>  날짜 text-xs font-semibold text-muted NUM · 상태 태그
│     상태 태그 <p role="status" h-6 rounded-md border text-xs font-semibold> 아이콘 12px + SwapText 상태 이름 (off 만 점선)
├─ 시계  <p mt-2 text-[40px] font-semibold leading-none text-accent NUM whitespace-nowrap>
├─ 상태 설명  <p mt-2.5 text-[13px] text-muted NUM> (있을 때)
├─ 버튼  BTN.primary(working·done·before — before 만 bg-accent) / BTN.secondary(off·error) + mt-3.5 w-full, h-11
├─ 완료 상자 (내부 DoneBox, done 만)  점선 상자 + Scene sm(House · Moon · Sparkle) + "수고했어요" + 내일 안내, useAppear
├─ 쉬는 날 안내 (off 만) · 오류 ErrorText (error 가 있을 때)
loading: 태그 자리 Bone h-6 w-[68px] rounded-md, 버튼 자리 Bone h-11 rounded-xl
```

상태별 태그·설명·버튼은 [§2-3](member-today.md#2-3-네-상태-td-1--색만으로-구별하지-않는다)·[§2-4](member-today.md#2-4-로딩오류).

**예시 공통 가짜 데이터** — `_examples/today-dashboard/demo-data.tsx` 하나를 Today Dashboard 예시와 같이 쓴다. 값은 [명세 §5-5](member-today.md#5-5-컴포넌트-가이드에-넣을-것-guide) 그대로: `now = new Date(2026, 8, 25, 14, 32, 7).getTime()`(금), `minuteNow = toMinute(now)`, `settings = { hourlyWage: 10320, weeklyHours: 20, workDaysPerWeek: 5, fivePlus: false }`, 기록 `DEMO_SHIFTS`(`s1`~`s4`), 기본 absence `{ date: "2026-09-24", kind: "substitution" }`. `onPunch`·`onRetry` 는 아무것도 안 하는 함수.

| 예시 (H2) | 설명 | `state` |
|---|---|---|
| Basic (출근 전) | 강조색 바탕 `출근` | `{ kind: "before" }` |
| 근무 중 | 초록 점 + `퇴근` | `{ kind: "working", open: s4 }` → `오후 01:30 출근 · 지금까지 1시간 2분` |
| 근무 중 — 어제 출근 | 날짜가 붙는 설명 | `open = { id: "x", start: 9/24 22:00, end: null }` → `9. 24. 오후 10:00 출근 · 지금까지 16시간 32분` |
| 오늘 퇴근함 | 비활성 `출근` + 완료 상자(Scene) | `{ kind: "done", lastEnd: 9/25 18:05 }` |
| 오늘 휴가 | 점선 태그, 유급 문구, 선 버튼 `출근` | `{ kind: "off", absence: "paid_leave" }` |
| 오늘 대타 | 점선 태그, 대타 문구 | `{ kind: "off", absence: "substitution" }` |
| 불러오는 중 | 태그·버튼 자리에 같은 크기 막대 — 출근 전과 높이가 같다 | `{ kind: "loading" }` |
| 불러오기 실패 | `다시 불러오기` | `{ kind: "error" }` |
| 저장 실패 | 버튼 아래 오류 글자 | `before` + `error="저장하지 못했어요. 다시 시도해 주세요."` |
| 320px 한 줄 | 좁은 폭에서도 시계가 한 줄 | 래퍼 `w-[320px] px-5`(카드 280px, 안쪽 240px), `before` |

**접근성**: 상태는 아이콘 모양 + 상태 이름 + 버튼 글자로 구별하고 휴가·대타는 점선 테두리까지 — 색은 보조. 상태 태그 `role="status"`, 불러오는 중에는 `Loading` 이 `상태 확인 중` 을 읽는다. 시계에는 live 영역 없음. 아이콘은 전부 `aria-hidden`. ([명세 §7](member-today.md#7-접근성-요약))

**사용 규칙**: [오늘 근무 대시보드 명세 §2](member-today.md#2-시계-카드--clockcard-t-1), [PRD 12](../prd/12-member-today.md).

**하지 말 것**
- 경과 시간을 `now`(1초)로 계산하지 않는다 — `minuteNow` 를 넘긴다.
- 시계 글자에 `aria-live` 를 걸지 않는다.
- 상태 태그에 색 바탕을 쓰지 않는다 ([명세 §8](member-today.md#8-다크-모드와-색--새-토큰-없음)).
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

`ClockCardSkeleton()` — props 없음. 로그인 확인 전 첫 화면용: loading 모양에 날짜(`h-3` 막대)·시계(`h-10` 칸 안 `h-9` 막대) 글자까지 막대. 크기는 loading 과 같다(머리 줄 h-6 · 시계 줄 40px · 버튼 h-11). 서버 렌더되는 자리라 시각을 그리지 않는다(hydration).

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
구역마다 px-4 py-3.5. 구역 머리는 SectionLabel, 번호 01~04 는 aria-hidden 장식
├─ 01 오늘  SectionLabel Clock, 오른쪽 = 합계. <ul text-[13px] NUM 점선 나눔> 오늘 출근한 기록 × 행 (없으면 안내 한 줄)
├─ 02 처리할 것  (0건이면 구역째 없음) SectionLabel Bell, 오른쪽 = 건수.
│     TodoRow (내부) <button min-h-11 rounded-xl border-l-[3px] border-caution bg-caution/10> × 2
├─ 03 이번 주  SectionLabel CalendarDays, 오른쪽 = 기간. <dl text-[13px]> DotRow 근무 시간 · ProgressBar · DotRow 근무한 날 · DotRow 주휴수당(holidayTone 색)
└─ 04 이번 달  <button min-h-11> PiggyBank "04 {월}월 예상 급여 (세전)"(SectionLabel 모양) + 금액 text-[22px] font-semibold text-accent NUM <CountUp> + "급여 탭에서 자세히" text-accent
status 가 loading 이면 같은 구역 틀에 막대(TodayDashboardSkeleton — 값은 줄 안 inline-block h-3.5, 04 금액은 27.5px 칸 안 h-6), error 면 구역 없이 오류 + 다시 불러오기(BTN.secondary)
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

**접근성**: 구역 `h2` 셋(오늘·처리할 것·이번 주 — `SectionLabel`, 번호는 `aria-hidden` 이라 이름만 읽힌다), 04 이번 달은 구역 전체가 버튼이라 버튼 이름으로 읽힌다. 처리할 것 행은 `sr-only` ` — 요청 탭에서 보기`. 누르는 곳 44px 이상. 아이콘 전부 `aria-hidden`. 390px 가로 스크롤 없음. ([명세 §7](member-today.md#7-접근성-요약))

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

**설명**: 화면 위 모달. 사장 화면 멤버 카드 "조건 수정" 이 쓴다 (2026-09-25 사용자 요청 "조건 수정은 모달로", shadcn Dialog 지정). 멤버 기록 탭의 빠진 기록 추가·수정·삭제 요청도 모달이다 (2026-10-15 "빠진기록 요청은 모달팝업으로" · "수정 요청도 마찬가지야" · "삭제도 마찬가지로"). 원본(`https://ui.shadcn.com/r/styles/base-nova/dialog.json`, `button.json`)을 그대로 두고 바깥 `className` 으로 맞춘다 — 타임시트 스킬 §0 "shadcn 컴포넌트를 들일 때".

**패키지**: `class-variance-authority`(Button), `tw-animate-css`(열고 닫힘 움직임) — 2026-09-25 사용자 승인 뒤 설치.

**맞춤**: `DialogContent` 에 `bg-surface p-5 sm:max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto`, `DialogFooter` 에 `-mx-5 -mb-5 flex-row border-line bg-transparent px-5 py-4`. 푸터 버튼은 `BTN.secondary`·`BTN.primary` 에 `flex-1` 을 더한다(h-11, 취소 회색 선 · 저장 진한 바탕 — §4-21). 옛 이름 `ACT_CANCEL`·`ACT_SAVE` 도 같은 값이다. 원본의 `bg-muted` 는 우리 `muted`(글자색)와 이름이 겹쳐 잇지 않고 덮는다.

| 예시 (H2) | 설명 |
|---|---|
| Basic | 작은 "조건 수정" 버튼(`BTN.small`)으로 열고, 시급 입력칸(천 단위 쉼표) + 취소·저장 |
| 기록 수정 요청 모달 | `RecordsPanel.tsx` 의 `RequestDialog`(내부)와 같은 틀, 보내기만 뺐다. `수정 요청`(`BTN.small`)·`삭제 요청`(`BTN.danger`)·`빠진 기록 추가 요청`(`BTN.dashed` 전체 폭)으로 연다. 머리는 `DialogTitle` + `DialogDescription`, 폼은 바른 출근·바른 퇴근·사유(삭제는 사유만), 아래 `취소` · `요청 보내기`(`BTN.secondary`·`BTN.primary` + `flex-1`). 닫으면 폼 상태를 지운다 |

---

### 4-20. `skeleton` — Skeleton

**설명**: 불러오는 동안 불러온 뒤와 **같은 크기**로 자리를 잡는 막대. layout shift 없음 (2026-09-25 사용자 요청 "모든 디자인에 layout shift 없도록 원래 사이즈에서 스켈레톤", shadcn Skeleton 지정). 원본(`https://ui.shadcn.com/r/styles/base-nova/skeleton.json`)은 그대로, 앱은 `Bone`(바탕 `bg-line` — 원본 `bg-muted` 는 우리 쪽 글자색)과 `Loading`(aria-busy + sr-only "불러오는 중")을 쓴다.

**크기 규칙**: 같은 틀(Card·padding·gap)에 글자 줄은 줄 높이 칸(`text-xs` h-4, `text-sm` h-5, `text-base` h-6, `text-lg·xl` h-7, `text-2xl` h-8) 안에 막대. 버튼·입력칸은 같은 높이·모서리. 개수가 바뀌는 목록은 흔한 개수(2~3행). 데이터와 무관한 고정 글자(구역 이름·안내문)는 글자 그대로 둔다 — 줄바꿈까지 같아진다.

**화면별 스켈레톤 위치**: 멤버 — `TodayDashboard.tsx`(`ClockCardSkeleton`·`TodayDashboardSkeleton`), `PayView.tsx`(`PayViewSkeleton`), `member/*`. 사장 — `web/src/app/admin/_skeletons.tsx`. 로그인 확인 전 셸 — `shell.tsx` `HeaderSkeleton`·`BottomNavSkeleton`. `HeaderSkeleton` 은 `AppHeader` 와 같은 한 줄이다 — 매장 이름 막대와 화면 이름 막대를 나란히, 오른쪽에 아바타 sm 자리.

| 예시 (H2) | 설명 |
|---|---|
| Basic | 불러온 카드와 스켈레톤 카드를 나란히 — 높이가 같다 |

---

### 4-21. `button` — Button

**설명**: 버튼 모양 상수 `BTN`. 컴포넌트가 아니라 클래스 묶음이라 `<button>`·`<a>` 에 그대로 붙인다. 색 테두리(파랑·빨강) 없이 주 동작은 진한 바탕, 보통 동작은 가는 선, 추가는 점선으로 나눈다 (2026-09-25 "버튼 디자인이 너무 촌스럽다 파랑 빨강. 모던하게", 2026-10-15 디자인 B). 디자인 B 의 `buttons` 페이지를 이 페이지로 합쳤다.

**파일·import**: `BTN` 은 `web/src/components/styles.ts` 에 있고 `ui.tsx` 가 다시 내보낸다. 옛 이름은 `web/src/components/buttons.ts`.

```tsx
import { BTN } from "@/components/ui";
```

**사용법**

```tsx
<button className={BTN.primary}>출근하기</button>
<button className={`${BTN.secondary} w-full`}>매장 만들기</button>
```

**구성** — 다섯 모양 모두 `inline-flex items-center justify-center rounded-xl`(6px) 이 바탕. 폭·바깥 여백은 쓰는 쪽에서 더한다.

| 키 | 높이 | 모양 | 쓰는 곳 |
|---|---|---|---|
| `primary` | 44px `h-11` | `bg-foreground` + `text-background`, 15px 굵게. 꺼지면 `bg-line` + `text-muted` | 한 화면의 주 동작 하나 |
| `secondary` | 44px `h-11` | `border-line` 가는 선 + `bg-surface`, 14px | 보조 동작 |
| `small` | 32px `h-8` | secondary 와 같은 선, 12px | 목록 행·카드 안 동작 |
| `dashed` | 44px `h-11` | 점선 `border-muted/60`, `text-muted` | 더하는 동작(휴가 추가·멤버 초대) |
| `danger` | 32px `h-8` | small 과 같고, 마우스를 올리면 선·글자가 `warn` | 삭제·퇴사처리·초대 취소 |

주 색은 `foreground` 라 라이트에서 검정, 다크에서 흰색이다.

**옛 이름** — 2026-09-25 에 shadcn `buttonVariants` 위에 만든 이름이다. 지금은 `BTN` 의 별칭이라 모양이 같고, 새 코드는 `BTN` 을 쓴다. 2026-09-25 결정 가운데 "색 테두리 없음·주 동작 검정·지우기는 올리면 빨강" 은 그대로이고, "보통 동작 회색 채움" 만 디자인 B 의 회색 선으로 바뀌었다. 높이도 `BTN` 을 따른다 — `ACT_*` 는 h-9 에서, `BLOCK_*` 는 h-12 에서 h-11 이 됐다.

| 옛 이름 | 같은 값 | 쓰는 곳 |
|---|---|---|
| `BTN_ACCENT` | `BTN.small` | 카드 안 작은 보통 동작 — 조건 수정·근무 기록·수정·복사 |
| `BTN_WARN` | `BTN.danger` | 카드 안 작은 지우기 — 삭제·퇴사처리·초대 취소 |
| `ACT_SAVE` · `ACT_CANCEL` | `BTN.primary` · `BTN.secondary` + `flex-1` | 폼 아래 나란히 놓는 저장·취소 |
| `BLOCK_PRIMARY` · `BLOCK_SECONDARY` | `BTN.primary` · `BTN.secondary` + `w-full` | 한 줄을 다 쓰는 주 동작·보조 동작 |

예외: 멤버 출퇴근 카드의 출근·퇴근 큰 버튼과 50m 배너는 상태를 색으로도 구별하므로 [member-today](member-today.md) §2-3 그대로.

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 다섯 모양 | `출근하기` `취소` `수정` `휴가 추가` `삭제` |
| 아이콘과 함께 | 글자 앞 lucide 아이콘 `aria-hidden` | `LogIn` 로그인 · `Plus` 멤버 초대 · `Trash2` 삭제 |
| 전체 폭 | `w-full` 덧붙이기 | `코드 등록`(primary) · `매장 만들기`(secondary) |
| 꺼진 상태 | `disabled` | `저장 중…` · `취소` · `수정` |

**하지 말 것**
- 버튼마다 `rounded-*`·`h-*`·색을 새로 쓰지 않는다. 모양이 더 필요하면 `BTN` 에 추가를 요청한다.
- 버튼에 Tailwind `transition`·`transition-colors` 를 붙이지 않는다 — 누름 전환이 덮인다(테스트가 막는다).
- 한 화면에 `BTN.primary` 를 여러 개 두지 않는다.
- 아이콘만 있는 버튼은 `IconButton`.
- 새 코드에 옛 이름을 쓰지 않는다.

**API 레퍼런스**: `BTN` 은 `as const` 객체 `{ primary, secondary, small, dashed, danger }` — 값은 모두 `string`(클래스). 옛 이름 6개도 `string` 이다.

---

### 4-22. `section-label` — Section Label

**설명**: 카드 안 구역의 머리. 작은 회색 글자 앞에 lucide 아이콘(15px)과 번호를 두고, 오른쪽에 요약 값을 둔다.

**import**: `import { SectionLabel } from "@/components/ui";`

**사용법**: `<SectionLabel icon={Clock}>오늘 근무</SectionLabel>`

**구성**

```
SectionLabel  <div flex justify-between text-xs font-semibold text-muted>
├─ 제목  <{as} flex items-center gap-1.5>   as 기본 h2
│  ├─ Icon 15px, 선 1.75, aria-hidden (icon 있을 때)
│  ├─ 번호  <span NUM text-muted/70> (index 있을 때)
│  └─ 글자  <span 한 줄 자름>{children}</span>
└─ 오른쪽 값  <span shrink-0 NUM> (right 있을 때)
```

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 아이콘 + 글자 | `icon={Clock}` `오늘 근무` |
| 번호와 오른쪽 값 | `index`·`right` | `ClipboardList` `01` `보낸 요청` 오른쪽 `3건` · `Wallet` `02` `예상 급여` 오른쪽 `9월` |
| 글자만 | 아이콘 없이, `as="h3"` | `지금 근무 중` 오른쪽 `2명` |
| 카드 안 | §4-7 "구역 나누기" 와 같은 예시 | `card/sections` |

**하지 말 것**
- 구역 아이콘을 lucide 밖에서 가져오지 않는다. 크기·굵기를 바꾸지 않는다 — 컴포넌트가 15px·1.75 로 정한다.
- 화면 제목 자리에 쓰지 않는다. 화면 이름은 `AppHeader` 가 가진다.
- `right` 에 긴 문장을 넣지 않는다 — 줄어들지 않아 제목 글자가 잘린다.

**API 레퍼런스**

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `children` | `React.ReactNode` | — | **필수** 구역 이름. 한 줄에서 자른다 |
| `icon` | `LucideIcon` | — | 앞에 붙는 아이콘(15px, 선 1.75) |
| `index` | `string` | — | 구역 번호(예 `"01"`). 옅은 고정폭 숫자 |
| `right` | `React.ReactNode` | — | 오른쪽 요약 값. 고정폭 숫자 |
| `as` | `"h2" \| "h3" \| "p"` | `"h2"` | 제목 태그 |

---

### 4-23. `scene` — Scene

**설명**: lucide 아이콘을 엮은 작은 장면 그림. 옅은 강조색 원 안에 주인공 아이콘 하나, 둘레에 소품 1~2개. 사람 그림 없이 사물로 뜻을 보인다. 빈 상태 `EmptyState` 도 이 페이지에 있다. 규칙은 §2-7.

**import**: `import { EmptyState, Scene } from "@/components/illust";`

**사용법**: `<Scene icon={Clock} accents={[{ icon: Coffee, at: "br" }, { icon: Sun, at: "tl" }]} />`

**구성**

```
Scene  <div aria-hidden relative, md 96×72 / sm 60×56>
├─ 원  <span rounded-full border-accent/20 bg-accent/10 text-accent, 가운데, md 64px / sm 44px>
│  └─ icon  md 30px / sm 22px, 선 1.5
└─ 소품  <span absolute text-muted, at 자리(tl·tr·bl·br)> × accents
   └─ icon  md 16px / sm 13px, 선 1.5
EmptyState  <div grid justify-items-center px-4 py-6 text-center>
├─ Scene md
├─ title  <p mt-3 text-sm font-semibold>
└─ children  <div mt-1 text-xs text-muted> (있을 때)
```

처음 그릴 때 원이 6px 올라오며 나타나고(0.35초), 0.15초 뒤 소품이 0.08초 간격으로 커지며 튀어나온다. 모션 줄이기면 전체가 투명도만.

**예시**

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 출퇴근 장면 + `다시 보기`(key 바꿔 다시 그림) | `Clock`, 소품 `Coffee` br · `Sun` tl |
| 크기 | md · sm | `Inbox`, 소품 `Sparkles` tr |
| 빈 상태 — EmptyState | Card 안 | `CalendarDays`, 소품 `Moon` tr, 제목 `이 달 기록이 없어요`, 설명 `출근을 누르면 여기에 근무가 쌓여요.` |

**하지 말 것**
- 사람·얼굴 아이콘(`User`, `Smile` 등)을 주인공으로 쓰지 않는다.
- 소품을 셋 이상 넣지 않는다.
- 장면에 읽을 내용을 담지 않는다 — `aria-hidden` 이다. 뜻은 옆 제목 글자가 가진다.
- 한 화면에 장면을 여러 개 두지 않는다.

**API 레퍼런스**

`Scene`

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `icon` | `LucideIcon` | — | **필수** 가운데 주인공(강조색) |
| `accents` | `Accent[]` | `[]` | 둘레 소품 1~2개 |
| `size` | `"md" \| "sm"` | `"md"` | md 원 64·아이콘 30 / sm 원 44·아이콘 22 |

`Accent` (타입): `icon: LucideIcon` **필수** 소품(`text-muted`) · `at: "tl" | "tr" | "bl" | "br"` **필수** 자리.

`EmptyState`

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `icon` | `LucideIcon` | — | **필수** 장면 주인공 |
| `accents` | `Accent[]` | — | 장면 소품 |
| `title` | `string` | — | **필수** 한 줄 제목 |
| `children` | `React.ReactNode` | — | 설명. 없으면 그리지 않는다 |

---

### 4-24. `motion` — Motion

**설명**: GSAP 로 만든 모션 4종. 화면 진입(`Enter`), 숫자 변화(`CountUp`), 글자 바뀜(`SwapText`), 완료 순간(`useAppear`)에만 쓴다. 규칙은 §2-6.

**import**: `import { CountUp, Enter, SwapText, useAppear } from "@/components/motion";`

**사용법**

```tsx
<Enter className="space-y-4">
  <Card>…</Card>
  <Card>…</Card>
</Enter>
```

**구성**

| 이름 | 움직임 | 모션 줄이기 |
|---|---|---|
| `Enter` | 바로 아래 자식들이 8px 아래에서 차례로. 0.32초, 0.06초 간격. 끝나면 인라인 스타일을 지운다 | 투명도만 0.2초 |
| `CountUp` | 이전 값(처음은 0)에서 새 값까지 0.6초. React 가 그린 글자 노드의 값만 바꾼다 | 새 값을 바로 |
| `SwapText` | 새 글자가 아래(100%)에서 올라온다. 0.22초. 처음 그릴 때는 움직이지 않는다 | 투명도만 0.2초 |
| `useAppear` | ref 를 붙인 요소가 마운트될 때 10px 아래에서. 0.35초 | 투명도만 0.2초 |

곡선은 모두 `EASE`(`power2.out`). 그리기 전에 시작 상태를 잡아(`useLayoutEffect`) 첫 장면이 깜빡이지 않는다.

**예시** — 모든 예시에 다시 움직여 볼 버튼을 둔다.

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic — Enter | 카드 3장이 차례로, `다시 보기` 로 `replay` 를 바꿈 | `오늘 근무` `이번 주 합계` `예상 급여` |
| 숫자 변화 — CountUp | `9월`/`10월` 버튼으로 값 바꿈, `format={won}`, 큰 숫자 `text-accent` + `NUM` | `190920` ↔ `247680` |
| 글자 바뀜 — SwapText | 버튼으로 상태 전환 | `근무 중` ↔ `퇴근함` |
| 완료 순간 — useAppear | `저장` 을 누르면 완료 상자가 나타남 | `CircleCheck` + `저장했어요` |

**하지 말 것**
- 탭 전환·목록 스크롤처럼 자주 보는 곳에 걸지 않는다.
- 화면 코드에서 `gsap` 을 직접 부르지 않는다. 새 모션은 `motion.tsx` 에 추가를 요청한다 — 모션 줄이기 처리가 한 곳에 모여 있다.
- `Enter` 안에 자식을 하나만 두면 차례 등장이 없다.
- `CountUp` 의 `format` 안에서 금액을 계산하지 않는다 (`lib/pay.ts`).

**API 레퍼런스**

| 이름 | Props | 설명 |
|---|---|---|
| `Enter` | `children` **필수**, `className?: string`, `replay?: unknown` | `replay` 가 바뀌면 다시 한다 |
| `CountUp` | `value: number` **필수**, `format: (n: number) => string` **필수**, `className?: string` | 움직이는 동안 `format` 에 반올림한 정수가 들어온다 |
| `SwapText` | `text: string` **필수**, `className?: string` | 바깥 `span`(`inline-flex overflow-hidden`)의 클래스 |
| `useAppear<T extends HTMLElement>()` | — | ref 객체를 돌려준다. 붙인 요소가 마운트될 때 한 번 |
| `EASE` | — | `"power2.out"` |
| `reducedMotion()` | — | 모션 줄이기면 `true`, 서버에서는 `false` |

---

### 4-25. `work-terms-charts` — Work Terms Charts

**설명**: 내 정보 탭 근무 조건 카드의 그림 셋 — 주간 리듬 카드(`WeekRhythm`), 주 시간 게이지(`WeeklyHoursGauge`), 근무일 점(`WorkDayDots`) (2026-10-15 사용자 요청 "이 데이터는 그래프로 그려줘"). 주간 리듬 카드는 "근무 시간표가 재미 없다, 더 창의적으로" 요청에 사용자가 고른 모양이다. Recharts 3.10.1 은 게이지에만 쓴다.

**import**: `import { WeekRhythm, WeeklyHoursGauge, WorkDayDots } from "@/components/member/WorkTermsCharts";`

**사용법**

```tsx
<WeekRhythm schedule={schedule} exceptions={exceptions} now={now} />
<WeeklyHoursGauge hours={20} />
<WorkDayDots schedule={schedule} count={5} />
```

구역 이름과 값 글자(`근무 시간표` · `월·화·수·목·금 10:00~14:00`)는 부르는 쪽이 그림 위에 둔다(`TimesheetApp.tsx` 내 정보 탭).

**구성**

```
WeekRhythm  <div>
├─ 위 줄 <p role="status" text-[13px]>  nextShift() 결과로 셋 중 하나
│  ├─ 근무 중: 초록 점 + "지금 근무 시간이에요 · 14:00 까지"
│  ├─ 다음 근무: CalendarClock + "다음 근무까지 1일 19시간 (토 09:00)" (남은 시간 text-accent NUM, untilText)
│  └─ 없음: "정해진 근무가 없어요" (14일 안에 근무가 없을 때)
└─ <ol grid-cols-7 gap-1>  이번 주 월~일 카드 × 7, <li aria-label="목요일 (오늘) 10:00~14:00 근무 4시간">
   ├─ 근무일: rounded-xl border-accent/25 bg-accent/10, 요일 · Sun 16px text-accent · "10-14" · "4h" (10px NUM)
   ├─ 쉬는 날: border-dashed border-line, 요일 · Sofa 16px text-muted · "쉼"
   ├─ 오늘: ring-2 ring-accent, 요일 글자 font-bold text-accent, aria-current="date"
   └─ 지난 요일: opacity-55
   그날 근무 = dayPlan() — 날짜별 근무 변경(DayException)이 시간표보다 먼저
   카드는 왼쪽부터 0.04초 간격으로 6px 올라오며 나타난다(0.3초, GSAP). 모션 줄이기면 투명도만
WeeklyHoursGauge  <figure> figcaption sr-only + <div aria-hidden h-[52px]> Recharts 막대 하나
   0~max(40, hours), 눈금 0h·15h·40h, 기준선 점선 "주휴 15h"·"법정 40h", 막대 text-accent 12px, 트랙 currentColor 15%
   움직임 0.4초 ease-out(Recharts 기본 1.5초를 줄임), 모션 줄이기면 끔
WorkDayDots  <div role="img" aria-label="1주 소정근로일수 5일 (월·화·수·목·금)">
   월~일 점 14px — 근무일 border-accent bg-accent / 아님 border-muted/40, 요일 글자는 schedule 이 있을 때만
```

색은 토큰만 쓴다. SVG 속성에는 `var()` 를 쓰지 않고 `currentColor` 로 받는다. 한 사람의 값이라 범례가 없다.

**예시** — 기준 시각 `new Date(2026, 9, 15, 13, 48).getTime()`(목 13:48) 고정. 공통 틀은 `_examples/work-terms-charts/terms.tsx`.

| 예시 (H2) | 설명 | 가짜 데이터 |
|---|---|---|
| Basic | 지금 근무 시간 | 월~금 10:00~14:00, 주 20시간 · 5일 → `지금 근무 시간이에요 · 14:00 까지` |
| 주 15시간 미만 | 게이지가 15h 기준선 앞에서 멈춘다 | 화·목·토 09:00~13:30, 주 13.5시간 · 3일 → `다음 근무까지 1일 19시간 (토 09:00)` |
| 날짜별 근무 변경 | 변경이 시간표보다 먼저 | Basic + `2026-10-16` off · `2026-10-18` work 11:00~15:00, 기준 시각 목 15:00 → `다음 근무까지 2일 20시간 (일 11:00)` |
| 시간표 없음 | 7일 모두 `쉼`, 근무일 점은 앞에서부터 | `schedule: null`, 주 15시간 · 3일 → `정해진 근무가 없어요` |

**접근성**: 주간 리듬 카드는 요일마다 `aria-label`, 카드 안 글자·아이콘은 `aria-hidden`, 위 줄은 `role="status"`. 게이지는 `figcaption`(sr-only), 근무일 점은 `role="img"` + `aria-label`. 같은 값이 그림 위 글자로도 보인다.

**하지 말 것**
- 카드·막대·점에 토큰 밖 색을 쓰지 않는다 — 다크 모드에서 바뀌지 않는다.
- 범례를 붙이지 않는다.
- 예시에서 `now` 를 `Date.now()` 로 두지 않는다 (§1-5).

**API 레퍼런스**

| 컴포넌트 | Prop | Type | 설명 |
|---|---|---|---|
| `WeekRhythm` | `schedule` | `Schedule \| null` (`{ days: number[]; start: string; end: string }`) | **필수** `days` 0(일)~6(토), 시각 `HH:MM` |
| | `exceptions` | `DayException[]` (`{ date: "YYYY-MM-DD"; kind: "off" \| "work"; start: string \| null; end: string \| null }`) | **필수** 날짜별 근무 변경 |
| | `now` | `number` | **필수** 기준 시각(ms) — 이번 주·오늘·다음 근무 |
| `WeeklyHoursGauge` | `hours` | `number` | **필수** 1주 소정근로시간. 40 이 넘으면 축 끝이 늘어난다 |
| `WorkDayDots` | `schedule` | `Schedule \| null` | **필수** 있으면 그 요일을 채우고 요일 글자를 단다 |
| | `count` | `number` | **필수** 1주 소정근로일수. `schedule` 이 없을 때 앞에서부터 이만큼 |

`dayPlan`·`nextShift`·`untilText` 는 `@/lib/schedule`(단위 테스트 있음).

---

## 5. 개발팀 전달 요점

1. 페이지 25개 + `/guide` + `/guide/foundations`. slug·순서·묶음은 §1-3 표 그대로.
2. 페이지 틀은 §1-4 의 9절 순서. 예시 이름이 곧 H2.
3. 미리보기는 실제 컴포넌트를 import 한다. 가이드용 복제 컴포넌트를 만들지 않는다.
4. `BottomNav`·`AppHeader` 미리보기는 `transform` 틀 안에 넣는다 (§1-5).
5. 날짜·시각은 예시마다 고정값. `useMonthCursor`·`Date.now()` 를 예시에 쓰지 않는다.
6. 다크 모드 전환 버튼은 두지 않는다. 다크 값은 기초 페이지 견본으로만.
7. 예시 데이터는 이 문서의 가짜 이름·id 만.
8. 규칙 본문은 스킬·달력 명세 링크로 걸고 복제하지 않는다.