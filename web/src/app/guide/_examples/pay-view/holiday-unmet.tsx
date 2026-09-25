import { PayView } from "@/components/PayView";
import type { Shift } from "@/lib/pay";

const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m).getTime(); // 2026년 9월 d일
const now = at(30, 18); // 9월 30일 18:00 고정
// 시급은 lib/pay.ts MINIMUM_WAGE(2026) 와 같은 값. 바뀌면 여기도 고친다
const settings = { hourlyWage: 10320, weeklyHours: 20, workDaysPerWeek: 5, fivePlus: false };
const shiftsOn = (days: number[], from: number, to: number): Shift[] =>
  days.map((d, i) => ({ id: `shift-demo-${String(i + 1).padStart(2, "0")}`, start: at(d, from), end: at(d, to) }));

// 9월 둘째 주에 3일만 일했다 → 주휴 미충족 (3/5일)
const shifts = shiftsOn([7, 8, 9], 10, 14);

export default function PayViewHolidayUnmet() {
  return <PayView shifts={shifts} settings={settings} year={2026} month={8} now={now} />;
}
