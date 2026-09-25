"use client";
import type { MyRequests } from "@/api/client";
import { TodayDashboard } from "@/components/TodayDashboard";
import { DEMO_ABSENCES, DEMO_SHIFTS, minuteNow, noop, settings } from "./demo-data";

// 나는 김하늘(user-demo-01). 동료 둘이 대타를 부탁했고(수락 전), 내 휴가 신청 하나가 승인 대기다
const me = { id: "user-demo-01", nickname: "김하늘" };
const substitutionIn = (id: string, requesterId: string, requesterNickname: string, date: string) => ({
  id,
  requesterId,
  requesterNickname,
  substituteId: me.id,
  substituteNickname: me.nickname,
  date,
  reason: "개인 일정",
  status: "requested" as const,
  reviewNote: null,
  createdAt: "2026-09-24T09:00:00.000Z",
});
const requests: MyRequests = {
  corrections: [],
  leaves: [
    {
      id: "leave-demo-01",
      userId: me.id,
      nickname: me.nickname,
      startDate: "2026-10-02",
      endDate: "2026-10-02",
      paid: null,
      reason: "병원 진료",
      status: "pending",
      byMaster: false,
      reviewNote: null,
      createdAt: "2026-09-23T09:00:00.000Z",
    },
  ],
  substitutionsOut: [],
  substitutionsIn: [
    substitutionIn("sub-demo-01", "user-demo-05", "이서준", "2026-09-29"),
    substitutionIn("sub-demo-02", "user-demo-06", "박도윤", "2026-10-01"),
  ],
};

export default function TodayDashboardTodo() {
  return (
    <TodayDashboard
      shifts={DEMO_SHIFTS}
      absences={DEMO_ABSENCES}
      requests={requests}
      settings={settings}
      now={minuteNow}
      status="ready"
      onRetry={noop}
      onOpenPay={noop}
      onOpenRequests={noop}
    />
  );
}
