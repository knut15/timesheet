"use client";
import { useState } from "react";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { dateLabel } from "@/lib/calendar";

export default function MonthGridBasic() {
  const [selected, setSelected] = useState<string | null>("2026-09-25");
  return (
    <MonthGrid
      year={2026}
      month={8}
      todayKey="2026-09-25"
      selectedKey={selected}
      onSelect={setSelected}
      cellHeight={56}
      cell={(key) => ({ label: dateLabel(key), marks: {}, body: null })}
    />
  );
}
