"use client";
// 멤버의 기록 탭 — 자기 기록을 보고, 고칠 것은 수정·삭제·추가를 요청한다. 반영은 사장님 승인 뒤. docs/prd/08
import { useState } from "react";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { api, errorCode, type Absence, type Correction } from "@/api/client";
import { parseDay, shiftMinutes, type Shift } from "@/lib/pay";
import { Card, date, ErrorText, Field, hm, StatusPill, time, toLocalInput } from "../ui";

const MESSAGES: Record<string, string> = {
  REQUEST_PENDING: "이 기록에는 이미 대기 중인 요청이 있어요.",
  VALIDATION_FAILED: "퇴근은 출근보다 늦어야 하고, 사유가 필요해요.",
  NOT_FOUND: "기록을 찾을 수 없어요.",
};
const ABSENCE_LABEL = { paid_leave: "유급 휴가", unpaid_leave: "무급 휴가", substitution: "대타로 쉼" } as const;

type Form = { mode: "edit" | "delete" | "add"; shift?: Shift };

export function RecordsPanel({ shifts, absences, corrections, year, month, onChange }: {
  shifts: Shift[];
  absences: Absence[];
  corrections: Correction[];
  year: number;
  month: number;
  onChange: () => void;
}) {
  const [form, setForm] = useState<Form | null>(null);
  const inMonth = (t: number) => {
    const d = new Date(t);
    return d.getFullYear() === year && d.getMonth() === month;
  };
  const pendingByShift = new Map(corrections.filter((c) => c.status === "pending" && c.shiftId).map((c) => [c.shiftId!, c]));
  const pendingAdds = corrections.filter((c) => c.status === "pending" && c.action === "add");

  // 기록과 휴가·대타 날을 날짜순으로 섞어 보여 준다
  const rows = [
    ...shifts.filter((s) => inMonth(s.start)).map((s) => ({ t: s.start, shift: s })),
    ...absences.filter((a) => inMonth(parseDay(a.date).getTime())).map((a) => ({ t: parseDay(a.date).getTime(), absence: a })),
  ].sort((a, b) => b.t - a.t);

  return (
    <div className="space-y-3">
      <button onClick={() => setForm({ mode: "add" })} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3 text-sm text-muted hover:text-foreground">
        <Plus size={16} aria-hidden /> 빠진 기록 추가 요청
      </button>
      {form?.mode === "add" && <CorrectionForm form={form} onDone={() => (setForm(null), onChange())} onCancel={() => setForm(null)} />}
      {pendingAdds.map((c) => (
        <Card key={c.id} className="flex items-center justify-between gap-3 border-dashed py-4">
          <div>
            <p className="text-sm font-medium">추가 요청 · {date(Date.parse(c.start!))}</p>
            <p className="text-sm text-muted tabular-nums">{time(Date.parse(c.start!))} ~ {time(Date.parse(c.end!))}</p>
          </div>
          <StatusPill status={c.status} />
        </Card>
      ))}
      {rows.length === 0 && <Card><p className="text-center text-muted">이 달 기록이 없어요.</p></Card>}
      <ul className="space-y-3">
        {rows.map((r) =>
          "shift" in r && r.shift ? (
            <li key={r.shift.id} className="rounded-2xl border border-line bg-surface px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{date(r.shift.start)}</p>
                  <p className="text-sm text-muted tabular-nums">
                    {time(r.shift.start)} ~ {r.shift.end ? time(r.shift.end) : "근무 중"} · {hm(shiftMinutes(r.shift))}
                  </p>
                </div>
                {pendingByShift.has(r.shift.id) ? (
                  <StatusPill status="pending" />
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => setForm({ mode: "edit", shift: r.shift })} aria-label="수정 요청" title="수정 요청" className="rounded-lg p-2 text-muted hover:bg-line/60 hover:text-foreground"><PencilLine size={18} aria-hidden /></button>
                    <button onClick={() => setForm({ mode: "delete", shift: r.shift })} aria-label="삭제 요청" title="삭제 요청" className="rounded-lg p-2 text-muted hover:bg-line/60 hover:text-warn"><Trash2 size={18} aria-hidden /></button>
                  </div>
                )}
              </div>
              {form?.shift?.id === r.shift.id && <div className="mt-3"><CorrectionForm form={form} onDone={() => (setForm(null), onChange())} onCancel={() => setForm(null)} /></div>}
            </li>
          ) : "absence" in r && r.absence ? (
            <li key={`${r.absence.sourceId}-${r.absence.date}`} className="rounded-2xl border border-dashed border-line px-5 py-3">
              <p className="text-sm font-medium">{date(r.t)}</p>
              <p className="text-sm text-muted">{ABSENCE_LABEL[r.absence.kind]}</p>
            </li>
          ) : null,
        )}
      </ul>
      <p className="px-1 text-xs text-muted">요청은 사장님이 승인하면 기록에 반영돼요. 요청 탭에서 진행 상황을 볼 수 있어요.</p>
    </div>
  );
}

function CorrectionForm({ form, onDone, onCancel }: { form: Form; onDone: () => void; onCancel: () => void }) {
  const base = form.shift;
  const [start, setStart] = useState(base ? toLocalInput(base.start) : "");
  const [end, setEnd] = useState(base?.end ? toLocalInput(base.end) : "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const title = { edit: "수정 요청", delete: "삭제 요청", add: "빠진 기록 추가 요청" }[form.mode];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const times = form.mode === "delete" ? {} : { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
    const { error } = await api.POST("/api/corrections", { body: { action: form.mode, shiftId: base?.id, reason, ...times } });
    if (error) return setError(MESSAGES[errorCode(error) ?? ""] ?? "잠시 뒤 다시 시도해 주세요.");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-background p-4">
      <p className="text-sm font-semibold">{title}</p>
      {form.mode !== "delete" && (
        <div className="grid grid-cols-1 gap-2">
          <Field label="바른 출근"><input type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} className="field" /></Field>
          <Field label="바른 퇴근"><input type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} className="field" /></Field>
        </div>
      )}
      <Field label="사유"><input required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 퇴근을 깜빡했어요" className="field" /></Field>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white">요청 보내기</button>
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-line py-2.5 text-sm">취소</button>
      </div>
    </form>
  );
}
