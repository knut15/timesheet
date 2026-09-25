"use client";
import { TodayDashboard } from "@/components/TodayDashboard";
import type { Shift } from "@/lib/pay";
import { at, DEMO_ABSENCES, NO_REQUESTS, noop, s1, s2, s3, s4, settings } from "./demo-data";

// 소정 20시간 초과 — s4 를 18:00 퇴근으로, 토요일(9/26) 8시간을 더하고 기준 시각을 9/26 18:00 으로
const shifts: Shift[] = [s1, s2, s3, { ...s4, end: at(25, 18) }, { id: "s5", start: at(26, 9), end: at(26, 17) }];
const now = at(26, 18);

export default function TodayDashboardOver() {
  return (
    <TodayDashboard
      shifts={shifts}
      absences={DEMO_ABSENCES}
      requests={NO_REQUESTS}
      settings={settings}
      now={now}
      status="ready"
      onRetry={noop}
      onOpenPay={noop}
      onOpenRequests={noop}
    />
  );
}
