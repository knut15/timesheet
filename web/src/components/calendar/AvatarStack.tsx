"use client";
// 마스터 달력 칸의 아바타 겹침. 3명까지 다 보이고, 4명 이상이면 2명 + "+N". docs/design/calendar.md §3
import { Avatar } from "../shell";

export function AvatarStack({ people, max = 3 }: { people: { userId: string; nickname: string }[]; max?: 3 }) {
  const shown = people.length > max ? people.slice(0, max - 1) : people;
  const rest = people.length - shown.length;
  return (
    <span aria-hidden className="flex items-center">
      {shown.map((p, i) => (
        <span key={p.userId} className={`inline-flex rounded-full ring-2 ring-surface ${i > 0 ? "-ml-1.5" : ""}`}>
          <Avatar name={p.nickname} seed={p.userId} size="xs" />
        </span>
      ))}
      {rest > 0 && (
        <span className="-ml-1.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-line text-[9px] font-semibold text-foreground ring-2 ring-surface">
          +{Math.min(rest, 99)}
        </span>
      )}
    </span>
  );
}
