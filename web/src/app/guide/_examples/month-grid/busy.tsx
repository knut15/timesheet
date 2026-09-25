"use client";
import { useState } from "react";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { memberCell, TODAY } from "./demo-data";

// busy 면 칸 내용·표시를 숨기고 aria-busy 를 켠다
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
      footer={<p className="text-[11px] text-muted">불러오는 중…</p>}
    />
  );
}
