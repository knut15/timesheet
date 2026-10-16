// 대시보드 — 지금 누가 일하는지, 이번 달 인건비가 얼마인지. 웹 web/src/app/admin/page.tsx 의 앱판. docs/prd/07-admin.md
import { useRouter } from "expo-router";
import { Bell, Coins, Hourglass, Timer, TriangleAlert, Wallet } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { api, type Member } from "@/api/client";
import { CountUp, Enter } from "@/components/motion";
import { Screen } from "@/components/shell";
import { Avatar, Card, MonthPicker, SectionLabel, T } from "@/components/ui";
import { dayLabel, hm, time, toShift, useMonthCursor, useNow, won } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { C, R, alpha } from "@/theme";
import { computeMonth, computeWeeks, dayKey, MINIMUM_WAGE, shiftMinutes, startOfWeek, type PaySettings } from "@shared/pay";
import { holidayStatus } from "../member/pay/PayView";
import { Dash, DashedList, ROW } from "./parts/common";
import { DashboardSkeleton } from "./parts/skeletons";

const LONG_OPEN_MIN = 12 * 60;

export function Dashboard() {
  const router = useRouter();
  const [cursor, setCursor] = useMonthCursor();
  const month = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const { data, reload } = useApi(() => api.GET("/api/stores/me/dashboard", { params: { query: { month } } }), month);
  const now = useNow(30_000);

  const rows = useMemo(() => {
    if (!data) return [];
    // 마스터는 출퇴근을 찍지 않는다. 멤버만 센다.
    return data.members.filter((m) => m.role === "member").map((m) => {
      const settings: PaySettings = { hourlyWage: m.hourlyWage, weeklyHours: m.weeklyHours, workDaysPerWeek: m.workDaysPerWeek, fivePlus: data.store.fivePlus };
      const shifts = data.shifts.filter((s) => s.userId === m.userId).map(toShift);
      const absences = data.absences.filter((a) => a.userId === m.userId);
      const weeks = computeWeeks(shifts, settings, now, absences);
      const thisWeek = weeks.find((w) => w.weekStart.getTime() === startOfWeek(now).getTime());
      return { member: m, settings, shifts, weeks, month: computeMonth(weeks, cursor.year, cursor.month), thisWeek };
    });
  }, [data, now, cursor.year, cursor.month]);

  if (!data)
    return (
      <Screen>
        <DashboardSkeleton />
      </Screen>
    );

  const working = rows.flatMap((r) => r.shifts.filter((s) => s.end === null).map((s) => ({ member: r.member, shift: s })));
  const today = dayKey(now);
  const cameToday = rows.filter((r) => r.shifts.some((s) => dayKey(s.start) === today)).length;
  const total = rows.reduce(
    (a, r) => ({ total: a.total + r.month.total, base: a.base + r.month.basePay, holiday: a.holiday + r.month.holidayPay, leave: a.leave + r.month.leavePay, ot: a.ot + r.month.overtimePay }),
    { total: 0, base: 0, holiday: 0, leave: 0, ot: 0 },
  );
  const alerts: { member: Member | null; text: string; href?: string }[] = [];
  if (data.pendingRequests > 0) alerts.push({ member: null, text: `처리 대기 요청 ${data.pendingRequests}건 (수정·휴가·대타)`, href: "/admin/requests" });
  const onLeaveToday = rows.filter((r) => data.absences.some((a) => a.userId === r.member.userId && a.date === today));
  for (const r of rows) {
    if (r.member.hourlyWage < MINIMUM_WAGE) alerts.push({ member: r.member, text: `시급 ${won(r.member.hourlyWage)} — 최저임금보다 낮아요` });
    for (const s of r.shifts) if (s.end === null && shiftMinutes(s, now) > LONG_OPEN_MIN) alerts.push({ member: r.member, text: `${dayLabel(s.start)} 출근 뒤 12시간 넘게 퇴근 기록이 없어요` });
    for (const w of r.month.weeks) if (w.overtimeLimitExceeded) alerts.push({ member: r.member, text: `${dayLabel(w.weekStart)} 주 연장근로 ${hm(w.overtimeMinutes)} — 주 12시간 초과` });
  }
  const toMember = (id: string) => router.push(`/admin/members/${id}`);

  return (
    <Screen onRefresh={reload}>
      <Enter>
        <Card>
          <SectionLabel icon={Timer} right={`${cameToday}/${rows.length}명 출근${onLeaveToday.length > 0 ? ` · 휴가·대타 ${onLeaveToday.length}명` : ""}`}>지금 근무 중</SectionLabel>
          {working.length === 0 ? (
            <T size={14} color={C.muted} style={{ marginTop: 12 }}>근무 중인 사람이 없어요</T>
          ) : (
            <DashedList
              style={{ marginTop: 4 }}
              items={working}
              keyOf={(w) => w.shift.id}
              render={({ member, shift }) => (
                <View style={ROW}>
                  <Avatar name={member.nickname} seed={member.userId} size="sm" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T size={13} weight="semibold" numberOfLines={1}>{member.nickname}</T>
                    <T size={12} mono color={C.muted}>{`${time(shift.start)} 출근 · ${hm(shiftMinutes(shift, now))}`}</T>
                  </View>
                  {/* 근무 중 표시 — 옆 글자 "출근" 이 같은 뜻이라 장식 */}
                  <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ height: 13, width: 13, borderRadius: 7, backgroundColor: alpha(C.ok, 0.15), alignItems: "center", justifyContent: "center" }}>
                    <View style={{ height: 7, width: 7, borderRadius: 4, backgroundColor: C.ok }} />
                  </View>
                </View>
              )}
            />
          )}
        </Card>

        <Card>
          <MonthPicker cursor={cursor} onChange={setCursor} />
          <View style={{ marginTop: 12 }}>
            <SectionLabel icon={Wallet}>{`${cursor.month + 1}월 인건비 (예상, 세전)`}</SectionLabel>
          </View>
          {/* 포인트 컬러 — 큰 금액만 강조색 (DESIGN.md §4) */}
          <CountUp value={total.total} format={won} size={28} weight="semibold" color={C.accent} style={{ marginTop: 6, lineHeight: 35 }} />
          <T size={12} mono color={C.muted} style={{ marginTop: 4 }}>{`기본급 ${won(total.base)} · 주휴 ${won(total.holiday)} · 휴가 ${won(total.leave)} · 연장 가산 ${won(total.ot)}`}</T>
        </Card>

        {alerts.length > 0 && (
          <Card>
            <SectionLabel icon={Bell} right={alerts.length}>확인 필요</SectionLabel>
            <View style={{ marginTop: 8, gap: 6, borderRadius: R.control, borderLeftWidth: 3, borderLeftColor: C.caution, backgroundColor: alpha(C.caution, 0.1), paddingHorizontal: 12, paddingVertical: 10 }}>
              {alerts.map((a, i) => {
                const Icon = a.member ? TriangleAlert : Hourglass;
                return (
                  <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                    <View style={{ marginTop: 3 }}>
                      <Icon size={14} color={a.member ? C.warn : C.caution} />
                    </View>
                    {a.member ? (
                      <T size={13} style={{ flex: 1 }}>
                        <T size={13} weight="semibold" accessibilityRole="link" onPress={() => toMember(a.member!.userId)}>{a.member.nickname}</T>
                        {` · ${a.text}`}
                      </T>
                    ) : (
                      <T size={13} weight="semibold" accessibilityRole="link" onPress={() => router.push(a.href as never)} style={{ flex: 1 }}>{a.text}</T>
                    )}
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        <Card>
          <SectionLabel icon={Coins}>{`멤버별 ${cursor.month + 1}월`}</SectionLabel>
          {rows.length === 0 ? (
            <T size={14} color={C.muted} style={{ marginTop: 12 }}>
              아직 멤버가 없어요.{" "}
              <T size={14} weight="medium" color={C.accent} accessibilityRole="link" onPress={() => router.push("/admin/invites")}>초대 코드를 발급</T>
              해 보세요.
            </T>
          ) : (
            <View style={{ marginTop: 4 }}>
              {rows.map((r, i) => (
                <View key={r.member.userId}>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => toMember(r.member.userId)}
                    style={({ pressed }) => [{ ...ROW, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: R.control }, pressed ? { backgroundColor: C.background } : null]}
                  >
                    <Avatar name={r.member.nickname} seed={r.member.userId} size="sm" />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T size={13} weight="semibold" numberOfLines={1}>{r.member.nickname}</T>
                      <T size={12} color={C.muted}>
                        <T size={12} mono color={C.muted}>{hm(r.month.workedMinutes)}</T>
                        {` · 이번 주 주휴 ${r.thisWeek ? holidayStatus(r.thisWeek, r.settings, now) : "기록 없음"}`}
                        {r.month.overtimeMinutes > 0 && ` · 연장 ${hm(r.month.overtimeMinutes)}`}
                      </T>
                    </View>
                    <T size={13} mono weight="semibold">{won(r.month.total)}</T>
                  </Pressable>
                  {i < rows.length - 1 && <Dash />}
                </View>
              ))}
            </View>
          )}
        </Card>
      </Enter>
    </Screen>
  );
}
