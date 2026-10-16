// 멤버 한 명의 월별 기록과 급여. 기록을 고치고 지운다. 웹 web/src/app/admin/members/[userId]/page.tsx 의 앱판. docs/prd/07-admin.md
// 탭 밖(스택) 화면이라 머리(헤더·뒤로 가기)를 직접 그린다 — parts/common.tsx SubPage
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { api, errorCode, type ShiftDto } from "@/api/client";
import { useSession } from "@/auth/session";
import { Enter } from "@/components/motion";
import { Screen } from "@/components/shell";
import { Avatar, Btn, Card, CardSection, ErrorText, Field, Input, MonthPicker, T } from "@/components/ui";
import { date, hm, monthRange, time, toShift, useMonthCursor, useNow } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { C, F, R, alpha } from "@/theme";
import { parseDay, shiftMinutes, type PaySettings } from "@shared/pay";
import { ConfirmSheet, DashLeft, parseLocal, SubPage, toLocalText } from "./parts/common";
import { PayView } from "../member/pay/PayView";
import { MemberDetailSkeleton } from "./parts/skeletons";

export function MemberDetail() {
  return (
    <SubPage title="근무 기록">
      <Body />
    </SubPage>
  );
}

function Body() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const session = useSession();
  const [cursor, setCursor] = useMonthCursor();
  const [tab, setTab] = useState<"records" | "pay">("records");
  const range = monthRange(cursor.year, cursor.month);
  const members = useApi(() => api.GET("/api/stores/me/members"), "");
  const shiftsRes = useApi(
    () => api.GET("/api/stores/me/members/{userId}/shifts", { params: { path: { userId }, query: range } }),
    `${userId}|${range.from}|${range.to}`,
  );
  const absRes = useApi(() => api.GET("/api/stores/me/absences", { params: { query: range } }), `${range.from}|${range.to}`);
  const absences = useMemo(() => (absRes.data ?? []).filter((a) => a.userId === userId), [absRes.data, userId]);
  const now = useNow(60_000);
  const shifts = useMemo(() => (shiftsRes.data ?? []).map(toShift), [shiftsRes.data]);
  const refresh = () => {
    members.reload();
    shiftsRes.reload();
    absRes.reload();
  };

  const member = members.data?.find((m) => m.userId === userId);
  if (members.data && !member)
    return (
      <Screen>
        <Card>
          <T size={14} color={C.muted}>
            이 매장의 멤버가 아니에요.{" "}
            <T size={14} weight="medium" color={C.accent} accessibilityRole="link" onPress={() => router.navigate("/admin/members")}>멤버 목록</T>
          </T>
        </Card>
      </Screen>
    );
  // 휴가 목록(absRes)도 기다린다 — 기록 목록 위에 뒤늦게 끼어들어 행이 밀리지 않게
  if (!member || !shiftsRes.data || !absRes.data || session.status !== "authenticated")
    return (
      <Screen>
        <MemberDetailSkeleton />
      </Screen>
    );

  const settings: PaySettings = {
    hourlyWage: member.hourlyWage,
    weeklyHours: member.weeklyHours,
    workDaysPerWeek: member.workDaysPerWeek,
    fivePlus: session.me.membership!.store.fivePlus,
  };
  const inMonth = shiftsRes.data
    .filter((s) => {
      const d = new Date(s.start);
      return d.getFullYear() === cursor.year && d.getMonth() === cursor.month;
    })
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
  const ym = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const monthAbsences = absences.filter((a) => a.date.startsWith(ym));

  return (
    <Screen onRefresh={refresh}>
      <Enter>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={member.nickname} seed={member.userId} size="lg" />
          <View style={{ minWidth: 0, flex: 1 }}>
            <T size={20} weight="bold" numberOfLines={1} style={{ letterSpacing: -0.3 }}>{member.nickname}</T>
            <T size={13} color={C.muted} numberOfLines={1}>{member.email}</T>
          </View>
        </Card>
        <MonthPicker cursor={cursor} onChange={setCursor} />
        {/* 보기 전환 — 옅은 바탕 틀 안에서 고른 쪽만 카드 바탕 */}
        <View style={{ flexDirection: "row", borderRadius: R.control, backgroundColor: alpha(C.line, 0.6), padding: 3 }}>
          {(["records", "pay"] as const).map((t) => (
            <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)} style={{ flex: 1, height: 40, alignItems: "center", justifyContent: "center", borderRadius: R.control - 2, backgroundColor: tab === t ? C.surface : "transparent" }}>
              <T size={13} weight={tab === t ? "semibold" : "medium"} color={tab === t ? C.foreground : C.muted}>{t === "records" ? "근무 기록" : "급여"}</T>
            </Pressable>
          ))}
        </View>
        {tab === "pay" ? (
          <PayView shifts={shifts} absences={absences} settings={settings} year={cursor.year} month={cursor.month} now={now} />
        ) : inMonth.length === 0 && absences.length === 0 ? (
          <Card>
            <T size={14} color={C.muted} style={{ textAlign: "center" }}>이 달 기록이 없어요.</T>
          </Card>
        ) : (
          <Card flush>
            {monthAbsences.map((a, i) => (
              <CardSection key={`${a.sourceId}-${a.date}`} first={i === 0} style={{ paddingVertical: 12 }}>
                {/* 쉬는 날은 점선 왼쪽 선 — 달력의 휴가·대타 점선과 같은 뜻 */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <DashLeft />
                  <View>
                    <T size={14} mono weight="medium">{date(parseDay(a.date))}</T>
                    <T size={13} color={C.muted}>{`${{ paid_leave: "유급 휴가", unpaid_leave: "무급 휴가", substitution: "대타로 쉼" }[a.kind]} · 요청 탭에서 관리`}</T>
                  </View>
                </View>
              </CardSection>
            ))}
            {inMonth.map((s, i) => (
              <ShiftRow key={s.id} shift={s} first={monthAbsences.length === 0 && i === 0} onChange={shiftsRes.reload} />
            ))}
          </Card>
        )}
      </Enter>
    </Screen>
  );
}

function ShiftRow({ shift, first, onChange }: { shift: ShiftDto; first: boolean; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [asking, setAsking] = useState(false);
  const s = toShift(shift);
  // 웹 datetime-local 칸 자리 — "YYYY-MM-DD HH:MM" 을 글자로 쓴다
  const [start, setStart] = useState(toLocalText(s.start));
  const [end, setEnd] = useState(s.end ? toLocalText(s.end) : "");
  const [error, setError] = useState<string | null>(null);
  const startMs = parseLocal(start);
  const endMs = end.trim() ? parseLocal(end) : null;
  const badFormat = Number.isNaN(startMs) || (endMs !== null && Number.isNaN(endMs));
  const invalid = badFormat || (endMs !== null && endMs <= startMs);

  const save = async () => {
    const { error } = await api.PATCH("/api/stores/me/shifts/{shiftId}", {
      params: { path: { shiftId: shift.id } },
      body: { start: new Date(startMs).toISOString(), end: endMs === null ? null : new Date(endMs).toISOString() },
    });
    if (error) return setError(errorCode(error) === "ALREADY_CLOCKED_IN" ? "근무 중인 기록이 이미 있어요. 퇴근 시각을 넣어 주세요." : "저장하지 못했어요.");
    setEditing(false);
    onChange();
  };

  if (editing)
    return (
      <CardSection first={first} style={{ gap: 12, borderLeftWidth: 3, borderLeftColor: C.accent, backgroundColor: C.background }}>
        <Field label="출근"><Input value={start} onChangeText={setStart} placeholder="YYYY-MM-DD HH:MM" keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={16} style={{ fontFamily: F.mono }} /></Field>
        <Field label="퇴근 (비우면 근무 중)"><Input value={end} onChangeText={setEnd} placeholder="YYYY-MM-DD HH:MM" keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={16} style={{ fontFamily: F.mono }} /></Field>
        {invalid && <T size={14} color={C.warn}>{badFormat ? "시각은 2026-10-16 09:00 처럼 써 주세요." : "퇴근은 출근보다 늦어야 해요."}</T>}
        <ErrorText>{error}</ErrorText>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Btn variant="primary" label="저장" onPress={save} disabled={invalid} style={{ flex: 1 }} />
          <Btn variant="secondary" label="취소" onPress={() => setEditing(false)} style={{ flex: 1 }} />
        </View>
      </CardSection>
    );
  return (
    <CardSection first={first} style={{ paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <View style={{ minWidth: 0, flexShrink: 1 }}>
        <T size={14} mono weight="semibold">{date(s.start)}</T>
        <T size={13} mono color={C.muted} style={{ marginTop: 2 }}>{`${time(s.start)} ~ ${s.end ? time(s.end) : "근무 중"} · ${hm(shiftMinutes(s))}`}</T>
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <Btn variant="small" label="수정" onPress={() => setEditing(true)} />
        <Btn variant="danger" label="삭제" onPress={() => setAsking(true)} />
      </View>
      <ConfirmSheet
        open={asking}
        onClose={() => setAsking(false)}
        title="이 기록을 지울까요?"
        confirmLabel="삭제"
        onConfirm={async () => {
          await api.DELETE("/api/stores/me/shifts/{shiftId}", { params: { path: { shiftId: shift.id } } });
          onChange();
        }}
      />
    </CardSection>
  );
}
