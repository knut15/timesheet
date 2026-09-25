"use client";
import { useState } from "react";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { memberCell, TODAY } from "./demo-data";

// 점선(휴가) 칸을 선택해도 점선은 남고, 연한 배경과 굵은 날짜가 더해진다
export default function MonthGridSelectedDashed() {
  const [selected, setSelected] = useState<string | null>("2026-09-24");
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
