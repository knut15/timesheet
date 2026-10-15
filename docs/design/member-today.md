# 멤버 출퇴근 탭 — 오늘 근무 대시보드 명세

[디자인 문서](README.md) · 요구사항 [PRD 12](../prd/12-member-today.md) · 작업 카드 [TS-004](../team/tasks/TS-004-member-today.md) · 셸 규칙 [timesheet-ui 스킬](../../.claude/skills/timesheet-ui/SKILL.md) · [컴포넌트 가이드 명세](component-guide.md) · [근무 달력 명세](calendar.md)

멤버 첫 화면(출퇴근 탭)에서 **오늘 근무를 한눈에** 보게 하는 화면·상태 명세다. 구현은 이 문서대로 한다.
따를 시안이 없어 기존 토큰·컴포넌트·달력의 상태 표시 방식 위에서 정했다 (2026-09-25).

- 사용자 결정(2026-09-25): 대시보드는 출퇴근 탭의 **시계(현재 시각) 바로 아래**. 시계는 한 줄 `HH:MM:SS`.
- 새 계산은 없다. 이번 주·이번 달 숫자는 전부 `web/src/lib/pay.ts` 가 낸 값이다 (TD-3).
- 새 색 토큰은 없다 (§8).
- 모양은 2026-10-15 B 시안으로 바꿨다. 1px 선, 작은 모서리, 고정폭 숫자(`NUM`), 구역 머리 `SectionLabel`, 점선 이음 줄 `DotRow`, `BTN` 버튼, GSAP 모션(`Enter`·`CountUp`·`SwapText`·`useAppear`)을 쓴다. 기준 값은 [DESIGN.md §3~§5](../../DESIGN.md). 상태 판정, 문구, 누를 수 있는 것과 그 동작은 2026-09-25 결정 그대로다.

---

## 1. 화면 순서 — 위에서 아래

| 순서 | 블록 | PRD | 조건 |
|---|---|---|---|
| 0 | 헤더 `AppHeader` (제목 `출퇴근`) | — | 항상 |
| 1 | 매장 50m 알림 배너 (지금 것 그대로) | T-6 | `geo.inside && !open` 일 때만 |
| 2 | **시계 카드 `ClockCard`** — 날짜, 시계, 지금 상태, 출근/퇴근 버튼 | T-1 | 항상 |
| 3 | **오늘 근무 카드 `TodayDashboard`** — 오늘 → 처리할 것 → 이번 주 → 이번 달 | T-2~T-5 | 항상 |
| 4 | 매장 근처 출근 알림 설정 카드 (지금 것 그대로) | T-6 | 항상 |

카드 사이 `space-y-3`(12px). B 시안의 카드 간격이다. 네 카드는 `Enter` 로 감싸 탭에 들어올 때 아래에서 차례로 올라오고, 기록을 다 읽어 `status` 가 바뀌면 한 번 더 올라온다.

### 1-1. 경계 — 시계 카드와 대시보드는 **다른 카드**

시계 카드 바로 다음에 대시보드 카드를 따로 둔다. 같은 카드로 합치지 않는다.

| 근거 | |
|---|---|
| 카드 안에 카드를 넣지 않는다 | 대시보드는 네 구역으로 나뉜다. 시계 카드에 넣으면 구역 구분이 카드 안 카드가 된다 ([가이드 §4-7](component-guide.md) "하지 말 것") |
| 시계 카드는 "지금 할 일" 한 가지 | 상태(T-1) 한 줄 + 버튼 하나. 여기만 보고 출근·퇴근을 누른다 |
| 가이드 예시로 따로 확인 | 로그인 화면이라 실화면 대신 가이드 예시로 검증한다(TS-004). 둘을 따로 두면 상태별 예시를 따로 만들 수 있다 |

**T-1(지금 상태)은 시계 카드 안, 시계 바로 아래**에 둔다. 상태와 그 상태에서 누를 버튼이 한 카드에 있어야 한다.

### 1-2. 대시보드 안 순서와 근거

| 순서 | 구역 | 왜 이 자리 |
|---|---|---|
| ① | 오늘 (T-2) | 첫 화면의 주제. 시계 카드의 상태와 바로 이어진다 |
| ② | 처리할 것 (T-5) | 유일하게 **응답이 필요한** 정보. 0건이면 구역째 숨으므로 평소에는 자리를 차지하지 않는다 |
| ③ | 이번 주 (T-3) | 주휴 판단은 주 단위 — 오늘 다음으로 가깝다 |
| ④ | 이번 달 (T-4) | 합계 한 줄 + 급여 탭 이동. 자세한 것은 급여 탭 |

### 1-3. 스크롤

390×844(iPhone 14) 기준 눈대중 높이 — 헤더 57 · 본문 위 여백 16 · 시계 카드 약 230 · 간격 16 · 대시보드(처리할 것 없음, 오늘 기록 2건) 약 330 = **약 650px**. 하단 내비(64 + 안전 영역 34)를 빼면 보이는 높이가 약 650~690px 이므로 **대시보드 끝까지 첫 화면에 들어오고, 알림 설정 카드만 아래로 밀린다.** 50m 배너가 뜨면(약 120px) 대시보드 아래쪽이 밀린다 — 배너는 출근하면 사라진다.
눈대중 값이다. 실제 높이는 구현 후 390px 화면에서 잰다(§11 미결).

---

## 2. 시계 카드 — `ClockCard` (T-1)

### 2-1. 구성 (왼쪽 정렬, `Card`)

```
Card
├─ 첫 줄       <div flex min-h-6 items-center justify-between>
│  ├─ 날짜      <p text-xs font-semibold text-muted NUM>     date(now) → "9월 25일 (금)"
│  └─ 상태 태그  <p h-6 rounded-md border … role="status">    아이콘 + 상태 이름 (§2-3)
├─ 시계        <p mt-2 text-[40px] font-semibold leading-none tracking-tight text-accent whitespace-nowrap NUM>  clockText(now) → "14:32:07"
├─ 상태 설명   <p mt-2.5 text-[13px] text-muted NUM>        (§2-3 표, 없으면 줄 없음)
├─ 버튼        <button BTN.* mt-3.5 w-full>  h-11            (§2-3 표)
├─ 퇴근 완료 상자 done 상태만 (§2-3)
├─ 쉬는 날 안내 <p mt-2 text-xs text-muted>                   off 상태만
└─ 오류        <div mt-3><ErrorText>                         저장 실패 글자 (지금 것 그대로)
```

- 시계는 강조색(`text-accent`)이다. 2026-10-15 "시계(시간) 급여는 포인트 컬러로" 결정이다.
- 상태 태그는 시계 위 첫 줄 오른쪽에 있다. 그래서 스크린리더는 날짜 → 상태 → 시계 순으로 읽는다(그 전에는 날짜 → 시계 → 상태). `role="status"` 는 그대로라 상태가 바뀌면 한 번 읽힌다.

### 2-2. 시계 — 한 줄 고정 (사용자 결정 2026-09-25)

- 형식은 `web/src/lib/format.ts` 의 `clockText` — 24시간 `HH:MM:SS` 숫자만. `15시 58분 12초` 처럼 글자를 섞지 않는다.
- **줄바꿈 금지**: `whitespace-nowrap` + `tabular-nums` + `font-mono`. 초가 바뀌어도 폭이 흔들리지 않는다.
- 폭 확인: 40px Geist Mono 8글자 ≈ 190px. 390px 폭 카드 안쪽은 316px(본문 350 − 카드 여백 32 − 테두리 2), 320px 폭 기기도 안쪽 246px 이라 한 줄에 들어간다.
- 1초마다 바뀐다(`useNow(1_000)`). 시계 글자에는 `aria-live` 를 걸지 않는다 — 스크린리더가 매초 읽게 된다.

### 2-3. 네 상태 (TD-1) — 색만으로 구별하지 않는다

상태마다 **아이콘 모양 · 상태 이름 글자 · 버튼 글자**가 모두 다르다. 휴가·대타는 여기에 태그의 **점선 테두리**가 더해진다 (달력과 같은 표시 — [스킬 §4](../../.claude/skills/timesheet-ui/SKILL.md#4-달력)).

| 상태 `kind` | 조건 (위에서부터 먼저 맞는 것) | 상태 태그 (아이콘 · 글자) | 상태 설명 | 버튼 |
|---|---|---|---|---|
| `working` 근무 중 | 퇴근 안 한 기록(`end === null`)이 있다 | `OpenDot`(초록 채운 점) · **근무 중** | `오전 09:02 출근 · 지금까지 5시간 30분` | **퇴근** — `BTN.primary`(진한 바탕) |
| `done` 오늘 퇴근함 | 오늘(`dayKey(start)` = 오늘) 기록이 있고 모두 퇴근했다 | `CircleCheck` `text-accent` · **오늘 퇴근함** | `오후 06:05 퇴근` (오늘 기록 중 가장 늦은 퇴근) | 비활성 **출근** `BTN.primary` 의 disabled 모양(`bg-line text-muted`) + 아래 퇴근 완료 상자. 다시 출근은 없다(PRD 12 T-7). 날짜가 바뀌면 before 로 돌아가 켜진다. 50m 배너·알림도 이날은 끈다 |
| `off` 오늘 휴가·대타 | 오늘 기록이 없고 오늘 날짜의 absence 가 있다 | `CalendarOff` `text-muted` · **오늘 휴가** / **오늘 대타** + 태그 테두리 `border-dashed border-muted` | 유급 `오늘은 유급 휴가예요` · 무급 `오늘은 무급 휴가예요` · 대타 `오늘은 동료가 대신 근무해요` | **출근** — `BTN.secondary`(회색 선) |
| `before` 출근 전 | 그 밖 | `CircleDashed` `text-muted` · **출근 전** | 없음 | **출근** — `BTN.primary` + `bg-accent text-on-accent` |

- 태그 공통: `inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-semibold text-foreground`. 테두리는 `border-muted/40`, off 만 `border-dashed border-muted`. 아이콘 12px(`OpenDot` 은 6px 점), `aria-hidden`.
- 태그 글자는 전부 `text-foreground` — 색을 바꾸는 것은 아이콘뿐이다. 색 바탕 알약(`bg-ok/15` 등)을 쓰지 않는 이유는 §8.
- 태그에 `role="status"`(= `aria-live="polite"`). 출근·퇴근을 누른 뒤 상태 이름이 바뀌면 한 번 읽힌다. 바뀔 때 새 글자가 아래에서 올라온다(`SwapText`, 0.22초).
- 버튼은 네 상태 모두 `h-11`(44px), `rounded-xl`, `w-full`. 버튼이 위아래로 움직이지 않게 상태 설명 줄은 없을 때 아예 빠진다(빈 줄을 두지 않는다) — before 는 시계 다음 바로 버튼.
- 저장 중(`busy`)에는 버튼이 비활성이다. 모양은 `BTN` 의 disabled(`bg-line text-muted`, 선 버튼은 `opacity-50`).
- **퇴근 완료 상자**(done): 버튼 아래 `mt-3.5` 점선 상자(`border-dashed border-muted/50 rounded-xl px-3 py-2.5`). 왼쪽은 집·달·반짝임 장면(`Scene size="sm"`, `House` + `Moon`·`Sparkle`), 오른쪽은 굵은 `수고했어요` 와 그 아래 `text-xs text-muted` `오늘 근무를 마쳤어요. 내일부터 다시 출근할 수 있어요.` 상자는 나타날 때 한 번 올라온다(`useAppear`).
- 휴가·대타 날에도 출근은 막지 않는다. 기록이 생기면 그날은 근무로 센다([PRD 09](../prd/09-leave-substitution.md) L-4). 그래서 버튼을 선 모양으로 낮추고 아래에 `text-xs text-muted` 한 줄: `쉬는 날에도 출근하면 근무로 기록돼요.`
- 같은 날 absence 가 여러 건이면 유급 휴가 > 무급 휴가 > 대타 순으로 하나만 보인다(`computeWeek` 의 "유급이 우선한다" 와 같은 방향).
- 오늘 기록이 있으면 absence 가 있어도 working/done 이다 (L-4).

#### 근무 중 — 경과 시간 갱신 단위

| 무엇 | 단위 | 근거 |
|---|---|---|
| 시계 `HH:MM:SS` | 1초 | 지금 것 그대로 |
| 경과 `지금까지 5시간 30분`, 오늘 합계, 이번 주·이번 달 숫자 | **1분** | 표기가 `hm()`(시간·분)이라 초 단위로 바꿀 것이 없다. 초까지 두 곳에서 움직이면 시선이 흩어진다 |

- 모든 분 단위 값은 **같은 `minuteNow`** 로 계산한다: `const minuteNow = Math.floor(now / 60_000) * 60_000`. 시계 카드의 경과와 대시보드의 오늘 합계가 1분 어긋나지 않게 한다. 대시보드 계산은 `minuteNow` 에 걸어 `useMemo` — 1초마다 다시 계산하지 않는다.
- 어제 출근해 아직 퇴근 안 한 기록(자정 넘김, 퇴근 누락)은 설명에 날짜를 붙인다: `9. 24. 오후 10:00 출근 · 지금까지 16시간 32분` (`dayLabel(start)` + `time(start)`). 이 기록은 출근한 날에 붙으므로 대시보드의 "오늘" 목록에는 없다 ([스킬 §4](../../.claude/skills/timesheet-ui/SKILL.md#4-달력) 날짜 기준).

### 2-4. 로딩·오류

| 상태 | 태그 | 설명 | 버튼 |
|---|---|---|---|
| `loading` 기록을 읽는 중 | 같은 높이 막대 `Bone h-6 w-[68px] rounded-md` | 없음 | 같은 높이 막대 `Bone mt-3.5 h-11 w-full rounded-xl` — 누를 버튼이 없어 상태를 모르는 동안 찍지 않는다 |
| `error` 기록·휴가 읽기 실패 | `TriangleAlert` `text-warn` · **상태를 불러오지 못했어요** | 없음 | 선 버튼 **다시 불러오기** (`RefreshCw` 16px 앞에) → `onRetry` |

- 지금 코드는 기록을 읽기 전에도 `출근` 버튼이 켜져 있다. 이미 출근한 사람에게 잠깐 `출근` 이 보인다 — 이 명세에서 `loading` 으로 막는다.
- `loading` 은 카드째 `Loading label="상태 확인 중"` 으로 감싼다(스크린리더가 한 번 읽는다). 높이는 출근 전(`before`)과 같아 기록이 들어와도 카드가 움직이지 않는다. 로그인 확인 전 첫 화면은 `ClockCardSkeleton` — 같은 모양에 날짜·시계 글자까지 막대(첫 줄 `min-h-6`, 시계 `h-10` 칸)다. 서버 렌더와 브라우저의 시각이 달라 시계 글자를 그리면 hydration 이 어긋나기 때문이다.
- 저장 실패(`저장하지 못했어요. 다시 시도해 주세요.`)는 지금처럼 버튼 아래 `ErrorText`. 상태는 바꾸지 않는다.

---

## 3. 오늘 근무 카드 — `TodayDashboard` (T-2~T-5)

`Card className="divide-y divide-line p-0"`, 구역마다 `px-4 py-3.5` ([DESIGN.md §3](../../DESIGN.md) 카드 구역).
구역 머리는 `SectionLabel`(h2, 작은 회색 글자 + lucide 15px 아이콘 + 오른쪽 요약 값) — 헤더 `h1 출퇴근` 아래 단계. 머리 앞의 번호 `01`~`04` 는 보이기만 하는 장식이라 `aria-hidden` 이다. 제목 이름은 `오늘`·`처리할 것`·`이번 주` 그대로 읽힌다. 숫자는 전부 `NUM`(고정폭).

| 구역 | 아이콘 | 오른쪽 요약 값 |
|---|---|---|
| ① 오늘 | `Clock` | 오늘 합계 `hm()` |
| ② 처리할 것 | `Bell` | 두 행의 건수 합 |
| ③ 이번 주 | `CalendarDays` | 기간 |
| ④ 이번 달 | `PiggyBank` | — (구역이 버튼이라 머리도 버튼 안 글자) |

### 3-1. ① 오늘 (T-2, TD-2)

```
오늘                                  4시간 30분      ← h2 왼쪽 / 합계 오른쪽 font-semibold
오전 09:02 ~ 오후 12:30               3시간 28분      ← text-sm, 시간 text-muted
오후 01:30 ~ ● 근무 중                 1시간 2분
```

- 목록: 오늘 출근한 기록(`dayKey(s.start) === dayKey(now)`)을 출근 시각 순으로 **전부**. 하루 기록은 보통 1~3건이라 접지 않는다.
- 시각은 기존 `time()` 표기(`오전 09:02`) 그대로 — 기록 탭과 같다. 한 행 약 230px 로 310px 안에 들어간다.
- 행: 왼쪽 `time(start) ~ time(end)`, 퇴근 전이면 `time(start) ~` + `OpenDot` + `근무 중`. 오른쪽 `hm(shiftMinutes(s, minuteNow))`.
- 합계 = 목록 각 행 분의 합. 두 번 나눠 일하면 둘의 합이다 (TD-2). `computeWeek` 가 날마다 더하는 식(`shiftMinutes` 합)과 같다.
- 목록 행은 `ul`/`li`, 13px 글자, 행 사이 점선(`divide-dashed`). 행 높이 약 34px (`py-[7px]`), 누를 것이 아니라 버튼이 아니다. 오른쪽 시간은 `font-semibold`.
- 빈 상태(오늘 기록 0): 합계 자리에 `0시간`, 목록 대신 `text-[13px] text-muted` 한 줄 `아직 오늘 기록이 없어요.`
  - off 상태면 대신 `오늘은 쉬는 날이에요.`

### 3-2. ② 처리할 것 (T-5, TD-4)

```
처리할 것
⇄  받은 대타 요청                            2건  >
⌛  내 대기 요청                              1건  >
```

| 행 | 아이콘 | 세는 것 (`MyRequests`) |
|---|---|---|
| 받은 대타 요청 | `ArrowLeftRight` `text-foreground` | `substitutionsIn` 중 `status === "requested"` — 하단 내비 요청 배지와 같은 수 |
| 내 대기 요청 | `Hourglass` `text-caution` (달력의 요청 대기와 같은 아이콘·색) | `corrections` 중 `pending` + `leaves` 중 `pending` + `substitutionsOut` 중 `requested`·`accepted` |

- 행 전체가 `button` → `onOpenRequests()` (요청 탭). 높이 44px 이상(`min-h-11`). 모양은 옅은 주의색 바탕 + 왼쪽 굵은 선(`rounded-xl border-l-[3px] border-caution bg-caution/10 px-3`), 행 사이 6px. 이름은 `font-semibold`, 오른쪽 `N건` `font-semibold text-caution` + `ChevronRight` 15px `text-muted`.
- 읽는 이름: 보이는 글자 뒤에 `sr-only` ` — 요청 탭에서 보기`.
- **0건인 행은 숨긴다. 둘 다 0건이면 구역째 숨긴다** (`처리할 것 없음` 같은 글자도 두지 않는다). 할 일이 없을 때 첫 화면을 짧게 두기 위해서다.
- 요청을 아직 못 읽었거나(`requests` 없음) 읽기에 실패하면 구역을 숨긴다. 요청 탭에서 다시 볼 수 있다.

### 3-3. ③ 이번 주 (T-3, TD-3)

```
03 이번 주                                 9/21 – 9/27   ← SectionLabel / 오른쪽 기간 (짧게)
근무 시간 ························· 14시간 / 20시간       ← DotRow
[██████████████████░░░░░░░░]                               ← ProgressBar
근무한 날 ················· 3일 / 5일 + 휴가·대타 1일
주휴수당 ·························· 진행 중 (4/5일)
```

값 — 전부 이번 주 `WeekPay` 하나에서 온다:

| 줄 | 글자 | 출처 |
|---|---|---|
| 기간 | `monthDay(week.weekStart) – monthDay(week.weekEnd.getTime() - 1)` → "9/21 – 9/27" | 2026-10-15 짧게 — 긴 "9월 21일 (월) ~ …" 는 375px 에서 제목 "이번 주" 를 말줄임으로 밀어냈다. 급여 탭 `WeekCard` 는 그대로 |
| 근무 시간 | `hm(week.workedMinutes) / {settings.weeklyHours}시간` | `computeWeek` |
| 막대 | `ProgressBar value={week.workedMinutes} max={settings.weeklyHours * 60}` | §5 |
| 근무한 날 | `{week.workDays}일 / {settings.workDaysPerWeek}일` + excusedDays > 0 이면 ` + 휴가·대타 {n}일` | `WeekCard` 의 근무 줄과 같은 표기 |
| 주휴수당 | `holidayStatus(week, settings, minuteNow)` **그대로** | `PayView.tsx` — 글자를 새로 만들지 않는다 |

- `holidayStatus` 가 내는 글자: `개근` · `진행 중 (4/5일)` · `미충족 (4/5일)` · `대상 아님 (주 15시간 미만)` · `대상 아님 (그 주 전부 휴가)`. 급여 탭 주별 카드와 글자까지 같다.
- 이번 주 `WeekPay` 를 얻는 법: `computeWeeks(shifts, settings, minuteNow, absences)` 에서 `weekStart === startOfWeek(minuteNow)` 인 것. 이번 주에 기록·휴가가 하나도 없으면 목록에 없으므로 `computeWeek(startOfWeek(minuteNow), [], settings, minuteNow, absences)` 로 빈 주를 만든다. 둘 다 pay.ts 함수다.
- 소정근로시간을 넘으면 막대는 가득 차고(넘친 만큼 더 그리지 않는다), 글자는 실제 값(`25시간 28분 / 20시간`)을 보인다. 연장·한도 경고는 급여 탭에 있다 — 여기서 반복하지 않는다.
- `settings.weeklyHours === 0` 이면 `/ 0시간` 과 막대를 빼고 근무 시간만.
- 줄은 `DotRow`(이름 ···· 값, 13px)다. 진행 막대는 `근무 시간` 줄 아래 8px 에 둔다. `dl` 안의 줄 묶음에 막대를 넣을 수 없어 `dl` 을 막대 앞뒤 둘로 나눴다 — 읽는 순서는 같다.
- 주휴 글자는 `holidayTone`(PayView.tsx) 색을 쓴다: `개근` `text-ok`, `진행 중` `text-caution`, 그 밖은 본문색. 글자가 뜻을 담고 색은 보조다. 급여 탭 주 카드와 같다.
- 긴 글자(`3일 / 5일 + 휴가·대타 1일`)는 약 150px 이다. `DotRow` 값 칸은 줄어들지 않지만 320px 기기의 카드 안쪽(246px)에도 이름과 함께 한 줄에 들어간다. 390px 가로 스크롤 없음(TD-5).

### 3-4. ④ 이번 달 (T-4, TD-3)

```
04 9월 예상 급여 (세전)                           급여 탭에서 자세히 >
144,480원                                        ← 22px 강조색, 숫자가 올라가며 나타남
```

- 구역 전체가 `button` (`min-h-11`, 왼쪽 정렬) → `onOpenPay()`.
- 왼쪽: `SectionLabel` 과 같은 모양의 글자(`PiggyBank` 15px + `04` + `{month + 1}월 예상 급여 (세전)`, 버튼 안이라 span) / 아래 `text-[22px] font-semibold leading-tight text-accent NUM` `won(m.total)`. 큰 급여 숫자라 강조색이고, `CountUp` 으로 이전 값(처음은 0)에서 0.6초 동안 올라간다.
- 오른쪽: `text-[13px] font-semibold text-accent` `급여 탭에서 자세히` + `ChevronRight` 15px. 버튼 읽는 이름은 보이는 글자 전체(`9월 예상 급여 (세전) 144,480원 급여 탭에서 자세히`).
- 값: `computeMonth(weeks, 이번 해, 이번 달).total` — 급여 탭 요약 카드 총액과 같은 값(TD-3). 월에 넣는 주는 급여 탭처럼 **일요일이 그 달에 속한 주**다. 그래서 달 끝 주(예: 9/28~10/4)는 10월에 들어가고 9월 합계에 안 보인다 — 급여 탭과 같으므로 그대로 둔다.
- 금액은 줄바꿈하지 않는다(`whitespace-nowrap`). 폭이 모자라면 오른쪽 `급여 탭에서 자세히` 가 다음 줄로 내려간다(`flex-wrap`) — 2026-09-25 가이드 390px 틀에서 `144,480` / `원` 으로 끊긴 것을 고침.
- 내역(기본급·주휴·연장)은 여기 두지 않는다. 합계 한 줄만.
- 급여 탭으로 갈 때 급여 탭의 달을 **이번 달로 맞춘다** (`setCursor(이번 달)` 후 `setTab("pay")`). 그래야 여기 숫자와 도착한 화면 숫자가 같다.

### 3-5. 로딩·오류·빈 상태

| 상태 | 대시보드 카드 |
|---|---|
| 기록·휴가 읽는 중 | `TodayDashboardSkeleton` — ready 와 같은 Card·구역·줄 높이에 값 대신 `Bone`. 구역 머리(`01 오늘`·`03 이번 주`), 줄 이름(`근무 시간`·`근무한 날`·`주휴수당`), `04 {월}월 예상 급여 (세전)`, `급여 탭에서 자세히` 는 글자 그대로. 값 자리 막대는 글자 줄 안의 `inline-block` 이라 줄 높이가 불러온 뒤와 같다. 큰 금액 자리는 `h-[27.5px]` 칸(22px × leading-tight). 오늘 기록은 2행, ② 처리할 것은 없음(0건)으로 잡고, 진행 막대 줄은 `weeklyHours > 0` 일 때만. `불러오는 중…` 글자는 두지 않는다 |
| 기록 또는 휴가 읽기 실패 | 카드(`p-4`) 안 `ErrorText` `오늘 근무를 불러오지 못했어요.` + 선 버튼 `다시 불러오기`(`BTN.secondary`, `RefreshCw`) → `onRetry`. 휴가를 못 읽으면 주휴·휴가수당이 틀리므로 둘 중 하나만 실패해도 실패로 본다 (기록 탭 `failed` 와 같은 기준) |
| 가입 첫날 (기록 0, 휴가 0) | 구역은 모두 그대로 보이고 값만 0: 오늘 `아직 오늘 기록이 없어요.` · 이번 주 `0시간 / 20시간`, 빈 막대, `0일 / 5일`, 주휴 `진행 중 (0/5일)` · 이번 달 `0원`. 빈 화면 안내 문구를 따로 만들지 않는다 — 0으로 채운 모양이 무엇이 쌓일지를 보여 준다 |
| 요청 읽는 중·실패 | ② 처리할 것만 숨는다. 나머지는 영향 없음 |

---

## 4. 와이어프레임 — 390px

본문 폭 390 − 좌우 여백 40 = 350px, 카드 안쪽 310px. `│` 는 카드 경계.

### 4-1. 근무 중 · 오늘 두 번 · 받은 대타 요청 있음

```
┌──────────────────────────────────────┐
│ [로고]                                │ AppHeader
│ 출퇴근                           (김)  │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ 9월 25일 (금)          [● 근무 중] │ │ ClockCard ← 태그, role=status
│ │ 14:32:07                         │ │  ← 40px 강조색, 한 줄 고정
│ │ 오후 01:30 출근 · 지금까지 1시간 2분 │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │             퇴근              │ │ │  ← bg-foreground
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ ◷ 01 오늘              4시간 30분  │ │ TodayDashboard ①
│ │ 오전 09:02 ~ 오후 12:30  3시간 28분 │ │
│ │ - - - - - - - - - - - - - - - - - │ │
│ │ 오후 01:30 ~ ● 근무 중    1시간 2분 │ │
│ ├──────────────────────────────────┤ │
│ │ ♫ 02 처리할 것                  2 │ │ ②
│ │ ┃⇄ 받은 대타 요청            2건  › │ │  ← 옅은 주의색 바탕 + 왼쪽 선
│ ├──────────────────────────────────┤ │
│ │ ▦ 03 이번 주 9월 21일 (월) ~ 9월 27일 (일)│ ③
│ │ 근무 시간 ········ 14시간 / 20시간  │ │
│ │ ████████████████████░░░░░░░░░░░  │ │
│ │ 근무한 날 · 3일 / 5일 + 휴가·대타 1일 │ │
│ │ 주휴수당 ·········· 진행 중 (4/5일) │ │
│ ├──────────────────────────────────┤ │
│ │ ◫ 04 9월 예상 급여 (세전)  급여 탭에서 자세히 › │ ④
│ │ 144,480원                         │ │  ← 강조색
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ 매장 근처 출근 알림           [ ○] │ │ 알림 설정 (밀려남)
├──────────────────────────────────────┤
│  출퇴근   기록   요청②   급여  내 정보  │ BottomNav
└──────────────────────────────────────┘
```

- 근무 중에 "오후 01:30 출근" 은 **지금 열린 기록**의 출근 시각이다(오늘 첫 출근이 아니다).
- 구역 머리 앞 기호(◷ ♫ ▦ ◫)는 lucide 아이콘 자리 표시다(`Clock`·`Bell`·`CalendarDays`·`PiggyBank`).
- ③ 머리 줄의 기간은 `SectionLabel` 오른쪽 값(`text-xs`, 줄어들지 않음). 316px 안에서 아이콘·`03 이번 주`(약 85px) + 기간(약 170px)이 한 줄에 들어간다. 더 좁으면 제목 쪽이 말줄임(`truncate`)된다.
- ④ 오른쪽 `급여 탭에서 자세히 ›` 약 115px + 왼쪽 라벨 약 125px — 한 줄에 들어간다. 금액은 다음 줄.

### 4-2. 시계 카드 네 상태 (대시보드는 4-1 과 같은 틀)

```
출근 전                         오늘 퇴근함
┌────────────────────────┐      ┌──────────────────────────┐
│ 9월 25일 (금) [◌ 출근 전]│      │ 9월 25일 (금) [✓ 오늘 퇴근함]│
│ 08:51:40               │      │ 18:20:05                 │
│ ┌────────────────────┐ │      │ 오후 06:05 퇴근            │
│ │        출근         │ │      │ ┌──────────────────────┐ │
│ └────────────────────┘ │      │ │    출근 (비활성)      │ │ ← bg-line text-muted
└────────────────────────┘      │ └──────────────────────┘ │
  bg-accent 채운 버튼            │ ┆⌂☾ 수고했어요           ┆ │ ← 퇴근 완료 상자(점선)
                                │ ┆   오늘 근무를 마쳤어요.  ┆ │
                                │ ┆   내일부터 다시 출근할…  ┆ │
                                └──────────────────────────┘

오늘 휴가·대타
┌─────────────────────────────┐
│ 9월 25일 (금)  ┆⊘ 오늘 휴가┆   │ ← 점선 태그
│ 10:03:12                    │
│ 오늘은 유급 휴가예요            │
│ ┌─────────────────────────┐ │
│ │          출근           │ │ ← 선 버튼
│ └─────────────────────────┘ │
│ 쉬는 날에도 출근하면 근무로 기록돼요.│
└─────────────────────────────┘
```

(`◌` = `CircleDashed`, `✓` = `CircleCheck`, `⊘` = `CalendarOff`, `⌂☾` = 집·달 장면 자리 표시. 실제는 lucide 아이콘. 시계 글자는 모두 강조색.)

### 4-3. 가입 첫날 (기록 0) · 처리할 것 없음

```
│ ┌──────────────────────────────────┐ │
│ │ ◷ 01 오늘                  0시간  │ │
│ │ 아직 오늘 기록이 없어요.            │ │
│ ├──────────────────────────────────┤ │  ← 처리할 것 구역 없음
│ │ ▦ 03 이번 주 9월 21일 (월) ~ 9월 27일 (일)│
│ │ 근무 시간 ········· 0시간 / 20시간  │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│ │ 근무한 날 ················ 0일 / 5일 │ │
│ │ 주휴수당 ·········· 진행 중 (0/5일) │ │
│ ├──────────────────────────────────┤ │
│ │ ◫ 04 9월 예상 급여 (세전)  급여 탭에서 자세히 › │
│ │ 0원                               │ │
│ └──────────────────────────────────┘ │
```

---

## 5. 새 컴포넌트

기존 것 재사용: `Card`, `SectionLabel`, `BTN`, `NUM`, `ErrorText`, `Bone`·`Loading`(ui.tsx), `OpenDot`(calendar/MonthGrid), `won`·`hm`·`time`·`date`·`dayLabel`(ui.tsx), `clockText`(lib/format.ts), `holidayStatus`·`holidayTone`·`DotRow`(PayView.tsx), `Scene`(illust.tsx), `CountUp`·`SwapText`·`useAppear`(motion.tsx), pay.ts 의 `computeWeeks`·`computeWeek`·`computeMonth`·`startOfWeek`·`dayKey`·`shiftMinutes`.
새로 만드는 것은 셋과 순수 함수 하나다. `ClockCard`·`TodayDashboard` 는 **API 를 부르지 않는 표시 컴포넌트**로 만든다 — 가이드 예시로 상태를 전부 그려 볼 수 있어야 한다(로그인 화면이라 실화면 확인이 어렵다, TS-004).

### 5-1. `todayState` — 순수 함수 (`web/src/lib/today.ts`)

```ts
import type { Absence, Shift } from "./pay";

export type TodayState =
  | { kind: "before" }
  | { kind: "working"; open: Shift }
  | { kind: "done"; lastEnd: number }
  | { kind: "off"; absence: Absence["kind"] };

/** 지금 상태. 순서: 열린 기록 → 오늘 기록 → 오늘 absence → 출근 전. §2-3 */
export function todayState(shifts: Shift[], absences: Absence[], now: number): TodayState;
```

- 급여 계산이 아니라 상태 판정이다. 단위 테스트로 TD-1 네 상태 + "absence 가 있어도 기록이 있으면 done" + "어제 열린 기록은 working" 을 확인한다.

### 5-2. `ClockCard` (`web/src/components/TodayDashboard.tsx`)

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `now` | `number` | — | **필수** 1초 단위 시각(시계용) |
| `state` | `TodayState \| { kind: "loading" } \| { kind: "error" }` | — | **필수** §2-3·§2-4 |
| `minuteNow` | `number` | — | **필수** 경과 시간 계산용(§2-3 갱신 단위) |
| `busy` | `boolean` | `false` | 저장 중 — 버튼 비활성(`BTN` 의 disabled 모양) |
| `error` | `string \| null` | `null` | 저장 실패 글자 → `ErrorText` |
| `onPunch` | `(kind: "in" \| "out") => void` | — | **필수** working 이면 `"out"`, 그 밖은 `"in"` |
| `onRetry` | `() => void` | — | **필수** error 상태의 `다시 불러오기` |

`ClockPanel` 은 지금처럼 출근·퇴근 API, 50m 배너, 알림 설정 카드를 맡고, 가운데 시계 카드 자리에 `ClockCard` 를 그린다.

### 5-3. `TodayDashboard` (`web/src/components/TodayDashboard.tsx`)

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `shifts` | `Shift[]` | — | **필수** 이번 달 조회 범위(`monthRange(이번 해, 이번 달)`)의 내 기록. 이번 주 전부를 포함한다 |
| `absences` | `Absence[]` | — | **필수** 같은 범위의 내 휴가·대타 |
| `requests` | `MyRequests \| null \| undefined` | — | 없으면 ② 처리할 것 숨김 |
| `settings` | `PaySettings` | — | **필수** |
| `now` | `number` | — | **필수** `minuteNow` 를 넘긴다 (§2-3) |
| `status` | `"loading" \| "error" \| "ready"` | — | **필수** §3-5 |
| `onRetry` | `() => void` | — | **필수** |
| `onOpenPay` | `() => void` | — | **필수** 급여 탭(이번 달)으로 |
| `onOpenRequests` | `() => void` | — | **필수** 요청 탭으로 |

오늘 상태 문구(off 의 `오늘은 쉬는 날이에요.`)를 위해 안에서 `todayState` 를 한 번 더 부르거나 `state` prop 을 받는다 — 구현 편한 쪽으로.

### 5-4. `ProgressBar` (`web/src/components/ui.tsx`)

```tsx
<ProgressBar value={840} max={1200} label="이번 주 근무 시간" valueText="14시간 / 20시간" />
```

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `value` | `number` | — | **필수** 현재 값 |
| `max` | `number` | — | **필수** 0 이하이면 빈 막대 |
| `label` | `string` | — | **필수** `aria-label` |
| `valueText` | `string` | — | **필수** `aria-valuetext` — 스크린리더는 숫자 대신 이 글자를 읽는다 |

구성과 접근성:

```
<div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max}
     aria-valuenow={Math.min(value, max)} aria-valuetext={valueText}
     class="h-2 w-full overflow-hidden rounded-full bg-line">
  <div class="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />   pct = max > 0 ? min(100, value / max * 100) : 0
</div>
```

- `aria-valuenow` 는 `max` 를 넘지 않게 자른다(ARIA 규칙). 넘친 실제 값은 `valueText` 가 말한다.
- 움직임(transition)을 넣지 않는다. 1분마다 조금씩 바뀌는 값이라 움직임이 의미 없다.
- `<progress>` 대신 div 인 이유: 브라우저마다 모양이 다르고 다크 모드 색을 토큰으로 맞추기 어렵다.

### 5-5. 컴포넌트 가이드에 넣을 것 (`/guide`)

[스킬 §0 "컴포넌트 가이드와 같이 움직인다"](../../.claude/skills/timesheet-ui/SKILL.md#컴포넌트-가이드guide와-같이-움직인다)대로 같은 커밋에 페이지·명세·목차(`nav.ts`)를 넣는다. 명세 [component-guide.md](component-guide.md) §1-3 표·§3 표·§4 에 아래 절을 더한다.

| 묶음 | slug | 목차 이름 | 자리 |
|---|---|---|---|
| 표시 | `progress-bar` | Progress Bar | `spinner` 다음 |
| 화면 조각 | `clock-card` | Clock Card | `pay-view` 앞 |
| 화면 조각 | `today-dashboard` | Today Dashboard | `clock-card` 다음 |

예시 공통 고정값: `now = new Date(2026, 8, 25, 14, 32, 7).getTime()`(금), `minuteNow = Math.floor(now / 60_000) * 60_000`, `settings = { hourlyWage: 10320, weeklyHours: 20, workDaysPerWeek: 5, fivePlus: false }`, 틀 폭 `max-w-md`. 이름·id 는 가이드 공통 가짜 데이터(`이서준`, `user-demo-05` …).

기본 기록 `DEMO_SHIFTS` (9월, 기기 시간대):

| id | 출근 | 퇴근 |
|---|---|---|
| `s1` | 9/22 10:00 | 15:00 |
| `s2` | 9/23 10:00 | 14:30 |
| `s3` | 9/25 09:02 | 12:30 |
| `s4` | 9/25 13:30 | 퇴근 전 (`null`) |

기본 absence: `{ date: "2026-09-24", kind: "substitution" }`.
이 데이터를 pay.ts 로 돌린 값(2026-09-25 `node --experimental-strip-types` 로 확인): 오늘 **270분(4시간 30분)**, 이번 주 **840분(14시간)** · 근무 3일 + 휴가·대타 1일 · 주휴 미확정(`진행 중 (4/5일)`) · 주 합계 **144,480원**, 9월 합계 **144,480원**.

`progress-bar` 예시

| 예시 (H2) | 설명 | 데이터 |
|---|---|---|
| Basic | 이번 주 근무 시간 | `value={840} max={1200}` `valueText="14시간 / 20시간"` |
| 빈 값 | 0 | `value={0} max={1200}` `valueText="0시간 / 20시간"` |
| 넘침 | 가득 차고 글자가 실제 값 | `value={1528} max={1200}` `valueText="25시간 28분 / 20시간"` |

`clock-card` 예시

| 예시 (H2) | 설명 | `state` |
|---|---|---|
| 출근 전 | 채운 `출근` | `{ kind: "before" }` |
| 근무 중 | 초록 점 + `퇴근` | `{ kind: "working", open: s4 }` → `오후 01:30 출근 · 지금까지 1시간 2분` |
| 근무 중 — 어제 출근 | 날짜가 붙는 설명 | `open = { id: "x", start: 9/24 22:00, end: null }` → `9. 24. 오후 10:00 출근 · 지금까지 16시간 32분` |
| 오늘 퇴근함 | 비활성 `출근` + 내일 안내 | `{ kind: "done", lastEnd: 9/25 18:05 }`, 이 예시만 `now` 9/25 18:20:05 (시계가 퇴근 뒤) |
| 오늘 휴가 | 점선 알약, 유급 문구 | `{ kind: "off", absence: "paid_leave" }` |
| 오늘 대타 | 점선 알약, 대타 문구 | `{ kind: "off", absence: "substitution" }` |
| 불러오는 중 | 알약·버튼 자리에 같은 크기 막대 | `{ kind: "loading" }` |
| 불러오기 실패 | `다시 불러오기` | `{ kind: "error" }` |
| 저장 실패 | 버튼 아래 오류 글자 | `before` + `error="저장하지 못했어요. 다시 시도해 주세요."` |
| 320px 한 줄 | 좁은 폭에서도 시계가 한 줄 | 틀 폭 320px, `before` |

`today-dashboard` 예시

| 예시 (H2) | 설명 | 데이터 |
|---|---|---|
| Basic — 두 번 나눠 근무 | TD-2: 오늘 합계 4시간 30분 = 3시간 28분 + 1시간 2분 | `DEMO_SHIFTS`, 기본 absence, `requests` 전부 빈 배열 |
| 처리할 것 | 받은 대타 2 · 내 대기 1 | Basic + `substitutionsIn` `requested` 2건(요청자 `이서준`·`박도윤`), `leaves` `pending` 1건 |
| 가입 첫날 | 기록 0, 모든 값 0 | `shifts=[]` `absences=[]` |
| 오늘 휴가 | 오늘 목록 대신 `오늘은 쉬는 날이에요.` | `s3`·`s4` 빼고 absence `{ date: "2026-09-25", kind: "paid_leave" }` 추가 |
| 소정 초과 | 막대 가득, `25시간 28분 / 20시간`, 주휴 `개근` | `s4` 를 18:00 퇴근으로, `s5` 9/26(토) 09:00~17:00 추가, `now` 9/26 18:00 |
| 주 15시간 미만 | 주휴 `대상 아님 (주 15시간 미만)` | Basic + `weeklyHours: 14` |
| 불러오는 중 | 같은 구역 틀에 막대 — Basic 과 높이가 같다 | `status="loading"` |
| 불러오기 실패 | 오류 + `다시 불러오기` | `status="error"` |

---

## 6. 데이터 출처 (구현 참고)

| 블록 | 값 | 출처 |
|---|---|---|
| 상태·오늘 목록 | 기록, 오늘 absence | `/api/shifts/me` · `/api/absences/me` (지금 `MemberHome` 의 `useApi` 두 개) |
| 이번 주·이번 달 | `WeekPay`, 월 합계 | pay.ts `computeWeeks` → 이번 주 / `computeMonth` |
| 처리할 것 | 요청 수 | `/api/requests/me` (`reqRes`) — 하단 내비 배지와 같은 응답 |

**조회 범위 주의**: 지금 `MemberHome` 은 기록·휴가를 **기록·급여 탭의 달(`cursor`)** 범위로 읽는다. 기록 탭에서 8월로 넘긴 뒤 출퇴근 탭으로 오면 8월 기록으로 상태·대시보드를 그리게 된다(지금 `ClockPanel` 의 `open` 판정도 같다).
권고: **출퇴근 탭을 고르거나 대시보드에서 급여 탭으로 갈 때 `cursor` 를 이번 달로 되돌린다.** 조회 요청을 늘리지 않는 가장 작은 변경이다. 바꾸려면 `MemberHome` 의 `setTab` 부분만 고치면 된다. 대시보드의 `status` 는 기록 탭과 같은 식(`data?.key !== rangeKey`, `error || absRes.error`)으로 낸다.

---

## 7. 접근성 요약

| 항목 | 값 |
|---|---|
| 상태 구별 | 아이콘 모양 + 상태 이름 + 버튼 글자, 휴가·대타는 점선 테두리까지. 색은 보조 |
| 상태 바뀜 알림 | 상태 알약 `role="status"`. 시계에는 live 영역 없음 |
| 진행 막대 | `role="progressbar"` + `aria-label` + `aria-valuemin/max/now` + `aria-valuetext` (§5-4) |
| 제목 | 헤더 `h1 출퇴근` → 대시보드 구역 `h2` 셋(오늘·처리할 것·이번 주). 번호 `01`~`03` 은 `aria-hidden` 이라 이름에 들어가지 않는다. ④ 이번 달은 구역 전체가 버튼이라 `h2` 없이 버튼 이름(`9월 예상 급여 (세전) 144,480원 급여 탭에서 자세히`)으로 읽힌다 |
| 누르는 곳 | 출근·퇴근 버튼 44px, 처리할 것 행·이번 달 구역 44px 이상 |
| 아이콘 | 전부 `aria-hidden`, 이름은 옆 글자가 가진다 |
| 390px | 가로 스크롤 없음 — 긴 값은 줄바꿈 허용, 시계만 `whitespace-nowrap`(폭 확인 §2-2) (TD-5) |

## 8. 다크 모드와 색 — 새 토큰 없음

모든 색은 기존 토큰(`globals.css`)이다. 아래 대비 값은 2026-09-25 WCAG 식으로 계산한 것이다(라이트 / 다크). 2026-10-07 토큰을 바꾼 뒤의 글자 대비는 `web/src/lib/design-tokens.test.mjs` 가 매번 확인한다.

| 쓰는 곳 | 색 | 대비 | 판정 |
|---|---|---|---|
| 상태 알약 글자 | `text-foreground` on `surface` | 17.49 / 16.03 | 글자 4.5 이상 |
| 점선 알약 테두리 (off) | `border-muted` on `surface` | 4.80 / 6.93 | 비글자 3 이상 (달력과 같은 이유로 `border-line` 1.3 은 쓰지 않는다) |
| `CircleCheck`, 시계, 큰 급여 숫자, `급여 탭에서 자세히` | `accent` on `surface` | 5.17 / 4.75 | 통과 |
| `CircleDashed`, `CalendarOff`, 보조 글자 | `muted` on `surface` | 4.80 / 6.93 | 통과 |
| `Hourglass` | `caution` on `surface` | 테스트가 4.5 이상을 확인 | 통과 |
| 처리할 것 행 `N건` | `caution` on `caution/10`(카드 위) | 테스트는 더 진한 `caution/15` 바탕에서 4.5 이상을 확인한다. `/10` 은 바탕이 카드색에 더 가까워 대비가 그보다 높다 | 통과 |
| `TriangleAlert`, 오류 글자 | `warn` on `surface` | 4.83 / 6.32 | 통과 |
| 막대 채움 vs 빈 칸 | `accent` vs `line` | 4.12 / 4.12 | 비글자 3 이상 |

- **색 바탕 알약을 쓰지 않는다.** 따져 본 조합이 작은 글자 기준 4.5 에 못 미쳤다: 근무 중 `green-700` on `green-500/15` 라이트 **4.40**, 퇴근함 `accent` on `accent/10` 라이트 4.49 · 다크 **4.23**, 출근 전 `muted` on `line` 라이트 **3.82**. 그래서 글자는 `foreground` 로 두고 아이콘에만 색을 준다.
- 막대 빈 칸(`bg-line`)과 카드 바탕의 대비는 1.26 / 1.15 로 낮다. 막대 끝이 흐리게 보여도 값은 옆 글자(`14시간 / 20시간`)가 말하므로 정보 손실은 없다. 빈 칸을 진하게 하려면 새 색이 필요해 이번에는 하지 않는다.
- 참고(이번 범위 밖, 고치지 않음): 기존 `StatusPill` 의 `approved`(`green-700` on `green-500/15`)도 라이트 4.40 이다.

---

## 9. 바꾸지 않는 것

- 50m 알림 배너와 알림 설정 카드의 내용·동작 (T-6)
- 출근·퇴근 API 호출과 다른 기기 충돌 처리(`ALREADY_CLOCKED_IN`·`NOT_CLOCKED_IN` → 다시 읽기)
- 범위 밖(PRD 12): 오늘 근무 **예정**, 동료 근무 여부. 대타로 **멤버가 대신 일하는 날** 표시도 PRD 12 T-1 에 없어서 넣지 않았다
- B 시안에 있던 것 중 넣지 않은 것: 시계 카드의 `수정 요청` 버튼과 `예정 16:00`, ③ 이번 주의 요일 7칸(날마다 근무 시간·예정), ② 행의 요청자·날짜(`민수, 10/18`). 모두 새 기능이나 새 문구라 모양만 바꾸는 이번 작업에서 뺐다(§11)

## 10. 구현 체크리스트 (시니어 → QA)

| 기준 | 확인 방법 |
|---|---|
| TD-1 | `todayState` 단위 테스트 4상태 + 가이드 `clock-card` 예시 4개가 아이콘·글자·버튼 모두 다르다 |
| TD-2 | 가이드 `today-dashboard` Basic: 오늘 `4시간 30분` = `3시간 28분` + `1시간 2분` |
| TD-3 | 같은 데이터로 급여 탭(이번 달)의 요약 총액·이번 주 카드와 대시보드 값이 같다 — Basic 기준 `144,480원`, `진행 중 (4/5일)` |
| TD-4 | 처리할 것 행을 누르면 요청 탭이 활성(`aria-current="page"`)이 된다 |
| TD-5 | 390px·320px 틀에서 가로 스크롤 없음, 시계 한 줄 |

## 11. 미결

| 무엇 | 권고 | 고칠 곳 |
|---|---|---|
| 휴가·대타 날 50m 배너가 `출근 체크하세요` 로 뜬다 | T-6 "지금 것 유지" 라 그대로 둔다. 쉬는 날 배너를 끄려면 기획(PRD 04·12) 결정이 먼저다 | `ClockPanel` 배너 조건 |
| §1-3 높이는 눈대중이다 | 구현 후 390×844 에서 대시보드 끝이 하단 내비 위에 오는지 잰다. 넘치면 ③ 의 `근무한 날` 줄을 주휴 줄에 합치는 쪽을 먼저 검토 | 이 문서 §3-3 |
| B 시안의 ③ 요일 7칸(월~일, 날마다 근무 시간 · 오늘 칸 강조 · 예정 칸 흐리게)을 넣을지 | 넣으려면 날마다 근무 시간(`computeWeek` 의 일별 합)과 근무 시간표(PRD 13 `schedule`)의 예정 시간이 필요하다. "예정" 은 이 문서 §9 에서 범위 밖이라 기획 결정이 먼저다 | 이 문서 §3-3, `TodayDashboard.tsx` ③ 구역 |
| 월 경계 주(9/28 월 ~ 10/4 일)는 9월 합계에 안 들어간다 | 급여 탭과 같게 둔다(TD-3). 헷갈린다는 의견이 나오면 급여 탭 안내 문구를 함께 고친다 | `PayView` 안내 글자 |
