"use client";
import { WorkTerms } from "./terms";

// 월~금 10:00~14:00, 주 20시간 · 5일. 기준 시각 목 13:48 — 지금 근무 시간이다
export default function WorkTermsChartsBasic() {
  return <WorkTerms schedule={{ days: [1, 2, 3, 4, 5], start: "10:00", end: "14:00" }} weeklyHours={20} workDaysPerWeek={5} />;
}
