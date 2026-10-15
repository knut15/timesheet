// 모양 상수 — "use client" 가 없는 모듈이라 서버 컴포넌트에서 가져와도 문자열 그대로다. ui.tsx 가 다시 내보낸다.
// 기준은 DESIGN.md §3·§4 (2026-10-15 B 시안).

/** 숫자(시각·시간·금액·날짜)는 고정폭 글꼴 — 자릿수가 바뀌어도 흔들리지 않는다 (2026-10-15 B 시안) */
export const NUM = "font-mono tabular-nums";

/**
 * 버튼 모양. 색 테두리 없이 — 주 동작은 진한 바탕, 보통은 선, 추가는 점선 (2026-10-15 B 시안).
 * 높이: 기본 44px(h-11), 작은 것 32px(h-8). 모양만 주고 폭·여백은 쓰는 쪽에서 더한다.
 */
export const BTN = {
  primary: "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 text-[15px] font-semibold text-background disabled:bg-line disabled:text-muted",
  secondary: "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50",
  small: "inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-line bg-surface px-2.5 text-xs font-medium text-foreground hover:bg-background disabled:opacity-50",
  dashed: "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-dashed border-muted/60 px-4 text-sm font-medium text-muted hover:text-foreground",
  danger: "inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-line bg-surface px-2.5 text-xs font-medium text-foreground hover:border-warn/40 hover:text-warn",
} as const;
