"use client";
// 월 급여 요약과 주별 내역. 멤버 화면과 마스터의 멤버 상세 화면이 같이 쓴다. 계산은 pay.ts 에만 있다.
import { useMemo } from "react";
import { computeMonth, computeWeeks, type Absence, type PaySettings, type Shift, type WeekPay } from "@/lib/pay";
import { Bone, Card, date, hm, Loading, won } from "./ui";

export function PayView({ shifts, settings, year, month, now, absences = [] }: { shifts: Shift[]; settings: PaySettings; year: number; month: number; now: number; absences?: Absence[] }) {
  const weeks = useMemo(() => computeWeeks(shifts, settings, now, absences), [shifts, settings, now, absences]);
  const m = computeMonth(weeks, year, month);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-muted">예상 급여 (세전)</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{won(m.total)}</p>
        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted">기본급 ({hm(m.workedMinutes)})</dt>
          <dd className="text-right tabular-nums">{won(m.basePay)}</dd>
          <dt className="text-muted">주휴수당</dt>
          <dd className="text-right tabular-nums">{won(m.holidayPay)}</dd>
          {m.leavePay > 0 && (
            <>
              <dt className="text-muted">휴가수당</dt>
              <dd className="text-right tabular-nums">{won(m.leavePay)}</dd>
            </>
          )}
          <dt className="text-muted">연장 가산 ({hm(m.overtimeMinutes)})</dt>
          <dd className="text-right tabular-nums">{won(m.overtimePay)}</dd>
        </dl>
        <p className="mt-4 text-xs text-muted">{NOTE}</p>
      </Card>
      {m.weeks.length === 0 && <p className="text-center text-sm text-muted">이 달 기록이 없어요.</p>}
      {m.weeks.map((w) => (
        <WeekCard key={w.weekStart.getTime()} week={w} settings={settings} now={now} />
      ))}
    </div>
  );
}

const NOTE = "일요일이 이 달에 속한 주를 합산해요. 휴게시간·야간수당·공제는 반영하지 않아요.";

/**
 * 기록·휴가를 읽는 동안의 자리 — PayView 와 같은 카드·줄 높이에 값 대신 막대.
 * 주 카드 수는 "일요일이 이 달에 있고 now 까지 시작한 주" 수 — 매주 근무하는 사람의 주 카드 수와 같다.
 * 휴가수당·한도 경고 줄은 없는 것으로 둔다.
 */
export function PayViewSkeleton({ year, month, now }: { year: number; month: number; now: number }) {
  const row = (
    <>
      <dt className="flex h-5 items-center"><Bone className="h-4 w-24" /></dt>
      <dd className="flex h-5 items-center justify-end"><Bone className="h-4 w-20" /></dd>
    </>
  );
  return (
    <Loading className="space-y-4">
      <Card>
        <p className="text-sm text-muted">예상 급여 (세전)</p>
        <div className="mt-1 flex h-9 items-center"><Bone className="h-8 w-40" /></div>
        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          {row}
          {row}
          {row}
        </dl>
        <p className="mt-4 text-xs text-muted">{NOTE}</p>
      </Card>
      {Array.from({ length: startedWeeks(year, month, now) }, (_, i) => (
        <Card key={i}>
          <div className="flex h-6 items-center justify-between gap-2">
            <Bone className="h-5 w-36" />
            <Bone className="h-5 w-20" />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-sm">
            {row}
            {row}
            {row}
            {row}
          </dl>
        </Card>
      ))}
    </Loading>
  );
}

/** 월요일 시작 주 가운데 일요일이 year·month 에 있고 now 이전에 시작한 주의 수 */
function startedWeeks(year: number, month: number, now: number) {
  let n = 0;
  for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) {
    const sunday = new Date(year, month, d);
    if (sunday.getDay() === 0 && new Date(year, month, d - 6).getTime() <= now) n++;
  }
  return n;
}

export function holidayStatus(week: WeekPay, settings: PaySettings, now: number) {
  if (settings.weeklyHours < 15) return "대상 아님 (주 15시간 미만)";
  if (week.holidayEligible) return "개근";
  const days = `${week.workDays + week.excusedDays}/${settings.workDaysPerWeek}일`;
  if (week.workDays === 0 && week.excusedDays > 0) return "대상 아님 (그 주 전부 휴가)";
  return now < week.weekEnd.getTime() ? `진행 중 (${days})` : `미충족 (${days})`;
}

function WeekCard({ week, settings, now }: { week: WeekPay; settings: PaySettings; now: number }) {
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold">
          {date(week.weekStart)} ~ {date(week.weekEnd.getTime() - 1)}
        </p>
        <p className="font-semibold tabular-nums">{won(week.total)}</p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-sm">
        <dt className="text-muted">근무</dt>
        <dd className="text-right tabular-nums">
          {hm(week.workedMinutes)} · {week.workDays}일{week.excusedDays > 0 && ` + 휴가·대타 ${week.excusedDays}일`}
        </dd>
        <dt className="text-muted">기본급</dt>
        <dd className="text-right tabular-nums">{won(week.basePay)}</dd>
        {week.leavePay > 0 && (
          <>
            <dt className="text-muted">휴가수당 ({week.paidLeaveDays}일)</dt>
            <dd className="text-right tabular-nums">{won(week.leavePay)}</dd>
          </>
        )}
        <dt className="text-muted">주휴수당 · {holidayStatus(week, settings, now)}</dt>
        <dd className="text-right tabular-nums">{won(week.holidayPay)}</dd>
        <dt className="text-muted">연장 {hm(week.overtimeMinutes)}{settings.fivePlus ? "" : " (5인 미만)"}</dt>
        <dd className="text-right tabular-nums">{won(week.overtimePay)}</dd>
      </dl>
      {week.overtimeLimitExceeded && <p className="mt-3 text-sm text-warn">연장근로가 주 12시간을 넘었어요 (단시간근로자 한도).</p>}
    </Card>
  );
}
