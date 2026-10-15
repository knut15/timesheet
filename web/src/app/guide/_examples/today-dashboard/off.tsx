"use client";
import { TodayDashboard } from "@/components/TodayDashboard";
import type { Absence } from "@/lib/pay";
import { DEMO_ABSENCES, minuteNow, NO_REQUESTS, noop, s1, s2, settings } from "./demo-data";

// 오늘(9/25) 유급 휴가 — 오늘 기록(s3·s4)을 빼고 absence 를 하나 더한다
const shifts = [s1, s2];
const absences: Absence[] = [...DEMO_ABSENCES, { date: "2026-09-25", kind: "paid_leave" }];

export default function TodayDashboardOff() {
  return (
    <TodayDashboard
      shifts={shifts}
      absences={absences}
      requests={NO_REQUESTS}
      settings={settings}
      now={minuteNow}
      status="ready"
      onRetry={noop}
      onOpenPay={noop}
      onOpenRequests={noop}
    />
  );
}
