"use client";
import { TodayDashboard } from "@/components/TodayDashboard";
import { minuteNow, noop, settings } from "./demo-data";

// 기록·휴가를 읽는 중 — Basic 과 같은 구역·줄에 값 대신 막대. 높이가 같다
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
