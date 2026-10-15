"use client";
import { ClockCard } from "@/components/TodayDashboard";
import { minuteNow, noop, now } from "../today-dashboard/demo-data";

// 저장 실패 — 상태는 그대로, 버튼 아래 오류 글자
export default function ClockCardSaveError() {
  return <ClockCard now={now} minuteNow={minuteNow} state={{ kind: "before" }} error="저장하지 못했어요. 다시 시도해 주세요." onPunch={noop} onRetry={noop} />;
}
