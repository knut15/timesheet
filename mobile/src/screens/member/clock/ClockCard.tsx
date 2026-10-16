// 출퇴근 탭 시계 카드 — 웹 web/src/components/TodayDashboard.tsx 의 ClockCard·ClockCardSkeleton 앱판. docs/design/member-today.md §2
// 모양은 2026-10-15 B 시안: 왼쪽 정렬 시계(강조색 40px), 날짜 옆 상태 태그
import { CalendarOff, CircleCheck, CircleDashed, House, Moon, RefreshCw, Sparkle, TriangleAlert } from "lucide-react-native";
import { View } from "react-native";
import { Scene } from "@/components/illust";
import { Appear, SwapText } from "@/components/motion";
import { Bone, Btn, Card, ErrorText, Loading, T } from "@/components/ui";
import { date, dayLabel, hm, time } from "@/lib/format";
import { C, R, alpha } from "@/theme";
import { clockText } from "@shared/format";
import { shiftMinutes, type Absence } from "@shared/pay";
import type { TodayState } from "@shared/today";

export type ClockState = TodayState | { kind: "loading" } | { kind: "error" };

const OFF_TEXT: Record<Absence["kind"], { pill: string; desc: string }> = {
  paid_leave: { pill: "오늘 휴가", desc: "오늘은 유급 휴가예요" },
  unpaid_leave: { pill: "오늘 휴가", desc: "오늘은 무급 휴가예요" },
  substitution: { pill: "오늘 대타", desc: "오늘은 동료가 대신 근무해요" },
};

// 출근·퇴근 버튼 — 네 상태 모두 같은 높이(44), 위 14
const PUNCH = { marginTop: 14 } as const;

/** 근무 중 표시 점 — 웹 calendar/MonthGrid 의 OpenDot (6px 초록 점, 장식) */
export function OpenDot() {
  return <View importantForAccessibility="no" accessibilityElementsHidden style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: C.ok }} />;
}

/** 시계 + 지금 상태 + 출근·퇴근 버튼. §2 */
export function ClockCard({
  now,
  minuteNow,
  state,
  busy = false,
  error = null,
  onPunch,
  onRetry,
}: {
  now: number;
  minuteNow: number;
  state: ClockState;
  busy?: boolean;
  error?: string | null;
  onPunch: (kind: "in" | "out") => void;
  onRetry: () => void;
}) {
  // 상태 태그 — 아이콘 모양 + 글자. 휴가·대타는 점선 테두리. 글자가 바뀔 때 아래에서 올라온다
  const pill = (icon: React.ReactNode, label: string, dashed = false) => (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={{ height: 24, flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: R.pill, borderWidth: 1, borderStyle: dashed ? "dashed" : "solid", borderColor: dashed ? C.muted : alpha(C.muted, 0.4), paddingHorizontal: 8 }}
    >
      {icon}
      <SwapText text={label} size={12} weight="semibold" color={C.foreground} />
    </View>
  );
  const desc = (text: string) => <T size={13} mono color={C.muted} style={{ marginTop: 10 }}>{text}</T>;
  const note = (text: string) => <T size={12} color={C.muted} style={{ marginTop: 8 }}>{text}</T>;

  let tag: React.ReactNode;
  let body: React.ReactNode;
  switch (state.kind) {
    case "working": {
      const { open } = state;
      // 어제 출근해 아직 퇴근 안 한 기록은 날짜를 붙인다 (§2-3)
      const started = open.start < new Date(minuteNow).setHours(0, 0, 0, 0) ? `${dayLabel(open.start)} ${time(open.start)}` : time(open.start);
      tag = pill(<OpenDot />, "근무 중");
      body = (
        <>
          {desc(`${started} 출근 · 지금까지 ${hm(shiftMinutes(open, minuteNow))}`)}
          <Btn variant="primary" label="퇴근" disabled={busy} onPress={() => onPunch("out")} style={PUNCH} />
        </>
      );
      break;
    }
    case "done":
      tag = pill(<CircleCheck size={12} color={C.accent} />, "오늘 퇴근함");
      body = (
        <>
          {desc(`${time(state.lastEnd)} 퇴근`)}
          {/* 다시 출근은 없다 — 내일 0시까지 막는다 (2026-09-25 사용자 결정). 비활성 모양은 primary 의 disabled */}
          <Btn variant="primary" label="출근" disabled style={PUNCH} />
          <DoneBox />
        </>
      );
      break;
    case "off":
      tag = pill(<CalendarOff size={12} color={C.muted} />, OFF_TEXT[state.absence].pill, true);
      body = (
        <>
          {desc(OFF_TEXT[state.absence].desc)}
          <Btn variant="secondary" label="출근" disabled={busy} onPress={() => onPunch("in")} style={PUNCH} />
          {note("쉬는 날에도 출근하면 근무로 기록돼요.")}
        </>
      );
      break;
    case "before":
      tag = pill(<CircleDashed size={12} color={C.muted} />, "출근 전");
      body = <Btn variant="accent" label="출근" disabled={busy} onPress={() => onPunch("in")} style={PUNCH} />;
      break;
    case "loading":
      // 상태를 모르는 동안 태그·버튼 자리는 막대로 둔다 — 누를 것이 없다 (§2-4)
      tag = <TagBone />;
      body = <Bone style={[{ height: 44, borderRadius: R.control }, PUNCH]} />;
      break;
    case "error":
      tag = pill(<TriangleAlert size={12} color={C.warn} />, "상태를 불러오지 못했어요");
      body = <Btn variant="secondary" icon={RefreshCw} label="다시 불러오기" onPress={onRetry} style={PUNCH} />;
      break;
  }

  const card = (
    <Card>
      <View style={{ minHeight: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <T size={12} weight="semibold" mono color={C.muted}>{date(now)}</T>
        {tag}
      </View>
      {/* 한 줄 고정: HH:MM:SS + 줄바꿈 금지 (2026-09-25). 포인트 컬러: 출퇴근 시계는 강조색 (2026-10-15 사용자 지시) */}
      <T size={40} weight="semibold" mono color={C.accent} numberOfLines={1} style={{ marginTop: 8, lineHeight: 40, letterSpacing: -1 }}>{clockText(now)}</T>
      {body}
      {error && (
        <View style={{ marginTop: 12 }}>
          <ErrorText>{error}</ErrorText>
        </View>
      )}
    </Card>
  );
  return state.kind === "loading" ? <Loading label="상태 확인 중">{card}</Loading> : card;
}

/** 상태 태그 자리 막대 — 태그와 같은 높이(24), 출근 전 태그 폭쯤 */
function TagBone() {
  return <Bone style={{ height: 24, width: 68, flexShrink: 0, borderRadius: R.pill }} />;
}

/**
 * 퇴근한 뒤의 완료 상자 — 나타날 때 한 번 올라오고, 집·달·반짝임 장면이 톡 튀어나온다.
 * 글자는 #8 문구(내일부터 다시 출근) 그대로, 머리만 "수고했어요" (2026-10-15 B 시안)
 */
function DoneBox() {
  return (
    <Appear style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: R.control, borderWidth: 1, borderStyle: "dashed", borderColor: alpha(C.muted, 0.5), paddingHorizontal: 12, paddingVertical: 10 }}>
      <Scene size="sm" icon={House} accents={[{ icon: Moon, at: "tr" }, { icon: Sparkle, at: "tl" }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T size={14} weight="semibold">수고했어요</T>
        <T size={12} color={C.muted} style={{ lineHeight: 19 }}>오늘 근무를 마쳤어요. 내일부터 다시 출근할 수 있어요.</T>
      </View>
    </Appear>
  );
}
