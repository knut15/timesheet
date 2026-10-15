# 디자인 새로 잡기 — 설계

[← 문서 목차](../../README.md)

2026-10-07 사용자와 정한 설계다. 구현 계획은 이 문서를 승인받은 뒤 따로 쓴다. 이 작업이 끝나면 디자인 기준의 원본은 루트 `DESIGN.md` 가 된다. 이 문서는 그 작업을 왜·어떻게 했는지 남기는 기록이다.

## 1. 목표

| 무엇 | 내용 |
|---|---|
| 요청 | "DESIGN.md 파일을 만들고, ui-ux-pro-max-skill·emilkowalski/skills 두 스킬로 디자인 수정" |
| 목적 | 분위기를 새로 잡는다 (사용자 선택: "분위기 자체를 새로") |
| 범위 | 전체 한 번에 — 멤버 5탭, 마스터 화면(대시보드·달력·요청·멤버·매장·초대), 로그인·가입·`/join`·온보딩, `/guide` |
| 성공 기준 | 모든 화면이 새 토큰을 따르고, 라이트·다크 모두 글자 대비 4.5:1 이상, 375px 폭에서 가로 스크롤·겹침 없음, `typecheck`·`build`·`test` 통과 |

### 바꾸지 않는 것 (가정 — 사용자가 고치면 따른다)

- 글꼴 Pretendard, 아이콘 lucide (2026-09-25 사용자 결정)
- 화면 구조: 헤더·하단 내비·탭 순서·라우트
- 급여·인증 등 로직

## 2. 분위기 — 라이트 C, 다크 민트

브라우저 시안 네 개(A 지금·B 따뜻한 오렌지·C 청록 평면·D 다크 라임) 중 사용자가 "C, D 라이트/다크모드로" 를 골랐다.
그대로 합치면 모드마다 강조색이 달라(청록↔라임) 다른 앱처럼 보여서, 짝짓는 세 안 중 **2번 — 다크도 청록 계열(민트)** 을 골랐다.

- 라이트: 옅은 청회색 배경, 흰 카드, 청록 강조, 그림자 없는 평면
- 다크: D 의 아주 어두운 배경과 선명한 숫자, 강조만 민트
- 앱은 기기 설정(`prefers-color-scheme`)을 따른다. 수동 전환은 만들지 않는다

ui-ux-pro-max `--design-system` 이 추천한 글꼴(Plus Jakarta Sans, Garamond 등)은 한글이 없어 쓰지 않는다.

## 3. 구현 방식 — 토큰 값 교체 (사용자 선택: 1번)

지금 토큰 이름(`--background`·`--surface`·`--accent` …)을 그대로 두고 **값만 바꾼다.** 빠진 토큰 셋을 더한다. 화면 대부분은 토큰을 따라 바뀌고, 토큰을 안 쓰고 색을 직접 박은 곳만 고친다.

버린 안: shadcn 토큰 이름(`primary`·`card` …)으로 전면 교체. 모든 화면 클래스가 바뀌고, "shadcn 은 지목한 것만" 규칙(timesheet-ui §0)과 어긋난다.

### 3-1. 색 토큰 (`web/src/app/globals.css`)

| 토큰 | 라이트 | 다크 | 대비 (계산) |
|---|---|---|---|
| `--background` | `#f6f8f8` | `#0b1213` | |
| `--foreground` | `#0f2a2a` | `#e8f1f0` | 배경 대비 14.23 / 16.46 |
| `--surface` | `#ffffff` | `#132022` | |
| `--line` | `#e2eaea` | `#1f3134` | |
| `--muted` | `#5b6f6f` | `#86a19f` | 배경 4.99 / 6.86, 카드 5.32 / 6.05 |
| `--accent` | `#0f766e` | `#2dd4bf` | 글자로 쓸 때 카드 대비 5.47 / 8.97 |
| `--on-accent` **(새로)** | `#ffffff` | `#05201d` | 강조 위 글자 5.47 / 9.17 |
| `--warn` | `#b91c1c` | `#f87171` | 카드 6.47 / 6.04, 15% 바탕 위 5.0 / 4.89 |
| `--ok` **(새로)** | `#166534` | `#4ade80` | 카드 7.13 / 9.58, 15% 바탕 위 5.66 / 6.94 |
| `--caution` **(새로)** | `#92400e` | `#fbbf24` | 카드 7.09 / 10.0, 15% 바탕 위 5.59 / 7.21 |

`@theme inline` 에 `--color-on-accent`·`--color-ok`·`--color-caution` 을 잇는다. 상태 색은 배지(`bg-*/15` 옅은 바탕 + 같은 색 글자)에도 쓴다. 처음 값(라이트 ok `#15803d`·caution `#b45309`·warn `#dc2626`)은 배지 대비가 4.09·4.08·3.81 로 모자라, 2026-10-07 사용자 결정으로 라이트만 한 단계 진하게 바꿨다.

### 3-2. 지금 코드에서 고칠 곳 (조사 결과)

| 문제 | 개수 | 처리 |
|---|---|---|
| 강조색 버튼 글자 `text-white` | 17곳 | `text-on-accent`. 다크의 민트 위 흰 글자는 대비 1.86 이라 읽기 어렵다 |
| 상태 색 직접 지정 (`green-*`, `amber-*`, `red-*`) | 약 20곳 | `ok`·`caution`·`warn` 토큰 |
| `bg-white` | 2곳 | 맥락을 보고 `surface` 또는 그대로 |
| select 화살표 SVG 의 색 `%2378716c` (`.field`) | 1곳 | 새 `--muted` 값에 맞춘다 |

### 3-3. 모양

- 모서리: 카드 14px, 버튼·입력칸 10px. `rounded-xl`(12px) 로 흩어진 곳을 맞춘다
- 테두리 1px `--line`, 그림자 없음
- 입력칸 높이 44px·`text-base`(16px) 는 그대로 — iOS 확대 방지와 터치 영역

## 4. 움직임과 디테일 — CSS 만 (사용자 선택)

emil 스킬 기준 "얼마나 자주 보나": 하루 수십 번 보는 동작(탭 전환)은 움직이지 않는다. 누르는 순간의 반응과 모바일 마감에 집중한다. 새 패키지 없음.

### 4-1. 넣는 것

| 대상 | 값 |
|---|---|
| 곡선 토큰 | `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. ease-in 금지 |
| 버튼·내비·`IconButton` 누름 | `:active` 에서 `scale(0.97)`, `transform` 120ms ease-out |
| 색·배경 전환 | 바뀌는 속성만 지정해 150ms. `transition: all` 금지 |
| 드물게 보는 것 — 오류 문구(`ErrorText`), 저장 완료 알림, 온보딩 카드 | `opacity` 0→1 + `translateY(4px)`→0, 200ms ease-out |
| `prefers-reduced-motion: reduce` | 이동·크기 변화 끄고 색 변화만 |

### 4-2. 모바일 마감 (emil `mobile-native`)

| 문제 | 처리 |
|---|---|
| 탭할 때 회색 번쩍임 | `-webkit-tap-highlight-color: transparent` |
| 탭 반응 지연 | 버튼·링크에 `touch-action: manipulation` |
| 하단 내비와 홈 바 겹침 | `viewport-fit=cover` + `env(safe-area-inset-bottom, 0px)`. 지금 상태를 먼저 확인한다 |
| 터치 뒤 hover 남음 | Tailwind v4 `hover:` 가 이미 `(hover: hover)` 로 감싼다 — 그대로 |

### 4-3. 넣지 않는 것

탭 전환 애니메이션, 숫자 카운트업, 스크롤 연출, 애니메이션 라이브러리.

## 5. 문서와 스킬

### 5-1. `DESIGN.md` (루트, 사용자 선택)

디자인 기준의 원본. 절 구성:

1. 분위기 — 라이트 C·다크 민트, 고른 날짜와 이유
2. 색 토큰 — 3-1 표 (값·대비)
3. 모양 — 모서리·테두리·그림자·간격
4. 글꼴·아이콘 — timesheet-ui §0 에서 옮겨 온다
5. 움직임 — 4절 표와 넣지 않는 것
6. 모바일·접근성 점검표 — ui-ux-pro-max 기준 (대비 4.5:1, 터치 44px, 아이콘 버튼 `aria-label`, 포커스 표시, 375px 가로 스크롤 없음, 모션 줄이기)
7. 바꿀 때 같이 고칠 곳 — `globals.css`, `/guide` 기초 페이지, `docs/design/component-guide.md`, timesheet-ui 스킬

### 5-2. 다른 문서

| 문서 | 바뀌는 점 |
|---|---|
| `CLAUDE.md` | 1절: 루트에 `DESIGN.md` 도 둔다는 예외. 5절 표: timesheet-ui 행에 DESIGN.md 연결 |
| `.claude/skills/timesheet-ui/SKILL.md` | 셸 규칙의 원본은 그대로. §0 디자인 기초는 DESIGN.md 를 가리키게 줄여 원본을 하나로 |
| `docs/design/component-guide.md`, `/guide` 기초·컴포넌트 예시 | 새 토큰 값, `on-accent`·`ok`·`caution` 예시 |
| `docs/README.md`, `docs/design/README.md` | DESIGN.md 와 이 문서 링크 |
| `docs/decisions.md` | 2026-10-07 디자인 결정 한 줄 |
| `.gitignore` | `.superpowers/` (브라우저 시안 폴더) |

### 5-3. 스킬 전역 설치 (사용자 선택)

| 스킬 | 방법 |
|---|---|
| ui-ux-pro-max | 공식 Claude Code 플러그인: `claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` → `claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| emilkowalski/skills | `npx skills@latest add emilkowalski/skills` 로 `~/.claude/skills` 에. 웹과 무관한 `write-swift`·`animate-expo` 는 뺀다 |

설치한 이름·버전은 완료 보고와 작업 히스토리에 남긴다. 설치가 위 명령대로 안 되면 멈추고 사용자에게 묻는다.

## 6. 작업 방식

- 브랜치: `release` 에서 딴 `claude/design-refresh`. 끝나면 `release` 위로 리베이스 → 스쿼시 머지 ([브랜치 전략](../../branching.md)). 머지·푸시는 사용자 승인 뒤
- `main` 이 원격보다 커밋 5개 앞서 있다 — 이 작업과 별개라 손대지 않는다
- 순서: 스킬 설치 → 토큰 → 공통 컴포넌트(`ui.tsx`·`shell.tsx`·`AuthForm`) → 화면별 → 문서·스킬 → 검증

## 7. 검증

| 무엇 | 방법 |
|---|---|
| 깨진 곳 | `pnpm typecheck`, `pnpm --filter timesheet-web build`, `pnpm --filter timesheet-web test` |
| 색 대비 | 토큰 조합 전부(옅은 바탕 포함)를 스크립트로 계산 — 4.5:1 이상 |
| 남은 직접 색 | `text-white`·`green-`·`amber-`·`red-`·`stone-` grep 결과 0 (의도한 예외는 이유를 적는다) |
| 화면 | 라이트·다크 × 375px 로 멤버 5탭, 마스터 화면, 로그인·가입·온보딩, `/guide` 스크린샷을 직접 본다 — 가로 스크롤·겹침·흰 글자 |
| 움직임 | emil `review-animations` — Before/After 표 |
| 접근성 | ui-ux-pro-max 점검표 (5-1 의 6절) |
