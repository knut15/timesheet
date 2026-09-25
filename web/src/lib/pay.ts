// 급여 계산. 규칙은 docs/prd/02-pay.md, docs/prd/03-overtime.md 를 따른다.

/** 2026년 최저임금(시간급). 연도가 바뀌면 docs/prd/02-pay.md 와 같이 고친다. */
export const MINIMUM_WAGE = 10320;
export const HOLIDAY_MIN_WEEKLY_HOURS = 15;
export const OVERTIME_RATE = 0.5;
export const OVERTIME_WEEKLY_LIMIT_HOURS = 12;

export type Shift = { id: string; start: number; end: number | null };

/** 결근이 아닌 날 — 승인된 휴가·대타(요청자 쪽). date 는 기기 시간대의 YYYY-MM-DD. docs/prd/09 */
export type Absence = { date: string; kind: "paid_leave" | "unpaid_leave" | "substitution" };

export type PaySettings = {
  hourlyWage: number;
  weeklyHours: number; // 1주 소정근로시간
  workDaysPerWeek: number; // 1주 소정근로일수
  fivePlus: boolean; // 상시 5인 이상 사업장
};

export type WeekPay = {
  weekStart: Date; // 월요일 00:00
  weekEnd: Date; // 다음 월요일 00:00
  workedMinutes: number;
  workDays: number;
  excusedDays: number; // 근무 기록 없이 결근 아닌 날 (휴가·대타)
  paidLeaveDays: number;
  basePay: number;
  leavePay: number; // 유급 휴가일 × 1일 소정근로시간 × 시급
  overtimeMinutes: number;
  overtimePay: number;
  holidayEligible: boolean;
  holidayPay: number;
  total: number;
  overtimeLimitExceeded: boolean;
};

const MIN = 60_000;
const DAY = 86_400_000;

/** 그 시각이 속한 주의 월요일 00:00 (기기 시간대). */
export function startOfWeek(t: number | Date): Date {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7; // 월=0 … 일=6
  d.setDate(d.getDate() - offset);
  return d;
}

/** 기기 시간대의 YYYY-MM-DD. 서버의 휴가 날짜와 같은 형식이다. */
export function dayKey(t: number | Date): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** YYYY-MM-DD 를 기기 시간대 자정으로. */
export function parseDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

export function shiftMinutes(s: Shift, now = Date.now()): number {
  return Math.max(0, Math.round(((s.end ?? now) - s.start) / MIN));
}

/** 한 주에 속한 근무 기록(출근일 기준)으로 그 주 급여를 계산한다. */
export function computeWeek(weekStart: Date, shifts: Shift[], settings: PaySettings, now = Date.now(), absences: Absence[] = []): WeekPay {
  const { hourlyWage, weeklyHours, workDaysPerWeek, fivePlus } = settings;
  const perMinute = hourlyWage / 60;

  const byDay = new Map<string, number>();
  for (const s of shifts) {
    const key = dayKey(s.start);
    byDay.set(key, (byDay.get(key) ?? 0) + shiftMinutes(s, now));
  }
  const workedMinutes = [...byDay.values()].reduce((a, b) => a + b, 0);
  const workDays = byDay.size;

  const weeklySchedMin = weeklyHours * 60;
  const dailySchedMin = workDaysPerWeek > 0 ? weeklySchedMin / workDaysPerWeek : 0;
  let dailyExcess = 0;
  for (const m of byDay.values()) dailyExcess += Math.max(0, m - dailySchedMin);
  const weeklyExcess = Math.max(0, workedMinutes - weeklySchedMin);
  const overtimeMinutes = Math.round(Math.max(dailyExcess, weeklyExcess));

  // 그 주에 들고, 근무 기록이 없는 날만 결근 아님으로 센다. 기록이 있으면 근무로 센다 (L-4).
  const weekEndMs = weekStart.getTime() + 7 * DAY;
  const excused = new Map<string, Absence["kind"]>();
  for (const a of absences) {
    const t = parseDay(a.date).getTime();
    if (t < weekStart.getTime() || t >= weekEndMs || byDay.has(a.date)) continue;
    // 같은 날 여러 건이면 유급이 우선한다
    if (excused.get(a.date) !== "paid_leave") excused.set(a.date, a.kind);
  }
  const excusedDays = excused.size;
  const paidLeaveDays = [...excused.values()].filter((k) => k === "paid_leave").length;

  // 개근: 하루는 실제로 일했고, 근무 + 결근 아닌 날이 소정근로일수 이상. 전부 휴가면 주휴 없음 (docs/prd/09 3절)
  const holidayEligible = weeklyHours >= HOLIDAY_MIN_WEEKLY_HOURS && workDays >= 1 && workDays + excusedDays >= workDaysPerWeek;

  const basePay = Math.round(workedMinutes * perMinute);
  const leavePay = Math.round(paidLeaveDays * dailySchedMin * perMinute);
  const overtimePay = fivePlus ? Math.round(overtimeMinutes * perMinute * OVERTIME_RATE) : 0;
  const holidayPay = holidayEligible ? Math.round((Math.min(weeklyHours, 40) / 40) * 8 * hourlyWage) : 0;

  return {
    weekStart,
    weekEnd: new Date(weekStart.getTime() + 7 * DAY),
    workedMinutes,
    workDays,
    excusedDays,
    paidLeaveDays,
    basePay,
    leavePay,
    overtimeMinutes,
    overtimePay,
    holidayEligible,
    holidayPay,
    total: basePay + leavePay + overtimePay + holidayPay,
    overtimeLimitExceeded: overtimeMinutes > OVERTIME_WEEKLY_LIMIT_HOURS * 60,
  };
}

/** 근무 기록을 주 단위로 묶어 최신 주부터 돌려준다. */
export function computeWeeks(shifts: Shift[], settings: PaySettings, now = Date.now(), absences: Absence[] = []): WeekPay[] {
  const groups = new Map<number, { start: Date; shifts: Shift[] }>();
  const group = (t: number | Date) => {
    const start = startOfWeek(t);
    const g = groups.get(start.getTime()) ?? { start, shifts: [] };
    groups.set(start.getTime(), g);
    return g;
  };
  for (const s of shifts) group(s.start).shifts.push(s);
  // 휴가만 있는 주도 급여 행이 생겨야 한다 (유급 휴가수당)
  for (const a of absences) group(parseDay(a.date));
  return [...groups.values()]
    .map((g) => computeWeek(g.start, g.shifts, settings, now, absences))
    .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
}

/** 일요일이 그 달에 속한 주를 모아 월 급여를 낸다. month 는 0~11. */
export function computeMonth(weeks: WeekPay[], year: number, month: number) {
  const inMonth = weeks.filter((w) => {
    const sunday = new Date(w.weekEnd.getTime() - DAY);
    return sunday.getFullYear() === year && sunday.getMonth() === month;
  });
  const sum = (k: "basePay" | "leavePay" | "overtimePay" | "holidayPay" | "total" | "workedMinutes" | "overtimeMinutes") =>
    inMonth.reduce((a, w) => a + w[k], 0);
  return {
    weeks: inMonth,
    workedMinutes: sum("workedMinutes"),
    overtimeMinutes: sum("overtimeMinutes"),
    basePay: sum("basePay"),
    leavePay: sum("leavePay"),
    overtimePay: sum("overtimePay"),
    holidayPay: sum("holidayPay"),
    total: sum("total"),
  };
}
