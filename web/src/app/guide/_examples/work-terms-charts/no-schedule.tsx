"use client";
import { WorkTerms } from "./terms";

// 시간표가 정해지지 않은 멤버 — 주간 리듬은 7일 모두 "쉼" 에 "정해진 근무가 없어요", 근무일 점은 일수만큼 앞에서부터 채운다(요일 글자 없음)
export default function WorkTermsChartsNoSchedule() {
  return <WorkTerms schedule={null} weeklyHours={15} workDaysPerWeek={3} />;
}
