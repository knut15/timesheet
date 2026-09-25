"use client";
import { TodayDashboard } from "@/components/TodayDashboard";
import { minuteNow, noop, settings } from "./demo-data";

// 기록·휴가를 읽는 중 — 구역 없이 한 줄
export default function TodayDashboardLoading() {
  return (
    <TodayDashboard
      shifts={[]}
      absences={[]}
      settings={settings}
      now={minuteNow}
      status="loading"
      onRetry={noop}
      onOpenPay={noop}
      onOpenRequests={noop}
    />
  );
}
