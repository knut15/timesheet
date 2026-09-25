"use client";
// 월 격자 — 월요일 시작, 날짜 칸은 버튼. 멤버·마스터 달력이 같이 쓴다. docs/design/calendar.md §3·§7
import { Hourglass, TriangleAlert } from "lucide-react";
import { monthCells } from "@/lib/calendar";
import { Card } from "../ui";

export type Marks = { open?: "today" | "stale"; pending?: boolean; dashed?: boolean };

const WEEK = ["월", "화", "수", "목", "금", "토", "일"];
const HEIGHT = { 56: "h-[52px]", 64: "h-[60px]" } as const; // 칸 높이에서 m-0.5 위아래 4px 를 뺀 버튼 높이

export function MonthGrid({ year, month, todayKey, selectedKey, onSelect, busy = false, cellHeight, cell, footer }: {
  year: number;
  month: number;
  todayKey: string;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  busy?: boolean; // aria-busy, 칸 내용 숨김
  cellHeight: 56 | 64; // 멤버 56, 마스터 64
  cell: (key: string) => { label: string; marks: Marks; body: React.ReactNode }; // body = 2·3줄
  footer?: React.ReactNode; // 범례·빈 달 문구
}) {
  return (
    <Card className="px-2 py-3">
      <div role="group" aria-label={`${year}년 ${month + 1}월 달력`} aria-busy={busy}>
        <div aria-hidden className="grid grid-cols-7">
          {WEEK.map((w) => (
            <span key={w} className="flex h-6 items-center justify-center text-[11px] text-muted">{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthCells(year, month).map((c) => {
            if (!c.inMonth)
              return (
                <div key={c.key} aria-hidden className={`m-0.5 ${HEIGHT[cellHeight]} px-0.5 pt-0.5 text-xs tabular-nums text-muted opacity-40`}>
                  <span className="inline-flex h-5 w-5 items-center justify-center">{c.day}</span>
                </div>
              );
            const { label, marks, body } = cell(c.key);
            const today = c.key === todayKey;
            const selected = c.key === selectedKey;
            const shown = busy ? {} : marks;
            // 선택(실선 2px)이 점선보다 우선한다
            const border = selected ? "border-2 border-accent bg-accent/10" : shown.dashed ? "border border-dashed border-muted" : "border border-transparent";
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelect(c.key)}
                aria-label={label}
                aria-pressed={selected}
                aria-current={today ? "date" : undefined}
                className={`relative m-0.5 flex min-w-0 flex-col rounded-lg text-left ${HEIGHT[cellHeight]} ${border} focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent`}
              >
                <span className="flex items-start justify-between px-0.5 pt-0.5">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs tabular-nums ${today ? "font-bold text-accent ring-[1.5px] ring-accent" : "font-medium"}`}>{c.day}</span>
                  <span aria-hidden className="flex items-center gap-0.5 pt-1">
                    {shown.open === "today" && <OpenDot />}
                    {shown.open === "stale" && <TriangleAlert size={10} className="text-warn" />}
                    {shown.pending && <Hourglass size={10} className="text-amber-700 dark:text-amber-400" />}
                  </span>
                </span>
                <span aria-hidden className="flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden">
                  {!busy && body}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {footer && <div className="mt-2 px-1">{footer}</div>}
    </Card>
  );
}

/** 근무 중 표시. 칸·범례·상세가 같은 모양을 쓴다 */
export function OpenDot() {
  return <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400" />;
}
