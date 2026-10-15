# timesheet 디자인 기준

웹(`web/`) 화면의 색·모양·글꼴·움직임·접근성 기준의 **원본**이다. 코드(`web/src/app/globals.css`)와 다른 문서는 이 문서를 따른다.

- 화면 셸 규칙(헤더·하단 내비·아바타)은 [timesheet-ui 스킬](.claude/skills/timesheet-ui/SKILL.md), 컴포넌트별 예시·props 는 [컴포넌트 가이드 명세](docs/design/component-guide.md)(웹 `/guide`)에 있다. 이 문서는 그 둘이 공통으로 따르는 기초만 다룬다.
- 왜 이렇게 정했는지는 [설계 기록](docs/superpowers/specs/2026-10-07-design-refresh-design.md)에 있다.

## 1. 분위기

2026-10-07 사용자 결정. 브라우저 시안 네 안 중 "C, D 라이트/다크모드로" 를 고르고, 강조색을 맞추는 세 방법 중 2번을 골랐다.

- **라이트**: 옅은 청회색 바탕, 흰 카드, 청록 강조, 그림자 없는 평면
- **다크**: 아주 어두운 바탕, 선명한 숫자, 강조만 밝은 민트(청록 계열) — 모드가 바뀌어도 같은 앱으로 보이게
- ~~모드는 기기 설정(`prefers-color-scheme`)을 따른다~~ → **2026-10-15 사용자 결정: 기기 설정과 상관없이 항상 다크.** ("컬러도 시안처럼 라이트로" 로 잠깐 항상 라이트였다가 "그냥 다크모드로하자" → "항상 다크".) 루트 `<html>` 에 `dark` 클래스를 고정으로 붙이고, 색은 `.dark` 블록 값을 쓴다. 앱 안 전환 버튼은 두지 않는다

2026-10-15 사용자 결정으로 **모양을 "B — 정밀·업무 도구"로 바꿨다.** 색은 위 그대로 두고 생김새만 바꿨다. 브라우저 시안 세 안(큰 숫자·면 / 정밀·업무 도구 / 도장·손맛) 중 B 를 골랐다.

- 가는 1px 선과 작은 모서리, 그림자 없음
- 숫자(시각·시간·금액·날짜)는 고정폭 글꼴. 자릿수가 바뀌어도 줄이 흔들리지 않는다
- 카드 안은 구역 머리(작은 회색 글자 + 아이콘)로 나눈다
- 헤더의 화면 이름은 18px 굵게, 출퇴근 시계와 큰 급여 숫자는 강조색(`text-accent`)으로 눈에 띄게 한다

## 2. 색 토큰

`globals.css` 의 `:root`(라이트, 지금은 쓰지 않음)와 `.dark` 블록(다크, 지금 쓰는 값)에 두고, `@theme inline` 으로 Tailwind 이름(`bg-surface`, `text-on-accent` …)이 된다. 대비는 WCAG 상대 휘도 공식으로 계산한 값이고 `web/src/lib/design-tokens.test.mjs` 가 4.5:1 이상을 지킨다.

2026-10-15 사용자 결정 "컬러도 바꿔줘 시안처럼" — 중립색 다섯(바탕·글자·카드·선·보조 글자)을 청록 기운 없는 회색으로 바꿨다. 강조색·상태색은 그대로다. 보조 글자는 시안 값 `#71717a` 이면 취소 배지 바탕에서 대비 4.21 이라 한 단계 진한 `#6b6b74` 로 정했다. 시안에 다크가 없어 다크도 같은 회색 계열로 맞췄다.

| 토큰 | 라이트 | 다크 | 쓰는 곳 | 대비 (라이트 / 다크) |
|---|---|---|---|---|
| `--background` | `#fafafa` | `#09090b` | 페이지 바탕, 하단 내비 활성 칩 | |
| `--foreground` | `#18181b` | `#fafafa` | 본문 글자, 주 버튼 바탕 | 바탕 16.97 / 19.06 |
| `--surface` | `#ffffff` | `#18181b` | 카드, 헤더, 하단 내비, 입력칸 | |
| `--line` | `#e4e4e7` | `#27272a` | 경계선, 중립 배지 바탕 | (장식) 카드 1.27 / 1.19 |
| `--muted` | `#6b6b74` | `#a1a1aa` | 보조 글자, 비활성 메뉴, 점선 테두리, 구역 머리 | 바탕 5.05 / 7.76, 카드 5.28 / 6.91, 취소 배지 바탕 4.59 / 6.27 |
| `--accent` | `#0f766e` | `#2dd4bf` | 활성 메뉴, 오늘·선택, 포커스, 강조 버튼 바탕 | 카드 위 글자 5.47 / 8.97 |
| `--on-accent` | `#ffffff` | `#05201d` | 강조 버튼 글자 | 강조 위 5.47 / 9.17 |
| `--warn` | `#b91c1c` | `#f87171` | 오류, 거절, 내비 배지, 퇴근 기록 없음 | 카드 6.47 / 6.04, 15% 바탕 5.0 / 4.89 |
| `--ok` | `#166534` | `#4ade80` | 승인 배지, 근무 중 점 | 카드 7.13 / 9.58, 15% 바탕 5.66 / 6.94 |
| `--caution` | `#92400e` | `#fbbf24` | 대기 배지, 요청 대기 아이콘 | 카드 7.09 / 10.0, 15% 바탕 5.59 / 7.21 |

규칙:

- 강조 바탕 위 글자는 `text-on-accent`. `text-white` 를 쓰지 않는다 — 다크 민트 위 흰 글자는 1.86
- 상태 배지는 `bg-<상태>/15` + `text-<상태>`. `dark:` 변형을 따로 쓰지 않는다 — 토큰이 모드를 맡는다
- 내비 배지(빨간 숫자)는 `bg-warn text-background`
- 토큰 밖 색은 둘뿐이다: 아바타 8색(흰 글자 고정, [timesheet-ui §3](.claude/skills/timesheet-ui/SKILL.md)), 토글 손잡이 `bg-white`. 나머지 Tailwind 색(`green-*`, `amber-*` …)·`text-white` 는 테스트가 막는다
- 라이트 상태 색은 처음 값(`#15803d`·`#b45309`·`#dc2626`)이 15% 배지 바탕에서 3.81~4.09 라, 2026-10-07 사용자 결정으로 한 단계 진하게 바꿨다

## 3. 모양

| 무엇 | 값 |
|---|---|
| 카드 | `rounded-2xl` = **8px**, 테두리 1px `--line`, 그림자 없음 |
| 버튼·입력칸·보기 전환 틀·아이콘 버튼 | `rounded-xl` = **6px** (`globals.css` 의 `--radius-xl`·`--radius-2xl`·`--radius-md` 재정의) |
| 배지(`StatusPill`)·내비 배지 | `rounded-md` = **4px** |
| 아바타 | 둥근 사각형 — 크기별 4·6·8·12px ([timesheet-ui §3](.claude/skills/timesheet-ui/SKILL.md)) |
| 버튼 | `styles.ts`(`ui.tsx` 가 다시 내보냄)의 `BTN` 상수로만 그린다 — `primary`(진한 바탕) · `secondary`(회색 선) · `small`(목록 안 보조, 32px) · `dashed`(추가) · `danger`(지우기, 올리면 빨강). `buttons.ts` 의 옛 이름은 `BTN` 별칭 (2026-10-15 버튼 체계 하나로) |
| 입력칸 | `.field` 높이 44px, 글자 16px (iOS 확대 방지), 바탕 `--surface`, 포커스는 강조색 테두리 + 옅은 고리 |
| 카드 구역 | 구역이 여럿이면 `Card className="divide-y divide-line p-0"` 안에 `px-4 py-3.5`. 구역 머리는 `SectionLabel` |
| 간격 | 본문 가로 `px-5`, 카드 안 `p-4`, 카드 사이 `space-y-4` — [가이드 명세 §2-3](docs/design/component-guide.md) |

## 4. 글꼴·아이콘

| 무엇 | 규칙 | 정한 날 |
|---|---|---|
| 글꼴 | 본문 **Pretendard**(가변, `next/font/local` — npm `pretendard` 파일을 앱이 직접 제공, CDN 없음). 코드는 Geist Mono. 새 글꼴을 CDN 으로 붙이지 않는다. 디자인 도구가 추천하는 영문 글꼴(Plus Jakarta Sans 등)은 한글이 없어 쓰지 않는다 | 2026-09-25 "폰트는 pretendard로 수정" |
| 숫자 | 금액·시간·날짜는 `ui.tsx` 의 `NUM`(`font-mono tabular-nums`, Geist Mono) | 2026-10-15 B 시안 |
| 강조 숫자 | 출퇴근 시계, 멤버 대시보드 이번 달 예상 급여, 급여 탭 예상 급여 합계, 사장님 대시보드 인건비만 `text-accent`. 작은 금액은 본문색 — 다 칠하면 강조가 흐려진다 | 2026-10-15 "시계(시간) 급여는 포인트 컬러로" |
| 아이콘 | lucide-react 만. 카드 구역 머리 아이콘도 lucide(15px, 선 1.75). 규칙은 [timesheet-ui §2](.claude/skills/timesheet-ui/SKILL.md) | 2026-09-25, 2026-10-15 "lucide 로 통일" |
| 그래프 | **Recharts**(3.10). 지금은 내 정보 근무 조건 한 곳 — 주간 시간표(요일별 출퇴근 구간 막대), 주 시간 게이지(주휴 15h·법정 40h 기준선), 근무일 점(차트 없이 7개 점). 한 사람의 값이라 범례 없이 강조색 하나. 막대·축은 `currentColor`(SVG 속성에 `var()` 를 쓰지 않는다), 같은 내용을 글자로도 둔다, 애니메이션 0.4초·동작 줄이기면 끔 | 2026-10-15 "이 데이터는 그래프로 그려줘" |
| 일러스트 | 사람 그림 없이 **lucide 아이콘 조합**으로 뜻을 보여 준다(`illust.tsx` 의 `Scene`·`EmptyState`). 옅은 강조색 원 안에 주인공 아이콘(강조색, 선 1.5), 둘레에 작은 소품 1~2개(muted). 빈 상태·완료 순간·로그인·가입·온보딩에만 쓰고, 한 화면에 하나만 둔다. 작은 구역의 빈 상태는 글자만 | 2026-10-15 — 손그림 묶음(Open Peeps·Doodle Icons)을 시안에서 써 본 뒤 "사람을 빼고 메타포로", "선이 삐뚤빼뚤·유치·색과 굵기" 로 lucide 를 골랐다 |

## 5. 움직임

2026-10-15 사용자 결정으로 **GSAP**(`gsap` 3.15, 무료 표준 라이선스)을 쓴다. 쓰는 곳은 사용자가 고른 넷 — 화면 진입, 출퇴근 누름, 숫자 변화, 완료 순간이다. 코드는 `web/src/components/motion.tsx`(일러스트 등장은 `illust.tsx`)에 모으고, 화면에서는 그 컴포넌트를 쓴다. 버튼 누름과 색 전환은 전처럼 CSS 가 맡는다.

| 대상 | 값 | 어디 |
|---|---|---|
| 화면 진입 — 탭·화면에 들어올 때 카드 | 아래에서 8px 올라오며 나타남, 0.32초, 하나씩 0.06초 간격. 불러오기가 끝나 내용이 바뀌면 한 번 더 | `Enter` |
| 숫자 변화 — 큰 금액(예상 급여·인건비) | 이전 값(처음은 0)에서 새 값까지 0.6초. 고정폭 숫자라 자릿수가 흔들리지 않는다 | `CountUp` |
| 출퇴근 누름 — 상태 글자 | 바뀔 때 새 글자가 아래에서 올라온다, 0.22초 | `SwapText` |
| 완료 순간 — 퇴근 완료 상자, 저장 알림 | 아래에서 10px 올라오며 나타남, 0.35초 | `useAppear` |
| 일러스트 | 원이 6px 올라오고(0.35초) 소품이 0.08초 간격으로 톡 튀어나온다(`back.out`) | `Scene` |
| 곡선 | GSAP `power2.out`. CSS 는 `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` 하나 | `motion.tsx` `EASE`, `globals.css` `:root` |
| 버튼·하단 주요 메뉴 누름 | `:active` 에서 `scale(0.97)`, transform 120ms `--ease-out` | `globals.css` `@layer base` — `button`·`[role=button]`·`nav[aria-label="주요 메뉴"] a`. 목록 행·카드·가이드 목차 같은 목록 링크는 빼서 스크롤 중 출렁이지 않게 |
| 색·배경 전환 | 바뀌는 속성만 150ms `ease` | 같은 규칙. 누름 대상(버튼·주요 메뉴)에 Tailwind `transition`·`transition-colors` 를 따로 주면 이 규칙이 덮이니 주지 않는다 (테스트가 `transition` 을 막는다) |
| 토글 손잡이 | `left` 가 아니라 `translate-x` 로, transform 150ms `--ease-out` | `TimesheetApp.tsx` 출근 알림. 레이아웃 속성(`left`·`width` …)은 전환하지 않는다 (테스트가 막는다) |
| 드문 등장 — 오류 문구(`ErrorText`), 온보딩 카드 | `.appear`: 투명도 0→1 + 위로 4px, 200ms. 여러 개가 함께 나오면 50ms 간격(`[animation-delay:50ms]`) | `globals.css` `@layer components` |
| 모션 줄이기 | GSAP 은 이동·크기 변화 없이 투명도만(숫자는 바로 최종 값), CSS 누름 축소 끔, `.appear` 는 투명도만 | `motion.tsx` `reducedMotion()`, `@media (prefers-reduced-motion: reduce)` |

하지 않는 것: 스크롤 연출, 무한 반복 애니메이션, `ease-in`, `transition-all`(테스트가 막는다), 레이아웃 속성(`width`·`height`·`top`) 애니메이션. 2026-10-07 에는 "라이브러리 없이 CSS 만, 숫자 카운트업·탭 전환 애니메이션 없음" 이었는데 2026-10-15 사용자 결정으로 위처럼 바뀌었다.

## 6. 모바일·접근성 점검표

새 화면을 만들거나 고치면 라이트·다크 × 375px 로 확인한다. 2026-10-07 전 화면 점검 결과를 같이 적는다.

| 항목 | 기준 | 2026-10-07 결과 |
|---|---|---|
| 글자 대비 | 4.5:1 이상 | 토큰 조합 전부 통과 (테스트). 취소 배지는 `bg-line/60` 바탕이라야 4.72 — `bg-line` 그대로면 4.35 |
| 터치 영역 | 44×44px 이상 | 아이콘 버튼 40→44, 초대 코드 동작 버튼 키움. 예외: 문장 속 글자 링크, 달력 칸(375px 에 7칸이라 41px), 보기 전환 40px, 출근 알림 토글 36×20(누르는 자리는 44px, 2026-10-15) — 모두 WCAG 최소 24px 은 넘는다 |
| 아이콘만 있는 버튼 | `aria-label` | `IconButton` 이 `label` 을 필수로 받는다 |
| 포커스 표시 | 키보드 이동 때 보인다 | 입력칸은 테두리가 `--accent` 로 바뀐다 |
| 가로 스크롤 | 375px 에서 없음 | 34장 전부 없음 |
| 탭 반응 | 회색 번쩍임 없음, 지연 없음 | `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` |
| 홈 바 | 하단 내비가 겹치지 않음 | `viewport-fit=cover` + `env(safe-area-inset-bottom)` |
| 확대 | 막지 않는다 | `maximum-scale`·`user-scalable` 을 넣지 않는다 |
| 모션 줄이기 | 이동·크기 변화 끔 | 5절 |

## 7. 바꿀 때 같이 고칠 곳

| 바꾼 것 | 같이 고칠 곳 |
|---|---|
| 색 토큰 값·이름 | `web/src/app/globals.css`, 2절 표(대비 다시 계산), `web/src/lib/design-tokens.test.mjs`, `web/src/components/guide/Foundations.tsx` `TOKENS`, [가이드 명세 §2-1](docs/design/component-guide.md), [달력 명세 §8](docs/design/calendar.md) |
| 모서리·간격·터치 크기 | 3·6절, 가이드 명세 §2-3, `web/src/app/guide/foundations/page.mdx` |
| 움직임 | 5절, `web/src/components/motion.tsx`, `globals.css`, foundations 페이지 "움직임" |
| 버튼·구역 머리·일러스트 모양 | 3·4절, `ui.tsx`(`BTN`·`SectionLabel`·`NUM`), `illust.tsx`, 가이드 해당 페이지 |
| 글꼴·아이콘 | 4절, timesheet-ui 스킬 §2 |
| 사용자가 새 디자인 규칙을 정함 | 이 문서 해당 절 + [결정 목록](docs/decisions.md) 한 줄 |
