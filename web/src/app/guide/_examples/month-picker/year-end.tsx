"use client";
import { useState } from "react";
import { MonthPicker } from "@/components/ui";

// 2026년 12월에서 다음 달을 누르면 2027년 1월
export default function MonthPickerYearEnd() {
  const [cursor, setCursor] = useState({ year: 2026, month: 11 });
  return <MonthPicker cursor={cursor} onChange={setCursor} />;
}
