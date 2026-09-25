"use client";
import { useState } from "react";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { memberCell, TODAY } from "./demo-data";

// busy 면 칸 내용·표시 대신 막대, aria-busy. 범례는 데이터와 무관해 그대로 둔다
export default function MonthGridBusy() {
  const [selected, setSelected] = useState<string | null>(TODAY);
  return (
    <MonthGrid
      year={2026}
      month={8}
      todayKey={TODAY}
      selectedKey={selected}
      onSelect={setSelected}
      busy
      cellHeight={56}
      cell={memberCell}
      footer={<CalendarLegend role="member" />}
    />
  );
}
