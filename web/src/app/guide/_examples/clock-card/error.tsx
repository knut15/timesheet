"use client";
import { ClockCard } from "@/components/TodayDashboard";
import { minuteNow, noop, now } from "../today-dashboard/demo-data";

// 기록·휴가 읽기 실패 — "다시 불러오기" 가 onRetry 를 부른다
export default function ClockCardError() {
  return <ClockCard now={now} minuteNow={minuteNow} state={{ kind: "error" }} onPunch={noop} onRetry={noop} />;
}
