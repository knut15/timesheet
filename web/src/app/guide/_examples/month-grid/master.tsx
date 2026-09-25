"use client";
import { useState } from "react";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { masterCell, TODAY } from "./demo-data";
export default function MonthGridMaster() {
  const [selected, setSelected] = useState<string | null>(TODAY);
  return (
    <MonthGrid
      year={2026}
      month={8}
      todayKey={TODAY}
      selectedKey={selected}
      onSelect={setSelected}
      cellHeight={64}
      cell={masterCell}
      footer={<CalendarLegend role="master" />}
    />
  );
}
