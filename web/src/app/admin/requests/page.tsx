"use client";
// 마스터 요청 화면 — 기록 수정 요청 승인·거절, 휴가·대타 승인·거절, 직접 등록·삭제. docs/prd/08·09
// 흐름 규칙은 .claude/skills/timesheet-requests/SKILL.md
import { useState } from "react";
import { parseDay } from "@/lib/pay";
import { api, errorCode, type Correction, type LeaveReq, type Member, type Substitution } from "@/api/client";
import { Avatar } from "@/components/shell";
import { Card, date, ErrorText, Field, Spinner, StatusPill, time } from "@/components/ui";
import { useApi } from "@/lib/useApi";

const MESSAGES: Record<string, string> = {
  REQUEST_CLOSED: "이미 처리된 요청이에요.",
  ALREADY_CLOCKED_IN: "근무 중인 기록이 이미 있어 반영할 수 없어요.",
  NOT_FOUND: "대상 기록이 없어요. 요청을 거절해 주세요.",
  LEAVE_OVERLAP: "그 멤버의 다른 휴가와 날짜가 겹쳐요.",
  SUBSTITUTE_NOT_ACCEPTED: "대타 동료가 아직 수락하지 않았어요.",
  VALIDATION_FAILED: "입력값을 확인해 주세요.",
};
const msg = (e: unknown) => MESSAGES[errorCode(e) ?? ""] ?? "잠시 뒤 다시 시도해 주세요.";
const span = (s: string, e: string | null) => `${date(Date.parse(s))} ${time(Date.parse(s))} ~ ${e ? time(Date.parse(e)) : "근무 중"}`;
const range = (a: string, b: string) => (a === b ? date(parseDay(a)) : `${date(parseDay(a))} ~ ${date(parseDay(b))}`);
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

export default function RequestsPage() {
  const req = useApi(() => api.GET("/api/stores/me/requests"), "");
  const members = useApi(() => api.GET("/api/stores/me/members"), "");
  if (!req.data || !members.data) return <Spinner />;
  const { corrections, leaves, substitutions } = req.data;
  const team = members.data.filter((m) => m.role === "member");
  const reload = req.reload;

  const pendingC = corrections.filter((c) => c.status === "pending");
  const pendingL = leaves.filter((l) => l.status === "pending");
  const waitingS = substitutions.filter((s) => s.status === "accepted" || s.status === "requested");
  const confirmedL = leaves.filter((l) => l.status === "approved");
  const confirmedS = substitutions.filter((s) => s.status === "approved");
  const closed = [
    ...corrections.filter((c) => c.status !== "pending").map((c) => ({ id: c.id, at: c.reviewedAt ?? c.createdAt, who: c.nickname, seed: c.userId, text: `기록 ${{ edit: "수정", add: "추가", delete: "삭제" }[c.action]}`, status: c.status })),
    ...leaves.filter((l) => l.status === "rejected" || l.status === "canceled").map((l) => ({ id: l.id, at: l.createdAt, who: l.nickname, seed: l.userId, text: `휴가 ${range(l.startDate, l.endDate)}`, status: l.status })),
    ...substitutions.filter((s) => ["declined", "rejected", "canceled"].includes(s.status)).map((s) => ({ id: s.id, at: s.createdAt, who: s.requesterNickname, seed: s.requesterId, text: `대타 ${date(parseDay(s.date))} → ${s.substituteNickname}`, status: s.status })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 20);

  const waiting = pendingC.length + pendingL.length + waitingS.length;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">처리할 요청 {waiting}건</h2>
        {waiting === 0 && <Card><p className="text-sm text-muted">대기 중인 요청이 없어요.</p></Card>}
        {pendingC.map((c) => <CorrectionCard key={c.id} c={c} onDone={reload} />)}
        {pendingL.map((l) => <LeaveCard key={l.id} l={l} onDone={reload} />)}
        {waitingS.map((s) => <SubCard key={s.id} s={s} onDone={reload} />)}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">직접 등록</h2>
        {team.length === 0 ? <Card><p className="text-sm text-muted">멤버가 있어야 등록할 수 있어요.</p></Card> : (
          <>
            <DirectLeave team={team} onDone={reload} />
            {team.length >= 2 && <DirectSub team={team} onDone={reload} />}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">확정된 휴가·대타</h2>
        {confirmedL.length + confirmedS.length === 0 && <Card><p className="text-sm text-muted">없어요.</p></Card>}
        <ul className="space-y-2">
          {confirmedL.map((l) => (
            <ConfirmedRow key={l.id} seed={l.userId} who={l.nickname} text={`휴가 ${range(l.startDate, l.endDate)} · ${l.paid ? "유급" : "무급"}${l.byMaster ? " · 직접 등록" : ""}`}
              onDelete={() => api.DELETE("/api/stores/me/leaves/{id}", { params: { path: { id: l.id } } })} onDone={reload} />
          ))}
          {confirmedS.map((s) => (
            <ConfirmedRow key={s.id} seed={s.requesterId} who={s.requesterNickname} text={`대타 ${date(parseDay(s.date))} → ${s.substituteNickname}님이 근무`}
              onDelete={() => api.DELETE("/api/stores/me/substitutions/{id}", { params: { path: { id: s.id } } })} onDone={reload} />
          ))}
        </ul>
      </section>

      {closed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted">최근 처리</h2>
          <Card className="p-0">
            <ul className="divide-y divide-line">
              {closed.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2"><Avatar name={r.who} seed={r.seed} size="sm" /><span className="truncate">{r.who} · {r.text}</span></span>
                  <StatusPill status={r.status} />
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}

function Who({ name, seed, kind }: { name: string; seed: string; kind: string }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar name={name} seed={seed} size="sm" />
      <p className="text-sm"><strong>{name}</strong> <span className="text-muted">· {kind}</span></p>
    </div>
  );
}

/** 승인·거절 버튼과 거절 메모. */
function Review({ onApprove, onReject, onDone, approveLabel = "승인", canApprove = true }: {
  onApprove: () => Promise<{ error?: unknown }>;
  onReject: (note: string) => Promise<{ error?: unknown }>;
  onDone: () => void;
  approveLabel?: string;
  canApprove?: boolean;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (f: () => Promise<{ error?: unknown }>) => {
    setBusy(true);
    const { error } = await f();
    setBusy(false);
    if (error) return setError(msg(error));
    onDone();
  };
  return (
    <div className="mt-3 space-y-2">
      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="메모 (거절 사유 등, 선택)" className="field text-sm" />
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        {canApprove && <button disabled={busy} onClick={() => run(onApprove)} className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50">{approveLabel}</button>}
        <button disabled={busy} onClick={() => run(() => onReject(note))} className="flex-1 rounded-xl border border-line py-2.5 text-sm disabled:opacity-50">거절</button>
      </div>
    </div>
  );
}

function CorrectionCard({ c, onDone }: { c: Correction; onDone: () => void }) {
  const kind = { edit: "기록 수정 요청", add: "기록 추가 요청", delete: "기록 삭제 요청" }[c.action];
  return (
    <Card>
      <Who name={c.nickname} seed={c.userId} kind={kind} />
      <dl className="mt-3 grid grid-cols-[4rem_1fr] gap-y-1 text-sm">
        {c.current && (<><dt className="text-muted">지금</dt><dd className="tabular-nums">{span(c.current.start, c.current.end)}</dd></>)}
        {c.action !== "delete" && (<><dt className="text-muted">요청</dt><dd className="font-medium tabular-nums">{span(c.start!, c.end)}</dd></>)}
        <dt className="text-muted">사유</dt><dd>{c.reason}</dd>
      </dl>
      <Review
        approveLabel={c.action === "delete" ? "승인 (기록 삭제)" : "승인 (기록에 반영)"}
        onApprove={() => api.POST("/api/stores/me/corrections/{id}/approve", { params: { path: { id: c.id } }, body: {} })}
        onReject={(note) => api.POST("/api/stores/me/corrections/{id}/reject", { params: { path: { id: c.id } }, body: { note: note || undefined } })}
        onDone={onDone}
      />
    </Card>
  );
}

function LeaveCard({ l, onDone }: { l: LeaveReq; onDone: () => void }) {
  const [paid, setPaid] = useState(l.paid);
  return (
    <Card>
      <Who name={l.nickname} seed={l.userId} kind="휴가 신청" />
      <p className="mt-2 text-sm font-medium">{range(l.startDate, l.endDate)}</p>
      <p className="text-sm text-muted">{l.reason}</p>
      <label className="mt-3 flex items-center justify-between text-sm">
        <span>유급으로 승인 (신청: {l.paid ? "유급" : "무급"})</span>
        <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
      </label>
      <Review
        onApprove={() => api.POST("/api/stores/me/leaves/{id}/approve", { params: { path: { id: l.id } }, body: { paid } })}
        onReject={(note) => api.POST("/api/stores/me/leaves/{id}/reject", { params: { path: { id: l.id } }, body: { note: note || undefined } })}
        onDone={onDone}
      />
    </Card>
  );
}

function SubCard({ s, onDone }: { s: Substitution; onDone: () => void }) {
  const waiting = s.status === "requested";
  return (
    <Card>
      <Who name={s.requesterNickname} seed={s.requesterId} kind="대타 요청" />
      <p className="mt-2 text-sm"><strong>{date(parseDay(s.date))}</strong> → <strong>{s.substituteNickname}</strong>님이 대신 근무</p>
      <p className="text-sm text-muted">{s.reason}</p>
      <div className="mt-2"><StatusPill status={s.status} /></div>
      <Review
        canApprove={!waiting}
        onApprove={() => api.POST("/api/stores/me/substitutions/{id}/approve", { params: { path: { id: s.id } }, body: {} })}
        onReject={(note) => api.POST("/api/stores/me/substitutions/{id}/reject", { params: { path: { id: s.id } }, body: { note: note || undefined } })}
        onDone={onDone}
      />
      {waiting && <p className="mt-2 text-xs text-muted">동료가 수락하면 승인할 수 있어요.</p>}
    </Card>
  );
}

function MemberSelect({ team, value, onChange, label }: { team: Member[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <Field label={label}>
      <select required value={value} onChange={(e) => onChange(e.target.value)} className="field">
        <option value="" disabled>선택</option>
        {team.map((m) => <option key={m.userId} value={m.userId}>{m.nickname}</option>)}
      </select>
    </Field>
  );
}

function DirectLeave({ team, onDone }: { team: Member[]; onDone: () => void }) {
  const [who, setWho] = useState("");
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const [paid, setPaid] = useState(true);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await api.POST("/api/stores/me/leaves", { body: { userId: who, startDate: start, endDate: end < start ? start : end, paid, reason } });
    if (error) return setError(msg(error));
    setError(null);
    setReason("");
    onDone();
  };
  return (
    <Card>
      <h3 className="font-semibold">휴가 등록</h3>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <MemberSelect team={team} value={who} onChange={setWho} label="멤버" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="시작일"><input type="date" required value={start} onChange={(e) => setStart(e.target.value)} className="field" /></Field>
          <Field label="종료일"><input type="date" required min={start} value={end} onChange={(e) => setEnd(e.target.value)} className="field" /></Field>
        </div>
        <label className="flex items-center justify-between text-sm">
          <span>유급 휴가</span>
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
        </label>
        <Field label="사유"><input required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} className="field" /></Field>
        <ErrorText>{error}</ErrorText>
        <button className="w-full rounded-xl bg-accent py-3 font-semibold text-white">등록 (바로 확정)</button>
      </form>
    </Card>
  );
}

function DirectSub({ team, onDone }: { team: Member[]; onDone: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [day, setDay] = useState(today());
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await api.POST("/api/stores/me/substitutions", { body: { requesterId: from, substituteId: to, date: day, reason } });
    if (error) return setError(from === to ? "쉬는 사람과 대신 나올 사람이 같아요." : msg(error));
    setError(null);
    setReason("");
    onDone();
  };
  return (
    <Card>
      <h3 className="font-semibold">대타 등록</h3>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MemberSelect team={team} value={from} onChange={setFrom} label="쉬는 멤버" />
          <MemberSelect team={team} value={to} onChange={setTo} label="대신 나올 멤버" />
        </div>
        <Field label="날짜"><input type="date" required value={day} onChange={(e) => setDay(e.target.value)} className="field" /></Field>
        <Field label="사유"><input required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} className="field" /></Field>
        <ErrorText>{error}</ErrorText>
        <button className="w-full rounded-xl border border-accent py-3 font-semibold text-accent">등록 (바로 확정)</button>
      </form>
    </Card>
  );
}

function ConfirmedRow({ seed, who, text, onDelete, onDone }: { seed: string; who: string; text: string; onDelete: () => Promise<{ error?: unknown }>; onDone: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
      <span className="flex min-w-0 items-center gap-2"><Avatar name={who} seed={seed} size="sm" /><span className="truncate">{who} · {text}</span></span>
      <button
        onClick={async () => {
          if (!window.confirm("이 휴가·대타를 지울까요? 급여 계산에서 빠져요.")) return;
          await onDelete();
          onDone();
        }}
        className="shrink-0 text-xs text-warn"
      >
        삭제
      </button>
    </li>
  );
}
