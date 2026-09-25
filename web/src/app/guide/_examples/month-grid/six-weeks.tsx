"use client";
import { useState } from "react";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { dateLabel } from "@/lib/calendar";

// 2026년 11월은 6줄이다. 오늘(9월 25일)은 이 달 밖이라 오늘 표시가 없다
export default function MonthGridSixWeeks() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <MonthGrid
      year={2026}
      month={10}
      todayKey="2026-09-25"
      selectedKey={selected}
      onSelect={setSelected}
      cellHeight={56}
      cell={(key) => ({ label: dateLabel(key), marks: {}, body: null })}
    />
  );
}
