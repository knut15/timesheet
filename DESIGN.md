# timesheet 디자인 기준

웹(`web/`) 화면의 색·모양·글꼴·움직임·접근성 기준의 **원본**이다. 코드(`web/src/app/globals.css`)와 다른 문서는 이 문서를 따른다.

- 화면 셸 규칙(헤더·하단 내비·아바타)은 [timesheet-ui 스킬](.claude/skills/timesheet-ui/SKILL.md), 컴포넌트별 예시·props 는 [컴포넌트 가이드 명세](docs/design/component-guide.md)(웹 `/guide`)에 있다. 이 문서는 그 둘이 공통으로 따르는 기초만 다룬다.
- 왜 이렇게 정했는지는 [설계 기록](docs/superpowers/specs/2026-10-07-design-refresh-design.md)에 있다.

## 1. 분위기

2026-10-07 사용자 결정. 브라우저 시안 네 안 중 "C, D 라이트/다크모드로" 를 고르고, 강조색을 맞추는 세 방법 중 2번을 골랐다.

- **라이트**: 옅은 청회색 바탕, 흰 카드, 청록 강조, 그림자 없는 평면
- **다크**: 아주 어두운 바탕, 선명한 숫자, 강조만 밝은 민트(청록 계열) — 모드가 바뀌어도 같은 앱으로 보이게
- 모드는 기기 설정(`prefers-color-scheme`)을 따른다. 앱 안 전환 버튼은 두지 않는다

## 2. 색 토큰

`globals.css` 의 `:root` 와 `@media (prefers-color-scheme: dark)` 에 두고, `@theme inline` 으로 Tailwind 이름(`bg-surface`, `text-on-accent` …)이 된다. 대비는 WCAG 상대 휘도 공식으로 계산한 값이고 `web/src/lib/design-tokens.test.mjs` 가 4.5:1 이상을 지킨다.

| 토큰 | 라이트 | 다크 | 쓰는 곳 | 대비 (라이트 / 다크) |
|---|---|---|---|---|
| `--background` | `#f6f8f8` | `#0b1213` | 페이지 바탕, 입력칸 | |
| `--foreground` | `#0f2a2a` | `#e8f1f0` | 본문 글자 | 바탕 14.23 / 16.46 |
| `--surface` | `#ffffff` | `#132022` | 카드, 하단 내비 | |
| `--line` | `#e2eaea` | `#1f3134` | 경계선, 중립 배지 바탕 | (장식) |
| `--muted` | `#5b6f6f` | `#86a19f` | 보조 글자, 비활성 메뉴, 점선 테두리 | 바탕 4.99 / 6.86, 카드 5.32 / 6.05 |
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
| 카드 | `rounded-2xl` = **14px**, 테두리 1px `--line`, 그림자 없음 |
| 버튼·입력칸·보기 전환 틀 | `rounded-xl` = **10px** (`globals.css` 의 `--radius-xl`·`--radius-2xl` 재정의) |
| 달력 칸·작은 전환 버튼 | `rounded-lg` 8px |
| 아바타·배지·아이콘 버튼 | `rounded-full` |
| 입력칸 | `.field` 높이 44px, 글자 16px (iOS 확대 방지) |
| 간격 | 본문 가로 `px-5`, 카드 안 `p-5`, 카드 사이 `space-y-4` — [가이드 명세 §2-3](docs/design/component-guide.md) |

## 4. 글꼴·아이콘

| 무엇 | 규칙 | 정한 날 |
|---|---|---|
| 글꼴 | 본문 **Pretendard**(가변, `next/font/local` — npm `pretendard` 파일을 앱이 직접 제공, CDN 없음). 코드는 Geist Mono. 새 글꼴을 CDN 으로 붙이지 않는다. 디자인 도구가 추천하는 영문 글꼴(Plus Jakarta Sans 등)은 한글이 없어 쓰지 않는다 | 2026-09-25 "폰트는 pretendard로 수정" |
| 숫자 | 금액·시간·날짜는 `tabular-nums` | |
| 아이콘 | lucide-react 만. 규칙은 [timesheet-ui §2](.claude/skills/timesheet-ui/SKILL.md) | 2026-09-25 |

## 5. 움직임

애니메이션 라이브러리 없이 CSS 만 쓴다 (2026-10-07 사용자 결정). 기준은 "얼마나 자주 보나" — 하루 수십 번 보는 동작은 움직이지 않는다.

| 대상 | 값 | 어디 |
|---|---|---|
| 곡선 | `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` 하나 | `globals.css` `:root` |
| 버튼·하단 내비 링크 누름 | `:active` 에서 `scale(0.97)`, transform 120ms | `globals.css` `@layer base` — `button`·`[role=button]`·`nav a` 전체. 목록 행·카드 같은 블록 링크는 빼서 스크롤 중 행이 출렁이지 않게 |
| 색·배경 전환 | 바뀌는 속성만 150ms | 같은 규칙. 요소에 `transition-colors` 를 따로 주면 누름 전환이 덮이니 주지 않는다 |
| 드문 등장 — 오류 문구(`ErrorText`), 저장 완료, 온보딩 카드 | `.appear`: 투명도 0→1 + 위로 4px, 200ms | `globals.css` `@layer components` |
| 모션 줄이기 | 누름 축소 끔, `.appear` 는 투명도만 | `@media (prefers-reduced-motion: reduce)` |

하지 않는 것: 탭 전환 애니메이션, 숫자 카운트업, 스크롤 연출, `ease-in`, `transition-all`(테스트가 막는다), 애니메이션 라이브러리.

## 6. 모바일·접근성 점검표

새 화면을 만들거나 고치면 라이트·다크 × 375px 로 확인한다. 2026-10-07 전 화면 점검 결과를 같이 적는다.

| 항목 | 기준 | 2026-10-07 결과 |
|---|---|---|
| 글자 대비 | 4.5:1 이상 | 토큰 조합 전부 통과 (테스트). 취소 배지는 `bg-line/60` 바탕이라야 4.72 — `bg-line` 그대로면 4.35 |
| 터치 영역 | 44×44px 이상 | 아이콘 버튼 40→44, 초대 코드 동작 버튼 키움. 예외: 문장 속 글자 링크, 달력 칸(375px 에 7칸이라 41px), 보기 전환 40px, 출근 알림 토글 48×28 — 모두 WCAG 최소 24px 은 넘는다 |
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
| 움직임 | 5절, `globals.css`, foundations 페이지 "움직임" |
| 글꼴·아이콘 | 4절, timesheet-ui 스킬 §2 |
| 사용자가 새 디자인 규칙을 정함 | 이 문서 해당 절 + [결정 목록](docs/decisions.md) 한 줄 |
