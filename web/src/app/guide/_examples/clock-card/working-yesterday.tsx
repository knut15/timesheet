"use client";
import { ClockCard } from "@/components/TodayDashboard";
import { at, minuteNow, noop, now } from "../today-dashboard/demo-data";

// 어제(9/24) 22:00 에 출근해 아직 퇴근 안 한 기록 → 설명에 날짜가 붙는다
const open = { id: "x", start: at(24, 22), end: null };

export default function ClockCardWorkingYesterday() {
  return <ClockCard now={now} minuteNow={minuteNow} state={{ kind: "working", open }} onPunch={noop} onRetry={noop} />;
}
