"use client";
import { useState } from "react";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { masterCell, TODAY } from "../month-grid/demo-data";

// Month Grid 마스터 예시와 같은 데이터. 22일·24일·25일 칸에 겹침이 들어간다
export default function AvatarStackInCalendar() {
  const [selected, setSelected] = useState<string | null>(TODAY);
  return <MonthGrid year={2026} month={8} todayKey={TODAY} selectedKey={selected} onSelect={setSelected} cellHeight={64} cell={masterCell} />;
}
