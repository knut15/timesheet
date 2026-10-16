// 멤버 기록 탭의 달력·목록 전환. 웹 web/src/components/calendar/ViewToggle.tsx 의 앱판. docs/design/calendar.md §2
// 모양은 2026-10-15 B 시안: 회색 바탕 세그먼트, 선택 칸만 흰 바탕 + 굵은 글자
import { CalendarDays, List } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { C, R, alpha } from "@/theme";
import { T } from "../ui";

const VIEWS = [
  { value: "calendar", label: "달력", icon: CalendarDays },
  { value: "list", label: "목록", icon: List },
] as const;

export function ViewToggle({ value, onChange }: { value: "calendar" | "list"; onChange: (v: "calendar" | "list") => void }) {
  return (
    <View accessibilityLabel="보기" style={{ flexDirection: "row", borderRadius: R.control, backgroundColor: alpha(C.line, 0.6), padding: 2 }}>
      {VIEWS.map(({ value: v, label, icon: Icon }) => {
        const on = v === value;
        return (
          <Pressable
            key={v}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(v)}
            style={[
              { flex: 1, height: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: R.pill },
              on ? { backgroundColor: C.surface, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 } : null,
            ]}
          >
            <Icon size={15} strokeWidth={on ? 2.2 : 1.8} color={on ? C.foreground : C.muted} />
            <T size={13} weight={on ? "semibold" : "medium"} color={on ? C.foreground : C.muted}>{label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}
