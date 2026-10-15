"use client";
import { TodayDashboard } from "@/components/TodayDashboard";
import { minuteNow, noop, settings } from "./demo-data";

// 기록 또는 휴가 읽기 실패 — 오류 글자와 "다시 불러오기"(onRetry)
export default function TodayDashboardError() {
  return (
    <TodayDashboard
      shifts={[]}
      absences={[]}
      settings={settings}
      now={minuteNow}
      status="error"
      onRetry={noop}
      onOpenPay={noop}
      onOpenRequests={noop}
    />
  );
}
