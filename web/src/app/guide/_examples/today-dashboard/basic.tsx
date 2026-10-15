"use client";
import { TodayDashboard } from "@/components/TodayDashboard";
import { DEMO_ABSENCES, DEMO_SHIFTS, minuteNow, NO_REQUESTS, noop, settings } from "./demo-data";

// 오늘 두 번 나눠 근무: 3시간 28분 + 1시간 2분 = 4시간 30분. 요청이 없어 "처리할 것" 은 숨는다
export default function TodayDashboardBasic() {
  return (
    <TodayDashboard
      shifts={DEMO_SHIFTS}
      absences={DEMO_ABSENCES}
      requests={NO_REQUESTS}
      settings={settings}
      now={minuteNow}
      status="ready"
      onRetry={noop}
      onOpenPay={noop}
      onOpenRequests={noop}
    />
  );
}
