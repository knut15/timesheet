// 마스터 근무 달력 — 전체 멤버가 날마다 누가·몇 시간 일했는지. 웹 web/src/app/admin/calendar/page.tsx 의 앱판.
// docs/prd/10-calendar.md, 화면 명세 docs/design/calendar.md §5
import { useRouter } from "expo-router";
import { ChevronRight, TriangleAlert } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { api, type Absence, type Correction, type Dashboard } from "@/api/client";
import { AvatarStack } from "@/components/calendar/AvatarStack";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { Enter } from "@/components/motion";
import { Screen } from "@/components/shell";
import { Avatar, Btn, Card, ErrorText, Loading, MonthPicker, StatusPill, T } from "@/components/ui";
import { date, hm, keyed, time, useMonthCursor, useNow } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { C, R } from "@/theme";
import { ABSENCE_LABEL, compactHours, correctionDay, dateLabel, dayAriaLabel, masterDays, type MasterDay } from "@shared/calendar";
import { dayKey, parseDay, shiftMinutes, type Shift } from "@shared/pay";
import { useSelectedDay } from "@/components/calendar/useSelectedDay";
import { Dash, DashLeft, ROW } from "./parts/common";
import { CalendarSummaryBone, DayRowsSkeleton, LegendBone } from "./parts/skeletons";

export function CalendarScreen() {
  const router = useRouter();
  const [cursor, setCursor] = useMonthCursor();
  const month = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  // data 에 읽은 달을 같이 담는다 — 달을 넘긴 직후 이전 달 data 로 새 달을 그리지 않게 (명세 §6)
  const dash = useApi(() => keyed(month, api.GET("/api/stores/me/dashboard", { params: { query: { month } } })), month);
  const reqs = useApi(() => api.GET("/api/stores/me/requests"), "");
  const now = useNow(60_000);
  const todayKey = dayKey(now);
  const [selected, setSelected] = useSelectedDay(cursor.year, cursor.month, todayKey);

  const loading = dash.data?.key !== month;
  const data = loading ? null : dash.data!.value;
  const pending = (reqs.data?.corrections ?? []).filter((c) => c.status === "pending");
  const days = data ? masterDays(data, pending, now) : new Map<string, MasterDay>();
  const members = data ? data.members.filter((m) => m.role === "member") : [];
  const refresh = () => {
    dash.reload();
    reqs.reload();
  };

  // 그 달 칸들의 합
  const monthPeople = new Set<string>();
  let monthMinutes = 0;
  for (const [key, d] of days) {
    if (!key.startsWith(month)) continue;
    monthMinutes += d.minutes;
    for (const p of d.people) monthPeople.add(p.userId);
  }
  const monthHasAny = [...days.keys()].some((k) => k.startsWith(month));

  if (dash.error)
    return (
      <Screen onRefresh={refresh}>
        <View style={{ gap: 16 }}>
          <MonthPicker cursor={cursor} onChange={setCursor} />
          <Card style={{ gap: 12 }}>
            <ErrorText>근무 기록을 불러오지 못했어요.</ErrorText>
            <Btn variant="secondary" label="다시 시도" onPress={dash.reload} full />
          </Card>
        </View>
      </Screen>
    );

  const cell = (key: string) => {
    const d = days.get(key);
    const isToday = key === todayKey;
    return {
      label: loading ? [dateLabel(key), ...(isToday ? ["오늘"] : []), "불러오는 중"].join(", ") : dayAriaLabel(key, isToday, d, "master"),
      marks: {
        open: d?.openCount ? ("today" as const) : d?.staleCount ? ("stale" as const) : undefined,
        pending: !!d?.pendingCount,
        dashed: !!d?.absentCount,
      },
      // 선택된 칸에서는 MonthGrid 가 T 의 foreground·muted 색을 바탕색으로 뒤집는다
      body: d && (
        <View style={{ alignItems: "center", gap: 2 }}>
          {d.people.length > 0 ? <AvatarStack people={d.people} /> : d.absentCount > 0 && <T size={10} color={C.muted} style={{ lineHeight: 12 }}>{`쉼 ${d.absentCount}`}</T>}
          {d.minutes > 0 && <T size={11} mono weight="semibold" color={C.foreground} style={{ lineHeight: 13 }}>{compactHours(d.minutes)}</T>}
        </View>
      ),
    };
  };

  const empty =
    members.length === 0 ? (
      <T size={14} color={C.muted} style={{ marginBottom: 8, textAlign: "center" }}>
        아직 멤버가 없어요.{" "}
        <T size={14} color={C.accent} accessibilityRole="link" onPress={() => router.push("/admin/invites")}>초대 코드를 발급</T>
        해 보세요.
      </T>
    ) : !monthHasAny ? (
      <T size={14} color={C.muted} style={{ marginBottom: 8, textAlign: "center" }}>이 달 근무 기록이 없어요.</T>
    ) : null;

  return (
    <Screen onRefresh={refresh}>
      <Enter>
        <View>
          <MonthPicker cursor={cursor} onChange={setCursor} />
          {loading ? (
            <CalendarSummaryBone />
          ) : (
            monthPeople.size > 0 && (
              <T size={13} mono color={C.muted} style={{ marginTop: 4, textAlign: "center" }}>
                {`${todayKey.startsWith(month) ? "이번 달" : `${cursor.month + 1}월`} ${monthPeople.size}명 · ${Math.round(monthMinutes / 60)}시간`}
              </T>
            )
          )}
        </View>
        <MonthGrid
          year={cursor.year}
          month={cursor.month}
          todayKey={todayKey}
          selectedKey={selected}
          onSelect={setSelected}
          busy={loading}
          cellHeight={64}
          cell={cell}
          footer={
            loading ? (
              <LegendBone />
            ) : (
              <>
                {empty}
                <CalendarLegend role="master" />
              </>
            )
          }
        />
        <DayDetail dayKeyValue={selected} summary={selected ? days.get(selected) : undefined} data={data} pending={pending} now={now} />
      </Enter>
    </Screen>
  );
}

type Row = {
  userId: string;
  nickname: string;
  shifts: Shift[];
  adds: Correction[];
  absence: Absence["kind"] | null;
};

function DayDetail({ dayKeyValue: key, summary, data, pending, now }: { dayKeyValue: string | null; summary: MasterDay | undefined; data: Dashboard | null; pending: Correction[]; now: number }) {
  const head = !key
    ? ""
    : [
        date(parseDay(key)),
        ...(summary?.people.length ? [`${summary.people.length}명`, hm(summary.minutes)] : summary?.absentCount ? [`쉼 ${summary.absentCount}명`] : []),
      ].join(" · ");

  let body: React.ReactNode;
  if (!key) body = <T size={14} color={C.muted}>날짜를 누르면 그날 근무가 나와요.</T>;
  else if (!data)
    body = (
      <Loading>
        <DayRowsSkeleton />
      </Loading>
    );
  else {
    const rows = dayRows(key, data, pending);
    body =
      rows.length === 0 ? (
        <T size={14} color={C.muted} style={{ marginTop: 8 }}>이 날 일한 사람이 없어요.</T>
      ) : (
        <View style={{ marginTop: 4 }}>
          {rows.map((r, i) => (
            <View key={r.userId}>
              <MemberDayRow row={r} pending={pending} now={now} />
              {i < rows.length - 1 && <Dash />}
            </View>
          ))}
        </View>
      );
  }

  // 구역 머리(날짜 · 인원 · 시간)는 고르면 바뀌므로 스크린리더가 읽어 준다
  return (
    <Card>
      {!!head && <T size={12} mono weight="semibold" color={C.muted} accessibilityRole="header" accessibilityLiveRegion="polite">{head}</T>}
      {body}
    </Card>
  );
}

/** 그날의 멤버별 행. 근무한 사람(첫 출근 이른 순) → 추가 요청만 있는 사람·쉰 사람(이름순) */
function dayRows(key: string, data: Dashboard, pending: Correction[]): Row[] {
  const rows = new Map<string, Row>();
  const row = (userId: string, nickname: string) => {
    let r = rows.get(userId);
    if (!r) rows.set(userId, (r = { userId, nickname, shifts: [], adds: [], absence: null }));
    return r;
  };
  const names = new Map(data.members.filter((m) => m.role === "member").map((m) => [m.userId, m.nickname]));
  const shifts = data.shifts
    .filter((s) => names.has(s.userId))
    .map((s) => ({ userId: s.userId, shift: { id: s.id, start: Date.parse(s.start), end: s.end ? Date.parse(s.end) : null } }))
    .filter((s) => dayKey(s.shift.start) === key)
    .sort((a, b) => a.shift.start - b.shift.start);
  for (const s of shifts) row(s.userId, names.get(s.userId)!).shifts.push(s.shift);
  for (const c of pending) if (c.action === "add" && names.has(c.userId) && correctionDay(c) === key) row(c.userId, names.get(c.userId)!).adds.push(c);
  for (const a of data.absences) if (a.date === key && names.has(a.userId)) row(a.userId, names.get(a.userId)!).absence = a.kind;
  const all = [...rows.values()];
  const worked = all.filter((r) => r.shifts.length > 0);
  const rest = all.filter((r) => r.shifts.length === 0).sort((a, b) => a.nickname.localeCompare(b.nickname, "ko"));
  return [...worked, ...rest];
}

function MemberDayRow({ row, pending, now }: { row: Row; pending: Correction[]; now: number }) {
  const router = useRouter();
  const today = dayKey(now);
  const working = row.shifts.some((s) => s.end === null && dayKey(s.start) === today);
  const rested = row.shifts.length === 0 && !!row.absence;
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/admin/members/${row.userId}`)}
      style={({ pressed }) => [{ ...ROW, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: R.control }, pressed ? { backgroundColor: C.background } : null]}
    >
      {/* 쉰 사람 줄은 왼쪽 점선 표시 — 달력의 휴가·대타 점선과 같은 뜻 */}
      {rested && <DashLeft style={{ position: "absolute", left: 0, top: 10, bottom: 10 }} />}
      <View style={{ alignSelf: "flex-start" }}>
        <Avatar name={row.nickname} seed={row.userId} size="sm" />
        {working && <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ position: "absolute", right: -2, bottom: -2, height: 10, width: 10, borderRadius: 5, borderWidth: 2, borderColor: C.surface, backgroundColor: C.ok }} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T size={13} weight="semibold">{row.nickname}</T>
        <View style={{ marginTop: 2, gap: 2 }}>
          {row.shifts.map((s) => {
            const stale = s.end === null && dayKey(s.start) !== today;
            const waiting = pending.some((c) => c.shiftId === s.id);
            return (
              <View key={s.id} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 8, rowGap: 4 }}>
                <T size={12} mono color={C.muted}>{`${time(s.start)} ~ ${s.end ? time(s.end) : "근무 중"} · ${hm(shiftMinutes(s, now))}`}</T>
                {stale && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <TriangleAlert size={13} color={C.warn} />
                    <T size={12} color={C.warn}>퇴근 기록 없음</T>
                  </View>
                )}
                {waiting && <StatusPill status="pending" />}
              </View>
            );
          })}
          {row.adds.map((c) => (
            <View key={c.id} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 8, rowGap: 4 }}>
              <T size={12} mono color={C.muted}>{`추가 요청 · ${time(Date.parse(c.start!))} ~ ${time(Date.parse(c.end!))}`}</T>
              <StatusPill status="pending" />
            </View>
          ))}
          {row.absence && <T size={12} color={C.muted}>{ABSENCE_LABEL[row.absence]}</T>}
        </View>
      </View>
      <ChevronRight size={15} color={C.muted} />
    </Pressable>
  );
}
