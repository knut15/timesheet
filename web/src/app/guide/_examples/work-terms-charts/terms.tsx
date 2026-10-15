"use client";
import { WeekRhythm, WeeklyHoursGauge, WorkDayDots } from "@/components/member/WorkTermsCharts";
import { Card, NUM } from "@/components/ui";
import { scheduleText, type DayException, type Schedule } from "@/lib/schedule";

// 기준 시각 고정 — 2026년 10월 15일(목) 13:48. 오늘 날짜로 두면 미리보기가 날마다 바뀐다
export const NOW = new Date(2026, 9, 15, 13, 48).getTime();

// 내 정보 탭 근무 조건 카드의 그래프 세 구역과 같은 틀. 예시들이 같이 쓴다
export function WorkTerms({ schedule, exceptions = [], now = NOW, weeklyHours, workDaysPerWeek }: { schedule: Schedule | null; exceptions?: DayException[]; now?: number; weeklyHours: number; workDaysPerWeek: number }) {
  return (
    <Card className="space-y-4">
      <section>
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <h3 className="text-muted">근무 시간표</h3>
          <span className={NUM}>{schedule ? scheduleText(schedule) : "정해지지 않음"}</span>
        </div>
        <div className="mt-2.5"><WeekRhythm schedule={schedule} exceptions={exceptions} now={now} /></div>
      </section>
      <section>
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <h3 className="text-muted">1주 소정근로시간</h3>
          <span className={NUM}>{weeklyHours}시간</span>
        </div>
        <div className="mt-1"><WeeklyHoursGauge hours={weeklyHours} /></div>
      </section>
      <section>
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <h3 className="text-muted">1주 소정근로일수</h3>
          <span className={NUM}>{workDaysPerWeek}일</span>
        </div>
        <div className="mt-2"><WorkDayDots schedule={schedule} count={workDaysPerWeek} /></div>
      </section>
    </Card>
  );
}
