"use client";
// 멤버 목록 — 급여 조건·근무 시간표를 고치고 퇴사처리한다. docs/prd/07-admin.md, docs/prd/13-work-schedule.md
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Plus, TicketPlus } from "lucide-react";
import { api, type Member, type Schedule } from "@/api/client";
import { Enter } from "@/components/motion";
import { Avatar } from "@/components/shell";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BTN, Card, date, ErrorText, Field, Loading, NUM, SectionLabel, useNow, won } from "@/components/ui";
import { cn } from "@/lib/utils";
import { dayKey, MINIMUM_WAGE, parseDay } from "@/lib/pay";
import { DAY_NAMES, digitsOf, scheduleProblem, scheduleTerms, scheduleText, TIME_OPTIONS, WEEK_ORDER, withCommas } from "@/lib/schedule";
import { useApi } from "@/lib/useApi";
import { ExceptionRowsSkeleton, MembersSkeleton } from "../_skeletons";

export default function MembersPage() {
  const { data, reload } = useApi(() => api.GET("/api/stores/me/members"), "");
  if (!data) return <MembersSkeleton />;
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
  // 열 때마다 지금 값으로 다시 채운다 — 취소한 입력이 남지 않게
  const open = () => {
    setForm({ hourlyWage: member.hourlyWage, schedule: member.schedule ?? { days: [], start: "10:00", end: "15:00" } });
    setError(null);
    setEditing(true);
  };
  const remove = async () => {
    if (!window.confirm(`${member.nickname}님을 퇴사처리할까요? 매장에서 빠지고 근무 기록은 남아요.`)) return;
    await api.DELETE("/api/stores/me/members/{userId}", { params: { path: { userId: member.userId } } });
    onChange();
  };
  const setSchedule = (patch: Partial<Schedule>) => setForm({ ...form, schedule: { ...form.schedule, ...patch } });
  const toggleDay = (d: number) =>
    setSchedule({ days: form.schedule.days.includes(d) ? form.schedule.days.filter((x) => x !== d) : [...form.schedule.days, d] });

  return (
    <li>
      {/* 구역 둘 — 위는 사람·조건, 아래는 날짜별 변경 (B 시안 9) */}
      <Card className="divide-y divide-line p-0">
        <div className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={member.nickname} seed={member.userId} />
            <div className="min-w-0 flex-1">
              <Link href={`/admin/members/${member.userId}`} className="font-semibold underline-offset-2 hover:underline">{member.nickname}</Link>
              <p className="truncate text-xs text-muted">{member.email}</p>
            </div>
            <Link href={`/admin/members/${member.userId}`} className={`${BTN.small} shrink-0`}>근무 기록</Link>
          </div>
          {/* 근무 시간표 줄 — 시급 · 요일·시각 · 주 시간 · 일수 */}
          <p className={`mt-2.5 text-xs text-muted ${NUM}`}>
            {won(member.hourlyWage)} · {member.schedule ? `${scheduleText(member.schedule)} · ` : ""}주 {member.weeklyHours}시간 · {member.workDaysPerWeek}일
            {!member.schedule && " · 시간표 없음"}
          </p>
          <div className="mt-2.5 flex gap-1.5">
            <button onClick={open} className={BTN.small}>조건 수정</button>
            <button onClick={remove} className={BTN.danger}>퇴사처리</button>
          </div>
        </div>
        {/* 조건 수정은 모달로 (2026-09-25 사용자 요청) — shadcn Dialog */}
        <Dialog open={editing} onOpenChange={setEditing}>
          {/* 원본(components/ui/dialog.tsx)은 두고 바깥에서 B 모양만 — 카드와 같은 8px 모서리·1px 선 */}
          <DialogContent className="max-h-[calc(100dvh-2rem)] gap-4 overflow-y-auto rounded-2xl bg-surface p-5 ring-line sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold tracking-tight">{member.nickname} 조건 수정</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Field label="시급(원)">
                <input
                  inputMode="numeric"
                  value={withCommas(form.hourlyWage)}
                  onChange={(e) => setForm({ ...form, hourlyWage: digitsOf(e.target.value) })}
                  className={`field ${NUM}`}
                />
              </Field>
              {form.hourlyWage < MINIMUM_WAGE && <p className="text-sm text-warn">2026년 최저임금({won(MINIMUM_WAGE)})보다 낮아요.</p>}
              <fieldset>
                {/* Field 이름과 같은 작은 회색 글자 */}
                <legend className="mb-1.5 text-xs font-semibold text-muted">근무 요일</legend>
                <div className="grid grid-cols-7 gap-1">
                  {WEEK_ORDER.map((d) => {
                    const on = form.schedule.days.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDay(d)}
                        className={`h-11 rounded-xl border text-[13px] font-semibold ${on ? "border-foreground bg-foreground text-background" : "border-line bg-surface text-muted hover:text-foreground"}`}
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
              <p className={`text-[13px] text-muted ${NUM}`}>
                {form.schedule.days.length > 0 && !problem ? `주 ${terms.weeklyHours}시간 · ${terms.workDaysPerWeek}일 (시간표로 계산)` : problem}
              </p>
              <ErrorText>{error}</ErrorText>
            </div>
            <DialogFooter className="-mx-5 -mb-5 flex-row border-line bg-transparent px-5 py-4">
              <button onClick={() => setEditing(false)} className={`${BTN.secondary} flex-1`}>취소</button>
              <button onClick={save} className={`${BTN.primary} flex-1`}>저장</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ScheduleExceptions userId={member.userId} />
      </Card>
    </li>
  );
}

/** 날짜별 변경 한 줄 — 점선으로 나눈다 (B 시안 .list-row). 스켈레톤(_skeletons.tsx ExceptionRowsSkeleton)도 같은 높이 */
const EXCEPTION_ROW = "flex items-center gap-2.5 border-b border-dashed border-line py-2.5 text-[13px] last:border-b-0";

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
    <div className="px-4 py-3.5">
      <SectionLabel as="p">날짜별 변경</SectionLabel>
      {loadError ? (
        <ErrorText>불러오지 못했어요.</ErrorText>
      ) : !data ? (
        <Loading>
          <ExceptionRowsSkeleton />
        </Loading>
      ) : (
        data.length > 0 && (
          <ul className="mt-0.5">
            {data.map((e) => (
              <li key={e.id} className={EXCEPTION_ROW}>
                <span className={`min-w-0 flex-1 ${NUM}`}>
                  {date(parseDay(e.date))} <span className="text-muted">·</span> {e.kind === "off" ? "쉼" : `${e.start}~${e.end} 근무`}
                </span>
                <button onClick={() => remove(e.id)} className={`${BTN.danger} shrink-0`}>삭제</button>
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
            <button onClick={() => setAdding(false)} className={`${BTN.secondary} flex-1`}>취소</button>
            <button onClick={add} className={`${BTN.primary} flex-1`}>등록</button>
          </div>
        </div>
      ) : (
        // 추가는 점선 버튼 (B 시안 9 — 36px)
        <button onClick={() => setAdding(true)} className={cn(BTN.dashed, "mt-1.5 h-9 w-full gap-1 text-xs")}>
          <Plus size={14} aria-hidden />
          날짜별 변경 추가
        </button>
      )}
    </div>
  );
}
