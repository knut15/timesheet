// 마스터 달력 칸의 아바타 겹침. 3명까지 다 보이고, 4명 이상이면 2명 + "+N". 웹 web/src/components/calendar/AvatarStack.tsx 의 앱판. docs/design/calendar.md §3
// 아바타가 둥근 사각형이라 겹침 테두리·"+N" 도 같은 모서리로 (2026-10-15 B 시안)
// 웹 ring-2 ring-surface 는 자리를 차지하지 않는다 — 앱은 2px 테두리를 두르고 바깥 여백 −2 로 자리를 18px 그대로 둔다
import { View } from "react-native";
import { C } from "@/theme";
import { Avatar, T } from "../ui";

const RING = { borderWidth: 2, borderColor: C.surface, borderRadius: 6, margin: -2 } as const;

export function AvatarStack({ people, max = 3 }: { people: { userId: string; nickname: string }[]; max?: 3 }) {
  const shown = people.length > max ? people.slice(0, max - 1) : people;
  const rest = people.length - shown.length;
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 2 }}>
      {shown.map((p, i) => (
        <View key={p.userId} style={[RING, i > 0 ? { marginLeft: -8 } : null]}>
          <Avatar name={p.nickname} seed={p.userId} size="xs" />
        </View>
      ))}
      {rest > 0 && (
        <View style={[RING, { marginLeft: -8 }]}>
          <View style={{ height: 18, width: 18, borderRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: C.line }}>
            <T size={9} weight="semibold" style={{ lineHeight: 11 }}>{`+${Math.min(rest, 99)}`}</T>
          </View>
        </View>
      )}
    </View>
  );
}
