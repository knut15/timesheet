"use client";
// 마스터 근무 달력 — 전체 멤버가 날마다 누가·몇 시간 일했는지. docs/prd/10-calendar.md, 화면 명세 docs/design/calendar.md §5
import Link from "next/link";
import { ChevronRight, TriangleAlert } from "lucide-react";
import { api, type Absence, type Correction, type Dashboard } from "@/api/client";
import { AvatarStack } from "@/components/calendar/AvatarStack";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { useSelectedDay } from "@/components/calendar/useSelectedDay";
import { Avatar } from "@/components/shell";
import { Card, date, ErrorText, hm, keyed, MonthPicker, StatusPill, time, useMonthCursor, useNow } from "@/components/ui";
import { ABSENCE_LABEL, compactHours, correctionDay, dateLabel, dayAriaLabel, masterDays, type MasterDay } from "@/lib/calendar";
import { dayKey, parseDay, shiftMinutes, type Shift } from "@/lib/pay";
import { useApi } from "@/lib/useApi";

export default function CalendarPage() {
  const [cursor, setCursor] = useMonthCursor();
  const month = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  // data 에 읽은 달을 같이 담는다 — 달을 넘긴 직후 이전 달 data 로 새 달을 그리지 않게 (명세 §6)
  const dash = useApi(() => keyed(month, api.GET("/api/stores/me/dashboard", { params: { query: { month } } })), month);
  const reqs = useApi(() => api.GET("/api/stores/me/requests"), "");
  const now = useNow(60_000);
  const todayKey = dayKey(now);
  const [selected, setSelected] = useSelectedDay(cursor.year, cursor.month, todayKey);

  const loading = dash.data?.key !== month;
  const data = loading ? null : dash.data!.value;
  const pending = (reqs.data?.corrections ?? []).filter((c) => c.status === "pending");
  const days = data ? masterDays(data, pending, now) : new Map<string, MasterDay>();
  const members = data ? data.members.filter((m) => m.role === "member") : [];

  // 그 달 칸들의 합
  const monthPeople = new Set<string>();
  let monthMinutes = 0;
  for (const [key, d] of days) {
    if (!key.startsWith(month)) continue;
    monthMinutes += d.minutes;
    for (const p of d.people) monthPeople.add(p.userId);
  }
  const monthHasAny = [...days.keys()].some((k) => k.startsWith(month));

  if (dash.error)
    return (
      <div className="space-y-4">
        <MonthPicker cursor={cursor} onChange={setCursor} />
        <Card className="space-y-3">
          <ErrorText>근무 기록을 불러오지 못했어요.</ErrorText>
          <button type="button" onClick={dash.reload} className="w-full rounded-xl border border-line py-2.5 text-sm">다시 시도</button>
        </Card>
      </div>
    );

  const cell = (key: string) => {
    const d = days.get(key);
    const isToday = key === todayKey;
    return {
      label: loading ? [dateLabel(key), ...(isToday ? ["오늘"] : []), "불러오는 중"].join(", ") : dayAriaLabel(key, isToday, d, "master"),
      marks: {
        open: d?.openCount ? ("today" as const) : d?.staleCount ? ("stale" as const) : undefined,
        pending: !!d?.pendingCount,
        dashed: !!d?.absentCount,
      },
      body: d && (
        <span className="flex flex-col items-center gap-0.5">
          {d.people.length > 0 ? <AvatarStack people={d.people} /> : d.absentCount > 0 && <span className="text-[10px] text-muted">쉼 {d.absentCount}</span>}
          {d.minutes > 0 && <span className="text-[11px] font-semibold tabular-nums text-foreground">{compactHours(d.minutes)}</span>}
        </span>
      ),
    };
  };

  const empty = members.length === 0 ? (
    <p className="mb-2 text-center text-sm text-muted">
      아직 멤버가 없어요. <Link href="/admin/invites" className="text-accent">초대 코드를 발급</Link>해 보세요.
    </p>
  ) : !monthHasAny ? (
    <p className="mb-2 text-center text-sm text-muted">이 달 근무 기록이 없어요.</p>
  ) : null;

  return (
    <div className="space-y-4">
      <div>
        <MonthPicker cursor={cursor} onChange={setCursor} />
        {(loading || monthPeople.size > 0) && (
          <p className="mt-1 px-1 text-sm text-muted">
            {loading ? "불러오는 중…" : `${todayKey.startsWith(month) ? "이번 달" : `${cursor.month + 1}월`} ${monthPeople.size}명 · ${Math.round(monthMinutes / 60)}시간`}
          </p>
        )}
      </div>
      <MonthGrid
        year={cursor.year}
        month={cursor.month}
        todayKey={todayKey}
        selectedKey={selected}
        onSelect={setSelected}
        busy={loading}
        cellHeight={64}
        cell={cell}
        footer={
          loading ? (
            <p className="text-[11px] text-muted">불러오는 중…</p>
          ) : (
            <>
              {empty}
              <CalendarLegend role="master" />
            </>
          )
        }
      />
      <DayDetail dayKeyValue={selected} summary={selected ? days.get(selected) : undefined} data={data} pending={pending} now={now} />
    </div>
  );
}

type Row = {
  userId: string;
  nickname: string;
  shifts: Shift[];
  adds: Correction[];
  absence: Absence["kind"] | null;
};

function DayDetail({ dayKeyValue: key, summary, data, pending, now }: { dayKeyValue: string | null; summary: MasterDay | undefined; data: Dashboard | null; pending: Correction[]; now: number }) {
  const head = !key
    ? ""
    : [
        date(parseDay(key)),
        ...(summary?.people.length ? [`${summary.people.length}명`, hm(summary.minutes)] : summary?.absentCount ? [`쉼 ${summary.absentCount}명`] : []),
      ].join(" · ");

  let body: React.ReactNode;
  if (!key) body = <p className="px-1 text-sm text-muted">날짜를 누르면 그날 근무가 나와요.</p>;
  else if (!data) body = <p className="px-1 text-sm text-muted">불러오는 중…</p>;
  else {
    const rows = dayRows(key, data, pending);
    body =
      rows.length === 0 ? (
        <p className="px-1 text-sm text-muted">이 날 일한 사람이 없어요.</p>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {rows.map((r) => <MemberDayRow key={r.userId} row={r} pending={pending} now={now} />)}
          </ul>
        </Card>
      );
  }

  return (
    <section className="space-y-3">
      <h2 aria-live="polite" className="px-1 text-sm font-semibold">{head}</h2>
      {body}
    </section>
  );
}

/** 그날의 멤버별 행. 근무한 사람(첫 출근 이른 순) → 추가 요청만 있는 사람·쉰 사람(이름순) */
function dayRows(key: string, data: Dashboard, pending: Correction[]): Row[] {
  const rows = new Map<string, Row>();
  const row = (userId: string, nickname: string) => {
    let r = rows.get(userId);
    if (!r) rows.set(userId, (r = { userId, nickname, shifts: [], adds: [], absence: null }));
    return r;
  };
  const names = new Map(data.members.filter((m) => m.role === "member").map((m) => [m.userId, m.nickname]));
  const shifts = data.shifts
    .filter((s) => names.has(s.userId))
    .map((s) => ({ userId: s.userId, shift: { id: s.id, start: Date.parse(s.start), end: s.end ? Date.parse(s.end) : null } }))
    .filter((s) => dayKey(s.shift.start) === key)
    .sort((a, b) => a.shift.start - b.shift.start);
  for (const s of shifts) row(s.userId, names.get(s.userId)!).shifts.push(s.shift);
  for (const c of pending) if (c.action === "add" && names.has(c.userId) && correctionDay(c) === key) row(c.userId, names.get(c.userId)!).adds.push(c);
  for (const a of data.absences) if (a.date === key && names.has(a.userId)) row(a.userId, names.get(a.userId)!).absence = a.kind;
  const all = [...rows.values()];
  const worked = all.filter((r) => r.shifts.length > 0);
  const rest = all.filter((r) => r.shifts.length === 0).sort((a, b) => a.nickname.localeCompare(b.nickname, "ko"));
  return [...worked, ...rest];
}

function MemberDayRow({ row, pending, now }: { row: Row; pending: Correction[]; now: number }) {
  const today = dayKey(now);
  const working = row.shifts.some((s) => s.end === null && dayKey(s.start) === today);
  return (
    <li>
      <Link href={`/admin/members/${row.userId}`} className={`flex items-center gap-3 px-5 py-4 hover:bg-background ${row.shifts.length === 0 && row.absence ? "border-l-2 border-dashed border-l-muted" : ""}`}>
        <span className="relative self-start">
          <Avatar name={row.nickname} seed={row.userId} size="sm" />
          {working && <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-green-600 dark:bg-green-400" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{row.nickname}</p>
          <ul className="space-y-0.5 text-sm text-muted tabular-nums">
            {row.shifts.map((s) => {
              const stale = s.end === null && dayKey(s.start) !== today;
              const waiting = pending.some((c) => c.shiftId === s.id);
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{time(s.start)} ~ {s.end ? time(s.end) : "근무 중"} · {hm(shiftMinutes(s, now))}</span>
                  {stale && (
                    <span className="inline-flex items-center gap-1 text-warn">
                      <TriangleAlert size={14} aria-hidden /> 퇴근 기록 없음
                    </span>
                  )}
                  {waiting && <StatusPill status="pending" />}
                </li>
              );
            })}
            {row.adds.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>추가 요청 · {time(Date.parse(c.start!))} ~ {time(Date.parse(c.end!))}</span>
                <StatusPill status="pending" />
              </li>
            ))}
            {row.absence && <li>{ABSENCE_LABEL[row.absence]}</li>}
          </ul>
        </div>
        <ChevronRight size={16} aria-hidden className="shrink-0 text-muted" />
      </Link>
    </li>
  );
}
