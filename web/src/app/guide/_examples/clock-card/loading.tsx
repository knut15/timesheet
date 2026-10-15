"use client";
import { ClockCard } from "@/components/TodayDashboard";
import { minuteNow, noop, now } from "../today-dashboard/demo-data";

// 기록을 읽는 중 — 알약·버튼 자리에 같은 크기 막대. 출근 전(before)과 높이가 같다
export default function ClockCardLoading() {
  return <ClockCard now={now} minuteNow={minuteNow} state={{ kind: "loading" }} onPunch={noop} onRetry={noop} />;
}
