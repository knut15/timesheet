# 디자인 새로 잡기 — 구현 계획

[← 문서 목차](../../README.md)

> **에이전트 작업자에게:** 이 계획은 superpowers:subagent-driven-development(추천) 또는 superpowers:executing-plans 로 태스크 단위로 실행한다. 단계는 체크박스(`- [ ]`)로 추적한다.

**목표:** 라이트 청록·다크 민트 토큰으로 웹 전체 분위기를 바꾸고, CSS 만으로 누름 반응·모바일 마감을 넣고, 기준을 루트 `DESIGN.md` 에 남긴다.

**구조:** `web/src/app/globals.css` 의 토큰 **값**을 바꾸고 토큰 셋(`on-accent`·`ok`·`caution`)과 곡선 토큰을 더한다. 토큰을 안 쓰고 색을 직접 박은 곳만 화면에서 고친다. 대비와 직접 색 금지는 `node --test` 테스트로 고정한다.

**기술:** Next.js 16 App Router, Tailwind CSS v4(`@theme inline`), lucide-react, `node --test`. 새 npm 패키지 없음.

**설계:** [2026-10-07-design-refresh-design.md](../specs/2026-10-07-design-refresh-design.md) — 실행자는 이 계획과 설계를 같이 읽는다.

## 전역 제약

- 작업 브랜치 `claude/design-refresh` (release 에서 땀). 머지·푸시는 사용자 승인 뒤
- 새 npm 패키지 금지. 움직임은 CSS 만
- 글꼴 Pretendard, 아이콘 lucide 그대로. 화면 구조·라우트·로직 그대로
- 토큰 이름(`--background`·`--foreground`·`--surface`·`--line`·`--muted`·`--accent`·`--warn`)은 바꾸지 않는다
- 색 값은 설계 §3-1 표 그대로:
  - 라이트 `--background #f6f8f8` `--foreground #0f2a2a` `--surface #ffffff` `--line #e2eaea` `--muted #5b6f6f` `--accent #0f766e` `--on-accent #ffffff` `--warn #b91c1c` `--ok #166534` `--caution #92400e`
  - 다크 `--background #0b1213` `--foreground #e8f1f0` `--surface #132022` `--line #1f3134` `--muted #86a19f` `--accent #2dd4bf` `--on-accent #05201d` `--warn #f87171` `--ok #4ade80` `--caution #fbbf24`
- 모서리: 카드 14px, 버튼·입력칸 10px. 그림자 없음
- 곡선 `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. `ease-in`·`transition: all`(Tailwind `transition-all`) 금지
- 글자 대비 4.5:1 이상 (라이트·다크 모두)
- 코드 주석은 한국어, 커밋 메시지는 한국어 + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- Next.js 코드를 쓰기 전에 `web/node_modules/next/dist/docs/` 를 확인한다 (`web/AGENTS.md`)

## 리뷰에서 볼 것

테스트가 직접 잡지 못하는데 사용자가 겪기 쉬운 것. 각 줄의 확인은 해당 태스크에 넣었다.

1. **다크 모드 민트 버튼 위 글자** — 흰 글자가 하나라도 남으면 읽기 어렵다(대비 1.86). → 태스크 3 의 직접 색 금지 테스트
2. **옅은 상태 바탕(`bg-ok/15` 등) 위 상태 글자** — 처음 값은 라이트에서 3.81~4.09 로 미달이라 진한 값으로 바꿨다. 다시 떨어지지 않게 → 태스크 2 의 대비 테스트에 섞인 바탕 조합
3. **출퇴근 알림 카드(`TimesheetApp.tsx:151`)** — 강조색 바탕 위 반전 버튼. 다크에서 버튼·글자 색이 뒤집혀야 한다. → 태스크 3 단계, 태스크 5 스크린샷
4. **아이폰 홈 바와 하단 내비** — `env()` 는 `viewport-fit=cover` 없이는 0 이다. → 태스크 2 에서 viewport 를 넣고, 태스크 5 에서 HTML `<meta name="viewport">` 확인
5. **모션 줄이기 설정** — 누름 축소·등장 이동이 꺼져야 한다. → 태스크 4 에서 Playwright `reducedMotion: "reduce"` 로 확인

---

### 태스크 1: 두 스킬 전역 설치

**파일:** 저장소 변경 없음 (`~/.claude` 아래)

**인터페이스:**
- 만드는 것: 이후 태스크가 쓰는 스킬 `ui-ux-pro-max`(플러그인), `emil-design-eng`·`review-animations`·`mobile-native` 등(`~/.claude/skills/`)

- [ ] **단계 1: ui-ux-pro-max 플러그인 설치**

```bash
claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```
기대: 두 명령 모두 성공 메시지. 실패하면 **멈추고 사용자에게 묻는다** (설계 §5-3).

- [ ] **단계 2: emil 스킬 설치 — `write-swift`·`animate-expo` 제외**

`npx skills@latest add emilkowalski/skills --help` 로 전역(-g)·스킬 선택 옵션을 먼저 확인하고, 전역으로 나머지 12개만 설치한다. 선택 옵션이 없으면 전부 설치한 뒤 두 폴더를 `~/.claude/skills/` 에서 지운다.

- [ ] **단계 3: 설치 확인**

Run: `claude plugin list | grep -i ui-ux; ls ~/.claude/skills | grep -E "emil-design-eng|review-animations|mobile-native"; ls ~/.claude/skills | grep -cE "write-swift|animate-expo"`
기대: ui-ux-pro-max 한 줄, 세 스킬 이름, 마지막 줄 `0`. 설치된 버전(플러그인 버전, emil 저장소 커밋)을 적어 둔다 — 태스크 6 의 히스토리에 넣는다.

---

### 태스크 2: 토큰·모양·곡선·모바일 기반

**파일:**
- 만들기: `web/src/lib/design-tokens.test.mjs`
- 고치기: `web/src/app/globals.css` (`:root`, `@theme inline`, 다크 `@media`, `body`, `select.field` 화살표 색)
- 고치기: `web/src/app/layout.tsx` (`viewport` 내보내기 추가)

**인터페이스:**
- 만드는 것: Tailwind 클래스 `bg-on-accent`/`text-on-accent`, `text-ok`/`bg-ok`, `text-caution`/`bg-caution`, CSS 변수 `--ease-out`. 모서리 `rounded-xl`=10px, `rounded-2xl`=14px (Tailwind `--radius-xl`·`--radius-2xl` 재정의)
- 만드는 것: 테스트 도우미 `readTokens(mode: "light" | "dark"): Record<string, string>` — `globals.css` 를 읽어 `:root` / 다크 `@media` 안 `:root` 의 `--이름: #hex` 를 돌려준다. 태스크 3 테스트도 같은 파일에 들어간다

- [ ] **단계 1: 대비 테스트 작성** — `design-tokens.test.mjs`

```js
// WCAG 상대 휘도 대비. 섞인 바탕은 fg 를 alpha 만큼 bg 위에 섞은 색
test("라이트·다크 글자 대비 4.5:1 이상", () => {
  for (const mode of ["light", "dark"]) {
    const t = readTokens(mode);
    const pairs = [
      ["foreground", "background"], ["foreground", "surface"],
      ["muted", "background"], ["muted", "surface"],
      ["accent", "surface"], ["on-accent", "accent"],
      ["warn", "surface"], ["ok", "surface"], ["caution", "surface"],
    ];
    for (const [fg, bg] of pairs) assert.ok(contrast(t[fg], t[bg]) >= 4.5, `${mode} ${fg}/${bg}`);
    // 상태 배지: 카드 위에 15% 섞은 바탕 (StatusPill 의 bg-*/15)
    for (const s of ["ok", "caution", "warn"]) assert.ok(contrast(t[s], mix(t[s], t.surface, 0.15)) >= 4.5, `${mode} ${s}/15`);
  }
});
test("설계 §3-1 의 값 그대로", () => {
  assert.equal(readTokens("light").accent, "#0f766e");
  assert.equal(readTokens("dark").accent, "#2dd4bf");
  assert.equal(readTokens("dark")["on-accent"], "#05201d");
});
```

- [ ] **단계 2: 실패 확인**

Run: `pnpm --filter timesheet-web test`
기대: `design-tokens.test.mjs` 실패 (`on-accent` 없음, accent 값 다름). 다른 테스트는 통과.

- [ ] **단계 3: `globals.css` 고치기**
  - `:root`·다크 `:root` 값을 전역 제약의 표대로. `--on-accent`·`--ok`·`--caution` 추가
  - `@theme inline` 에 `--color-on-accent`·`--color-ok`·`--color-caution`, `--radius-xl: 10px`, `--radius-2xl: 14px`
  - `:root` 에 `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`
  - `@layer base`: `html { -webkit-tap-highlight-color: transparent; }`, `button, a, [role="button"], label { touch-action: manipulation; }`
  - `select.field` 화살표 SVG 의 `stroke='%2378716c'` 를 새 라이트 muted `%235b6f6f` 로
  - 대비 테스트가 실패하면 **값을 바꾸지 말고 멈추고 보고**한다 (설계 값은 사용자 승인 사항. 계획 작성 때 계산으로는 모두 통과)

- [ ] **단계 4: `layout.tsx` 에 viewport**

`import type { Viewport } from "next"` 후 `export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" }`. `maximumScale`·`userScalable` 은 넣지 않는다(확대 막기 금지). 하단 내비는 이미 `pb-[env(safe-area-inset-bottom)]` 를 쓴다(`shell.tsx` BottomNav) — 그대로.

- [ ] **단계 5: 통과 확인**

Run: `pnpm --filter timesheet-web test && pnpm typecheck`
기대: 전부 통과.

- [ ] **단계 6: 커밋** — `토큰을 라이트 청록·다크 민트로 바꾸고 모바일 기본값을 넣는다`

---

### 태스크 3: 직접 박은 색을 토큰으로

**파일:**
- 테스트: `web/src/lib/design-tokens.test.mjs` (테스트 추가)
- 고치기 (강조 버튼 `text-white` → `text-on-accent`): `src/app/admin/members/[userId]/page.tsx:123`, `src/app/admin/requests/page.tsx:133,241`, `src/app/admin/members/page.tsx:87`, `src/app/admin/store/page.tsx:73,143`, `src/app/admin/invites/page.tsx:48,104`, `src/app/onboarding/page.tsx:55`, `src/components/AuthForm.tsx:65`, `src/components/TimesheetApp.tsx:172`, `src/components/member/RequestsPanel.tsx:58,93`, `src/components/member/RecordsPanel.tsx:284`
- 고치기 (상태 색): `src/components/ui.tsx:97-100` (StatusPill), `src/components/calendar/CalendarLegend.tsx:12`, `src/components/calendar/MonthGrid.tsx:60,78`, `src/app/admin/page.tsx:68`, `src/app/admin/calendar/page.tsx:187`
- 고치기 (기타): `src/components/TimesheetApp.tsx:151,153` (출퇴근 알림 카드), `src/components/shell.tsx:92` (내비 배지)

**인터페이스:**
- 쓰는 것: 태스크 2 의 `text-on-accent`·`ok`·`caution` 클래스, `readTokens`

- [ ] **단계 1: 직접 색 금지 테스트 추가**

```js
test("화면 코드에 직접 박은 색이 없다", () => {
  // web/src 아래 .tsx 전부. 허용: 아바타 흰 글자(고정 배경색, 다크와 무관), 토글 손잡이 bg-white
  const ALLOW = [/shell\.tsx:\d+ .*select-none.*text-white/, /TimesheetApp\.tsx:.*rounded-full bg-white transition/];
  const BAD = /\b(text|bg|border|ring)-(white|black|(green|emerald|amber|yellow|red|blue|stone|gray|slate)-\d{2,3})\b/;
  assert.deepEqual(scanTsx(BAD).filter((hit) => !ALLOW.some((re) => re.test(hit))), []);
});
test("transition-all 을 쓰지 않는다", () => {
  assert.deepEqual(scanTsx(/\btransition-all\b/), []);
});
```
`scanTsx(re): string[]` 는 `src/**/*.tsx` 를 줄 단위로 읽어 `"<상대경로>:<줄> <내용>"` 을 돌려준다.

- [ ] **단계 2: 실패 확인**

Run: `pnpm --filter timesheet-web test`
기대: 위 두 테스트 실패, 걸린 줄 목록이 위 "파일" 목록과 같다(+ `transition-all` 쓰는 곳). 목록에 없는 파일이 나오면 같은 규칙으로 고칠 대상에 넣는다.

- [ ] **단계 3: 고치기**
  - 강조 버튼: `text-white` → `text-on-accent`
  - StatusPill: 대기 셋 `bg-caution/15 text-caution`, 승인 `bg-ok/15 text-ok` (`dark:` 변형 지운다 — 토큰이 모드를 맡는다)
  - 달력: 대기 아이콘 `text-caution`, 근무 점 `bg-ok`. 관리 화면 근무 중 점 `bg-ok`
  - 출퇴근 알림 카드: 바탕 `bg-accent text-on-accent`, 안의 버튼 `bg-on-accent text-accent` (다크에서 어두운 버튼·민트 글자로 뒤집힌다)
  - 내비 배지: `bg-warn text-white` → `bg-warn text-background` (다크 warn `#f87171` 위 흰 글자는 대비 부족)
  - `transition-all` 은 바뀌는 속성만으로 (`transition-[left]` 등) + `duration-150 ease-[var(--ease-out)]`

- [ ] **단계 4: 통과 확인**

Run: `pnpm --filter timesheet-web test && pnpm typecheck`
기대: 전부 통과.

- [ ] **단계 5: 커밋** — `화면에 직접 박은 색을 토큰으로 바꾼다`

---

### 태스크 4: 누름 반응·등장·모션 줄이기

**파일:**
- 고치기: `web/src/app/globals.css` (`@layer base`·`@layer components`)
- 고치기: `web/src/components/ui.tsx` (`ErrorText`), `web/src/app/admin/store/page.tsx:142` (저장 완료 문구), `web/src/app/onboarding/page.tsx:41,59` (`Card` 두 개)

**인터페이스:**
- 만드는 것: CSS 클래스 `.appear` — 한 번 등장(200ms). 누름 반응은 `button` 전역이라 클래스 없음

- [ ] **단계 1: 누름 반응** — `@layer base`

`button:not(:disabled), a[href], [role="button"]` 에 `transition: transform 120ms var(--ease-out)`, `:active` 에서 `transform: scale(0.97)`. 하단 내비 링크·버튼도 이 규칙을 받는다 (색 전환 `transition-colors` 는 그대로 두되 길이 150ms 로).

- [ ] **단계 2: 등장** — `@layer components`

`.appear { animation: appear 200ms var(--ease-out) both; }`, `@keyframes appear { from { opacity: 0; transform: translateY(4px); } }`. `ErrorText` 의 `<p>`, 저장 완료 `<p>`, 온보딩 `Card` 두 개에 `appear` 를 붙인다 (`Card` 는 `className` prop 으로).

- [ ] **단계 3: 모션 줄이기**

`@media (prefers-reduced-motion: reduce)` 안에서 `.appear { animation-name: fade; }` (`@keyframes fade { from { opacity: 0 } }`), 누름 `:active` 의 `transform: none`.

- [ ] **단계 4: 확인**

Run: `pnpm --filter timesheet-web build`
기대: 빌드 성공. 그리고 Playwright 로 로그인 화면을 열어(라이트) 버튼을 `mouse.down()` 한 상태에서 `getComputedStyle(button).transform` 이 `matrix(0.97, …)` 인지, `reducedMotion: "reduce"` 컨텍스트에서는 `none` 인지 확인한다. 브라우저는 `~/Library/Caches/ms-playwright/chromium_headless_shell-1223` 의 실행 파일, 모듈은 `~/workspace/autofix/node_modules/.pnpm/playwright@1.63.0` 을 쓴다(스크립트는 세션 scratchpad 에 둔다).

- [ ] **단계 5: 커밋** — `누름 반응과 드문 등장 효과를 CSS 로 넣는다`

---

### 태스크 5: 전 화면 확인과 리뷰

**파일:** 확인에서 나온 수정만 (해당 화면 파일)

- [ ] **단계 1: 스크린샷** — 라이트·다크 × 375×812

로컬 서버(웹 3200·API 4200)를 띄우고 Playwright 로: `/login`, `/signup` → 가입(이메일 `design-check-<시각>@example.com`) → `/onboarding` → 매장 만들기 → `/admin` 5화면(대시보드·달력·요청·멤버·매장)과 `/admin/invites` → 멤버 화면은 두 번째 계정을 초대 코드로 가입시켜 `/` 5탭 → `/guide`, `/guide/foundations`. `colorScheme: "light" | "dark"` 두 번. 저장 경로는 세션 scratchpad.

- [ ] **단계 2: 직접 본다**

스크린샷을 하나씩 열어 확인: 흰 글자 남음, 대비 낮은 글자, 겹침, 가로 스크롤(`document.documentElement.scrollWidth > 375` 도 스크립트로 검사), 하단 내비 위치. 문제는 고치고 같은 스크린샷을 다시 찍는다.

- [ ] **단계 3: viewport 확인**

Run: `curl -s http://localhost:3200/login | grep -o '<meta name="viewport"[^>]*>'`
기대: `viewport-fit=cover` 포함, `maximum-scale`·`user-scalable` 없음.

- [ ] **단계 4: ui-ux-pro-max 점검표**

설계 §5-1 의 6절 항목(대비, 터치 44px, 아이콘 버튼 `aria-label`, 포커스 표시, 375px 가로 스크롤, 모션 줄이기)을 화면별로 확인하고 결과 표를 남긴다. 포커스 표시는 Tab 키 이동 스크린샷으로 본다.

- [ ] **단계 5: emil `review-animations`**

태스크 4 의 diff 에 `review-animations` 를 돌려 Before/After 표를 받는다. 지적이 설계 §4 와 맞으면 반영, 설계와 어긋나면(예: 탭 전환 애니메이션 추가) 반영하지 않고 보고에 남긴다.

- [ ] **단계 6: 확인용 계정 정리**

이 태스크에서 만든 `design-check-*@example.com` 계정과 그 매장을 로컬 DB 에서 지운다 (지우기 전 대상 목록을 출력해 확인).

- [ ] **단계 7: 커밋** (수정이 있었으면) — `화면 점검에서 나온 어긋남을 고친다`

---

### 태스크 6: DESIGN.md 와 문서·스킬 동기화

**파일:**
- 만들기: `DESIGN.md` (루트)
- 고치기: `CLAUDE.md` (1절 예외, 1절 문서 표, 5절 timesheet-ui 행), `.claude/skills/timesheet-ui/SKILL.md` (§0), `docs/design/component-guide.md` (§2-1·§2-3), `web/src/components/guide/Foundations.tsx` (`TOKENS`), `web/src/app/guide/foundations/page.mdx` (모서리·움직임), `docs/README.md`, `docs/design/README.md`, `docs/decisions.md`, `docs/history/2026-10-07.md` (전역 스킬 `work-history` 형식)

- [ ] **단계 1: `DESIGN.md`** — 설계 §5-1 의 7절 구성. 색 표의 대비는 태스크 2 테스트가 계산한 값, 점검표는 태스크 5 결과를 쓴다
- [ ] **단계 2: `CLAUDE.md`** — 1절 "루트에는 `README.md`·`DESIGN.md`·이 파일만" 과 문서 표 한 줄, 5절 timesheet-ui 행에 "색·모양·움직임 기준은 DESIGN.md"
- [ ] **단계 3: timesheet-ui §0** — 글꼴·아이콘 등 디자인 기초 표를 `DESIGN.md` 로 옮기고 §0 은 "디자인 기초의 원본은 DESIGN.md" 한 줄 + 셸에만 해당하는 규칙(입력칸 `.field`, shadcn 들이는 법, 가이드 동기화)만 남긴다
- [ ] **단계 4: 가이드** — `Foundations.tsx` `TOKENS` 에 새 값과 `--on-accent`·`--ok`·`--caution` 세 줄, foundations 페이지에 모서리 10/14px·`--ease-out`·누름 반응, `component-guide.md` §2-1 표와 §2-3 모서리를 같은 값으로
- [ ] **단계 5: 목차·결정·히스토리** — `docs/README.md` 디자인 절에 DESIGN.md, `docs/design/README.md` 첫 줄에 DESIGN.md, `decisions.md` 에 `| 2026-10-07 | 라이트 청록·다크 민트, CSS 움직임만 | DESIGN.md |`, 히스토리에 결정·설치한 스킬 이름과 버전(태스크 1)
- [ ] **단계 6: 스킬 대조**

Run: `git diff --stat release... && grep -rln "globals.css\|--accent\|#2563eb" .claude/skills docs`
기대: 옛 값(`#2563eb` 는 아바타 색으로만 남음, `#f5f5f4`·`#78716c` 없음)이 남은 문서 없음. 남으면 고친다.

- [ ] **단계 7: 최종 확인**

Run: `pnpm --filter timesheet-web test && pnpm typecheck && pnpm --filter timesheet-web build`
기대: 전부 통과.

- [ ] **단계 8: 커밋** — `DESIGN.md 를 두고 디자인 문서·스킬·가이드를 새 기준에 맞춘다`
