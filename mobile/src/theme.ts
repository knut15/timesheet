// 색·모양·글꼴 토큰. 값의 원본은 루트 DESIGN.md §2~4 와 web/src/app/globals.css 의 .dark 블록이다.
// 앱도 웹과 같이 항상 다크다 (2026-10-15 사용자 결정 "항상 다크"). 웹 토큰을 바꾸면 여기도 같이 바꾼다.
export const C = {
  background: "#09090b",
  foreground: "#fafafa",
  surface: "#18181b",
  line: "#27272a",
  muted: "#a1a1aa",
  accent: "#2dd4bf",
  onAccent: "#05201d",
  warn: "#f87171",
  ok: "#4ade80",
  caution: "#fbbf24",
} as const;

/** 투명도를 붙인 색 — Tailwind 의 `bg-accent/10` 과 같다 */
export function alpha(hex: string, a: number) {
  const n = Math.round(a * 255).toString(16).padStart(2, "0");
  return `${hex}${n}`;
}

/** 모서리 — 카드 8, 버튼·입력칸 6, 배지 4 (DESIGN.md §3) */
export const R = { card: 8, control: 6, pill: 4 } as const;

/** 본문 가로 여백 20, 카드 안 16, 카드 사이 12 */
export const S = { page: 20, card: 16, gap: 12 } as const;

/**
 * 글꼴 — 본문 Pretendard, 숫자 Geist Mono. 앱은 굵기마다 파일이 따로라 fontWeight 대신 family 를 고른다.
 * 파일은 assets/fonts (app.json 의 expo-font 플러그인이 앱에 넣는다).
 */
export const F = {
  regular: "Pretendard-Regular",
  medium: "Pretendard-Medium",
  semibold: "Pretendard-SemiBold",
  bold: "Pretendard-Bold",
  mono: "GeistMono-Regular",
} as const;
