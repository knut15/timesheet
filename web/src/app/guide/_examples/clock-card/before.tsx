"use client";
import { ClockCard } from "@/components/TodayDashboard";
import { minuteNow, noop, now } from "../today-dashboard/demo-data";

// 출근 전 — 채운 "출근" 버튼, 상태 설명 줄 없음
export default function ClockCardBefore() {
  return <ClockCard now={now} minuteNow={minuteNow} state={{ kind: "before" }} onPunch={noop} onRetry={noop} />;
}
