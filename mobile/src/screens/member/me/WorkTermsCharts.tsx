// 내 정보 탭 근무 조건 그래프 — 웹 web/src/components/member/WorkTermsCharts.tsx 앱판 (2026-10-15 사용자 요청 "이 데이터는 그래프로 그려줘").
// 웹은 Recharts·GSAP 이다. 앱에서는 둘 다 못 쓴다 — 게이지는 react-native-svg, 움직임은 react-native-reanimated 로 같은 모양을 그린다.
// 색은 토큰 — 막대는 강조색, 축·기준선·트랙은 muted 에 투명도. 한 사람의 값이라 범례 없이 구역 이름이 제목이다.
import { CalendarClock, Sofa, Sun } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { G as G_, Line, Rect, Text as SvgText } from "react-native-svg";
import { EASE, rise } from "@/components/motion";
import { T } from "@/components/ui";
import { C, F, R, alpha } from "@/theme";
import { DAY_NAMES, WEEK_ORDER, dayPlan, nextShift, untilText, type DayException, type Schedule } from "@shared/schedule";

const minutesOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const durationText = (h: number) => `${Math.floor(h)}시간${h % 1 ? " 30분" : ""}`;
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/**
 * 주간 리듬 카드 — 이번 주 월~일 카드 7장. 근무하는 날은 해 + 시각 + 시간, 쉬는 날은 소파 (2026-10-15 사용자 선택 "주간 리듬 카드").
 * 날짜별 근무 변경이 시간표보다 먼저다. 위 줄은 "지금 근무 시간" 또는 "다음 근무까지 …".
 */
export function WeekRhythm({ schedule, exceptions, now }: { schedule: Schedule | null; exceptions: DayException[]; now: number }) {
  const today = new Date(now);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
  const todayKey = today.toDateString();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const next = nextShift(schedule, exceptions, today);

  return (
    <View>
      <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {next?.state === "working" ? (
          <>
            {/* 초록 점 + 옅은 고리 3px (웹 ring-3 ring-ok/20) — 고리는 자리를 차지하지 않게 바깥으로 */}
            <View importantForAccessibility="no" style={{ height: 6, width: 6, alignItems: "center", justifyContent: "center" }}>
              <View style={{ position: "absolute", height: 12, width: 12, borderRadius: 6, backgroundColor: alpha(C.ok, 0.2) }} />
              <View style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: C.ok }} />
            </View>
            <T size={13} style={{ flexShrink: 1 }}>
              지금 근무 시간이에요 · <T size={13} mono weight="semibold">{hhmm(next.end)}</T> 까지
            </T>
          </>
        ) : next ? (
          <>
            <CalendarClock size={15} color={C.muted} />
            <T size={13} style={{ flexShrink: 1 }}>
              다음 근무까지 <T size={13} mono weight="semibold" color={C.accent}>{untilText(next.at.getTime() - now)}</T>{" "}
              <T size={13} mono color={C.muted}>({DAY_NAMES[next.at.getDay()]} {next.start})</T>
            </T>
          </>
        ) : (
          <T size={13} color={C.muted}>정해진 근무가 없어요</T>
        )}
      </View>
      <View style={{ marginTop: 10, flexDirection: "row", gap: 4 }}>
        {days.map((d, i) => {
          const plan = dayPlan(schedule, exceptions, d);
          const isToday = d.toDateString() === todayKey;
          const past = d < todayStart;
          const hours = plan ? (minutesOf(plan.end) - minutesOf(plan.start)) / 60 : 0;
          const name = DAY_NAMES[d.getDay()];
          return (
            // 카드가 왼쪽부터 0.04초 간격으로 올라온다 (처음 그릴 때 한 번).
            // 등장 애니메이션은 opacity 를 1 로 덮어쓴다 — 지난 날 흐림(0.55)은 안쪽 칸에 둔다
            <Animated.View key={d.toDateString()} entering={rise(6, 300, i * 40)} style={{ flex: 1, minWidth: 0 }}>
              <View
                accessible
                accessibilityLabel={`${name}요일${isToday ? " (오늘)" : ""} ${plan ? `${plan.start}~${plan.end} 근무 ${durationText(hours)}` : "쉬는 날"}`}
                accessibilityState={isToday ? { selected: true } : undefined}
                // 테두리는 모두 1px — 오늘은 같은 굵기에 강조색 실선만 (2026-10-15 사용자 요청)
                style={{
                  flex: 1,
                  alignItems: "center",
                  gap: 4,
                  borderRadius: R.control,
                  borderWidth: 1,
                  borderStyle: !isToday && !plan ? "dashed" : "solid",
                  borderColor: isToday ? C.accent : plan ? alpha(C.accent, 0.25) : C.line,
                  backgroundColor: plan ? alpha(C.accent, 0.1) : "transparent",
                  paddingHorizontal: 2,
                  paddingVertical: 8,
                  opacity: past ? 0.55 : 1,
                }}
              >
                <T size={11} weight={isToday ? "bold" : "semibold"} color={isToday ? C.accent : C.muted}>{name}</T>
                {plan ? <Sun size={16} strokeWidth={1.75} color={C.accent} /> : <Sofa size={16} strokeWidth={1.5} color={C.muted} />}
                <T size={10} mono color={plan ? C.foreground : C.muted} style={{ lineHeight: 12.5 }}>{plan ? `${plan.start.slice(0, 2)}-${plan.end.slice(0, 2)}` : "쉼"}</T>
                <T size={10} mono weight="semibold" color={C.foreground} style={{ lineHeight: 12.5, opacity: plan ? 1 : 0 }}>{plan ? `${hours}h` : "0h"}</T>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// 게이지 자리 — 높이 52, 위 14(기준선 글자), 막대 12, 아래 눈금 글자. 좌우 여백은 웹 Recharts margin(left 8, right 22)과 같다
const G = { height: 52, top: 14, bar: 12, left: 8, right: 22 } as const;
// 기준선 — 주휴수당 기준 15시간, 법정 40시간
const REFS = [
  { v: 15, label: "주휴 15h" },
  { v: 40, label: "법정 40h" },
] as const;

/** 주 시간 게이지 — 0~40시간 막대 하나, 주휴수당 기준 15시간·법정 40시간 기준선 */
export function WeeklyHoursGauge({ hours }: { hours: number }) {
  const max = Math.max(40, Math.ceil(hours));
  const [width, setWidth] = useState(0);
  const plot = Math.max(0, width - G.left - G.right);
  const x = (v: number) => G.left + (v / max) * plot;
  // 막대가 0에서 값까지 0.4초 동안 자란다 — 동작 줄이기면 Reanimated 가 바로 최종 값으로 둔다
  const grow = useSharedValue(0);
  useEffect(() => {
    grow.value = withTiming(1, { duration: 400, easing: EASE });
  }, [grow]);
  const barWidth = (hours / max) * plot;
  const barProps = useAnimatedProps(() => ({ width: Math.max(0, barWidth * grow.value) }));
  const axisY = G.top + G.bar + 14;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`1주 소정근로시간 ${hours}시간 — 주휴수당 기준 15시간 ${hours >= 15 ? "이상" : "미만"}, 법정 40시간`}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: G.height }}
    >
      {width > 0 && (
        <Svg width={width} height={G.height}>
          {/* 트랙 — muted 15% */}
          <Rect x={G.left} y={G.top} width={plot} height={G.bar} rx={4} fill={C.muted} fillOpacity={0.15} />
          <AnimatedRect x={G.left} y={G.top} height={G.bar} rx={4} fill={C.accent} animatedProps={barProps} />
          {REFS.map((r) => (
            <G_ key={r.v}>
              <Line x1={x(r.v)} x2={x(r.v)} y1={G.top} y2={G.top + G.bar} stroke={C.muted} strokeDasharray="3 3" />
              <SvgText x={x(r.v)} y={G.top - 4} fontSize={10} fontFamily={F.regular} fill={C.muted} textAnchor="middle">
                {r.label}
              </SvgText>
            </G_>
          ))}
          {[0, 15, 40].map((v) => (
            <SvgText key={v} x={x(v)} y={axisY} fontSize={11} fontFamily={F.regular} fill={C.muted} textAnchor="middle">
              {`${v}h`}
            </SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
}

/** 근무일 점 — 월~일 7개 중 근무하는 요일만 채운다. 시간표가 없으면 일수만큼 앞에서부터 */
export function WorkDayDots({ schedule, count }: { schedule: Schedule | null; count: number }) {
  const on = (i: number, d: number) => (schedule ? schedule.days.includes(d) : i < count);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`1주 소정근로일수 ${count}일${schedule ? ` (${WEEK_ORDER.filter((d) => schedule.days.includes(d)).map((d) => DAY_NAMES[d]).join("·")})` : ""}`}
      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
    >
      {WEEK_ORDER.map((d, i) => (
        <View key={d} style={{ alignItems: "center", gap: 4 }}>
          <View style={{ height: 14, width: 14, borderRadius: 7, borderWidth: 1, borderColor: on(i, d) ? C.accent : alpha(C.muted, 0.4), backgroundColor: on(i, d) ? C.accent : "transparent" }} />
          {schedule && <T size={11} color={C.muted}>{DAY_NAMES[d]}</T>}
        </View>
      ))}
    </View>
  );
}
