"use client";
// 멤버 목록 — 급여 조건을 고치고 내보낸다. docs/prd/07-admin.md
import Link from "next/link";
import { useState } from "react";
import { api, type Member } from "@/api/client";
import { Card, ErrorText, Field, Spinner, won } from "@/components/ui";
import { MINIMUM_WAGE } from "@/lib/pay";
import { useApi } from "@/lib/useApi";

export default function MembersPage() {
  const { data, reload } = useApi(() => api.GET("/api/stores/me/members"), "");
  if (!data) return <Spinner />;
  const members = data.filter((m) => m.role === "member");
  if (members.length === 0)
    return (
      <Card>
        <p className="text-sm text-muted">
          아직 멤버가 없어요. <Link href="/admin/invites" className="text-accent">초대 코드를 발급</Link>해 보세요.
        </p>
      </Card>
    );
  return (
    <ul className="space-y-3">
      {members.map((m) => (
        <MemberRow key={m.userId} member={m} onChange={reload} />
      ))}
    </ul>
  );
}

function MemberRow({ member, onChange }: { member: Member; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ hourlyWage: member.hourlyWage, weeklyHours: member.weeklyHours, workDaysPerWeek: member.workDaysPerWeek });
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const { error } = await api.PATCH("/api/stores/me/members/{userId}", { params: { path: { userId: member.userId } }, body: form });
    if (error) return setError("저장하지 못했어요. 값을 확인해 주세요.");
    setEditing(false);
    onChange();
  };
  const remove = async () => {
    if (!window.confirm(`${member.nickname}님을 매장에서 내보낼까요? 근무 기록은 남아요.`)) return;
    await api.DELETE("/api/stores/me/members/{userId}", { params: { path: { userId: member.userId } } });
    onChange();
  };
  const num = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.valueAsNumber });

  return (
    <li>
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/admin/members/${member.userId}`} className="font-semibold hover:underline">{member.nickname}</Link>
            <p className="truncate text-sm text-muted">{member.email}</p>
          </div>
          <Link href={`/admin/members/${member.userId}`} className="shrink-0 text-sm text-accent">근무 기록</Link>
        </div>
        {editing ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Field label="시급(원)"><input type="number" step={10} value={form.hourlyWage} onChange={num("hourlyWage")} className="field" /></Field>
              <Field label="주 시간"><input type="number" step={0.5} value={form.weeklyHours} onChange={num("weeklyHours")} className="field" /></Field>
              <Field label="주 일수"><input type="number" min={1} max={7} value={form.workDaysPerWeek} onChange={num("workDaysPerWeek")} className="field" /></Field>
            </div>
            {form.hourlyWage < MINIMUM_WAGE && <p className="text-sm text-warn">2026년 최저임금({won(MINIMUM_WAGE)})보다 낮아요.</p>}
            <ErrorText>{error}</ErrorText>
            <div className="flex gap-2">
              <button onClick={save} className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white">저장</button>
              <button onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-line py-2.5 text-sm">취소</button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="tabular-nums">
              {won(member.hourlyWage)} · 주 {member.weeklyHours}시간 · {member.workDaysPerWeek}일
            </p>
            <div className="flex gap-3">
              <button onClick={() => setEditing(true)} className="text-accent">조건 수정</button>
              <button onClick={remove} className="text-warn">내보내기</button>
            </div>
          </div>
        )}
      </Card>
    </li>
  );
}
