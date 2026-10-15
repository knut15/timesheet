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

/** 날짜별 근무 변경 — 서버 ScheduleExceptionDto 에서 필요한 칸만 */
export type DayException = { date: string; kind: "off" | "work"; start: string | null; end: string | null };

const pad2 = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** 그날 근무 시각 — 날짜별 변경이 시간표보다 먼저다. 쉬는 날이면 null */
export function dayPlan(schedule: Schedule | null, exceptions: DayException[], day: Date): { start: string; end: string } | null {
  const ex = exceptions.find((e) => e.date === keyOf(day));
  if (ex) return ex.kind === "work" && ex.start && ex.end ? { start: ex.start, end: ex.end } : null;
  if (!schedule || !schedule.days.includes(day.getDay())) return null;
  return { start: schedule.start, end: schedule.end };
}

/**
 * 지금 근무 시간인지, 아니면 다음 근무가 언제인지 (내 정보 주간 리듬 카드, 2026-10-15).
 * 오늘부터 14일 안을 본다. 그 안에 근무가 없으면 null.
 */
export function nextShift(schedule: Schedule | null, exceptions: DayException[], now: Date):
  | { state: "working"; end: Date }
  | { state: "next"; at: Date; start: string; end: string }
  | null {
  for (let i = 0; i < 14; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const plan = dayPlan(schedule, exceptions, day);
    if (!plan) continue;
    const at = (t: string) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), Number(t.slice(0, 2)), Number(t.slice(3)));
    const s = at(plan.start), e = at(plan.end);
    if (i === 0 && now >= s && now < e) return { state: "working", end: e };
    if (s > now) return { state: "next", at: s, start: plan.start, end: plan.end };
  }
  return null;
}

/** 남은 시간 글자 — 90분 → "1시간 30분", 26시간 → "1일 2시간" */
export function untilText(ms: number) {
  const min = Math.max(0, Math.round(ms / 60_000));
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  if (d > 0) return `${d}일${h ? ` ${h}시간` : ""}`;
  if (h > 0) return `${h}시간${m ? ` ${m}분` : ""}`;
  return `${m}분`;
}
