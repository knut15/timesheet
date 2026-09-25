# TS-003 — 디자인 컴포넌트 가이드 (/guide, MDX)

- 상태: review — 구현·검증·배포 끝. 다크 모드 시각 비교·독립 QA 미실시
- 사용자 요청과 범위: "디자인팀 https://ui.shadcn.com/docs/components/base/avatar 이대로 timesheet 디자인 컴포넌트 가이드 만들고 개발팀은 mdx 로 페이지 만들어" (2026-09-25)
  - 사용자 결정: **문서 형식만 따른다**(컴포넌트 코드는 그대로, shadcn·Base UI 도입 없음), MDX 패키지 설치, 웹 앱 `/guide` 운영 공개
- 부모 에이전트와 현재 담당: 부모 = 현재 대화. 디자인(명세) ∥ 개발 1단계(MDX 기반) → 개발 2단계(페이지)
  - `.claude/agents/timesheet-*` 는 이 세션에서 에이전트 유형으로 안 잡힌다 — 범용 서브에이전트에 roles.md 절을 읽혀 위임
- 참고: shadcn Avatar 페이지 구성 — 제목·설명 → 미리보기/코드 → 설치 → 사용법 → 구성 → 예시 → API 표. timesheet-ui 스킬, docs/design/calendar.md
- 현재 코드: main(66d9bea)에서 딴 feature/component-guide. 설치됨: @next/mdx 16.3.6, @mdx-js/loader 3.1.1, @mdx-js/react 3.1.1, @types/mdx 2.0.14
- 담당별 허용 파일:

| 담당 | 허용 파일 |
|---|---|
| 디자인 | `docs/design/component-guide.md`(신규), `docs/design/README.md`, `.claude/skills/timesheet-ui/SKILL.md` |
| 개발(시니어) | `web/next.config.ts`, `web/mdx-components.tsx`(신규), `web/src/app/guide/**`(신규), `web/src/components/guide/**`(신규), `web/tsconfig.json`(mdx 필요 시만). 기존 컴포넌트는 **동작을 바꾸지 않는다** — 가이드에 필요한 export 추가만 |
| 부모 | 이 카드, docs/team/README.md, docs/README.md, docs/history, README, package.json·lockfile, 배포 |

- 완료 조건: /guide 에 컴포넌트별 MDX 페이지(shadcn 구성), 미리보기는 실제 컴포넌트, 코드 탭은 예시 원본. typecheck·lint·test·build, 운영 /guide 200. 로그인 없이 볼 수 있으므로 **브라우저로 실화면 확인**
- 반복 횟수와 중단 조건: 같은 실패를 새 증거 없이 2회 → 멈추고 보고

## 검증

| 기준 | 환경·명령·증거 | pass / fail / not-run |
|---|---|---|
| 페이지 구성 | 17쪽(/guide, 기초, 컴포넌트 15), 예시 51 — 빌드 라우트 ○ 17 | pass |
| 미리보기 = 실제 컴포넌트, 코드 = 예시 원본 | 빌드 HTML 표본 5곳에 원본 소스, 브라우저에서 "코드" 탭 전환 확인 | pass |
| 390px 가로 스크롤 | 운영 주소를 390px iframe 으로 17쪽 전부 — 0쪽 넘침 (처음엔 기초 1쪽 437px → 수정) | pass |
| 다크 모드 스크롤바 | 목차 옆 흰 스크롤바 → color-scheme + thin 으로 수정, 스크린샷 확인 | pass |
| typecheck·lint·test·build | 부모 재실행: 오류 0, lint 0, 39/39, build 성공 | pass |
| 라이트 모드 화면 | 브라우저가 다크라 라이트는 보지 못함 | not-run |
| 독립 QA | 미투입 | not-run |

## 전달 기록

- 2026-09-25 / 부모 → 디자인·개발 / 이 카드 / — / 디자인 명세 작성 ∥ MDX 기반 구축
- 2026-09-25 / 디자인 → 개발 / docs/design/component-guide.md (15 컴포넌트, 예시 49) / — / 2단계
- 2026-09-25 / 개발 → 부모 / 가이드 85 파일, 로고 예시 포함 / remark-gfm·하이라이트는 제안만(설치 안 함) / 부모: 재검증, 브라우저 확인, 스크롤바·390px 수정, 배포

