"use client";
// 멤버 한 명의 월별 기록과 급여. 기록을 고치고 지운다. docs/prd/07-admin.md
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { api, errorCode, type ShiftDto } from "@/api/client";
import { useSession } from "@/auth/hooks";
import { PayView } from "@/components/PayView";
import { Card, date, ErrorText, Field, hm, MonthPicker, monthRange, Spinner, time, toLocalInput, toShift, useMonthCursor, useNow } from "@/components/ui";
import { shiftMinutes, type PaySettings } from "@/lib/pay";
import { useApi } from "@/lib/useApi";

export default function MemberDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const session = useSession();
  const [cursor, setCursor] = useMonthCursor();
  const [tab, setTab] = useState<"records" | "pay">("records");
  const range = monthRange(cursor.year, cursor.month);
  const members = useApi(() => api.GET("/api/stores/me/members"), "");
  const shiftsRes = useApi(
    () => api.GET("/api/stores/me/members/{userId}/shifts", { params: { path: { userId }, query: range } }),
    `${userId}|${range.from}|${range.to}`,
  );
  const now = useNow(60_000);
  const shifts = useMemo(() => (shiftsRes.data ?? []).map(toShift), [shiftsRes.data]);

  const member = members.data?.find((m) => m.userId === userId);
  if (members.data && !member) return <Card><p className="text-sm text-muted">이 매장의 멤버가 아니에요. <Link href="/admin/members" className="text-accent">멤버 목록</Link></p></Card>;
  if (!member || !shiftsRes.data || session.status !== "authenticated") return <Spinner />;

  const settings: PaySettings = {
    hourlyWage: member.hourlyWage,
    weeklyHours: member.weeklyHours,
    workDaysPerWeek: member.workDaysPerWeek,
    fivePlus: session.me.membership!.store.fivePlus,
  };
  const inMonth = shiftsRes.data
    .filter((s) => {
      const d = new Date(s.start);
      return d.getFullYear() === cursor.year && d.getMonth() === cursor.month;
    })
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/members" className="text-sm text-muted">← 멤버</Link>
        <h2 className="mt-1 text-xl font-bold">{member.nickname}</h2>
      </div>
      <MonthPicker cursor={cursor} onChange={setCursor} />
      <div className="grid grid-cols-2 rounded-xl border border-line p-1 text-sm">
        {(["records", "pay"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg py-2 ${tab === t ? "bg-surface font-semibold" : "text-muted"}`}>
            {t === "records" ? "근무 기록" : "급여"}
          </button>
        ))}
      </div>
      {tab === "pay" ? (
        <PayView shifts={shifts} settings={settings} year={cursor.year} month={cursor.month} now={now} />
      ) : inMonth.length === 0 ? (
        <Card><p className="text-center text-sm text-muted">이 달 기록이 없어요.</p></Card>
      ) : (
        <ul className="space-y-3">
          {inMonth.map((s) => (
            <ShiftRow key={s.id} shift={s} onChange={shiftsRes.reload} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ShiftRow({ shift, onChange }: { shift: ShiftDto; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const s = toShift(shift);
  const [start, setStart] = useState(toLocalInput(s.start));
  const [end, setEnd] = useState(s.end ? toLocalInput(s.end) : "");
  const [error, setError] = useState<string | null>(null);
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : null;
  const invalid = Number.isNaN(startMs) || (endMs !== null && (Number.isNaN(endMs) || endMs <= startMs));

  const save = async () => {
    const { error } = await api.PATCH("/api/stores/me/shifts/{shiftId}", {
      params: { path: { shiftId: shift.id } },
      body: { start: new Date(startMs).toISOString(), end: endMs === null ? null : new Date(endMs).toISOString() },
    });
    if (error) return setError(errorCode(error) === "ALREADY_CLOCKED_IN" ? "근무 중인 기록이 이미 있어요. 퇴근 시각을 넣어 주세요." : "저장하지 못했어요.");
    setEditing(false);
    onChange();
  };
  const remove = async () => {
    if (!window.confirm("이 기록을 지울까요?")) return;
    await api.DELETE("/api/stores/me/shifts/{shiftId}", { params: { path: { shiftId: shift.id } } });
    onChange();
  };

  if (editing)
    return (
      <li className="space-y-3 rounded-2xl border border-accent bg-surface p-5">
        <Field label="출근"><input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="field" /></Field>
        <Field label="퇴근 (비우면 근무 중)"><input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="field" /></Field>
        {invalid && <p className="text-sm text-warn">퇴근은 출근보다 늦어야 해요.</p>}
        <ErrorText>{error}</ErrorText>
        <div className="flex gap-2">
          <button onClick={save} disabled={invalid} className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white disabled:opacity-40">저장</button>
          <button onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-line py-2.5 text-sm">취소</button>
        </div>
      </li>
    );
  return (
    <li className="flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4">
      <div>
        <p className="font-medium">{date(s.start)}</p>
        <p className="text-sm text-muted tabular-nums">
          {time(s.start)} ~ {s.end ? time(s.end) : "근무 중"} · {hm(shiftMinutes(s))}
        </p>
      </div>
      <div className="flex gap-3 text-sm">
        <button onClick={() => setEditing(true)} className="text-accent">수정</button>
        <button onClick={remove} className="text-warn">삭제</button>
      </div>
    </li>
  );
}
