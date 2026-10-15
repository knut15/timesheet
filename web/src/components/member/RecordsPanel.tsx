"use client";
// 멤버의 기록 탭 — 자기 기록을 달력(기본)이나 목록으로 보고, 고칠 것은 수정·삭제·추가를 요청한다. 반영은 사장님 승인 뒤.
// docs/prd/08, docs/prd/10-calendar.md, 화면 명세 docs/design/calendar.md §2·§4
import { useState } from "react";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { api, errorCode, type Absence, type Correction } from "@/api/client";
import { ABSENCE_LABEL, ABSENCE_SHORT, compactHours, dateLabel, dayAriaLabel, memberDays } from "@/lib/calendar";
import { dayKey, parseDay, shiftMinutes, type Shift } from "@/lib/pay";
import { CalendarLegend } from "../calendar/CalendarLegend";
import { MonthGrid } from "../calendar/MonthGrid";
import { useSelectedDay } from "../calendar/useSelectedDay";
import { ViewToggle } from "../calendar/ViewToggle";
import { Enter } from "../motion";
import { BTN, Card, date, ErrorText, Field, hm, NUM, SectionLabel, StatusPill, time, toLocalInput, useNow } from "../ui";

const MESSAGES: Record<string, string> = {
  REQUEST_PENDING: "이 기록에는 이미 대기 중인 요청이 있어요.",
  VALIDATION_FAILED: "퇴근은 출근보다 늦어야 하고, 사유가 필요해요.",
  NOT_FOUND: "기록을 찾을 수 없어요.",
};

type Form = { mode: "edit" | "delete" | "add"; shift?: Shift };
type FormState = { form: Form | null; setForm: (f: Form | null) => void; onChange: () => void };

type Props = {
  shifts: Shift[];
  absences: Absence[];
  corrections: Correction[];
  year: number;
  month: number;
  loading: boolean; // 지금 data 가 다른 달 것이다
  failed: boolean;
  onRetry: () => void;
  onChange: () => void;
};

export function RecordsPanel(props: Props) {
  // 보기와 선택은 이 안의 상태다 — 보기를 바꿔도 선택이 남고, 탭을 다시 열면 달력으로 돌아온다
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [form, setForm] = useState<Form | null>(null);
  const fs: FormState = { form, setForm, onChange: props.onChange };
  const pendingByShift = new Map(props.corrections.filter((c) => c.status === "pending" && c.shiftId).map((c) => [c.shiftId!, c]));

  return (
    // 카드가 차례로 나타나고, 불러오기가 끝나면(loading 이 바뀌면) 다시
    <Enter className="space-y-3" replay={props.loading}>
      <ViewToggle value={view} onChange={setView} />
      {props.failed ? (
        <Card className="space-y-3">
          <ErrorText>기록을 불러오지 못했어요.</ErrorText>
          <button type="button" onClick={props.onRetry} className={`${BTN.secondary} w-full`}>다시 시도</button>
        </Card>
      ) : view === "calendar" ? (
        <CalendarView {...props} fs={fs} pendingByShift={pendingByShift} />
      ) : (
        <ListView {...props} fs={fs} pendingByShift={pendingByShift} />
      )}
    </Enter>
  );
}

type ViewProps = Props & { fs: FormState; pendingByShift: Map<string, Correction> };

function CalendarView({ shifts, absences, corrections, year, month, loading, fs, pendingByShift }: ViewProps) {
  const now = useNow(60_000);
  const todayKey = dayKey(now);
  const [selected, setSelected] = useSelectedDay(year, month, todayKey);
  const days = memberDays(shifts, absences, corrections, now);
  const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
  const empty = ![...days.keys()].some((k) => k.startsWith(ym));

  const cell = (key: string) => {
    const d = days.get(key);
    const isToday = key === todayKey;
    return {
      label: loading ? [dateLabel(key), ...(isToday ? ["오늘"] : []), "불러오는 중"].join(", ") : dayAriaLabel(key, isToday, d, "member"),
      marks: { open: d?.open ?? undefined, pending: d?.pending, dashed: !!d?.absence },
      body: (
        <>
          {!!d?.minutes && <span className={`text-[11px] font-semibold text-foreground ${NUM}`}>{compactHours(d.minutes)}</span>}
          {d?.absence && <span className="text-[10px] text-muted">{ABSENCE_SHORT[d.absence]}</span>}
        </>
      ),
    };
  };

  const sel = selected ? days.get(selected) : undefined;
  const dayShifts = selected ? shifts.filter((s) => dayKey(s.start) === selected).sort((a, b) => a.start - b.start) : [];
  const dayAdds = selected ? corrections.filter((c) => c.status === "pending" && c.action === "add" && c.start && dayKey(Date.parse(c.start)) === selected) : [];
  const dayAbsences = selected ? absences.filter((a) => a.date === selected) : [];
  const nothing = dayShifts.length + dayAdds.length + dayAbsences.length === 0;

  return (
    <>
      <MonthGrid
        year={year}
        month={month}
        todayKey={todayKey}
        selectedKey={selected}
        onSelect={setSelected}
        busy={loading}
        cellHeight={56}
        cell={cell}
        footer={
          loading ? (
            <p className="text-[11px] text-muted">불러오는 중…</p>
          ) : (
            <>
              {empty && <p className="mb-2 text-center text-sm text-muted">이 달 기록이 없어요.</p>}
              <CalendarLegend role="member" />
            </>
          )
        }
      />
      <Card>
        <div aria-live="polite">
          <SectionLabel>
            <span className={NUM}>{selected ? `${date(parseDay(selected))}${sel?.minutes ? ` · ${hm(sel.minutes)}` : ""}` : ""}</span>
          </SectionLabel>
        </div>
        {!selected ? (
          <p className="mt-2 text-sm text-muted">날짜를 누르면 그날 기록이 나와요.</p>
        ) : loading ? (
          <p className="mt-2 text-sm text-muted">불러오는 중…</p>
        ) : nothing ? (
          <p className="mt-2 text-sm text-muted">이 날 기록이 없어요.</p>
        ) : (
          <ul className={ROWS}>
            {dayShifts.map((s) => <RecordRow key={s.id} shift={s} pending={pendingByShift.has(s.id)} fs={fs} showDate={false} />)}
            {dayAdds.map((c) => <PendingAddRow key={c.id} correction={c} showDate={false} />)}
            {dayAbsences.map((a) => <AbsenceRow key={`${a.sourceId}-${a.date}`} absence={a} showDate={false} />)}
          </ul>
        )}
      </Card>
      <AddRequest fs={fs} />
      <Hint />
    </>
  );
}

function ListView({ shifts, absences, corrections, year, month, loading, fs, pendingByShift }: ViewProps) {
  const inMonth = (t: number) => {
    const d = new Date(t);
    return d.getFullYear() === year && d.getMonth() === month;
  };
  const pendingAdds = corrections.filter((c) => c.status === "pending" && c.action === "add");

  // 기록과 휴가·대타 날을 날짜순으로 섞어 보여 준다
  const rows = [
    ...shifts.filter((s) => inMonth(s.start)).map((s) => ({ t: s.start, shift: s })),
    ...absences.filter((a) => inMonth(parseDay(a.date).getTime())).map((a) => ({ t: parseDay(a.date).getTime(), absence: a })),
  ].sort((a, b) => b.t - a.t);

  return (
    <div className="space-y-3">
      <AddRequest fs={fs} />
      {pendingAdds.length > 0 && (
        <Card className="py-1.5">
          <ul className={ROWS_FLUSH}>
            {pendingAdds.map((c) => <PendingAddRow key={c.id} correction={c} showDate />)}
          </ul>
        </Card>
      )}
      {loading ? (
        <Card><p className="text-center text-sm text-muted">불러오는 중…</p></Card>
      ) : rows.length === 0 ? (
        <Card><p className="text-center text-sm text-muted">이 달 기록이 없어요.</p></Card>
      ) : (
        <Card className="py-1.5">
          <ul className={ROWS_FLUSH}>
            {rows.map((r) =>
              "shift" in r && r.shift ? (
                <RecordRow key={r.shift.id} shift={r.shift} pending={pendingByShift.has(r.shift.id)} fs={fs} showDate />
              ) : "absence" in r && r.absence ? (
                <AbsenceRow key={`${r.absence.sourceId}-${r.absence.date}`} absence={r.absence} showDate />
              ) : null,
            )}
          </ul>
        </Card>
      )}
      <Hint />
    </div>
  );
}

// 카드 안 목록 — 줄 사이는 점선 (2026-10-15 B 시안 .list-row)
const ROWS = "mt-1 divide-y divide-dashed divide-line";
const ROWS_FLUSH = "divide-y divide-dashed divide-line";
const ROW = "flex items-center gap-2.5 py-2.5 text-[13px]";

/** 기록 한 줄 — 목록과 달력 상세가 같이 쓴다. 대기 중인 요청이 있으면 버튼 대신 "승인 대기" */
function RecordRow({ shift, pending, fs, showDate }: { shift: Shift; pending: boolean; fs: FormState; showDate: boolean }) {
  const { form, setForm, onChange } = fs;
  const span = `${time(shift.start)} ~ ${shift.end ? time(shift.end) : "근무 중"}`;
  return (
    <li>
      <div className={ROW}>
        <div className="min-w-0 flex-1">
          <p className={`font-medium ${NUM}`}>{showDate ? date(shift.start) : span}</p>
          <p className={`mt-px text-xs text-muted ${NUM}`}>{showDate ? `${span} · ${hm(shiftMinutes(shift))}` : hm(shiftMinutes(shift))}</p>
        </div>
        {pending ? (
          <StatusPill status="pending" />
        ) : (
          // 목록 안 보조 동작이라 작은 버튼(h-8)
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => setForm({ mode: "edit", shift })} className={BTN.small}><PencilLine size={13} aria-hidden />수정 요청</button>
            <button type="button" onClick={() => setForm({ mode: "delete", shift })} className={BTN.danger}><Trash2 size={13} aria-hidden />삭제 요청</button>
          </div>
        )}
      </div>
      {form?.shift?.id === shift.id && <div className="pb-3"><CorrectionForm form={form} onDone={() => (setForm(null), onChange())} onCancel={() => setForm(null)} /></div>}
    </li>
  );
}

/** 휴가·대타 한 줄 — 점선 테두리 표시 + 글자 (색만으로 구별하지 않는다) */
function AbsenceRow({ absence, showDate }: { absence: Absence; showDate: boolean }) {
  return (
    <li className={ROW}>
      {showDate && <p className={`min-w-0 flex-1 font-medium ${NUM}`}>{date(parseDay(absence.date))}</p>}
      <span className="inline-flex h-5 shrink-0 items-center rounded-md border border-dashed border-muted px-1.5 text-[11px] font-semibold text-muted">{ABSENCE_LABEL[absence.kind]}</span>
    </li>
  );
}

/** 대기 중인 추가 요청 한 줄 */
function PendingAddRow({ correction: c, showDate }: { correction: Correction; showDate: boolean }) {
  const times = `${time(Date.parse(c.start!))} ~ ${time(Date.parse(c.end!))}`;
  return (
    <li className={ROW}>
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${NUM}`}>{showDate ? `추가 요청 · ${date(Date.parse(c.start!))}` : times}</p>
        <p className={`mt-px text-xs text-muted ${NUM}`}>{showDate ? times : "추가 요청"}</p>
      </div>
      <StatusPill status={c.status} />
    </li>
  );
}

function AddRequest({ fs }: { fs: FormState }) {
  const { form, setForm, onChange } = fs;
  return (
    <>
      <button type="button" onClick={() => setForm({ mode: "add" })} className={`${BTN.dashed} w-full`}>
        <Plus size={16} aria-hidden /> 빠진 기록 추가 요청
      </button>
      {form?.mode === "add" && (
        <Card>
          <CorrectionForm form={form} onDone={() => (setForm(null), onChange())} onCancel={() => setForm(null)} flat />
        </Card>
      )}
    </>
  );
}

function Hint() {
  return <p className="px-0.5 text-xs leading-relaxed text-muted">요청은 사장님이 승인하면 기록에 반영돼요. 요청 탭에서 진행 상황을 볼 수 있어요.</p>;
}

/** flat: 카드 안에 바로 둘 때(바탕 상자 없이). 목록 줄 안에서는 옅은 바탕 상자로 줄과 구별한다 */
function CorrectionForm({ form, onDone, onCancel, flat = false }: { form: Form; onDone: () => void; onCancel: () => void; flat?: boolean }) {
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
    <form onSubmit={submit} className={`space-y-3 ${flat ? "" : "rounded-xl bg-background p-3"}`}>
      <SectionLabel as="h3">{title}</SectionLabel>
      {form.mode !== "delete" && (
        <div className="grid grid-cols-1 gap-2">
          <Field label="바른 출근"><input type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} className="field" /></Field>
          <Field label="바른 퇴근"><input type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} className="field" /></Field>
        </div>
      )}
      <Field label="사유"><input required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 퇴근을 깜빡했어요" className="field" /></Field>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button className={`${BTN.primary} flex-1`}>요청 보내기</button>
        <button type="button" onClick={onCancel} className={`${BTN.secondary} flex-1`}>취소</button>
      </div>
    </form>
  );
}
