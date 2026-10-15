"use client";
import { TodayDashboard } from "@/components/TodayDashboard";
import { minuteNow, NO_REQUESTS, noop, settings } from "./demo-data";

// 가입 첫날 — 기록·휴가 0. 구역은 그대로 두고 값만 0
export default function TodayDashboardFirstDay() {
  return (
    <TodayDashboard
      shifts={[]}
      absences={[]}
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
