"use client";
// 멤버 기록 탭의 달력·목록 전환. docs/design/calendar.md §2
// 모양은 2026-10-15 B 시안: 회색 바탕 세그먼트, 선택 칸만 흰 바탕 + 굵은 글자
import { CalendarDays, List } from "lucide-react";

const VIEWS = [
  { value: "calendar", label: "달력", icon: CalendarDays },
  { value: "list", label: "목록", icon: List },
] as const;

export function ViewToggle({ value, onChange }: { value: "calendar" | "list"; onChange: (v: "calendar" | "list") => void }) {
  return (
    <div role="group" aria-label="보기" className="grid grid-flow-col auto-cols-fr rounded-xl bg-line/60 p-0.5">
      {VIEWS.map(({ value: v, label, icon: Icon }) => {
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(v)}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-md text-[13px] ${on ? "bg-surface font-semibold text-foreground shadow-sm" : "font-medium text-muted hover:text-foreground"}`}
          >
            <Icon size={15} strokeWidth={on ? 2.2 : 1.8} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
