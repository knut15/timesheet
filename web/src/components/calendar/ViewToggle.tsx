"use client";
// 멤버 기록 탭의 달력·목록 전환. docs/design/calendar.md §2
import { CalendarDays, List } from "lucide-react";

const VIEWS = [
  { value: "calendar", label: "달력", icon: CalendarDays },
  { value: "list", label: "목록", icon: List },
] as const;

export function ViewToggle({ value, onChange }: { value: "calendar" | "list"; onChange: (v: "calendar" | "list") => void }) {
  return (
    <div role="group" aria-label="보기" className="flex rounded-xl border border-line bg-background p-1">
      {VIEWS.map(({ value: v, label, icon: Icon }) => {
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(v)}
            className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium ${on ? "bg-surface text-foreground shadow-sm" : "text-muted"}`}
          >
            <Icon size={16} strokeWidth={on ? 2.4 : 2} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
