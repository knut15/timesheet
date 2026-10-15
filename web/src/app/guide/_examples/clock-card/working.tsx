"use client";
import { ClockCard } from "@/components/TodayDashboard";
import { minuteNow, noop, now, s4 } from "../today-dashboard/demo-data";

// 근무 중 — 지금 열린 기록(s4, 13:30 출근)의 경과 시간. minuteNow 14:32 기준 1시간 2분
export default function ClockCardWorking() {
  return <ClockCard now={now} minuteNow={minuteNow} state={{ kind: "working", open: s4 }} onPunch={noop} onRetry={noop} />;
}
