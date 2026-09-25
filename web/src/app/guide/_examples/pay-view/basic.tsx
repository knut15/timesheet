import { PayView } from "@/components/PayView";
import type { Shift } from "@/lib/pay";

const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m).getTime(); // 2026년 9월 d일
const now = at(30, 18); // 9월 30일 18:00 고정
// 시급은 lib/pay.ts MINIMUM_WAGE(2026) 와 같은 값. 바뀌면 여기도 고친다
const settings = { hourlyWage: 10320, weeklyHours: 20, workDaysPerWeek: 5, fivePlus: false };
const shiftsOn = (days: number[], from: number, to: number): Shift[] =>
  days.map((d, i) => ({ id: `shift-demo-${String(i + 1).padStart(2, "0")}`, start: at(d, from), end: at(d, to) }));

// 주 5일 × 4시간. 9/28 주는 일요일(10/4)이 10월이라 9월 합산에 들지 않으므로 넣지 않는다
const shifts = shiftsOn([1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25], 10, 14);

export default function PayViewBasic() {
  return <PayView shifts={shifts} settings={settings} year={2026} month={8} now={now} />;
}
