// Month Grid 예시들이 같이 쓰는 가짜 데이터. 2026년 9월, 오늘은 9월 25일(금)로 고정한다.
// 칸 내용·marks·읽는 이름은 실제 화면(member/RecordsPanel.tsx, admin/calendar/page.tsx)과 같은 방식으로 만든다.
import { AvatarStack } from "@/components/calendar/AvatarStack";
import type { Marks } from "@/components/calendar/MonthGrid";
import { ABSENCE_SHORT, compactHours, dayAriaLabel, type MasterDay, type MemberDay } from "@/lib/calendar";

export const TODAY = "2026-09-25";

type Cell = { label: string; marks: Marks; body: React.ReactNode };

const MEMBER: Record<string, MemberDay> = {
  "2026-09-22": { minutes: 270, open: null, absence: null, pending: false },
  "2026-09-23": { minutes: 540, open: "stale", absence: null, pending: true },
  "2026-09-24": { minutes: 0, open: null, absence: "paid_leave", pending: false },
  "2026-09-25": { minutes: 130, open: "today", absence: null, pending: false },
  "2026-09-26": { minutes: 0, open: null, absence: "substitution", pending: false },
};

export function memberCell(key: string): Cell {
  const d = MEMBER[key];
  return {
    label: dayAriaLabel(key, key === TODAY, d, "member"),
    marks: { open: d?.open ?? undefined, pending: d?.pending, dashed: !!d?.absence },
    body: (
      <>
        {!!d?.minutes && <span className="text-[11px] font-semibold tabular-nums text-foreground">{compactHours(d.minutes)}</span>}
        {d?.absence && <span className="text-[10px] text-muted">{ABSENCE_SHORT[d.absence]}</span>}
      </>
    ),
  };
}

const kim = { userId: "user-demo-01", nickname: "김하늘" };
const lee = { userId: "user-demo-05", nickname: "이서준" };
const park = { userId: "user-demo-06", nickname: "박도윤" };
const choi = { userId: "user-demo-04", nickname: "최유나" };
const alex = { userId: "user-demo-08", nickname: "Alex Kim" };
const mia = { userId: "user-demo-02", nickname: "Mia" };
const none = { openCount: 0, staleCount: 0, absentCount: 0, pendingCount: 0 };

const MASTER: Record<string, MasterDay> = {
  "2026-09-22": { ...none, people: [kim, lee, park], minutes: 870, absentCount: 1, pendingCount: 1 },
  "2026-09-24": { ...none, people: [kim, lee, park, choi, alex], minutes: 900 },
  "2026-09-25": { ...none, people: [kim, mia], minutes: 240, openCount: 1 },
  "2026-09-27": { ...none, people: [], minutes: 0, absentCount: 1 },
};

export function masterCell(key: string): Cell {
  const d = MASTER[key];
  return {
    label: dayAriaLabel(key, key === TODAY, d, "master"),
    marks: {
      open: d?.openCount ? "today" : d?.staleCount ? "stale" : undefined,
      pending: !!d?.pendingCount,
      dashed: !!d?.absentCount,
    },
    body: d && (
      <span className="flex flex-col items-center gap-0.5">
        {d.people.length > 0 ? <AvatarStack people={d.people} /> : d.absentCount > 0 && <span className="text-[10px] text-muted">쉼 {d.absentCount}</span>}
        {d.minutes > 0 && <span className="text-[11px] font-semibold tabular-nums text-foreground">{compactHours(d.minutes)}</span>}
      </span>
    ),
  };
}
