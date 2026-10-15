// 멤버 출퇴근 탭의 지금 상태. 급여 계산이 아니라 상태 판정이다. docs/design/member-today.md §2-3, §5-1
import { dayKey, type Absence, type Shift } from "./pay";

export type TodayState =
  | { kind: "before" }
  | { kind: "working"; open: Shift }
  | { kind: "done"; lastEnd: number }
  | { kind: "off"; absence: Absence["kind"] };

// 같은 날 absence 가 여러 건이면 유급 휴가 > 무급 휴가 > 대타 (computeWeek 의 "유급이 우선한다" 와 같은 방향)
const RANK: Record<Absence["kind"], number> = { paid_leave: 0, unpaid_leave: 1, substitution: 2 };

/** 순서: 열린 기록 → 오늘 기록 → 오늘 absence → 출근 전. 기록이 있으면 absence 가 있어도 근무로 센다 (PRD 09 L-4). */
export function todayState(shifts: Shift[], absences: Absence[], now: number): TodayState {
  // 어제 출근해 아직 퇴근 안 한 기록(자정 넘김·퇴근 누락)도 근무 중이다
  const open = shifts.find((s) => s.end === null);
  if (open) return { kind: "working", open };
  const today = dayKey(now);
  const todays = shifts.filter((s) => dayKey(s.start) === today);
  if (todays.length > 0) return { kind: "done", lastEnd: Math.max(...todays.map((s) => s.end!)) };
  const off = absences.filter((a) => a.date === today).sort((a, b) => RANK[a.kind] - RANK[b.kind])[0];
  if (off) return { kind: "off", absence: off.kind };
  return { kind: "before" };
}

/** 오늘 출근한 기록, 출근 순. 대시보드 "오늘" 목록 (§3-1) */
export function todayShifts(shifts: Shift[], now: number): Shift[] {
  const today = dayKey(now);
  return shifts.filter((s) => dayKey(s.start) === today).sort((a, b) => a.start - b.start);
}

/** 분 단위로 자른 시각 — 경과·합계를 한 기준으로 계산해 1분 어긋나지 않게 (§2-3) */
export const toMinute = (t: number) => Math.floor(t / 60_000) * 60_000;
