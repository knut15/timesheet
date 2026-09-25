// 근무 달력의 날짜 계산과 날짜별 집계. 화면 명세는 docs/design/calendar.md, 요구는 docs/prd/10-calendar.md
// node --test 가 이 파일을 직접 읽는다 — React·경로 별칭(@/)을 import 하지 않는다.
import type { Absence, Correction, Dashboard } from "@/api/client";
import { dayKey, parseDay, shiftMinutes, type Shift } from "./pay";

export const ABSENCE_LABEL = { paid_leave: "유급 휴가", unpaid_leave: "무급 휴가", substitution: "대타로 쉼" } as const;
/** 멤버 달력 칸(폭 약 44px)에 쓰는 줄인 말 */
export const ABSENCE_SHORT = { paid_leave: "유급", unpaid_leave: "무급", substitution: "대타" } as const;

type AbsenceKind = Absence["kind"];

/** 그 달을 덮는 월요일 시작 칸들. 줄 수만큼(28·35·42개). month 는 0~11 (useMonthCursor 와 같다) */
export function monthCells(year: number, month: number): { key: string; day: number; inMonth: boolean }[] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // 월=0 … 일=6
  const days = new Date(year, month + 1, 0).getDate();
  const count = Math.ceil((lead + days) / 7) * 7;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(year, month, 1 - lead + i);
    return { key: dayKey(d), day: d.getDate(), inMonth: d.getMonth() === month };
  });
}

/** 칸에 쓰는 줄인 시간. 0 → "", 45 → "0.8h", 240 → "4h", 270 → "4.5h", 870 → "15h" (10시간 이상은 정수) */
export function compactHours(minutes: number): string {
  if (minutes <= 0) return "";
  const h = minutes / 60;
  const v = minutes < 600 ? Math.round(h * 10) / 10 : Math.round(h);
  return `${v}h`;
}

/** 대기 중인 수정 요청이 걸린 날. 수정·삭제는 원래 기록의 출근, 추가는 요청한 출근 */
export function correctionDay(c: Pick<Correction, "current" | "start">): string | null {
  const t = c.current?.start ?? c.start;
  return t ? dayKey(Date.parse(t)) : null;
}

const openState = (s: Shift, now: number): "today" | "stale" | null =>
  s.end !== null ? null : dayKey(s.start) === dayKey(now) ? "today" : "stale";

/** 멤버: 날짜 키 → 그날 요약 */
export type MemberDay = { minutes: number; open: "today" | "stale" | null; absence: AbsenceKind | null; pending: boolean };

export function memberDays(
  shifts: Shift[],
  absences: Pick<Absence, "date" | "kind">[],
  pendingCorrections: Pick<Correction, "status" | "current" | "start">[],
  now: number,
): Map<string, MemberDay> {
  const days = new Map<string, MemberDay>();
  const at = (key: string) => {
    let d = days.get(key);
    if (!d) days.set(key, (d = { minutes: 0, open: null, absence: null, pending: false }));
    return d;
  };
  // 기록은 출근한 날 한 칸에만 붙는다 — pay.ts 가 주를 나누는 기준과 같다
  for (const s of shifts) {
    const d = at(dayKey(s.start));
    d.minutes += shiftMinutes(s, now);
    d.open = openState(s, now) ?? d.open;
  }
  for (const a of absences) at(a.date).absence = a.kind;
  for (const c of pendingCorrections) {
    const key = c.status === "pending" ? correctionDay(c) : null;
    if (key) at(key).pending = true;
  }
  return days;
}

/** 마스터: 날짜 키 → 그날 요약. people 은 첫 출근 이른 순 */
export type MasterDay = {
  people: { userId: string; nickname: string }[];
  minutes: number;
  openCount: number; // 오늘 진행 중
  staleCount: number; // 지난 날 열림
  absentCount: number;
  pendingCount: number;
};

type DashboardInput = {
  members: Pick<Dashboard["members"][number], "userId" | "nickname" | "role">[];
  shifts: Pick<Dashboard["shifts"][number], "id" | "userId" | "start" | "end">[];
  absences: Pick<Dashboard["absences"][number], "userId" | "date">[];
};

export function masterDays(
  dash: DashboardInput,
  pendingCorrections: Pick<Correction, "userId" | "status" | "current" | "start">[],
  now: number,
): Map<string, MasterDay> {
  // 마스터는 출퇴근을 찍지 않는다. 멤버만 센다 (대시보드와 같다)
  const names = new Map(dash.members.filter((m) => m.role === "member").map((m) => [m.userId, m.nickname]));
  const days = new Map<string, MasterDay & { absent: Set<string> }>();
  const at = (key: string) => {
    let d = days.get(key);
    if (!d) days.set(key, (d = { people: [], minutes: 0, openCount: 0, staleCount: 0, absentCount: 0, pendingCount: 0, absent: new Set() }));
    return d;
  };
  const shifts = dash.shifts
    .filter((s) => names.has(s.userId))
    .map((s) => ({ userId: s.userId, start: Date.parse(s.start), end: s.end ? Date.parse(s.end) : null, id: s.id }))
    .sort((a, b) => a.start - b.start);
  for (const s of shifts) {
    const d = at(dayKey(s.start));
    d.minutes += shiftMinutes(s, now);
    if (!d.people.some((p) => p.userId === s.userId)) d.people.push({ userId: s.userId, nickname: names.get(s.userId)! });
    const open = openState(s, now);
    if (open === "today") d.openCount++;
    if (open === "stale") d.staleCount++;
  }
  for (const a of dash.absences) if (names.has(a.userId)) at(a.date).absent.add(a.userId);
  for (const c of pendingCorrections) {
    const key = c.status === "pending" && names.has(c.userId) ? correctionDay(c) : null;
    if (key) at(key).pendingCount++;
  }
  const out = new Map<string, MasterDay>();
  for (const [key, { absent, ...d }] of days) out.set(key, { ...d, absentCount: absent.size });
  return out;
}

const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

/** "9월 22일 월요일" */
export function dateLabel(key: string): string {
  const d = parseDay(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}`;
}

/** ui.tsx 의 hm 과 같은 형식. 이 파일은 node 테스트가 읽으므로 React 파일(ui.tsx)을 import 하지 않는다 */
const hmText = (min: number) => `${Math.floor(min / 60)}시간${min % 60 ? ` ${min % 60}분` : ""}`;

const isMaster = (s: MemberDay | MasterDay): s is MasterDay => "people" in s;

/** 날짜 칸의 읽는 이름. 순서: 날짜 → 오늘 → 근무 → 휴가·대타 → 상태 → 요청 (명세 §7) */
export function dayAriaLabel(key: string, isToday: boolean, summary: MemberDay | MasterDay | undefined, role: "member" | "master"): string {
  const parts = [dateLabel(key)];
  if (isToday) parts.push("오늘");
  const head = parts.length;
  if (summary && role === "master" && isMaster(summary)) {
    if (summary.people.length > 0) parts.push(`${summary.people.length}명 근무 ${hmText(summary.minutes)}`);
    if (summary.absentCount > 0) parts.push(`휴가·대타 ${summary.absentCount}명`);
    if (summary.openCount > 0) parts.push(`근무 중 ${summary.openCount}명`);
    if (summary.staleCount > 0) parts.push(`퇴근 기록 없음 ${summary.staleCount}건`);
    if (summary.pendingCount > 0) parts.push(`수정 요청 대기 ${summary.pendingCount}건`);
  } else if (summary && !isMaster(summary)) {
    if (summary.minutes > 0) parts.push(`${hmText(summary.minutes)} 근무`);
    if (summary.absence) parts.push(ABSENCE_LABEL[summary.absence]);
    if (summary.open === "today") parts.push("근무 중");
    if (summary.open === "stale") parts.push("퇴근 기록 없음");
    if (summary.pending) parts.push("수정 요청 대기 중");
  }
  if (parts.length === head) parts.push(role === "master" ? "근무 없음" : "기록 없음");
  return parts.join(", ");
}
