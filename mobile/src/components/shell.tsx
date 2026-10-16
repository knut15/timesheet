// 앱 셸 — 헤더·하단 탭·서브헤더·화면 틀. 웹 web/src/components/shell.tsx 의 앱판. 규칙은 .claude/skills/timesheet-ui/SKILL.md
import { useRouter, type Tabs } from "expo-router";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react-native";
import { Image, Pressable, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL, authHeaders } from "@/auth/session";
import { C, S, alpha } from "@/theme";
import { Avatar, T } from "./ui";

/**
 * 모든 화면의 머리. 한 줄로 "매장 / 화면 이름" — 화면 이름을 18px 굵게. 오른쪽에 동작과 내 아바타.
 * crumbs 가 있으면 화면 이름 앞에 "멤버 › 근무 기록" 처럼 상위 화면을 붙인다.
 * logoUrl 이 있으면 매장 이름 대신 매장 로고(높이 20, 가로 최대 96)를 둔다 (docs/prd/11). 로고는 인증 헤더를 실어 받는다.
 */
export function AppHeader({ eyebrow, title, me, actions, logoUrl, logoAlt = "", crumbs }: { eyebrow: string; title: string; me: { id: string; nickname: string }; actions?: React.ReactNode; logoUrl?: string | null; logoAlt?: string; crumbs?: { label: string; href: string }[] }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line }}>
      <View style={{ height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: S.page }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1, minWidth: 0 }}>
          {logoUrl && <Image accessibilityLabel={logoAlt} source={{ uri: API_URL + logoUrl, headers: authHeaders() }} style={{ height: 20, width: 96, maxWidth: 96 }} resizeMode="contain" />}
          {!!eyebrow && <T size={15} weight="medium" color={C.muted} numberOfLines={1} style={{ flexShrink: 1 }}>{eyebrow}</T>}
          {(!!logoUrl || !!eyebrow) && <T size={15} color={alpha(C.muted, 0.5)}>/</T>}
          {crumbs?.map((c) => (
            <Pressable key={c.href} accessibilityRole="link" onPress={() => router.navigate(c.href as never)} style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <T size={15} weight="medium" color={C.muted}>{c.label}</T>
              <ChevronRight size={15} color={C.muted} />
            </Pressable>
          ))}
          <T size={18} weight="bold" accessibilityRole="header" numberOfLines={1} style={{ letterSpacing: -0.3, flexShrink: 1 }}>{title}</T>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          {actions}
          <Avatar name={me.nickname} seed={me.id} size="sm" label={`${me.nickname} (나)`} />
        </View>
      </View>
    </View>
  );
}

/** 하위 화면의 서브헤더 — 헤더 아래 띠에 뒤로 가기. 본문과 확실히 나뉜다 (2026-09-25 사용자 요청) */
export function SubHeader({ backLabel, onBack }: { backLabel: string; onBack: () => void }) {
  return (
    <View style={{ backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line, paddingHorizontal: 12, paddingVertical: 6 }}>
      <Pressable accessibilityRole="button" onPress={onBack} hitSlop={6} style={({ pressed }) => [{ height: 32, flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 8, borderRadius: 8, alignSelf: "flex-start" }, pressed ? { backgroundColor: alpha(C.line, 0.6) } : null]}>
        <ChevronLeft size={14} color={C.muted} />
        <T size={12} weight="medium" color={C.muted}>{backLabel}</T>
      </Pressable>
    </View>
  );
}

/** 화면 본문 — 세로 스크롤, 가로 여백 20, 카드 사이 12. onRefresh 를 주면 끌어내려 새로 고침 */
export function Screen({ children, onRefresh, refreshing = false, style }: { children: React.ReactNode; onRefresh?: () => void; refreshing?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={[{ paddingHorizontal: S.page, paddingTop: 16, paddingBottom: 32, gap: S.gap }, style]}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.muted} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

// expo-router 가 하단 탭 그리기 함수에 넘기는 값 (react-navigation 의 BottomTabBarProps)
type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

export type TabMeta = { label: string; icon: LucideIcon; badge?: number };

/**
 * 하단 탭 — 아이콘 위, 이름 아래. 활성 항목은 바탕 칩 + 진한 글자 (웹 BottomNav 와 같은 모양). 홈 바만큼 아래 여백.
 * 배지는 처리할 것의 수 — 9 넘으면 "9+".
 */
export function TabBar({ state, navigation, meta }: BottomTabBarProps & { meta: Record<string, TabMeta> }) {
  const insets = useSafeAreaInsets();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.line, paddingBottom: insets.bottom }}>
      {state.routes.map((route, i) => {
        const m = meta[route.name];
        if (!m) return null;
        const on = state.index === i;
        const Icon = m.icon;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${m.label}${m.badge ? ` (처리할 것 ${m.badge}건)` : ""}`}
            onPress={() => {
              const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!on && !e.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            style={({ pressed }) => [{ flex: 1, height: 64, alignItems: "center", justifyContent: "center", gap: 4 }, pressed ? { transform: [{ scale: 0.97 }] } : null]}
          >
            {on && <View style={{ position: "absolute", left: 4, right: 4, top: 6, bottom: 6, borderRadius: 6, backgroundColor: C.background }} />}
            <View>
              <Icon size={20} strokeWidth={on ? 2.2 : 1.8} color={on ? C.foreground : C.muted} />
              {!!m.badge && (
                <View style={{ position: "absolute", right: -10, top: -6, minWidth: 16, borderRadius: 4, backgroundColor: C.warn, paddingHorizontal: 4 }}>
                  <T size={10} weight="bold" color={C.background} style={{ textAlign: "center", lineHeight: 16 }}>{m.badge > 9 ? "9+" : String(m.badge)}</T>
                </View>
              )}
            </View>
            <T size={11} weight={on ? "semibold" : "medium"} color={on ? C.foreground : C.muted}>{m.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}
