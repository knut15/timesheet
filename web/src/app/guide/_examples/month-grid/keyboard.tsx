"use client";
import { useState } from "react";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { memberCell, TODAY } from "./demo-data";

// Tab 으로 칸에 가면 focus-visible 바깥 선이 보인다. 마우스·터치 선택에는 없다
export default function MonthGridKeyboard() {
  const [selected, setSelected] = useState<string | null>(TODAY);
  return (
    <MonthGrid
      year={2026}
      month={8}
      todayKey={TODAY}
      selectedKey={selected}
      onSelect={setSelected}
      cellHeight={56}
      cell={memberCell}
      footer={<CalendarLegend role="member" />}
    />
  );
}
