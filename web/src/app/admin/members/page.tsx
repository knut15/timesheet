"use client";
// 멤버 목록 — 급여 조건을 고치고 내보낸다. docs/prd/07-admin.md
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, TicketPlus } from "lucide-react";
import { api, type Member } from "@/api/client";
import { Enter } from "@/components/motion";
import { Avatar } from "@/components/shell";
import { BTN, Card, ErrorText, Field, NUM, Spinner, won } from "@/components/ui";
import { MINIMUM_WAGE } from "@/lib/pay";
import { useApi } from "@/lib/useApi";

export default function MembersPage() {
  const { data, reload } = useApi(() => api.GET("/api/stores/me/members"), "");
  if (!data) return <Spinner />;
  const members = data.filter((m) => m.role === "member");
  return (
    <Enter className="space-y-3">
      <InviteEntry />
      {members.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            아직 멤버가 없어요. <Link href="/admin/invites" className="font-medium text-accent">초대 코드를 발급</Link>해 보세요.
          </p>
        </Card>
      ) : (
        // 넓은 화면에서는 두 줄로
        <ul className="grid items-start gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <MemberRow key={m.userId} member={m} onChange={reload} />
          ))}
        </ul>
      )}
    </Enter>
  );
}

/** 초대 화면 진입 줄. 초대는 하단 내비에서 빠지고 멤버 화면 안으로 들어왔다 (docs/design/calendar.md §1) */
function InviteEntry() {
  return (
    <Link href="/admin/invites" className="flex h-14 items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 hover:bg-background">
      <TicketPlus size={20} strokeWidth={1.75} aria-hidden className="text-muted" />
      <span className="flex-1 font-semibold">초대 코드</span>
      <span className="text-[13px] text-muted">발급·관리</span>
      <ChevronRight size={15} aria-hidden className="text-muted" />
    </Link>
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
        <div className="flex items-center gap-2.5">
          <Avatar name={member.nickname} seed={member.userId} />
          <div className="min-w-0 flex-1">
            <Link href={`/admin/members/${member.userId}`} className="font-semibold underline-offset-2 hover:underline">{member.nickname}</Link>
            <p className="truncate text-xs text-muted">{member.email}</p>
          </div>
          <Link href={`/admin/members/${member.userId}`} className={`${BTN.small} shrink-0`}>근무 기록</Link>
        </div>
        {editing ? (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Field label="시급(원)"><input type="number" step={10} value={form.hourlyWage} onChange={num("hourlyWage")} className="field" /></Field>
              <Field label="주 시간"><input type="number" step={0.5} value={form.weeklyHours} onChange={num("weeklyHours")} className="field" /></Field>
              <Field label="주 일수"><input type="number" min={1} max={7} value={form.workDaysPerWeek} onChange={num("workDaysPerWeek")} className="field" /></Field>
            </div>
            {form.hourlyWage < MINIMUM_WAGE && <p className="text-sm text-warn">2026년 최저임금({won(MINIMUM_WAGE)})보다 낮아요.</p>}
            <ErrorText>{error}</ErrorText>
            <div className="flex gap-2">
              <button onClick={save} className={`${BTN.primary} flex-1`}>저장</button>
              <button onClick={() => setEditing(false)} className={`${BTN.secondary} flex-1`}>취소</button>
            </div>
          </div>
        ) : (
          <>
            <p className={`mt-2.5 text-xs text-muted ${NUM}`}>
              {won(member.hourlyWage)} · 주 {member.weeklyHours}시간 · {member.workDaysPerWeek}일
            </p>
            <div className="mt-2.5 flex gap-1.5">
              <button onClick={() => setEditing(true)} className={BTN.small}>조건 수정</button>
              <button onClick={remove} className={BTN.danger}>내보내기</button>
            </div>
          </>
        )}
      </Card>
    </li>
  );
}
