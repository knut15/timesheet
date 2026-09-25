"use client";
// 달력 범례. 표시 모양은 칸에 쓰는 것과 같은 요소, 설명은 보이는 글자. docs/design/calendar.md §3
import { Hourglass, TriangleAlert } from "lucide-react";
import { OpenDot } from "./MonthGrid";

export function CalendarLegend({ role }: { role: "member" | "master" }) {
  return (
    <div className="space-y-1 text-[11px] text-muted">
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <li className="flex items-center gap-1"><OpenDot /> 근무 중</li>
        <li className="flex items-center gap-1"><TriangleAlert size={10} aria-hidden className="text-warn" /> 퇴근 기록 없음</li>
        <li className="flex items-center gap-1"><Hourglass size={10} aria-hidden className="text-amber-700 dark:text-amber-400" /> 요청 대기</li>
        <li className="flex items-center gap-1">
          <span aria-hidden className="inline-block h-2.5 w-3 rounded-sm border border-dashed border-muted" />
          {role === "member" ? "휴가·대타" : "쉰 사람 있음"}
        </li>
      </ul>
      {role === "member" && <p>유급·무급: 휴가 · 대타: 대타로 쉰 날</p>}
    </div>
  );
}
