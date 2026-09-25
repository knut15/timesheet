"use client";
// 대시보드 — 지금 누가 일하는지, 이번 달 인건비가 얼마인지. docs/prd/07-admin.md
import Link from "next/link";
import { useMemo } from "react";
import { api, type Member } from "@/api/client";
import { holidayStatus } from "@/components/PayView";
import { Avatar } from "@/components/shell";
import { Card, dayLabel, hm, MonthPicker, Spinner, time, toShift, useMonthCursor, useNow, won } from "@/components/ui";
import { computeMonth, computeWeeks, dayKey, MINIMUM_WAGE, shiftMinutes, startOfWeek, type PaySettings } from "@/lib/pay";
import { useApi } from "@/lib/useApi";

const LONG_OPEN_MIN = 12 * 60;

export default function DashboardPage() {
  const [cursor, setCursor] = useMonthCursor();
  const month = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const { data } = useApi(() => api.GET("/api/stores/me/dashboard", { params: { query: { month } } }), month);
  const now = useNow(30_000);

  const rows = useMemo(() => {
    if (!data) return [];
    // 마스터는 출퇴근을 찍지 않는다. 멤버만 센다.
    return data.members.filter((m) => m.role === "member").map((m) => {
      const settings: PaySettings = { hourlyWage: m.hourlyWage, weeklyHours: m.weeklyHours, workDaysPerWeek: m.workDaysPerWeek, fivePlus: data.store.fivePlus };
      const shifts = data.shifts.filter((s) => s.userId === m.userId).map(toShift);
      const absences = data.absences.filter((a) => a.userId === m.userId);
      const weeks = computeWeeks(shifts, settings, now, absences);
      const thisWeek = weeks.find((w) => w.weekStart.getTime() === startOfWeek(now).getTime());
      return { member: m, settings, shifts, weeks, month: computeMonth(weeks, cursor.year, cursor.month), thisWeek };
    });
  }, [data, now, cursor.year, cursor.month]);

  if (!data) return <Spinner />;

  const working = rows.flatMap((r) => r.shifts.filter((s) => s.end === null).map((s) => ({ member: r.member, shift: s })));
  const today = dayKey(now);
  const cameToday = rows.filter((r) => r.shifts.some((s) => dayKey(s.start) === today)).length;
  const total = rows.reduce(
    (a, r) => ({ total: a.total + r.month.total, base: a.base + r.month.basePay, holiday: a.holiday + r.month.holidayPay, leave: a.leave + r.month.leavePay, ot: a.ot + r.month.overtimePay }),
    { total: 0, base: 0, holiday: 0, leave: 0, ot: 0 },
  );
  const alerts: { member: Member | null; text: string; href?: string }[] = [];
  if (data.pendingRequests > 0) alerts.push({ member: null, text: `처리 대기 요청 ${data.pendingRequests}건 (수정·휴가·대타)`, href: "/admin/requests" });
  const onLeaveToday = rows.filter((r) => data.absences.some((a) => a.userId === r.member.userId && a.date === today));
  for (const r of rows) {
    if (r.member.hourlyWage < MINIMUM_WAGE) alerts.push({ member: r.member, text: `시급 ${won(r.member.hourlyWage)} — 최저임금보다 낮아요` });
    for (const s of r.shifts) if (s.end === null && shiftMinutes(s, now) > LONG_OPEN_MIN) alerts.push({ member: r.member, text: `${dayLabel(s.start)} 출근 뒤 12시간 넘게 퇴근 기록이 없어요` });
    for (const w of r.month.weeks) if (w.overtimeLimitExceeded) alerts.push({ member: r.member, text: `${dayLabel(w.weekStart)} 주 연장근로 ${hm(w.overtimeMinutes)} — 주 12시간 초과` });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">지금 근무 중</h2>
            <p className="text-sm text-muted">오늘 {cameToday}/{rows.length}명 출근{onLeaveToday.length > 0 && ` · 휴가·대타 ${onLeaveToday.length}명`}</p>
          </div>
          {working.length === 0 ? (
            <p className="mt-3 text-sm text-muted">근무 중인 사람이 없어요</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {working.map(({ member, shift }) => (
                <li key={shift.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <span className="relative">
                      <Avatar name={member.nickname} seed={member.userId} size="sm" />
                      <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-green-500" />
                    </span>
                    <span className="truncate">{member.nickname}</span>
                  </span>
                  <span className="tabular-nums text-muted">{time(shift.start)} 출근 · {hm(shiftMinutes(shift, now))}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <MonthPicker cursor={cursor} onChange={setCursor} />
          <p className="mt-2 text-sm text-muted">인건비 (예상, 세전)</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{won(total.total)}</p>
          <p className="mt-2 text-xs text-muted tabular-nums">기본급 {won(total.base)} · 주휴 {won(total.holiday)} · 휴가 {won(total.leave)} · 연장 가산 {won(total.ot)}</p>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="border-warn/40">
          <h2 className="font-semibold text-warn">확인 필요</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {alerts.map((a, i) => (
              <li key={i}>
                {a.member ? (
                  <><Link href={`/admin/members/${a.member.userId}`} className="font-medium underline-offset-2 hover:underline">{a.member.nickname}</Link> · {a.text}</>
                ) : (
                  <Link href={a.href!} className="font-medium underline-offset-2 hover:underline">{a.text}</Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-0">
        <h2 className="px-5 pt-5 font-semibold">멤버별 {cursor.month + 1}월</h2>
        {rows.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted">
            아직 멤버가 없어요. <Link href="/admin/invites" className="text-accent">초대 코드를 발급</Link>해 보세요.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {rows.map((r) => (
              <li key={r.member.userId}>
                <Link href={`/admin/members/${r.member.userId}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-background">
                  <Avatar name={r.member.nickname} seed={r.member.userId} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.member.nickname}</p>
                    <p className="text-xs text-muted">
                      {hm(r.month.workedMinutes)} · 이번 주 주휴 {r.thisWeek ? holidayStatus(r.thisWeek, r.settings, now) : "기록 없음"}
                      {r.month.overtimeMinutes > 0 && ` · 연장 ${hm(r.month.overtimeMinutes)}`}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">{won(r.month.total)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
