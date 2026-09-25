"use client";
import { useState } from "react";
import { MonthPicker } from "@/components/ui";

// 시작은 2026년 9월로 고정한다. 화면에서는 useMonthCursor() 로 오늘이 든 달부터 시작한다
export default function MonthPickerBasic() {
  const [cursor, setCursor] = useState({ year: 2026, month: 8 });
  return <MonthPicker cursor={cursor} onChange={setCursor} />;
}
