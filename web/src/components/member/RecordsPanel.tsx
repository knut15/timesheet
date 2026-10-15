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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Bone, BTN, Card, date, ErrorText, Field, hm, Loading, NUM, SectionLabel, StatusPill, time, toLocalInput, useNow } from "../ui";

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
    <Enter className="space-y-3">
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
          // 범례는 데이터와 무관하다 — 읽는 동안에도 그대로 둬 격자 아래가 움직이지 않게 한다
          <>
            {!loading && empty && <p className="mb-2 text-center text-sm text-muted">이 달 기록이 없어요.</p>}
            <CalendarLegend role="member" />
          </>
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
          <Loading>
            <ul className={ROWS}>
              <RowSkeleton showDate={false} />
            </ul>
          </Loading>
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
        <Loading>
          <Card className="py-1.5">
            <ul className={ROWS_FLUSH}>
              <RowSkeleton showDate />
              <RowSkeleton showDate />
              <RowSkeleton showDate />
            </ul>
          </Card>
        </Loading>
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
  const { form, setForm } = fs;
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
      <RequestDialog form={form?.shift?.id === shift.id ? form : null} fs={fs} />
    </li>
  );
}

/**
 * 읽는 동안의 기록 한 줄 — RecordRow 와 같은 줄 틀(ROW)에 글자 두 줄(13px·12px) 자리 막대,
 * 오른쪽은 수정 요청·삭제 요청 작은 버튼(h-8) 자리. 막대는 글자 줄 안의 inline-block 이라 줄 높이가 같다
 */
function RowSkeleton({ showDate }: { showDate: boolean }) {
  return (
    <li className={ROW}>
      <div className="min-w-0 flex-1">
        {/* 막대는 글자 줄 안의 inline-block — 블록 안이라 줄 높이(13px·12px 글자의 줄)가 그대로 생긴다 */}
        <div className="font-medium"><Bone className={`inline-block h-3.5 align-middle ${showDate ? "w-24" : "w-36"}`} /></div>
        <div className="mt-px text-xs"><Bone className={`inline-block h-3 align-middle ${showDate ? "w-40" : "w-16"}`} /></div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Bone className="h-8 w-[84px] rounded-xl" />
        <Bone className="h-8 w-[84px] rounded-xl" />
      </div>
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
  const { form, setForm } = fs;
  return (
    <>
      <button type="button" onClick={() => setForm({ mode: "add" })} className={`${BTN.dashed} w-full`}>
        <Plus size={16} aria-hidden /> 빠진 기록 추가 요청
      </button>
      <RequestDialog form={form?.mode === "add" ? form : null} fs={fs} />
    </>
  );
}

const DIALOG_TEXT = {
  add: { title: "빠진 기록 추가 요청", desc: () => "출퇴근을 찍지 못한 날의 시각을 적어 주세요. 사장님이 승인하면 기록에 들어가요." },
  edit: { title: "수정 요청", desc: () => "바른 출퇴근 시각과 사유를 적어 주세요. 사장님이 승인하면 기록이 바뀌어요." },
  delete: {
    title: "삭제 요청",
    desc: (s?: Shift) => `${s ? `${date(s.start)} ${time(s.start)} ~ ${s.end ? time(s.end) : "근무 중"} 기록을 ` : ""}지워 달라고 요청해요. 사장님이 승인하면 기록에서 빠져요.`,
  },
} as const;

/**
 * 빠진 기록 추가·수정·삭제 요청 모달 (2026-10-15 사용자 요청 "빠진기록 요청은 모달팝업으로", "수정 요청도 마찬가지야", "삭제도 마찬가지로").
 * 조건 수정 모달과 같은 shadcn Dialog·같은 모양. form 이 null 이면 닫혀 있고, 닫으면(바깥·Esc·취소) 폼 상태를 지운다
 */
function RequestDialog({ form, fs }: { form: Form | null; fs: FormState }) {
  const { setForm, onChange } = fs;
  const text = form ? DIALOG_TEXT[form.mode] : null;
  return (
    <Dialog open={!!text} onOpenChange={(open) => !open && setForm(null)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-4 overflow-y-auto rounded-2xl bg-surface p-5 ring-line sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">{text?.title}</DialogTitle>
          <DialogDescription className="text-[13px] text-muted">{text?.desc(form?.shift)}</DialogDescription>
        </DialogHeader>
        {form && <CorrectionForm form={form} onDone={() => (setForm(null), onChange())} onCancel={() => setForm(null)} />}
      </DialogContent>
    </Dialog>
  );
}

function Hint() {
  return <p className="px-0.5 text-xs leading-relaxed text-muted">요청은 사장님이 승인하면 기록에 반영돼요. 요청 탭에서 진행 상황을 볼 수 있어요.</p>;
}

/** 요청 폼 — RequestDialog 안에서만 쓴다. 제목은 모달 머리가 맡고, 버튼은 모달 아래(취소 · 요청 보내기) */
function CorrectionForm({ form, onDone, onCancel }: { form: Form; onDone: () => void; onCancel: () => void }) {
  const base = form.shift;
  const [start, setStart] = useState(base ? toLocalInput(base.start) : "");
  const [end, setEnd] = useState(base?.end ? toLocalInput(base.end) : "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const times = form.mode === "delete" ? {} : { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
    const { error } = await api.POST("/api/corrections", { body: { action: form.mode, shiftId: base?.id, reason, ...times } });
    if (error) return setError(MESSAGES[errorCode(error) ?? ""] ?? "잠시 뒤 다시 시도해 주세요.");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {form.mode !== "delete" && (
        <div className="grid grid-cols-1 gap-2">
          <Field label="바른 출근"><input type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} className="field" /></Field>
          <Field label="바른 퇴근"><input type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} className="field" /></Field>
        </div>
      )}
      <Field label="사유"><input required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 퇴근을 깜빡했어요" className="field" /></Field>
      <ErrorText>{error}</ErrorText>
      <DialogFooter className="-mx-5 -mb-5 mt-4 flex-row border-line bg-transparent px-5 py-4">
        <button type="button" onClick={onCancel} className={`${BTN.secondary} flex-1`}>취소</button>
        <button className={`${BTN.primary} flex-1`}>요청 보내기</button>
      </DialogFooter>
    </form>
  );
}
