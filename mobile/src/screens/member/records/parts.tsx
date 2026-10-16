// 기록·요청·급여 탭이 같이 쓰는 작은 부품. 공통 ui.tsx 에 없는 것만 여기 둔다.
import { Children } from "react";
import type { LucideIcon } from "lucide-react-native";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { C, R } from "@/theme";
import { Bone, T } from "@/components/ui";

/** 점선 가로줄 — 웹 divide-dashed divide-line. iOS 는 한쪽 테두리만 점선으로 그리지 못해 사방 점선 상자의 윗변만 잘라 보인다 */
export function DashedRule() {
  return (
    <View style={{ height: 1, overflow: "hidden" }}>
      <View style={{ height: 3, borderWidth: 1, borderStyle: "dashed", borderColor: C.line }} />
    </View>
  );
}

/** 줄 사이에 점선을 둔 목록 (웹 `divide-y divide-dashed divide-line`) */
export function DashedList({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = Children.toArray(children);
  return (
    <View style={style}>
      {items.map((c, i) => (
        <View key={(c as { key?: string }).key ?? i}>
          {i > 0 && <DashedRule />}
          {c}
        </View>
      ))}
    </View>
  );
}

/** 글자 줄 안의 막대 — 줄 높이(글자 크기 × 1.45)는 그대로, 가운데에 막대 (웹 `inline-block align-middle`) */
export function LineBone({ font, h, w }: { font: number; h: number; w: number }) {
  return (
    <View style={{ height: Math.round(font * 1.45), justifyContent: "center" }}>
      <Bone style={{ height: h, width: w, borderRadius: R.pill }} />
    </View>
  );
}

/** SectionLabel 과 같은 틀에 글자 대신 막대 — SectionLabel 의 글자 자리는 Text 라 막대(View)를 넣지 않는다 */
export function SectionLabelBone({ icon: Icon, w, right }: { icon: LucideIcon; w: number; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon size={15} strokeWidth={1.75} color={C.muted} />
        <LineBone font={12} h={12} w={w} />
      </View>
      {right}
    </View>
  );
}

/** 숫자 글자 (웹 NUM) */
export function Num({ children, size = 13, weight = "regular", color = C.foreground }: { children: React.ReactNode; size?: number; weight?: "regular" | "medium" | "semibold" | "bold"; color?: string }) {
  return <T size={size} weight={weight} color={color} mono>{children}</T>;
}

// ── 날짜·시각 입력 ─────────────────────────────────────
// 웹의 <input type="datetime-local">·<input type="date"> 자리. 앱은 날짜 고르기 라이브러리가 없어 글자로 받는다.
// 형식이 맞고 실제 있는 날짜·시각일 때만 값을 낸다 (2026-02-30, 25:00 은 거절).

/** "YYYY-MM-DD HH:mm" (기기 시간대) → 밀리초. 형식이 틀리면 null */
export function parseLocalDateTime(text: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(text.trim());
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number) as [number, number, number, number, number];
  const t = new Date(y, mo - 1, d, h, mi);
  return t.getFullYear() === y && t.getMonth() === mo - 1 && t.getDate() === d && t.getHours() === h && t.getMinutes() === mi ? t.getTime() : null;
}

/** "YYYY-MM-DD" 가 실제 있는 날짜인지 */
export function isDay(text: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!m) return false;
  const [y, mo, d] = m.slice(1).map(Number) as [number, number, number];
  const t = new Date(y, mo - 1, d);
  return t.getFullYear() === y && t.getMonth() === mo - 1 && t.getDate() === d;
}
