"use client";
import { TodayDashboard } from "@/components/TodayDashboard";
import { DEMO_ABSENCES, DEMO_SHIFTS, minuteNow, NO_REQUESTS, noop, settings } from "./demo-data";

// 소정 주 14시간 — 주휴수당 대상이 아니다
export default function TodayDashboardUnder15() {
  return (
    <TodayDashboard
      shifts={DEMO_SHIFTS}
      absences={DEMO_ABSENCES}
      requests={NO_REQUESTS}
      settings={{ ...settings, weeklyHours: 14 }}
      now={minuteNow}
      status="ready"
      onRetry={noop}
      onOpenPay={noop}
      onOpenRequests={noop}
    />
  );
}
