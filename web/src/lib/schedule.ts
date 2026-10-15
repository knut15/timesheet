// 근무 시간표 표기·계산. 규칙은 docs/prd/13-work-schedule.md
export type Schedule = { days: number[]; start: string; end: string };

/** 화면 순서 — 월요일부터. 값은 Date.getDay() (0=일) */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 30분 단위 "00:00" ~ "23:30" */
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

const minutesOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

/** 주 시간·주 일수 — 서버 계산(contract.ts scheduleTerms)과 같은 식 */
export function scheduleTerms(s: Schedule) {
  return { workDaysPerWeek: s.days.length, weeklyHours: (s.days.length * (minutesOf(s.end) - minutesOf(s.start))) / 60 };
}

/** 저장하면 안 되는 이유. 없으면 null */
export function scheduleProblem(s: Schedule): string | null {
  if (s.days.length === 0) return "근무 요일을 하나 이상 골라 주세요.";
  if (minutesOf(s.end) <= minutesOf(s.start)) return "퇴근은 출근보다 늦어야 해요.";
  if (scheduleTerms(s).weeklyHours > 52) return "주 52시간을 넘어요.";
  return null;
}

/** "월·수·금 10:00~15:00" */
export function scheduleText(s: Schedule) {
  const days = WEEK_ORDER.filter((d) => s.days.includes(d)).map((d) => DAY_NAMES[d]).join("·");
  return `${days} ${s.start}~${s.end}`;
}

/** 입력칸 표기 — 12000 → "12,000" */
export const withCommas = (n: number) => (Number.isFinite(n) ? n.toLocaleString("ko-KR") : "");
/** 입력 글자에서 숫자만 — "12,0a00" → 12000, 비면 0 */
export const digitsOf = (s: string) => Number(s.replace(/\D/g, "").slice(0, 9)) || 0;
