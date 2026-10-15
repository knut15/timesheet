"use client";
import { ClockCard } from "@/components/TodayDashboard";
import { minuteNow, noop, now } from "../today-dashboard/demo-data";

// 오늘 유급 휴가 — 점선 알약, 보조 모양 "출근", 아래 안내 한 줄
export default function ClockCardOffPaid() {
  return <ClockCard now={now} minuteNow={minuteNow} state={{ kind: "off", absence: "paid_leave" }} onPunch={noop} onRetry={noop} />;
}
