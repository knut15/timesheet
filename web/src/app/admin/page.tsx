"use client";
// 대시보드 — 지금 누가 일하는지, 이번 달 인건비가 얼마인지. docs/prd/07-admin.md
import Link from "next/link";
import { useMemo } from "react";
import { Bell, Coins, Hourglass, Timer, TriangleAlert, Wallet } from "lucide-react";
import { api, type Member } from "@/api/client";
import { holidayStatus } from "@/components/PayView";
import { CountUp, Enter } from "@/components/motion";
import { Avatar } from "@/components/shell";
import { Card, dayLabel, hm, MonthPicker, NUM, SectionLabel, time, toShift, useMonthCursor, useNow, won } from "@/components/ui";
import { computeMonth, computeWeeks, dayKey, MINIMUM_WAGE, shiftMinutes, startOfWeek, type PaySettings } from "@/lib/pay";
import { useApi } from "@/lib/useApi";
import { DashboardSkeleton } from "./_skeletons";

const LONG_OPEN_MIN = 12 * 60;
/** 카드 안 목록 행 — 점선으로 나눈다 (B 시안 .list-row) */
const ROW = "flex items-center gap-2.5 border-b border-dashed border-line py-2.5 text-[13px] last:border-b-0";

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

  if (!data) return <DashboardSkeleton />;

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
    // 달을 바꿔 새 data 가 오면 카드가 다시 차례로 나타난다
    <Enter className="grid gap-3 sm:grid-cols-2" replay={data}>
      <Card>
        <SectionLabel icon={Timer} right={`${cameToday}/${rows.length}명 출근${onLeaveToday.length > 0 ? ` · 휴가·대타 ${onLeaveToday.length}명` : ""}`}>지금 근무 중</SectionLabel>
        {working.length === 0 ? (
          <p className="mt-3 text-sm text-muted">근무 중인 사람이 없어요</p>
        ) : (
          <ul className="mt-1">
            {working.map(({ member, shift }) => (
              <li key={shift.id} className={ROW}>
                <Avatar name={member.nickname} seed={member.userId} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{member.nickname}</span>
                  <span className={`block text-xs text-muted ${NUM}`}>{time(shift.start)} 출근 · {hm(shiftMinutes(shift, now))}</span>
                </span>
                {/* 근무 중 표시 — 옆 글자 "출근" 이 같은 뜻이라 장식 */}
                <span aria-hidden className="h-[7px] w-[7px] shrink-0 rounded-full bg-ok ring-3 ring-ok/15" />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <MonthPicker cursor={cursor} onChange={setCursor} />
        <div className="mt-3">
          <SectionLabel icon={Wallet}>{cursor.month + 1}월 인건비 (예상, 세전)</SectionLabel>
        </div>
        {/* 포인트 컬러 — 큰 금액만 강조색 (2026-10-15 사용자 지시) */}
        <CountUp value={total.total} format={won} className={`mt-1.5 block text-[28px] font-semibold leading-tight text-accent ${NUM}`} />
        <p className={`mt-1 text-xs text-muted ${NUM}`}>기본급 {won(total.base)} · 주휴 {won(total.holiday)} · 휴가 {won(total.leave)} · 연장 가산 {won(total.ot)}</p>
      </Card>

      {alerts.length > 0 && (
        <Card className="sm:col-span-2">
          <SectionLabel icon={Bell} right={alerts.length}>확인 필요</SectionLabel>
          <ul className="mt-2 grid gap-1.5 rounded-xl border-l-3 border-caution bg-caution/10 px-3 py-2.5 text-[13px]">
            {alerts.map((a, i) => {
              const Icon = a.member ? TriangleAlert : Hourglass;
              return (
                <li key={i} className="flex items-start gap-2">
                  <Icon size={14} aria-hidden className={`mt-0.5 shrink-0 ${a.member ? "text-warn" : "text-caution"}`} />
                  <span className="min-w-0">
                    {a.member ? (
                      <><Link href={`/admin/members/${a.member.userId}`} className="font-semibold underline-offset-2 hover:underline">{a.member.nickname}</Link> · {a.text}</>
                    ) : (
                      <Link href={a.href!} className="font-semibold underline-offset-2 hover:underline">{a.text}</Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card className="sm:col-span-2">
        <SectionLabel icon={Coins}>멤버별 {cursor.month + 1}월</SectionLabel>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            아직 멤버가 없어요. <Link href="/admin/invites" className="font-medium text-accent">초대 코드를 발급</Link>해 보세요.
          </p>
        ) : (
          <ul className="mt-1">
            {rows.map((r) => (
              <li key={r.member.userId} className="border-b border-dashed border-line last:border-b-0">
                <Link href={`/admin/members/${r.member.userId}`} className="-mx-2 flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-[13px] hover:bg-background">
                  <Avatar name={r.member.nickname} seed={r.member.userId} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.member.nickname}</span>
                    <span className="block text-xs text-muted">
                      <span className={NUM}>{hm(r.month.workedMinutes)}</span> · 이번 주 주휴 {r.thisWeek ? holidayStatus(r.thisWeek, r.settings, now) : "기록 없음"}
                      {r.month.overtimeMinutes > 0 && ` · 연장 ${hm(r.month.overtimeMinutes)}`}
                    </span>
                  </span>
                  <span className={`shrink-0 font-semibold ${NUM}`}>{won(r.month.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Enter>
  );
}
