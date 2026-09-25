import { PayView } from "@/components/PayView";
import type { Shift } from "@/lib/pay";

const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m).getTime(); // 2026년 9월 d일
const now = at(30, 18); // 9월 30일 18:00 고정
// 시급은 lib/pay.ts MINIMUM_WAGE(2026) 와 같은 값. 바뀌면 여기도 고친다
const settings = { hourlyWage: 10320, weeklyHours: 20, workDaysPerWeek: 5, fivePlus: true };
const shiftsOn = (days: number[], from: number, to: number): Shift[] =>
  days.map((d, i) => ({ id: `shift-demo-${String(i + 1).padStart(2, "0")}`, start: at(d, from), end: at(d, to) }));

// 5인 이상 사업장, 소정 주 20시간인데 하루 8시간씩 닷새 → 연장 20시간, 주 12시간 한도 초과
const shifts = shiftsOn([21, 22, 23, 24, 25], 9, 17);

export default function PayViewOvertimeLimit() {
  return <PayView shifts={shifts} settings={settings} year={2026} month={8} now={now} />;
}
