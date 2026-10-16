// 출퇴근 탭 오늘 근무 카드 — 웹 web/src/components/TodayDashboard.tsx 의 TodayDashboard·TodayDashboardSkeleton 앱판.
// API 를 부르지 않는 표시 컴포넌트다. docs/design/member-today.md §3
import { ArrowLeftRight, Bell, CalendarDays, ChevronRight, Clock, Hourglass, PiggyBank, RefreshCw } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import type { MyRequests } from "@/api/client";
import { CountUp } from "@/components/motion";
import { Bone, Btn, Card, CardSection, DotRow, ErrorText, Loading, ProgressBar, SectionLabel, T } from "@/components/ui";
import { hm, time, won } from "@/lib/format";
import { C, R, alpha } from "@/theme";
import { computeMonth, computeWeek, computeWeeks, shiftMinutes, startOfWeek, type Absence, type PaySettings, type Shift, type WeekPay } from "@shared/pay";
import { todayShifts, todayState } from "@shared/today";
import { holidayStatus, holidayTone } from "../pay/PayView";
import { DashedList } from "../records/parts";
import { OpenDot } from "./ClockCard";

/** "10/12" — 대시보드 이번 주 기간용 짧은 날짜 */
const monthDay = (t: number | Date) => `${new Date(t).getMonth() + 1}/${new Date(t).getDate()}`;

// 구역 안쪽 — 가로 16, 세로 14 (웹 px-4 py-3.5)
const SECTION = { paddingVertical: 14 } as const;
// 13px 글자 한 줄 높이 — 막대를 이 높이의 줄 안에 두어 불러온 뒤와 줄 높이가 같게
const LINE13 = Math.round(13 * 1.45);

/** 오늘 · 처리할 것 · 이번 주 · 이번 달. now 에는 분 단위 시각(minuteNow)을 넘긴다. §3 */
export function TodayDashboard({
  shifts,
  absences,
  requests,
  settings,
  now,
  status,
  onRetry,
  onOpenPay,
  onOpenRequests,
}: {
  shifts: Shift[];
  absences: Absence[];
  requests?: MyRequests | null;
  settings: PaySettings;
  now: number;
  status: "loading" | "error" | "ready";
  onRetry: () => void;
  onOpenPay: () => void;
  onOpenRequests: () => void;
}) {
  const view = useMemo(() => {
    const today = todayShifts(shifts, now);
    const weekStart = startOfWeek(now);
    const weeks = computeWeeks(shifts, settings, now, absences);
    // 이번 주에 기록·휴가가 하나도 없으면 목록에 없다 — 빈 주를 만든다 (§3-3)
    const week = weeks.find((w) => w.weekStart.getTime() === weekStart.getTime()) ?? computeWeek(weekStart, [], settings, now, absences);
    const d = new Date(now);
    return {
      today,
      todayTotal: today.reduce((sum, s) => sum + shiftMinutes(s, now), 0),
      off: todayState(shifts, absences, now).kind === "off",
      week,
      month: d.getMonth(),
      monthTotal: computeMonth(weeks, d.getFullYear(), d.getMonth()).total,
    };
  }, [shifts, absences, settings, now]);

  if (status === "loading") return <TodayDashboardSkeleton now={now} progress={settings.weeklyHours > 0} />;
  if (status === "error") {
    return (
      <Card style={{ gap: 12 }}>
        <ErrorText>오늘 근무를 불러오지 못했어요.</ErrorText>
        <Btn variant="secondary" icon={RefreshCw} label="다시 불러오기" onPress={onRetry} style={{ alignSelf: "flex-start" }} />
      </Card>
    );
  }

  const incoming = requests ? requests.substitutionsIn.filter((x) => x.status === "requested").length : 0;
  const pending = requests
    ? requests.corrections.filter((x) => x.status === "pending").length +
      requests.leaves.filter((x) => x.status === "pending").length +
      requests.substitutionsOut.filter((x) => x.status === "requested" || x.status === "accepted").length
    : 0;
  const { week } = view;
  const holiday = holidayStatus(week, settings, now);

  return (
    <Card flush>
      <CardSection first style={SECTION}>
        <SectionLabel icon={Clock} index="01" right={hm(view.todayTotal)}>오늘</SectionLabel>
        {view.today.length === 0 ? (
          <T size={13} color={C.muted} style={{ marginTop: 8 }}>{view.off ? "오늘은 쉬는 날이에요." : "아직 오늘 기록이 없어요."}</T>
        ) : (
          <DashedList style={{ marginTop: 8 }}>
            {view.today.map((s) => (
              <View key={s.id} style={ROW}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <T size={13} mono color={C.muted}>{time(s.start)} ~</T>
                  {s.end === null ? (
                    <>
                      <OpenDot />
                      <T size={13} mono weight="semibold">근무 중</T>
                    </>
                  ) : (
                    <T size={13} mono color={C.muted}>{time(s.end)}</T>
                  )}
                </View>
                <T size={13} mono weight="semibold">{hm(shiftMinutes(s, now))}</T>
              </View>
            ))}
          </DashedList>
        )}
      </CardSection>

      {incoming + pending > 0 && (
        <CardSection style={SECTION}>
          <SectionLabel icon={Bell} index="02" right={incoming + pending}>처리할 것</SectionLabel>
          <View style={{ marginTop: 8, gap: 6 }}>
            {incoming > 0 && <TodoRow icon={<ArrowLeftRight size={15} color={C.foreground} />} label="받은 대타 요청" count={incoming} onPress={onOpenRequests} />}
            {pending > 0 && <TodoRow icon={<Hourglass size={15} color={C.caution} />} label="내 대기 요청" count={pending} onPress={onOpenRequests} />}
          </View>
        </CardSection>
      )}

      <CardSection style={SECTION}>
        {/* 기간은 짧게 "10/12 – 10/18" — 긴 날짜는 좁은 폭에서 제목을 밀어냈다 (2026-10-15 사용자 요청) */}
        <SectionLabel icon={CalendarDays} index="03" right={`${monthDay(week.weekStart)} – ${monthDay(week.weekEnd.getTime() - 1)}`}>이번 주</SectionLabel>
        <View style={{ marginTop: 10, gap: 6 }}>
          <DotRow term="근무 시간">
            <T size={13} mono weight="semibold">
              {hm(week.workedMinutes)}
              {settings.weeklyHours > 0 && ` / ${settings.weeklyHours}시간`}
            </T>
          </DotRow>
        </View>
        {settings.weeklyHours > 0 && (
          <View style={{ marginTop: 8 }}>
            <ProgressBar value={week.workedMinutes} max={settings.weeklyHours * 60} label="이번 주 근무 시간" valueText={`${hm(week.workedMinutes)} / ${settings.weeklyHours}시간`} />
          </View>
        )}
        <View style={{ marginTop: 8, gap: 6 }}>
          <DotRow term="근무한 날">
            <T size={13} mono weight="semibold">
              {week.workDays}일 / {settings.workDaysPerWeek}일{week.excusedDays > 0 && ` + 휴가·대타 ${week.excusedDays}일`}
            </T>
          </DotRow>
          <DotRow term="주휴수당">
            <T size={13} weight="semibold" color={holidayTone(holiday) ?? C.foreground}>{holiday}</T>
          </DotRow>
        </View>
      </CardSection>

      <View style={{ borderTopWidth: 1, borderTopColor: C.line }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${view.month + 1}월 예상 급여 (세전) ${won(view.monthTotal)}, 급여 탭에서 자세히`}
          onPress={onOpenPay}
          style={({ pressed }) => [PAY_ROW, pressed ? { backgroundColor: C.background } : null]}
        >
          <View style={{ minWidth: 0 }}>
            <PayLabel>{view.month + 1}월 예상 급여 (세전)</PayLabel>
            {/* 금액은 끊지 않는다 — 좁으면 오른쪽 링크가 다음 줄로 내려간다. 포인트 컬러: 큰 급여 숫자 (2026-10-15) */}
            <CountUp value={view.monthTotal} format={won} size={22} weight="semibold" color={C.accent} style={PAY_AMOUNT} />
          </View>
          <PayLink />
        </Pressable>
      </View>
    </Card>
  );
}

const ROW = { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingVertical: 7 } as const;
const PAY_ROW = { minHeight: 44, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", columnGap: 12, rowGap: 4, paddingHorizontal: 16, paddingVertical: 14 } as const;
const PAY_AMOUNT = { marginTop: 4, lineHeight: 27.5 } as const;

/** ④ 구역 머리 — 구역 전체가 버튼이라 제목 대신 SectionLabel 과 같은 모양의 글자 */
function PayLabel({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <PiggyBank size={15} strokeWidth={1.75} color={C.muted} />
      <T size={12} mono color={alpha(C.muted, 0.7)}>04</T>
      <T size={12} weight="semibold" color={C.muted}>{children}</T>
    </View>
  );
}

function PayLink() {
  return (
    <View style={{ flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 2 }}>
      <T size={13} weight="semibold" color={C.accent}>급여 탭에서 자세히</T>
      <ChevronRight size={15} color={C.accent} />
    </View>
  );
}

/** 처리할 것 한 줄 — 옅은 주의색 바탕 + 왼쪽 굵은 선(2026-10-15 B 시안 .todo). 행 전체가 요청 탭으로 가는 버튼 */
function TodoRow({ icon, label, count, onPress }: { icon: React.ReactNode; label: string; count: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${count}건 — 요청 탭에서 보기`}
      onPress={onPress}
      style={({ pressed }) => [
        { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: R.control, borderLeftWidth: 3, borderLeftColor: C.caution, backgroundColor: alpha(C.caution, 0.1), paddingHorizontal: 12 },
        pressed ? { transform: [{ scale: 0.97 }] } : null,
      ]}
    >
      {icon}
      <T size={13} weight="semibold" style={{ flex: 1 }}>{label}</T>
      <T size={13} mono weight="semibold" color={C.caution}>{count}건</T>
      <ChevronRight size={15} color={C.muted} />
    </Pressable>
  );
}

/** 글자 줄 안의 막대 — 줄 높이를 지켜 불러온 뒤와 같은 높이가 되게 */
function LineBone({ width, height = 14, line = LINE13 }: { width: number; height?: number; line?: number }) {
  return (
    <View style={{ height: line, justifyContent: "center" }}>
      <Bone style={{ height, width }} />
    </View>
  );
}

/**
 * 기록·휴가를 읽는 동안의 자리 — ready 와 같은 카드·구역·줄 높이에 값 대신 막대 (§3-5).
 * 구역 이름처럼 데이터와 무관한 글자는 그대로 둔다. 오늘 기록은 2행, 처리할 것 구역은 없는 것(0건)으로 둔다.
 * progress: 소정 시간이 있어 이번 주 진행 막대 줄이 생기는지 (settings.weeklyHours > 0)
 */
export function TodayDashboardSkeleton({ now, progress = true }: { now: number; progress?: boolean }) {
  const right = (w: number) => <LineBone width={w} height={12} line={Math.round(12 * 1.45)} />;
  return (
    <Loading>
      <Card flush>
        <CardSection first style={SECTION}>
          <SectionLabel icon={Clock} index="01" right={right(64)}>오늘</SectionLabel>
          <DashedList style={{ marginTop: 8 }}>
            {[0, 1].map((i) => (
              <View key={i} style={ROW}>
                <LineBone width={144} />
                <LineBone width={64} />
              </View>
            ))}
          </DashedList>
        </CardSection>
        <CardSection style={SECTION}>
          <SectionLabel icon={CalendarDays} index="03" right={right(96)}>이번 주</SectionLabel>
          <View style={{ marginTop: 10, gap: 6 }}>
            <DotRow term="근무 시간"><LineBone width={96} /></DotRow>
          </View>
          {progress && (
            <View style={{ marginTop: 8 }}>
              <Bone style={{ height: 8, borderRadius: 999 }} />
            </View>
          )}
          <View style={{ marginTop: 8, gap: 6 }}>
            <DotRow term="근무한 날"><LineBone width={64} /></DotRow>
            <DotRow term="주휴수당"><LineBone width={96} /></DotRow>
          </View>
        </CardSection>
        <View style={[PAY_ROW, { borderTopWidth: 1, borderTopColor: C.line }]}>
          <View style={{ minWidth: 0 }}>
            <PayLabel>{new Date(now).getMonth() + 1}월 예상 급여 (세전)</PayLabel>
            {/* 22px 글자 줄 = 27.5 */}
            <View style={{ marginTop: 4, height: 27.5, justifyContent: "center" }}>
              <Bone style={{ height: 24, width: 112 }} />
            </View>
          </View>
          {/* 고정 글자는 그대로 — 좁은 폭에서 불러온 뒤와 같은 자리에서 줄바꿈된다 */}
          <PayLink />
        </View>
      </Card>
    </Loading>
  );
}
