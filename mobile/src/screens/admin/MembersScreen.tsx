// 멤버 목록 — 급여 조건·근무 시간표를 고치고 퇴사처리한다. 웹 web/src/app/admin/members/page.tsx 의 앱판.
// docs/prd/07-admin.md, docs/prd/13-work-schedule.md
import { useRouter } from "expo-router";
import { ChevronRight, Plus, TicketPlus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { api, type Member, type Schedule } from "@/api/client";
import { Enter } from "@/components/motion";
import { Screen } from "@/components/shell";
import { Avatar, Btn, Card, CardSection, ErrorText, Field, Input, Loading, SectionLabel, Segmented, Sheet, T } from "@/components/ui";
import { date, useNow, won } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { C, F, R } from "@/theme";
import { dayKey, MINIMUM_WAGE, parseDay } from "@shared/pay";
import { DAY_NAMES, digitsOf, scheduleProblem, scheduleTerms, scheduleText, WEEK_ORDER, withCommas } from "@shared/schedule";
import { ConfirmSheet, Dash, isDay, isHalfHour, ROW } from "./parts/common";
import { ExceptionRowsSkeleton, MembersSkeleton } from "./parts/skeletons";

/** 앱은 시각을 글자로 쓴다 — 웹 select 의 보기(30분 단위)와 같은 값만 받는다 */
const TIME_FORMAT = "시각은 09:00·09:30 처럼 30분 단위로 써 주세요.";

export function MembersScreen() {
  const router = useRouter();
  const { data, reload } = useApi(() => api.GET("/api/stores/me/members"), "");
  if (!data)
    return (
      <Screen>
        <MembersSkeleton />
      </Screen>
    );
  const members = data.filter((m) => m.role === "member");
  return (
    <Screen onRefresh={reload}>
      <Enter>
        <InviteEntry />
        {members.length === 0 ? (
          <Card>
            <T size={14} color={C.muted}>
              아직 멤버가 없어요.{" "}
              <T size={14} weight="medium" color={C.accent} accessibilityRole="link" onPress={() => router.push("/admin/invites")}>초대 코드를 발급</T>
              해 보세요.
            </T>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {members.map((m) => (
              <MemberRow key={m.userId} member={m} onChange={reload} />
            ))}
          </View>
        )}
      </Enter>
    </Screen>
  );
}

/** 초대 화면 진입 줄. 초대는 하단 탭에서 빠지고 멤버 화면 안으로 들어왔다 (docs/design/calendar.md §1) */
function InviteEntry() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="초대 코드 발급·관리"
      onPress={() => router.push("/admin/invites")}
      style={({ pressed }) => [{ height: 56, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: R.card, borderWidth: 1, borderColor: C.line, backgroundColor: pressed ? C.background : C.surface, paddingHorizontal: 16 }]}
    >
      <TicketPlus size={20} strokeWidth={1.75} color={C.muted} />
      <T size={14} weight="semibold" style={{ flex: 1 }}>초대 코드</T>
      <T size={13} color={C.muted}>발급·관리</T>
      <ChevronRight size={15} color={C.muted} />
    </Pressable>
  );
}

function MemberRow({ member, onChange }: { member: Member; onChange: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [form, setForm] = useState(() => ({
    hourlyWage: member.hourlyWage,
    // 시간표가 없던 멤버는 요일 없이 시작한다 (docs/prd/13)
    schedule: member.schedule ?? { days: [] as number[], start: "10:00", end: "15:00" },
  }));
  const [error, setError] = useState<string | null>(null);
  const timeOk = isHalfHour(form.schedule.start) && isHalfHour(form.schedule.end);
  const problem = timeOk ? scheduleProblem(form.schedule) : TIME_FORMAT;
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
  const setSchedule = (patch: Partial<Schedule>) => setForm({ ...form, schedule: { ...form.schedule, ...patch } });
  const toggleDay = (d: number) =>
    setSchedule({ days: form.schedule.days.includes(d) ? form.schedule.days.filter((x) => x !== d) : [...form.schedule.days, d] });
  const toDetail = () => router.push(`/admin/members/${member.userId}`);

  return (
    // 구역 둘 — 위는 사람·조건, 아래는 날짜별 변경
    <Card flush>
      <CardSection first style={{ paddingVertical: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Avatar name={member.nickname} seed={member.userId} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T size={16} weight="semibold" accessibilityRole="link" onPress={toDetail} numberOfLines={1}>{member.nickname}</T>
            <T size={12} color={C.muted} numberOfLines={1}>{member.email}</T>
          </View>
          <Btn variant="small" label="근무 기록" onPress={toDetail} />
        </View>
        {/* 근무 시간표 줄 — 시급 · 요일·시각 · 주 시간 · 일수 */}
        <T size={12} mono color={C.muted} style={{ marginTop: 10 }}>
          {`${won(member.hourlyWage)} · ${member.schedule ? `${scheduleText(member.schedule)} · ` : ""}주 ${member.weeklyHours}시간 · ${member.workDaysPerWeek}일${member.schedule ? "" : " · 시간표 없음"}`}
        </T>
        <View style={{ marginTop: 10, flexDirection: "row", gap: 6 }}>
          <Btn variant="small" label="조건 수정" onPress={open} />
          <Btn variant="danger" label="퇴사처리" onPress={() => setLeaving(true)} />
        </View>
      </CardSection>

      {/* 조건 수정은 대화상자로 (2026-09-25 사용자 요청) */}
      <Sheet open={editing} onClose={() => setEditing(false)} title={`${member.nickname} 조건 수정`}>
        <Field label="시급(원)">
          <Input keyboardType="number-pad" value={withCommas(form.hourlyWage)} onChangeText={(v) => setForm({ ...form, hourlyWage: digitsOf(v) })} style={{ fontFamily: F.mono }} />
        </Field>
        {form.hourlyWage < MINIMUM_WAGE && <T size={14} color={C.warn}>{`2026년 최저임금(${won(MINIMUM_WAGE)})보다 낮아요.`}</T>}
        <View>
          <T size={12} weight="semibold" color={C.muted} style={{ marginBottom: 6 }}>근무 요일</T>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {WEEK_ORDER.map((d) => {
              const on = form.schedule.days.includes(d);
              return (
                <Pressable
                  key={d}
                  accessibilityRole="button"
                  accessibilityLabel={`${DAY_NAMES[d]}요일`}
                  accessibilityState={{ selected: on }}
                  onPress={() => toggleDay(d)}
                  style={{ flex: 1, height: 44, alignItems: "center", justifyContent: "center", borderRadius: R.control, borderWidth: 1, borderColor: on ? C.foreground : C.line, backgroundColor: on ? C.foreground : C.surface }}
                >
                  <T size={13} weight="semibold" color={on ? C.background : C.muted}>{DAY_NAMES[d]}</T>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Field label="출근" style={{ flex: 1 }}><TimeInput value={form.schedule.start} onChange={(v) => setSchedule({ start: v })} /></Field>
          <Field label="퇴근" style={{ flex: 1 }}><TimeInput value={form.schedule.end} onChange={(v) => setSchedule({ end: v })} /></Field>
        </View>
        <T size={13} mono color={C.muted}>
          {form.schedule.days.length > 0 && !problem ? `주 ${terms.weeklyHours}시간 · ${terms.workDaysPerWeek}일 (시간표로 계산)` : (problem ?? "")}
        </T>
        <ErrorText>{error}</ErrorText>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
          <Btn variant="secondary" label="취소" onPress={() => setEditing(false)} style={{ flex: 1 }} />
          <Btn variant="primary" label="저장" onPress={save} style={{ flex: 1 }} />
        </View>
      </Sheet>

      <ConfirmSheet
        open={leaving}
        onClose={() => setLeaving(false)}
        title={`${member.nickname}님을 퇴사처리할까요?`}
        description="매장에서 빠지고 근무 기록은 남아요."
        confirmLabel="퇴사처리"
        onConfirm={async () => {
          await api.DELETE("/api/stores/me/members/{userId}", { params: { path: { userId: member.userId } } });
          onChange();
        }}
      />
      <ScheduleExceptions userId={member.userId} />
    </Card>
  );
}

/** 시각 칸 — "HH:MM" 을 글자로 쓴다 (웹 select 자리) */
function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <Input value={value} onChangeText={onChange} placeholder="HH:MM" keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={5} style={{ fontFamily: F.mono }} />;
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
    // 웹 date 칸의 min={today} 와 select 보기 자리
    if (!isDay(form.date)) return setError("날짜는 2026-10-16 처럼 써 주세요.");
    if (form.date < today) return setError("오늘 이후 날짜만 등록할 수 있어요.");
    if (form.kind === "work" && !(isHalfHour(form.start) && isHalfHour(form.end))) return setError(TIME_FORMAT);
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
    <CardSection style={{ paddingVertical: 14 }}>
      <SectionLabel>날짜별 변경</SectionLabel>
      {loadError ? (
        <ErrorText>불러오지 못했어요.</ErrorText>
      ) : !data ? (
        <Loading>
          <ExceptionRowsSkeleton />
        </Loading>
      ) : (
        data.length > 0 && (
          <View style={{ marginTop: 2 }}>
            {data.map((e, i) => (
              <View key={e.id}>
                <View style={ROW}>
                  <T size={13} mono style={{ flex: 1, minWidth: 0 }}>
                    {`${date(parseDay(e.date))} `}
                    <T size={13} color={C.muted}>·</T>
                    {` ${e.kind === "off" ? "쉼" : `${e.start}~${e.end} 근무`}`}
                  </T>
                  <Btn variant="danger" label="삭제" onPress={() => remove(e.id)} />
                </View>
                {i < data.length - 1 && <Dash />}
              </View>
            ))}
          </View>
        )
      )}
      {adding ? (
        <View style={{ marginTop: 8, gap: 12 }}>
          <Field label="날짜">
            <Input value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={10} style={{ fontFamily: F.mono }} />
          </Field>
          <Field label="변경">
            <Segmented value={form.kind} options={[{ value: "off", label: "쉼" }, { value: "work", label: "근무 (시각 지정)" }]} onChange={(kind) => setForm({ ...form, kind })} />
          </Field>
          {form.kind === "work" && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Field label="출근" style={{ flex: 1 }}><TimeInput value={form.start} onChange={(v) => setForm({ ...form, start: v })} /></Field>
              <Field label="퇴근" style={{ flex: 1 }}><TimeInput value={form.end} onChange={(v) => setForm({ ...form, end: v })} /></Field>
            </View>
          )}
          <T size={12} color={C.muted}>같은 날짜에 다시 등록하면 덮어써요.</T>
          <ErrorText>{error}</ErrorText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Btn variant="secondary" label="취소" onPress={() => setAdding(false)} style={{ flex: 1 }} />
            <Btn variant="primary" label="등록" onPress={add} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        // 추가는 점선 버튼 (36px)
        <Btn variant="dashed" icon={Plus} label="날짜별 변경 추가" onPress={() => setAdding(true)} full style={{ marginTop: 6, height: 36 }} />
      )}
    </CardSection>
  );
}
