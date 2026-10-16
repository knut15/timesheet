// 월 격자 — 월요일 시작, 날짜 칸은 버튼. 멤버·마스터 달력이 같이 쓴다. 웹 web/src/components/calendar/MonthGrid.tsx 의 앱판.
// props 이름·모양은 웹과 같다. docs/design/calendar.md §3·§7
// 모양은 2026-10-15 B 시안: 작은 모서리 칸, 기록 있는 날 옅은 바탕, 오늘은 강조색 굵은 테두리, 선택은 진한 바탕 + 굵은 날짜
import { Children, Fragment, cloneElement, isValidElement } from "react";
import { Hourglass, TriangleAlert } from "lucide-react-native";
import { Pressable, View, useWindowDimensions } from "react-native";
import { monthCells } from "@shared/calendar";
import { C, R, S, alpha } from "@/theme";
import { Bone, Card, T } from "../ui";

export type Marks = { open?: "today" | "stale"; pending?: boolean; dashed?: boolean };

const WEEK = ["월", "화", "수", "목", "금", "토", "일"];
const HEIGHT = { 56: 52, 64: 60 } as const; // 칸 높이에서 칸 사이 간격을 뺀 버튼 높이
const GAP = 3; // 칸 사이
const PAD = 10; // 격자 카드 안쪽 여백 (웹 p-2.5)

/**
 * 칸 내용(body)에 그려진 것이 있는지 — 웹은 CSS `:has([data-body]>*)` 로 본다.
 * 앱은 요소 나무를 따라가며 false·null·빈 Fragment 를 뺀다.
 */
function hasContent(node: React.ReactNode): boolean {
  return Children.toArray(node).some((c) => (isValidElement(c) && c.type === Fragment ? hasContent((c.props as { children?: React.ReactNode }).children) : true));
}

/**
 * 선택된 칸(진한 바탕) 안의 글자를 바탕색으로 뒤집는다 — 웹 SELECTED_BODY(`[&_.text-foreground]:text-background [&_.text-muted]:text-background/75`).
 * 칸 내용은 부르는 쪽이 그리므로, 요소의 color prop 이 foreground·muted 이면(T 의 기본값 foreground 포함) 바꿔 그린다.
 * 부르는 쪽이 만든 컴포넌트 안쪽까지는 들어가지 않는다 — 웹도 그 컴포넌트가 해당 클래스를 쓸 때만 바뀐다.
 */
function invert(node: React.ReactNode): React.ReactNode {
  return Children.map(node, (c) => {
    if (!isValidElement(c)) return c;
    const props = c.props as { color?: string; children?: React.ReactNode };
    const next: { color?: string; children?: React.ReactNode } = {};
    const color = props.color ?? (c.type === T ? C.foreground : undefined);
    if (color === C.foreground) next.color = C.background;
    else if (color === C.muted) next.color = alpha(C.background, 0.75);
    if (props.children !== undefined && typeof props.children !== "string" && typeof props.children !== "number") next.children = invert(props.children);
    return cloneElement(c, next);
  });
}

export function MonthGrid({ year, month, todayKey, selectedKey, onSelect, busy = false, cellHeight, cell, footer }: {
  year: number;
  month: number;
  todayKey: string;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  busy?: boolean; // 칸 내용·표시 대신 막대
  cellHeight: 56 | 64; // 멤버 56, 마스터 64
  cell: (key: string) => { label: string; marks: Marks; body: React.ReactNode }; // body = 2·3줄
  footer?: React.ReactNode; // 범례·빈 달 문구
}) {
  // 칸 폭 = (화면폭 − 본문 여백 20×2 − 카드 테두리 1×2 − 카드 안쪽 10×2 − 칸 사이 3×6) ÷ 7. 375pt 에서 약 42.1
  const { width } = useWindowDimensions();
  const cellW = Math.floor(((width - S.page * 2 - 2 - PAD * 2 - GAP * 6) / 7) * 10) / 10;
  const h = HEIGHT[cellHeight];
  const cells = monthCells(year, month);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  return (
    <Card style={{ padding: PAD }}>
      <View accessibilityLabel={`${year}년 ${month + 1}월 달력`} accessibilityState={{ busy }}>
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ flexDirection: "row", gap: GAP }}>
          {WEEK.map((w) => (
            <View key={w} style={{ width: cellW, height: 24, alignItems: "center", justifyContent: "center" }}>
              <T size={11} weight="semibold" color={C.muted}>{w}</T>
            </View>
          ))}
        </View>
        <View style={{ gap: GAP }}>
          {weeks.map((row) => (
            <View key={row[0]!.key} style={{ flexDirection: "row", gap: GAP }}>
              {row.map((c) => {
                if (!c.inMonth)
                  return (
                    <View key={c.key} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ width: cellW, height: h, padding: 4, opacity: 0.4 }}>
                      <T size={11} weight="semibold" mono color={C.muted} style={{ lineHeight: 11 }}>{String(c.day)}</T>
                    </View>
                  );
                const { label, marks, body } = cell(c.key);
                const today = c.key === todayKey;
                const selected = c.key === selectedKey;
                const shown: Marks = busy ? {} : marks;
                const edge = shown.dashed ? C.muted : today ? C.accent : selected ? C.foreground : C.line;
                // 불러오는 동안은 칸 내용이 막대라 "기록 있는 날" 바탕을 칠하지 않는다
                const fill = selected ? C.foreground : !busy && hasContent(body) ? C.background : C.surface;
                const markColor = (c: string) => (selected ? C.background : c);
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => onSelect(c.key)}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected, busy }}
                    style={{ width: cellW, height: h, borderRadius: R.pill, borderWidth: 1, borderStyle: shown.dashed ? "dashed" : "solid", borderColor: edge, backgroundColor: fill, overflow: "hidden" }}
                  >
                    {/* 오늘 — 1px 테두리 안쪽에 1px 고리를 더해 굵게 (웹 ring-1 ring-inset ring-accent) */}
                    {today && <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: C.accent, borderRadius: R.pill - 1 }} />}
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 4, paddingTop: 4 }}>
                      <T size={11} mono weight={selected || today ? "bold" : "semibold"} color={selected ? C.background : today ? C.accent : C.foreground} style={{ lineHeight: 11 }}>
                        {String(c.day)}
                      </T>
                      {/* 선택된 칸에서는 표시를 바탕색으로 — 모양(점·삼각형·모래시계)이 뜻을 담는다 */}
                      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                        {shown.open === "today" && (selected ? <View style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: C.background }} /> : <OpenDot />)}
                        {shown.open === "stale" && <TriangleAlert size={10} color={markColor(C.warn)} />}
                        {shown.pending && <Hourglass size={10} color={markColor(C.caution)} />}
                      </View>
                    </View>
                    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ flex: 1, minWidth: 0, alignItems: "flex-end", justifyContent: "flex-end", overflow: "hidden", paddingHorizontal: 4, paddingBottom: 4 }}>
                      {busy ? <Bone style={{ height: 10, width: 24, borderRadius: R.pill }} /> : selected ? invert(body) : body}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
      {footer && <View style={{ marginTop: 10, paddingHorizontal: 2 }}>{footer}</View>}
    </Card>
  );
}

/** 근무 중 표시. 칸·범례·상세가 같은 모양을 쓴다 */
export function OpenDot() {
  return <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: C.ok }} />;
}
