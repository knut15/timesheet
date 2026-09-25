"use client";
// 달력의 선택된 날짜. 이번 달이면 오늘, 다른 달로 넘기면 없음, 이번 달로 돌아오면 다시 오늘. docs/design/calendar.md §2
import { useState } from "react";

export function useSelectedDay(year: number, month: number, todayKey: string) {
  const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
  const [picked, setPicked] = useState<string | null>(null);
  const [shownYm, setShownYm] = useState(ym);
  // 달이 바뀌면 고른 날을 비운다 — effect 대신 렌더 중에 맞춘다(React 문서의 "prop 이 바뀔 때 state 조정")
  if (shownYm !== ym) {
    setShownYm(ym);
    setPicked(null);
  }
  const selected = (shownYm === ym ? picked : null) ?? (todayKey.startsWith(ym) ? todayKey : null);
  return [selected, setPicked] as const;
}
