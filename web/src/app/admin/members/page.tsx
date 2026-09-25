"use client";
// 멤버 목록 — 급여 조건·근무 시간표를 고치고 내보낸다. docs/prd/07-admin.md, docs/prd/13-work-schedule.md
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Plus, TicketPlus } from "lucide-react";
import { api, type Member, type Schedule } from "@/api/client";
import { Avatar } from "@/components/shell";
import { Card, date, ErrorText, Field, Spinner, useNow, won } from "@/components/ui";
import { dayKey, MINIMUM_WAGE, parseDay } from "@/lib/pay";
import { DAY_NAMES, digitsOf, scheduleProblem, scheduleTerms, scheduleText, TIME_OPTIONS, WEEK_ORDER, withCommas } from "@/lib/schedule";
import { useApi } from "@/lib/useApi";

export default function MembersPage() {
  const { data, reload } = useApi(() => api.GET("/api/stores/me/members"), "");
  if (!data) return <Spinner />;
  const members = data.filter((m) => m.role === "member");
  return (
    <div className="space-y-3">
      <InviteEntry />
      {members.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            아직 멤버가 없어요. <Link href="/admin/invites" className="text-accent">초대 코드를 발급</Link>해 보세요.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {members.map((m) => (
            <MemberRow key={m.userId} member={m} onChange={reload} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** 초대 화면 진입 줄. 초대는 하단 내비에서 빠지고 멤버 화면 안으로 들어왔다 (docs/design/calendar.md §1) */
function InviteEntry() {
  return (
    <Link href="/admin/invites" className="flex h-14 items-center gap-3 rounded-2xl border border-line bg-surface px-5 hover:bg-background">
      <TicketPlus size={20} aria-hidden className="text-accent" />
      <span className="flex-1 font-semibold">초대 코드</span>
      <span className="text-sm text-muted">발급·관리</span>
      <ChevronRight size={16} aria-hidden className="text-muted" />
    </Link>
  );
}

// 카드 안 동작은 글자 링크가 아니라 버튼 모양으로 (2026-09-25 사용자 요청 "텍스트 전부 버튼 디자인으로")
const BTN = "inline-flex h-10 shrink-0 items-center justify-center rounded-xl border px-3 text-sm font-semibold";
const BTN_ACCENT = `${BTN} border-accent text-accent hover:bg-accent/10`;
const BTN_WARN = `${BTN} border-warn text-warn hover:bg-warn/10`;

function MemberRow({ member, onChange }: { member: Member; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    hourlyWage: member.hourlyWage,
    // 시간표가 없던 멤버는 요일 없이 시작한다 (docs/prd/13)
    schedule: member.schedule ?? { days: [] as number[], start: "10:00", end: "15:00" },
  }));
  const [error, setError] = useState<string | null>(null);
  const problem = scheduleProblem(form.schedule);
  const terms = scheduleTerms(form.schedule);

  const save = async () => {
    // 시간표가 없던 멤버가 요일을 안 골랐으면 시급만 바꾼다
    const keepLegacy = !member.schedule && form.schedule.days.length === 0;
    if (problem && !keepLegacy) return setError(problem);
    const body = keepLegacy ? { hourlyWage: form.hourlyWage } : form;
    const { error } = await api.PATCH("/api/stores/me/members/{userId}", { params: { path: { userId: member.userId } }, body });
    if (error) return setError("저장하지 못했어요. 값을 확인해 주세요.");
    setError(null);
    setEditing(false);
    onChange();
  };
  const remove = async () => {
    if (!window.confirm(`${member.nickname}님을 매장에서 내보낼까요? 근무 기록은 남아요.`)) return;
    await api.DELETE("/api/stores/me/members/{userId}", { params: { path: { userId: member.userId } } });
    onChange();
  };
  const setSchedule = (patch: Partial<Schedule>) => setForm({ ...form, schedule: { ...form.schedule, ...patch } });
  const toggleDay = (d: number) =>
    setSchedule({ days: form.schedule.days.includes(d) ? form.schedule.days.filter((x) => x !== d) : [...form.schedule.days, d] });

  return (
    <li>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <Avatar name={member.nickname} seed={member.userId} />
          <div className="min-w-0 flex-1">
            <Link href={`/admin/members/${member.userId}`} className="font-semibold hover:underline">{member.nickname}</Link>
            <p className="truncate text-sm text-muted">{member.email}</p>
          </div>
          <Link href={`/admin/members/${member.userId}`} className={BTN_ACCENT}>근무 기록</Link>
        </div>
        {editing ? (
          <div className="mt-4 space-y-3">
            <Field label="시급(원)">
              <input
                inputMode="numeric"
                value={withCommas(form.hourlyWage)}
                onChange={(e) => setForm({ ...form, hourlyWage: digitsOf(e.target.value) })}
                className="field tabular-nums"
              />
            </Field>
            {form.hourlyWage < MINIMUM_WAGE && <p className="text-sm text-warn">2026년 최저임금({won(MINIMUM_WAGE)})보다 낮아요.</p>}
            <fieldset>
              <legend className="mb-1.5 text-sm text-muted">근무 요일</legend>
              <div className="grid grid-cols-7 gap-1">
                {WEEK_ORDER.map((d) => {
                  const on = form.schedule.days.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleDay(d)}
                      className={`h-11 rounded-xl border text-sm font-semibold ${on ? "border-accent bg-accent text-white" : "border-line text-muted"}`}
                    >
                      {DAY_NAMES[d]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-2">
              <Field label="출근">
                <select value={form.schedule.start} onChange={(e) => setSchedule({ start: e.target.value })} className="field">
                  {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="퇴근">
                <select value={form.schedule.end} onChange={(e) => setSchedule({ end: e.target.value })} className="field">
                  {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <p className="text-sm tabular-nums text-muted">
              {form.schedule.days.length > 0 && !problem ? `주 ${terms.weeklyHours}시간 · ${terms.workDaysPerWeek}일 (시간표로 계산)` : problem}
            </p>
            <ErrorText>{error}</ErrorText>
            <div className="flex gap-2">
              <button onClick={save} className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white">저장</button>
              <button onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-line py-2.5 text-sm">취소</button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="tabular-nums">
              {won(member.hourlyWage)} · {member.schedule ? `${scheduleText(member.schedule)} · ` : ""}주 {member.weeklyHours}시간 · {member.workDaysPerWeek}일
              {!member.schedule && <span className="text-muted"> · 시간표 없음</span>}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className={BTN_ACCENT}>조건 수정</button>
              <button onClick={remove} className={BTN_WARN}>내보내기</button>
            </div>
          </div>
        )}
        <ScheduleExceptions userId={member.userId} />
      </Card>
    </li>
  );
}

/** 날짜별 근무 변경 — 기본 시간표는 두고 그날 하루만 쉼·시각 변경. docs/prd/13 */
function ScheduleExceptions({ userId }: { userId: string }) {
  const today = dayKey(useNow(60_000));
  const { data, error: loadError, reload } = useApi(
    () => api.GET("/api/stores/me/members/{userId}/schedule-exceptions", { params: { path: { userId }, query: { from: today } } }),
    `${userId}|${today}`,
  );
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ date: today, kind: "off" as "off" | "work", start: "10:00", end: "15:00" });
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    const body = form.kind === "off" ? { date: form.date, kind: form.kind } : form;
    const { error } = await api.POST("/api/stores/me/members/{userId}/schedule-exceptions", { params: { path: { userId } }, body });
    if (error) return setError(form.kind === "work" ? "퇴근은 출근보다 늦어야 해요." : "저장하지 못했어요.");
    setError(null);
    setAdding(false);
    reload();
  };
  const remove = async (id: string) => {
    await api.DELETE("/api/stores/me/schedule-exceptions/{id}", { params: { path: { id } } });
    reload();
  };

  return (
    <div className="mt-4 border-t border-line pt-3 text-sm">
      <p className="font-semibold">날짜별 변경</p>
      {loadError ? (
        <ErrorText>불러오지 못했어요.</ErrorText>
      ) : (
        data &&
        data.length > 0 && (
          <ul className="mt-1">
            {data.map((e) => (
              <li key={e.id} className="flex min-h-11 items-center justify-between gap-2">
                <span className="tabular-nums">
                  {date(parseDay(e.date))} <span className="text-muted">·</span> {e.kind === "off" ? "쉼" : `${e.start}~${e.end} 근무`}
                </span>
                <button onClick={() => remove(e.id)} className={BTN_WARN}>삭제</button>
              </li>
            ))}
          </ul>
        )
      )}
      {adding ? (
        <div className="mt-2 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="날짜">
              <input type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="field" />
            </Field>
            <Field label="변경">
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as "off" | "work" })} className="field">
                <option value="off">쉼</option>
                <option value="work">근무 (시각 지정)</option>
              </select>
            </Field>
          </div>
          {form.kind === "work" && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="출근">
                <select value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="field">
                  {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="퇴근">
                <select value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="field">
                  {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          )}
          <p className="text-xs text-muted">같은 날짜에 다시 등록하면 덮어써요.</p>
          <ErrorText>{error}</ErrorText>
          <div className="flex gap-2">
            <button onClick={add} className="flex-1 rounded-xl bg-accent py-2.5 font-semibold text-white">등록</button>
            <button onClick={() => setAdding(false)} className="flex-1 rounded-xl border border-line py-2.5">취소</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className={`${BTN_ACCENT} mt-2 w-full gap-1`}>
          <Plus size={16} aria-hidden />
          날짜별 변경 추가
        </button>
      )}
    </div>
  );
}
