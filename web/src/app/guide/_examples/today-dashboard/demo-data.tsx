// Clock Card·Today Dashboard 예시들이 같이 쓰는 가짜 데이터. 2026년 9월 25일(금) 14:32:07 로 고정한다.
// 값은 docs/design/member-today.md §5-5 그대로다. 숫자(합계·급여)는 컴포넌트가 lib/pay.ts 로 계산한다.
import type { MyRequests } from "@/api/client";
import type { Absence, PaySettings, Shift } from "@/lib/pay";
import { toMinute } from "@/lib/today";

export const at = (d: number, h: number, m = 0, s = 0) => new Date(2026, 8, d, h, m, s).getTime(); // 2026년 9월 d일
export const now = at(25, 14, 32, 7); // 시계용 1초 단위 시각
export const minuteNow = toMinute(now); // 경과·합계용 분 단위 시각 (14:32)
// 시급은 lib/pay.ts MINIMUM_WAGE(2026) 와 같은 값. 바뀌면 여기도 고친다
export const settings: PaySettings = { hourlyWage: 10320, weeklyHours: 20, workDaysPerWeek: 5, fivePlus: false };

// 월 22일·화 23일 근무, 목 24일 대타로 쉼, 금 25일(오늘) 두 번 나눠 근무 — 두 번째는 퇴근 전
export const s1: Shift = { id: "s1", start: at(22, 10), end: at(22, 15) };
export const s2: Shift = { id: "s2", start: at(23, 10), end: at(23, 14, 30) };
export const s3: Shift = { id: "s3", start: at(25, 9, 2), end: at(25, 12, 30) };
export const s4: Shift = { id: "s4", start: at(25, 13, 30), end: null };
export const DEMO_SHIFTS: Shift[] = [s1, s2, s3, s4];

export const DEMO_ABSENCES: Absence[] = [{ date: "2026-09-24", kind: "substitution" }];

// 요청이 하나도 없다 → "처리할 것" 구역이 숨는다
export const NO_REQUESTS: MyRequests = { corrections: [], leaves: [], substitutionsOut: [], substitutionsIn: [] };

// 예시에서는 눌러도 아무 일도 없다
export const noop = () => {};
