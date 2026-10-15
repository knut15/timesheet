"use client";
import { ClockCard } from "@/components/TodayDashboard";
import { minuteNow, noop, now } from "../today-dashboard/demo-data";

// 오늘 대타로 쉼 — 점선 알약, 대타 문구
export default function ClockCardOffSubstitution() {
  return <ClockCard now={now} minuteNow={minuteNow} state={{ kind: "off", absence: "substitution" }} onPunch={noop} onRetry={noop} />;
}
