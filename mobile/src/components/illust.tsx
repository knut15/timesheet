// 장면 일러스트 — 웹 web/src/components/illust.tsx 의 앱판. lucide 아이콘 조합으로 뜻을 보여 준다. 사람 그림은 쓰지 않는다 (DESIGN.md §4).
// 가운데 옅은 강조색 원에 주인공 아이콘(강조색), 둘레에 작은 소품 1~2개(muted). 선 굵기 1.5.
import type { LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { C, alpha } from "@/theme";
import { rise } from "./motion";
import { T } from "./ui";

export type Accent = { icon: LucideIcon; at: "tl" | "tr" | "bl" | "br" };
const AT = { tl: { left: 0, top: 0 }, tr: { right: 0, top: 0 }, bl: { left: 0, bottom: 0 }, br: { right: 0, bottom: 0 } } as const;
const SIZE = { md: { w: 96, h: 72, disc: 64, icon: 30, accent: 16 }, sm: { w: 60, h: 56, disc: 44, icon: 22, accent: 13 } } as const;

/** 원이 6px 올라오고(0.35초) 소품이 0.08초 간격으로 톡 튀어나온다. 장식이라 스크린리더가 읽지 않는다 */
export function Scene({ icon: Icon, accents = [], size = "md" }: { icon: LucideIcon; accents?: Accent[]; size?: keyof typeof SIZE }) {
  const z = SIZE[size];
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ width: z.w, height: z.h }}>
      <Animated.View
        entering={rise(6, 350)}
        style={{ position: "absolute", left: (z.w - z.disc) / 2, top: (z.h - z.disc) / 2, width: z.disc, height: z.disc, borderRadius: z.disc / 2, borderWidth: 1, borderColor: alpha(C.accent, 0.2), backgroundColor: alpha(C.accent, 0.1), alignItems: "center", justifyContent: "center" }}
      >
        <Icon size={z.icon} strokeWidth={1.5} color={C.accent} />
      </Animated.View>
      {accents.map(({ icon: A, at }, i) => (
        <Animated.View key={i} entering={ZoomIn.springify().damping(9).delay(150 + i * 80)} style={[{ position: "absolute" }, AT[at]]}>
          <A size={z.accent} strokeWidth={1.5} color={C.muted} />
        </Animated.View>
      ))}
    </View>
  );
}

/** 빈 상태 — 장면 + 한 줄 제목 + 설명. 화면에 하나만 두고, 작은 구역의 빈 상태는 글자만 쓴다 */
export function EmptyState({ icon, accents, title, children }: { icon: LucideIcon; accents?: Accent[]; title: string; children?: React.ReactNode }) {
  return (
    <View style={{ alignItems: "center", paddingHorizontal: 16, paddingVertical: 24 }}>
      <Scene icon={icon} accents={accents} />
      <T size={14} weight="semibold" style={{ marginTop: 12, textAlign: "center" }}>{title}</T>
      {children ? (typeof children === "string" ? <T size={12} color={C.muted} style={{ marginTop: 4, textAlign: "center" }}>{children}</T> : <View style={{ marginTop: 4 }}>{children}</View>) : null}
    </View>
  );
}
