import { PayView } from "@/components/PayView";

const now = new Date(2026, 8, 30, 18, 0).getTime(); // 9월 30일 18:00 고정
const settings = { hourlyWage: 10320, weeklyHours: 20, workDaysPerWeek: 5, fivePlus: false };

// 기록이 없으면 요약 카드 0원과 "이 달 기록이 없어요."
export default function PayViewEmpty() {
  return <PayView shifts={[]} settings={settings} year={2026} month={8} now={now} />;
}
