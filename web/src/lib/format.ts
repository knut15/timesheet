// 화면 표기. 시계는 모바일에서 한 줄에 들어가야 한다 (2026-09-25 사용자 요청: "초단위가 개행처리됨 → 한줄로")

/** 24시간 HH:MM:SS. `15시 58분 12초` 보다 좁아서 390px 폭 카드에서도 한 줄에 들어간다. */
export function clockText(t: number | Date): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
