"use client";
// 멤버의 요청 탭 — 휴가 신청, 대타 요청, 받은 대타 수락·거절, 내 요청 목록. docs/prd/08·09
// 흐름 규칙은 .claude/skills/timesheet-requests/SKILL.md
import { useState } from "react";
import { parseDay } from "@/lib/pay";
import { api, errorCode, type Colleague, type MyRequests } from "@/api/client";
import { Avatar } from "../shell";
import { Card, date, ErrorText, Field, StatusPill, time } from "../ui";

const MESSAGES: Record<string, string> = {
  LEAVE_OVERLAP: "이미 신청한 휴가와 날짜가 겹쳐요.",
  VALIDATION_FAILED: "입력값을 확인해 주세요.",
  REQUEST_CLOSED: "이미 처리된 요청이에요.",
  NOT_FOUND: "대상을 찾을 수 없어요.",
};
const msg = (e: unknown) => MESSAGES[errorCode(e) ?? ""] ?? "잠시 뒤 다시 시도해 주세요.";
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

export function RequestsPanel({ requests, colleagues, onChange }: { requests: MyRequests | null; colleagues: Colleague[]; onChange: () => void }) {
  const incoming = (requests?.substitutionsIn ?? []).filter((s) => s.status === "requested");
  return (
    <div className="space-y-4">
      {incoming.length > 0 && (
        <Card>
          <h2 className="font-semibold">받은 대타 요청</h2>
          <ul className="mt-3 space-y-3">
            {incoming.map((s) => (
              <IncomingSub key={s.id} sub={s} onChange={onChange} />
            ))}
          </ul>
        </Card>
      )}
      <LeaveForm onDone={onChange} />
      <SubstitutionForm colleagues={colleagues} onDone={onChange} />
      <MyList requests={requests} onChange={onChange} />
    </div>
  );
}

function IncomingSub({ sub, onChange }: { sub: MyRequests["substitutionsIn"][number]; onChange: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const act = async (kind: "accept" | "decline") => {
    const { error } = await api.POST(`/api/substitutions/{id}/${kind}`, { params: { path: { id: sub.id } } });
    if (error) return setError(msg(error));
    onChange();
  };
  return (
    <li className="rounded-xl bg-background p-3">
      <div className="flex items-center gap-2">
        <Avatar name={sub.requesterNickname} seed={sub.requesterId} size="sm" />
        <p className="text-sm">
          <strong>{sub.requesterNickname}</strong>님이 <strong>{date(parseDay(sub.date))}</strong> 대타를 부탁했어요
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">{sub.reason}</p>
      <ErrorText>{error}</ErrorText>
      <div className="mt-3 flex gap-2">
        <button onClick={() => act("accept")} className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white">수락</button>
        <button onClick={() => act("decline")} className="flex-1 rounded-xl border border-line py-2.5 text-sm">거절</button>
      </div>
      <p className="mt-2 text-xs text-muted">수락하면 사장님이 승인해야 확정돼요.</p>
    </li>
  );
}

function LeaveForm({ onDone }: { onDone: () => void }) {
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const [paid, setPaid] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await api.POST("/api/leaves", { body: { startDate: start, endDate: end < start ? start : end, paid, reason } });
    if (error) return setError(msg(error));
    setError(null);
    setReason("");
    setSent(true);
    onDone();
  };
  return (
    <Card>
      <h2 className="font-semibold">휴가 신청</h2>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="시작일"><input type="date" required value={start} onChange={(e) => setStart(e.target.value)} className="field" /></Field>
          <Field label="종료일"><input type="date" required min={start} value={end} onChange={(e) => setEnd(e.target.value)} className="field" /></Field>
        </div>
        <label className="flex items-center justify-between text-sm">
          <span>유급 휴가로 신청 (사장님이 바꿀 수 있어요)</span>
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
        </label>
        <Field label="사유"><input required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} className="field" /></Field>
        <ErrorText>{error}</ErrorText>
        {sent && !error && <p className="text-sm text-accent">신청했어요. 사장님 승인을 기다려요.</p>}
        <button className="w-full rounded-xl bg-accent py-3 font-semibold text-white">신청</button>
      </form>
    </Card>
  );
}

function SubstitutionForm({ colleagues, onDone }: { colleagues: Colleague[]; onDone: () => void }) {
  const [day, setDay] = useState(today());
  const [who, setWho] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  if (colleagues.length === 0) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await api.POST("/api/substitutions", { body: { date: day, substituteId: who, reason } });
    if (error) return setError(msg(error));
    setError(null);
    setReason("");
    setSent(true);
    onDone();
  };
  return (
    <Card>
      <h2 className="font-semibold">대타 요청</h2>
      <p className="mt-1 text-sm text-muted">동료가 수락하고 사장님이 승인하면 그날은 결근으로 세지 않아요.</p>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="날짜"><input type="date" required value={day} onChange={(e) => setDay(e.target.value)} className="field" /></Field>
          <Field label="대신 나올 동료">
            <select required value={who} onChange={(e) => setWho(e.target.value)} className="field">
              <option value="" disabled>선택</option>
              {colleagues.map((c) => (
                <option key={c.userId} value={c.userId}>{c.nickname}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="사유"><input required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} className="field" /></Field>
        <ErrorText>{error}</ErrorText>
        {sent && !error && <p className="text-sm text-accent">요청했어요. 동료의 수락을 기다려요.</p>}
        <button className="w-full rounded-xl border border-accent py-3 font-semibold text-accent">요청</button>
      </form>
    </Card>
  );
}

type Row = { key: string; kind: string; text: string; status: string; note: string | null; createdAt: string; cancel?: () => Promise<{ error?: unknown }> };

function MyList({ requests, onChange }: { requests: MyRequests | null; onChange: () => void }) {
  const [error, setError] = useState<string | null>(null);
  if (!requests) return null;
  const range = (a: string, b: string) => (a === b ? date(parseDay(a)) : `${date(parseDay(a))} ~ ${date(parseDay(b))}`);
  const rows: Row[] = [
    ...requests.corrections.map((c): Row => ({
      key: c.id,
      kind: { edit: "기록 수정", add: "기록 추가", delete: "기록 삭제" }[c.action],
      text: c.action === "delete" ? `${c.current ? `${date(Date.parse(c.current.start))} ${time(Date.parse(c.current.start))} 기록` : "기록"}` : `${date(Date.parse(c.start!))} ${time(Date.parse(c.start!))} ~ ${time(Date.parse(c.end!))}`,
      status: c.status,
      note: c.reviewNote,
      createdAt: c.createdAt,
      cancel: c.status === "pending" ? () => api.POST("/api/corrections/{id}/cancel", { params: { path: { id: c.id } } }) : undefined,
    })),
    ...requests.leaves.map((l): Row => ({
      key: l.id,
      kind: `휴가 (${l.paid ? "유급" : "무급"})${l.byMaster ? " · 사장님 등록" : ""}`,
      text: range(l.startDate, l.endDate),
      status: l.status,
      note: l.reviewNote,
      createdAt: l.createdAt,
      cancel: l.status === "pending" && !l.byMaster ? () => api.POST("/api/leaves/{id}/cancel", { params: { path: { id: l.id } } }) : undefined,
    })),
    ...requests.substitutionsOut.map((s): Row => ({
      key: s.id,
      kind: "대타 요청",
      text: `${date(parseDay(s.date))} · ${s.substituteNickname}님`,
      status: s.status,
      note: s.reviewNote,
      createdAt: s.createdAt,
      cancel: s.status === "requested" || s.status === "accepted" ? () => api.POST("/api/substitutions/{id}/cancel", { params: { path: { id: s.id } } }) : undefined,
    })),
    ...requests.substitutionsIn
      .filter((s) => s.status !== "requested")
      .map((s): Row => ({ key: s.id, kind: "대타 (내가 대신)", text: `${date(parseDay(s.date))} · ${s.requesterNickname}님 대신`, status: s.status, note: s.reviewNote, createdAt: s.createdAt })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Card className="p-0">
      <h2 className="px-5 pt-5 font-semibold">내 요청</h2>
      <ErrorText>{error}</ErrorText>
      {rows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted">아직 요청이 없어요.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {rows.map((r) => (
            <li key={r.key} className="flex items-start justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-xs text-muted">{r.kind}</p>
                <p className="text-sm">{r.text}</p>
                {r.note && <p className="mt-0.5 text-xs text-muted">사장님: {r.note}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill status={r.status} />
                {r.cancel && (
                  <button
                    onClick={async () => {
                      const { error } = await r.cancel!();
                      if (error) setError(msg(error));
                      onChange();
                    }}
                    className="text-xs text-muted underline"
                  >
                    취소
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
