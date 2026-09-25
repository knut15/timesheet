"use client";
// 멤버 한 명의 월별 기록과 급여. 기록을 고치고 지운다. docs/prd/07-admin.md
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { api, errorCode, type ShiftDto } from "@/api/client";
import { useSession } from "@/auth/hooks";
import { PayView } from "@/components/PayView";
import { Avatar } from "@/components/shell";
import { Card, date, ErrorText, Field, hm, MonthPicker, monthRange, time, toLocalInput, toShift, useMonthCursor, useNow } from "@/components/ui";
import { parseDay, shiftMinutes, type PaySettings } from "@/lib/pay";
import { useApi } from "@/lib/useApi";
import { ACT_CANCEL, ACT_SAVE, BTN_ACCENT, BTN_WARN } from "../../_buttons";
import { MemberDetailSkeleton } from "../../_skeletons";

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
  const absRes = useApi(() => api.GET("/api/stores/me/absences", { params: { query: range } }), `${range.from}|${range.to}`);
  const absences = useMemo(() => (absRes.data ?? []).filter((a) => a.userId === userId), [absRes.data, userId]);
  const now = useNow(60_000);
  const shifts = useMemo(() => (shiftsRes.data ?? []).map(toShift), [shiftsRes.data]);

  const member = members.data?.find((m) => m.userId === userId);
  if (members.data && !member) return <Card><p className="text-sm text-muted">이 매장의 멤버가 아니에요. <Link href="/admin/members" className="text-accent">멤버 목록</Link></p></Card>;
  // 휴가 목록(absRes)도 기다린다 — 기록 목록 위에 뒤늦게 끼어들어 행이 밀리지 않게
  if (!member || !shiftsRes.data || !absRes.data || session.status !== "authenticated") return <MemberDetailSkeleton />;

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
        <div className="flex items-center gap-3">
          <Avatar name={member.nickname} seed={member.userId} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{member.nickname}</h2>
            <p className="truncate text-sm text-muted">{member.email}</p>
          </div>
        </div>
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
        <PayView shifts={shifts} absences={absences} settings={settings} year={cursor.year} month={cursor.month} now={now} />
      ) : inMonth.length === 0 && absences.length === 0 ? (
        <Card><p className="text-center text-sm text-muted">이 달 기록이 없어요.</p></Card>
      ) : (
        <ul className="space-y-3">
          {absences
            .filter((a) => a.date.startsWith(`${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`))
            .map((a) => (
              <li key={`${a.sourceId}-${a.date}`} className="rounded-2xl border border-dashed border-line px-5 py-3 text-sm">
                <p className="font-medium">{date(parseDay(a.date))}</p>
                <p className="text-muted">{{ paid_leave: "유급 휴가", unpaid_leave: "무급 휴가", substitution: "대타로 쉼" }[a.kind]} · 요청 탭에서 관리</p>
              </li>
            ))}
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
          <button onClick={save} disabled={invalid} className={`${ACT_SAVE} disabled:opacity-40`}>저장</button>
          <button onClick={() => setEditing(false)} className={ACT_CANCEL}>취소</button>
        </div>
      </li>
    );
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-4">
      <div>
        <p className="font-medium">{date(s.start)}</p>
        <p className="text-sm text-muted tabular-nums">
          {time(s.start)} ~ {s.end ? time(s.end) : "근무 중"} · {hm(shiftMinutes(s))}
        </p>
      </div>
      {/* 글자 대신 버튼 모양 — 멤버 목록 카드와 같은 BTN_* (2026-09-25 사용자 요청 "수정, 삭제 버튼디자인") */}
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className={BTN_ACCENT}>수정</button>
        <button onClick={remove} className={BTN_WARN}>삭제</button>
      </div>
    </li>
  );
}
