"use client";
// 월 격자 — 월요일 시작, 날짜 칸은 버튼. 멤버·마스터 달력이 같이 쓴다. docs/design/calendar.md §3·§7
// 모양은 2026-10-15 B 시안: 작은 모서리 칸, 기록 있는 날 옅은 바탕, 오늘은 강조색 굵은 테두리, 선택은 진한 바탕 + 굵은 날짜
import { Hourglass, TriangleAlert } from "lucide-react";
import { monthCells } from "@/lib/calendar";
import { Bone, Card, NUM } from "../ui";

export type Marks = { open?: "today" | "stale"; pending?: boolean; dashed?: boolean };

const WEEK = ["월", "화", "수", "목", "금", "토", "일"];
const HEIGHT = { 56: "h-[52px]", 64: "h-[60px]" } as const; // 칸 높이에서 칸 사이 간격을 뺀 버튼 높이

// 선택된 칸(진한 바탕) 안의 글자는 바탕색으로 뒤집는다 — 칸 내용(body)은 부르는 쪽이 그리므로 여기서 덮는다
const SELECTED_BODY = "[&_.text-foreground]:text-background [&_.text-muted]:text-background/75";
// 기록 있는 날 = 칸 내용(data-body)에 그려진 것이 있는 날. 내용 글자(시간·쉼)가 같이 보이므로 색만으로 구별하지 않는다
const HAS_RECORD = "[&:has([data-body]>*)]:bg-background";

export function MonthGrid({ year, month, todayKey, selectedKey, onSelect, busy = false, cellHeight, cell, footer }: {
  year: number;
  month: number;
  todayKey: string;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  busy?: boolean; // aria-busy, 칸 내용·표시 대신 막대
  cellHeight: 56 | 64; // 멤버 56, 마스터 64
  cell: (key: string) => { label: string; marks: Marks; body: React.ReactNode }; // body = 2·3줄
  footer?: React.ReactNode; // 범례·빈 달 문구
}) {
  return (
    <Card className="p-2.5">
      <div role="group" aria-label={`${year}년 ${month + 1}월 달력`} aria-busy={busy}>
        {busy && <span className="sr-only" role="status">불러오는 중</span>}
        <div aria-hidden className="grid grid-cols-7 gap-[3px]">
          {WEEK.map((w) => (
            <span key={w} className="flex h-6 items-center justify-center text-[11px] font-semibold text-muted">{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[3px]">
          {monthCells(year, month).map((c) => {
            if (!c.inMonth)
              return (
                <div key={c.key} aria-hidden className={`${HEIGHT[cellHeight]} p-1 text-[11px] font-semibold text-muted opacity-40 ${NUM}`}>
                  {c.day}
                </div>
              );
            const { label, marks, body } = cell(c.key);
            const today = c.key === todayKey;
            const selected = c.key === selectedKey;
            const shown = busy ? {} : marks;
            const edge = shown.dashed ? "border-dashed border-muted" : today ? "border-accent" : selected ? "border-foreground" : "border-line";
            // 불러오는 동안은 칸 내용이 막대라 "기록 있는 날" 바탕을 칠하지 않는다
            const fill = selected ? `bg-foreground text-background ${SELECTED_BODY}` : `bg-surface ${busy ? "" : HAS_RECORD}`;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelect(c.key)}
                aria-label={label}
                aria-pressed={selected}
                aria-current={today ? "date" : undefined}
                className={`relative flex min-w-0 flex-col rounded-md border text-left ${HEIGHT[cellHeight]} ${edge} ${fill} ${today ? "ring-1 ring-inset ring-accent" : ""} focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent`}
              >
                <span className="flex items-start justify-between px-1 pt-1">
                  <span className={`text-[11px] leading-none ${NUM} ${selected ? "font-bold" : today ? "font-bold text-accent" : "font-semibold"}`}>{c.day}</span>
                  {/* 선택된 칸에서는 표시를 바탕색으로 — 모양(점·삼각형·모래시계)이 뜻을 담는다 */}
                  <span aria-hidden className="flex items-center gap-0.5">
                    {shown.open === "today" && (selected ? <span className="inline-block h-1.5 w-1.5 rounded-full bg-background" /> : <OpenDot />)}
                    {shown.open === "stale" && <TriangleAlert size={10} className={selected ? "" : "text-warn"} />}
                    {shown.pending && <Hourglass size={10} className={selected ? "" : "text-caution"} />}
                  </span>
                </span>
                <span data-body aria-hidden className="flex min-w-0 flex-1 flex-col items-end justify-end overflow-hidden px-1 pb-1">
                  {busy ? <Bone className="h-2.5 w-6" /> : body}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {footer && <div className="mt-2.5 px-0.5">{footer}</div>}
    </Card>
  );
}

/** 근무 중 표시. 칸·범례·상세가 같은 모양을 쓴다 */
export function OpenDot() {
  return <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-ok" />;
}
