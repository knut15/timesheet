"use client";
import { ClockCard } from "@/components/TodayDashboard";
import { minuteNow, noop, now } from "../today-dashboard/demo-data";

// 기록을 읽는 중 — 상태를 모르는 동안 버튼을 막는다
export default function ClockCardLoading() {
  return <ClockCard now={now} minuteNow={minuteNow} state={{ kind: "loading" }} onPunch={noop} onRetry={noop} />;
}
