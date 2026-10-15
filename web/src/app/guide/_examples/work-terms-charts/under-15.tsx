"use client";
import { WorkTerms } from "./terms";

// 화·목·토 09:00~13:30, 주 13.5시간 — 게이지 막대가 주휴 15h 기준선 앞에서 멈춘다.
// 목 13:48 은 오늘 근무가 끝난 뒤라 위 줄은 "다음 근무까지 … (토 09:00)"
export default function WorkTermsChartsUnder15() {
  return <WorkTerms schedule={{ days: [2, 4, 6], start: "09:00", end: "13:30" }} weeklyHours={13.5} workDaysPerWeek={3} />;
}
