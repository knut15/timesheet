"use client";
import { ClockCard } from "@/components/TodayDashboard";
import { minuteNow, noop, now } from "../today-dashboard/demo-data";

// 320px 폭 기기. 본문 좌우 여백 20px 을 빼면 카드 280px, 카드 안쪽 240px — 시계(약 230px)가 한 줄에 들어간다
export default function ClockCardNarrow() {
  return (
    <div className="w-[320px] px-5">
      <ClockCard now={now} minuteNow={minuteNow} state={{ kind: "before" }} onPunch={noop} onRetry={noop} />
    </div>
  );
}
