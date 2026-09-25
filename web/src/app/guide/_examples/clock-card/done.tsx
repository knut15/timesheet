"use client";
import { ClockCard } from "@/components/TodayDashboard";
import { at, noop } from "../today-dashboard/demo-data";

// 퇴근 뒤 시각이어야 설명과 시계가 맞는다 — 이 예시만 18:20:05 (명세 §4-2)
const now = at(25, 18, 20, 5);
const minuteNow = Math.floor(now / 60_000) * 60_000;

// 오늘 퇴근함 — 가장 늦은 퇴근 시각과 보조 모양 "다시 출근"
export default function ClockCardDone() {
  return <ClockCard now={now} minuteNow={minuteNow} state={{ kind: "done", lastEnd: at(25, 18, 5) }} onPunch={noop} onRetry={noop} />;
}
