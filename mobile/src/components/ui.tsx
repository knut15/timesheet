// 공통 UI — 웹 web/src/components/ui.tsx·styles.ts·shell.tsx 를 앱 컴포넌트로 옮긴 것. 모양 기준은 DESIGN.md §3·§4.
// 웹의 Tailwind 클래스 대신 theme.ts 토큰으로 그린다. 이름과 쓰임은 웹과 같게 둔다.
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Svg, { Line } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { C, F, R, S, alpha } from "@/theme";

// ── 글자 ───────────────────────────────────────────────
type Weight = "regular" | "medium" | "semibold" | "bold";

/**
 * 글자. 크기·굵기·색을 이름으로 고른다. mono 는 숫자(시각·시간·금액·날짜) — 웹 NUM 과 같은 Geist Mono 고정폭.
 * 앱은 굵기마다 글꼴 파일이 따로라 fontWeight 대신 fontFamily 를 바꾼다.
 */
export function T({ size = 14, weight = "regular", color = C.foreground, mono = false, style, ...rest }: TextProps & { size?: number; weight?: Weight; color?: string; mono?: boolean }) {
  const family = mono ? F.mono : F[weight];
  // 고정폭 글꼴은 파일이 하나(Regular)다 — 굵게는 iOS 가 합성한다
  const monoWeight: TextStyle = mono && weight !== "regular" ? { fontWeight: weight === "medium" ? "500" : weight === "semibold" ? "600" : "700" } : {};
  return <Text {...rest} style={[{ fontFamily: family, fontSize: size, color, lineHeight: Math.round(size * 1.45), fontVariant: ["tabular-nums"] }, monoWeight, style]} />;
}

// ── 카드 ───────────────────────────────────────────────
/** 카드 — 모서리 8, 테두리 1px line, 그림자 없음. 안쪽 16. 구역을 나눌 때는 flush 로 두고 CardSection 을 쌓는다 */
export function Card({ children, style, flush = false }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; flush?: boolean }) {
  return <View style={[styles.card, flush ? null : { padding: S.card }, style]}>{children}</View>;
}

/** 카드 구역 — 위 구역과 1px 선으로 나뉜다 (웹 divide-y). 첫 구역은 first */
export function CardSection({ children, first = false, style }: { children: React.ReactNode; first?: boolean; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ padding: S.card }, first ? null : { borderTopWidth: 1, borderTopColor: C.line }, style]}>{children}</View>;
}

/**
 * 카드 구역 머리 — 작은 회색 글자, 앞에 lucide 아이콘(15, 선 1.75), 원하면 번호("01"), 오른쪽에 요약 값.
 * tone="title" 은 카드 제목 — 14px 굵게·본문색, 아이콘만 회색 (2026-10-15 사용자 요청)
 */
export function SectionLabel({ icon: Icon, index, children, right, tone = "label" }: { icon?: LucideIcon; index?: string; children: React.ReactNode; right?: React.ReactNode; tone?: "label" | "title" }) {
  const title = tone === "title";
  return (
    <View style={styles.row}>
      <View style={[styles.row, { gap: 6, flexShrink: 1, justifyContent: "flex-start" }]} accessibilityRole="header">
        {Icon && <Icon size={15} strokeWidth={1.75} color={C.muted} />}
        {index && <T size={12} mono color={alpha(C.muted, 0.7)}>{index}</T>}
        <T size={title ? 14 : 12} weight="semibold" color={title ? C.foreground : C.muted} numberOfLines={1} style={{ flexShrink: 1 }}>
          {children}
        </T>
      </View>
      {right !== undefined && (typeof right === "string" || typeof right === "number" ? <T size={12} weight="semibold" mono color={C.muted}>{right}</T> : right)}
    </View>
  );
}

/** 점선으로 이은 "이름 ……… 값" 한 줄 (웹 PayView DotRow) */
export function DotRow({ term, children, muted = false }: { term: React.ReactNode; children: React.ReactNode; muted?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
      {typeof term === "string" ? <T size={13} color={C.muted}>{term}</T> : term}
      {/* iOS 는 점선 테두리를 줄 길이에 따라 실선으로 그린다 — svg 선의 점 간격으로 그린다 */}
      <Svg style={{ flex: 1, minWidth: 12, marginBottom: 5 }} height={1}>
        <Line x1="0" y1="0.5" x2="100%" y2="0.5" stroke={alpha(C.muted, 0.4)} strokeWidth={1} strokeDasharray="1 2" />
      </Svg>
      {typeof children === "string" || typeof children === "number" ? (
        <T size={13} weight={muted ? "medium" : "semibold"} color={muted ? C.muted : C.foreground}>{children}</T>
      ) : (
        children
      )}
    </View>
  );
}

// ── 버튼 ───────────────────────────────────────────────
/**
 * 버튼 모양 — 웹 BTN 과 같은 다섯 가지. primary(진한 바탕) · secondary(회색 선) · small(목록 안 보조, 32) · dashed(추가) · danger(지우기).
 * 높이 기본 44, small·danger 32. 누르면 0.97 로 줄어든다 (DESIGN.md §5)
 */
export type BtnVariant = "primary" | "secondary" | "small" | "dashed" | "danger" | "accent";
export function Btn({ variant = "secondary", label, icon: Icon, onPress, disabled, style, full = false, ...rest }: Omit<PressableProps, "style" | "children"> & { variant?: BtnVariant; label: string; icon?: LucideIcon; style?: StyleProp<ViewStyle>; full?: boolean }) {
  const v = BTN[variant];
  const off = !!disabled;
  const color = off && variant === "primary" ? C.muted : v.color;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off }}
      disabled={off}
      onPress={onPress}
      hitSlop={v.height < 44 ? (44 - v.height) / 2 : undefined}
      style={({ pressed }) => [
        styles.btn,
        { height: v.height, paddingHorizontal: v.px, backgroundColor: off && variant === "primary" ? C.line : v.bg, borderColor: v.border, borderWidth: v.border ? 1 : 0, borderStyle: variant === "dashed" ? "dashed" : "solid" },
        full ? { alignSelf: "stretch" } : null,
        off && variant !== "primary" ? { opacity: 0.5 } : null,
        pressed ? { transform: [{ scale: 0.97 }] } : null,
        style,
      ]}
      {...rest}
    >
      {Icon && <Icon size={v.height < 44 ? 14 : 16} color={color} strokeWidth={2} />}
      <T size={v.size} weight={variant === "primary" || variant === "accent" ? "semibold" : "medium"} color={color}>{label}</T>
    </Pressable>
  );
}
const BTN: Record<BtnVariant, { height: number; px: number; bg: string; border?: string; color: string; size: number }> = {
  primary: { height: 44, px: 16, bg: C.foreground, color: C.background, size: 15 },
  accent: { height: 44, px: 16, bg: C.accent, color: C.onAccent, size: 15 },
  secondary: { height: 44, px: 16, bg: C.surface, border: C.line, color: C.foreground, size: 14 },
  small: { height: 32, px: 10, bg: C.surface, border: C.line, color: C.foreground, size: 12 },
  dashed: { height: 44, px: 16, bg: "transparent", border: alpha(C.muted, 0.6), color: C.muted, size: 14 },
  danger: { height: 32, px: 10, bg: C.surface, border: C.line, color: C.warn, size: 12 },
};

/** 아이콘만 있는 버튼 — 44×44. 이름(label)은 스크린리더용으로 꼭 받는다. outline 은 월 이동처럼 테두리 있는 모양 */
export function IconButton({ icon: Icon, label, onPress, variant = "ghost", disabled }: { icon: LucideIcon; label: string; onPress: () => void; variant?: "ghost" | "outline"; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        { height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: R.control },
        variant === "outline" ? { borderWidth: 1, borderColor: C.line, backgroundColor: C.surface } : null,
        pressed ? { transform: [{ scale: 0.97 }], backgroundColor: alpha(C.line, 0.6) } : null,
        disabled ? { opacity: 0.4 } : null,
      ]}
    >
      <Icon size={variant === "outline" ? 18 : 20} color={variant === "outline" ? C.foreground : C.muted} />
    </Pressable>
  );
}

/** 켜고 끄기 — 그림은 36×20, 누르는 자리는 44 (DESIGN.md §6). 손잡이는 transform 150ms */
export function Switch({ value, onChange, label, disabled }: { value: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  const x = useSharedValue(value ? 16 : 0);
  useEffect(() => {
    x.value = withTiming(value ? 16 : 0, { duration: 150, easing: Easing.bezier(0.23, 1, 0.32, 1) });
  }, [value, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value, disabled }} disabled={disabled} onPress={() => onChange(!value)} style={{ height: 44, width: 44, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : 1 }}>
      <View style={{ height: 20, width: 36, borderRadius: R.pill, backgroundColor: value ? C.accent : C.line }}>
        <Animated.View style={[{ position: "absolute", left: 3, top: 3, height: 14, width: 14, borderRadius: 3, backgroundColor: "#fff" }, knob]} />
      </View>
    </Pressable>
  );
}

// ── 입력 ───────────────────────────────────────────────
/** 입력칸 — 높이 44, 글자 16, 바탕 surface, 포커스는 강조색 테두리 */
export function Input(props: TextInputProps) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      placeholderTextColor={alpha(C.muted, 0.7)}
      selectionColor={C.accent}
      {...props}
      onFocus={(e) => (setFocus(true), props.onFocus?.(e))}
      onBlur={(e) => (setFocus(false), props.onBlur?.(e))}
      style={[styles.input, focus ? { borderColor: C.accent } : null, props.multiline ? { height: 88, paddingTop: 10, textAlignVertical: "top" } : null, props.style]}
    />
  );
}

export function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: 6, minWidth: 0 }, style]}>
      <T size={12} weight="semibold" color={C.muted}>{label}</T>
      {children}
    </View>
  );
}

/** 여러 개 중 하나 고르기 — 보기 전환 틀과 같은 모양 */
export function Segmented<V extends string>({ value, options, onChange }: { value: V; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  return (
    <View style={{ flexDirection: "row", borderWidth: 1, borderColor: C.line, borderRadius: R.control, padding: 3, backgroundColor: C.surface }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)} style={{ flex: 1, height: 34, alignItems: "center", justifyContent: "center", borderRadius: R.control - 2, backgroundColor: on ? C.background : "transparent" }}>
            <T size={13} weight={on ? "semibold" : "medium"} color={on ? C.foreground : C.muted}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  return children ? <T size={14} color={C.warn} accessibilityRole="alert">{children}</T> : null;
}

// ── 상태 표시 ──────────────────────────────────────────
/** 요청 상태 배지. 수정 요청·휴가·대타가 같이 쓴다 (docs/prd/08·09) */
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "승인 대기", color: C.caution, bg: alpha(C.caution, 0.15) },
  requested: { label: "동료 수락 대기", color: C.caution, bg: alpha(C.caution, 0.15) },
  accepted: { label: "승인 대기", color: C.caution, bg: alpha(C.caution, 0.15) },
  approved: { label: "승인", color: C.ok, bg: alpha(C.ok, 0.15) },
  rejected: { label: "거절", color: C.warn, bg: alpha(C.warn, 0.15) },
  declined: { label: "동료 거절", color: C.warn, bg: alpha(C.warn, 0.15) },
  canceled: { label: "취소", color: C.muted, bg: alpha(C.line, 0.6) },
};
export function StatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, color: C.muted, bg: alpha(C.line, 0.6) };
  return <Pill label={s.label} color={s.color} bg={s.bg} />;
}

/** 작은 배지 — 높이 20, 모서리 4 */
export function Pill({ label, color = C.muted, bg = alpha(C.line, 0.6) }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={{ height: 20, justifyContent: "center", paddingHorizontal: 6, borderRadius: R.pill, backgroundColor: bg, alignSelf: "flex-start" }}>
      <T size={11} weight="semibold" color={color} style={{ lineHeight: 14 }}>{label}</T>
    </View>
  );
}

/** 진행 막대. 넘친 값은 가득 채우고 실제 값은 valueText 가 말한다 */
export function ProgressBar({ value, max, label, valueText }: { value: number; max: number; label: string; valueText: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max, now: Math.min(value, max), text: valueText }} style={{ height: 8, borderRadius: 999, backgroundColor: C.line, overflow: "hidden" }}>
      <View style={{ height: "100%", width: `${pct}%`, borderRadius: 999, backgroundColor: C.accent }} />
    </View>
  );
}

/** 스켈레톤 막대 — 불러온 뒤 모양과 같은 크기로 둔다. 은은하게 깜빡인다 */
export function Bone({ style }: { style?: StyleProp<ViewStyle> }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.5, { duration: 900 }), -1, true);
  }, [o]);
  const pulse = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ backgroundColor: C.line, borderRadius: R.control, height: 14 }, pulse, style]} />;
}

/** 불러오는 중 — 스켈레톤 영역. 스크린리더에는 "불러오는 중" 한 번만 읽힌다 */
export function Loading({ children, label = "불러오는 중" }: { children: React.ReactNode; label?: string }) {
  return (
    <View accessible accessibilityLabel={label} accessibilityState={{ busy: true }}>
      {children}
    </View>
  );
}

export function Spinner() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
      <ActivityIndicator color={C.muted} />
    </View>
  );
}

// ── 월 이동 ────────────────────────────────────────────
export function MonthPicker({ cursor, onChange }: { cursor: { year: number; month: number }; onChange: (c: { year: number; month: number }) => void }) {
  const move = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    onChange({ year: d.getFullYear(), month: d.getMonth() });
  };
  return (
    <View style={styles.row}>
      <IconButton variant="outline" icon={ChevronLeft} label="이전 달" onPress={() => move(-1)} />
      <T weight="semibold" mono size={15}>{cursor.year}년 {cursor.month + 1}월</T>
      <IconButton variant="outline" icon={ChevronRight} label="다음 달" onPress={() => move(1)} />
    </View>
  );
}

// ── 아바타 ─────────────────────────────────────────────
/** 아바타 배경. 흰 글자와 대비 4.5:1 이상인 중간 채도만 (웹 shell.tsx 와 같은 색·같은 해시 — 같은 사람은 웹과 앱에서 같은 색) */
const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#db2777", "#dc2626", "#c2410c", "#15803d", "#0f766e", "#4338ca"];
function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}
export function initials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  if (/^[a-z]/i.test(t)) {
    const parts = t.split(/\s+/);
    return (parts.length > 1 ? parts[0]![0]! + parts[1]![0]! : t.slice(0, 2)).toUpperCase();
  }
  return [...t][0]!;
}
const AV = { xs: { box: 18, r: 4, font: 9 }, sm: { box: 32, r: 6, font: 12 }, md: { box: 40, r: 8, font: 14 }, lg: { box: 64, r: 12, font: 20 } } as const;
export function Avatar({ name, seed, size = "md", label }: { name: string; seed: string; size?: keyof typeof AV; label?: string }) {
  const z = AV[size];
  return (
    <View
      accessible={!!label}
      accessibilityLabel={label}
      importantForAccessibility={label ? "yes" : "no-hide-descendants"}
      style={{ height: z.box, width: z.box, borderRadius: z.r, alignItems: "center", justifyContent: "center", backgroundColor: AVATAR_COLORS[hash(seed) % AVATAR_COLORS.length] }}
    >
      <T size={z.font} weight="semibold" color="#fff" style={{ lineHeight: z.font * 1.2 }}>{initials(name)}</T>
    </View>
  );
}

// ── 대화상자 ───────────────────────────────────────────
/**
 * 대화상자 — 웹 RequestDialog·dialog.tsx 의 자리. 가운데 뜨는 카드, 바깥을 누르거나 닫기로 닫힌다.
 * 내용이 길면 안에서 스크롤된다. 키보드가 올라오면 위로 밀린다 (behavior padding).
 */
export function Sheet({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel="닫기" onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 16 }}>
        <Pressable onPress={() => {}} style={[styles.card, { padding: S.card, maxHeight: "85%" }]} accessibilityViewIsModal>
          <T size={16} weight="bold" accessibilityRole="header">{title}</T>
          {description && <T size={13} color={C.muted} style={{ marginTop: 4 }}>{description}</T>}
          <ScrollView style={{ marginTop: 14 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  card: { borderRadius: R.card, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: R.control },
  input: { height: 44, borderWidth: 1, borderColor: C.line, borderRadius: R.control, backgroundColor: C.surface, paddingHorizontal: 12, fontSize: 16, color: C.foreground, fontFamily: F.regular },
});
