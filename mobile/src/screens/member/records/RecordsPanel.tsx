// 멤버의 기록 탭 — 자기 기록을 달력(기본)이나 목록으로 보고, 고칠 것은 수정·삭제·추가를 요청한다. 반영은 사장님 승인 뒤.
// 웹 web/src/components/member/RecordsPanel.tsx 의 앱판. docs/prd/08, docs/prd/10-calendar.md, 화면 명세 docs/design/calendar.md §2·§4
import { useState } from "react";
import { PencilLine, Plus, Trash2 } from "lucide-react-native";
import { View } from "react-native";
import type { Absence, Correction } from "@/api/client";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { ViewToggle } from "@/components/calendar/ViewToggle";
import { Enter } from "@/components/motion";
import { Bone, Btn, Card, ErrorText, Loading, SectionLabel, StatusPill, T } from "@/components/ui";
import { date, hm, time, useNow } from "@/lib/format";
import { C, R } from "@/theme";
import { ABSENCE_LABEL, ABSENCE_SHORT, compactHours, dateLabel, dayAriaLabel, memberDays } from "@shared/calendar";
import { dayKey, parseDay, shiftMinutes, type Shift } from "@shared/pay";
import { DashedList, LineBone, Num } from "./parts";
import { RequestDialog, type Form } from "./RequestDialog";
import { useSelectedDay } from "@/components/calendar/useSelectedDay";

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
  // 웹은 줄마다 대화상자를 두지만 한 번에 하나만 열린다 — 앱은 패널에 하나만 둔다
  const [form, setForm] = useState<Form | null>(null);
  const pendingByShift = new Map(props.corrections.filter((c) => c.status === "pending" && c.shiftId).map((c) => [c.shiftId!, c]));

  return (
    // 카드가 차례로 나타난다. 대화상자는 닫혀 있으면 아무것도 그리지 않으므로 Enter 밖에 둔다
    <>
    <Enter>
      <ViewToggle value={view} onChange={setView} />
      {props.failed ? (
        <Card style={{ gap: 12 }}>
          <ErrorText>기록을 불러오지 못했어요.</ErrorText>
          <Btn variant="secondary" label="다시 시도" onPress={props.onRetry} full />
        </Card>
      ) : view === "calendar" ? (
        <CalendarView {...props} setForm={setForm} pendingByShift={pendingByShift} />
      ) : (
        <ListView {...props} setForm={setForm} pendingByShift={pendingByShift} />
      )}
    </Enter>
    <RequestDialog form={form} onClose={() => setForm(null)} onChange={props.onChange} />
    </>
  );
}

type ViewProps = Props & { setForm: (f: Form | null) => void; pendingByShift: Map<string, Correction> };

function CalendarView({ shifts, absences, corrections, year, month, loading, setForm, pendingByShift }: ViewProps) {
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
          {!!d?.minutes && <T size={11} weight="semibold" mono color={C.foreground} style={{ lineHeight: 14 }}>{compactHours(d.minutes)}</T>}
          {d?.absence && <T size={10} color={C.muted} style={{ lineHeight: 13 }}>{ABSENCE_SHORT[d.absence]}</T>}
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
    <View style={{ gap: 12 }}>
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
            {!loading && empty && <T size={14} color={C.muted} style={{ textAlign: "center", marginBottom: 8 }}>이 달 기록이 없어요.</T>}
            <CalendarLegend role="member" />
          </>
        }
      />
      <Card>
        <View accessibilityLiveRegion="polite">
          <SectionLabel>
            <T size={12} weight="semibold" mono color={C.muted}>{selected ? `${date(parseDay(selected))}${sel?.minutes ? ` · ${hm(sel.minutes)}` : ""}` : " "}</T>
          </SectionLabel>
        </View>
        {!selected ? (
          <T size={14} color={C.muted} style={{ marginTop: 8 }}>날짜를 누르면 그날 기록이 나와요.</T>
        ) : loading ? (
          <Loading>
            <View style={{ marginTop: 4 }}>
              <RowSkeleton showDate={false} />
            </View>
          </Loading>
        ) : nothing ? (
          <T size={14} color={C.muted} style={{ marginTop: 8 }}>이 날 기록이 없어요.</T>
        ) : (
          <DashedList style={{ marginTop: 4 }}>
            {dayShifts.map((s) => <RecordRow key={s.id} shift={s} pending={pendingByShift.has(s.id)} setForm={setForm} showDate={false} />)}
            {dayAdds.map((c) => <PendingAddRow key={c.id} correction={c} showDate={false} />)}
            {dayAbsences.map((a) => <AbsenceRow key={`${a.sourceId}-${a.date}`} absence={a} showDate={false} />)}
          </DashedList>
        )}
      </Card>
      <AddRequest setForm={setForm} />
      <Hint />
    </View>
  );
}

function ListView({ shifts, absences, corrections, year, month, loading, setForm, pendingByShift }: ViewProps) {
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

  // 웹 Card className="py-1.5" — 위아래 6, 옆 16
  const flushCard = { paddingVertical: 6 };
  return (
    <View style={{ gap: 12 }}>
      <AddRequest setForm={setForm} />
      {pendingAdds.length > 0 && (
        <Card style={flushCard}>
          <DashedList>
            {pendingAdds.map((c) => <PendingAddRow key={c.id} correction={c} showDate />)}
          </DashedList>
        </Card>
      )}
      {loading ? (
        <Loading>
          <Card style={flushCard}>
            <DashedList>
              <RowSkeleton key="a" showDate />
              <RowSkeleton key="b" showDate />
              <RowSkeleton key="c" showDate />
            </DashedList>
          </Card>
        </Loading>
      ) : rows.length === 0 ? (
        <Card><T size={14} color={C.muted} style={{ textAlign: "center" }}>이 달 기록이 없어요.</T></Card>
      ) : (
        <Card style={flushCard}>
          <DashedList>
            {rows.map((r) =>
              "shift" in r && r.shift ? (
                <RecordRow key={r.shift.id} shift={r.shift} pending={pendingByShift.has(r.shift.id)} setForm={setForm} showDate />
              ) : "absence" in r && r.absence ? (
                <AbsenceRow key={`${r.absence.sourceId}-${r.absence.date}`} absence={r.absence} showDate />
              ) : null,
            )}
          </DashedList>
        </Card>
      )}
      <Hint />
    </View>
  );
}

// 줄 틀 — 웹 ROW "flex items-center gap-2.5 py-2.5 text-[13px]"
const ROW = { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 } as const;

/** 기록 한 줄 — 목록과 달력 상세가 같이 쓴다. 대기 중인 요청이 있으면 버튼 대신 "승인 대기" */
function RecordRow({ shift, pending, setForm, showDate }: { shift: Shift; pending: boolean; setForm: (f: Form) => void; showDate: boolean }) {
  const span = `${time(shift.start)} ~ ${shift.end ? time(shift.end) : "근무 중"}`;
  return (
    <View style={ROW}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Num weight="medium">{showDate ? date(shift.start) : span}</Num>
        <T size={12} mono color={C.muted} style={{ marginTop: 1 }}>{showDate ? `${span} · ${hm(shiftMinutes(shift))}` : hm(shiftMinutes(shift))}</T>
      </View>
      {pending ? (
        <StatusPill status="pending" />
      ) : (
        // 목록 안 보조 동작이라 작은 버튼(32)
        <View style={{ flexDirection: "row", flexShrink: 0, gap: 4 }}>
          <Btn variant="small" icon={PencilLine} label="수정 요청" onPress={() => setForm({ mode: "edit", shift })} />
          <Btn variant="danger" icon={Trash2} label="삭제 요청" onPress={() => setForm({ mode: "delete", shift })} />
        </View>
      )}
    </View>
  );
}

/**
 * 읽는 동안의 기록 한 줄 — RecordRow 와 같은 줄 틀에 글자 두 줄(13px·12px) 자리 막대,
 * 오른쪽은 수정 요청·삭제 요청 작은 버튼(32) 자리
 */
function RowSkeleton({ showDate }: { showDate: boolean }) {
  return (
    <View style={ROW}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <LineBone font={13} h={14} w={showDate ? 96 : 144} />
        <View style={{ marginTop: 1 }}><LineBone font={12} h={12} w={showDate ? 160 : 64} /></View>
      </View>
      <View style={{ flexDirection: "row", flexShrink: 0, gap: 4 }}>
        <Bone style={{ height: 32, width: 84, borderRadius: R.control }} />
        <Bone style={{ height: 32, width: 84, borderRadius: R.control }} />
      </View>
    </View>
  );
}

/** 휴가·대타 한 줄 — 점선 테두리 표시 + 글자 (색만으로 구별하지 않는다) */
function AbsenceRow({ absence, showDate }: { absence: Absence; showDate: boolean }) {
  return (
    <View style={ROW}>
      {showDate && <View style={{ flex: 1, minWidth: 0 }}><Num weight="medium">{date(parseDay(absence.date))}</Num></View>}
      <View style={{ height: 20, flexShrink: 0, justifyContent: "center", borderRadius: R.pill, borderWidth: 1, borderStyle: "dashed", borderColor: C.muted, paddingHorizontal: 6 }}>
        <T size={11} weight="semibold" color={C.muted} style={{ lineHeight: 14 }}>{ABSENCE_LABEL[absence.kind]}</T>
      </View>
    </View>
  );
}

/** 대기 중인 추가 요청 한 줄 */
function PendingAddRow({ correction: c, showDate }: { correction: Correction; showDate: boolean }) {
  const times = `${time(Date.parse(c.start!))} ~ ${time(Date.parse(c.end!))}`;
  return (
    <View style={ROW}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Num weight="medium">{showDate ? `추가 요청 · ${date(Date.parse(c.start!))}` : times}</Num>
        <T size={12} mono color={C.muted} style={{ marginTop: 1 }}>{showDate ? times : "추가 요청"}</T>
      </View>
      <StatusPill status={c.status} />
    </View>
  );
}

function AddRequest({ setForm }: { setForm: (f: Form) => void }) {
  return <Btn variant="dashed" icon={Plus} label="빠진 기록 추가 요청" onPress={() => setForm({ mode: "add" })} full />;
}

function Hint() {
  return <T size={12} color={C.muted} style={{ paddingHorizontal: 2, lineHeight: 19 }}>요청은 사장님이 승인하면 기록에 반영돼요. 요청 탭에서 진행 상황을 볼 수 있어요.</T>;
}
