"use client";
import { NOW, WorkTerms } from "./terms";

// 날짜별 근무 변경이 시간표보다 먼저다 — 금(10/16) 쉼, 일(10/18) 11:00~15:00 근무.
// 기준 시각을 목 15:00 으로 두면 다음 근무는 금이 아니라 일 11:00
export default function WorkTermsChartsExceptions() {
  return (
    <WorkTerms
      schedule={{ days: [1, 2, 3, 4, 5], start: "10:00", end: "14:00" }}
      exceptions={[
        { date: "2026-10-16", kind: "off", start: null, end: null },
        { date: "2026-10-18", kind: "work", start: "11:00", end: "15:00" },
      ]}
      now={NOW + 72 * 60_000}
      weeklyHours={20}
      workDaysPerWeek={5}
    />
  );
}
