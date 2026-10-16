// 달력 범례. 표시 모양은 칸에 쓰는 것과 같은 요소, 설명은 보이는 글자. 웹 web/src/components/calendar/CalendarLegend.tsx 의 앱판. docs/design/calendar.md §3
import { Hourglass, TriangleAlert } from "lucide-react-native";
import { View } from "react-native";
import { C } from "@/theme";
import { T } from "../ui";
import { OpenDot } from "./MonthGrid";

function Item({ mark, children }: { mark: React.ReactNode; children: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      {mark}
      <T size={11} color={C.muted}>{children}</T>
    </View>
  );
}

export function CalendarLegend({ role }: { role: "member" | "master" }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 12, rowGap: 6 }}>
        <Item mark={<OpenDot />}>근무 중</Item>
        <Item mark={<TriangleAlert size={12} color={C.warn} />}>퇴근 기록 없음</Item>
        <Item mark={<Hourglass size={12} color={C.caution} />}>요청 대기</Item>
        <Item mark={<View style={{ height: 10, width: 12, borderRadius: 2, borderWidth: 1, borderStyle: "dashed", borderColor: C.muted }} />}>
          {role === "member" ? "휴가·대타" : "쉰 사람 있음"}
        </Item>
      </View>
      {role === "member" && <T size={11} color={C.muted}>유급·무급: 휴가 · 대타: 대타로 쉰 날</T>}
    </View>
  );
}
