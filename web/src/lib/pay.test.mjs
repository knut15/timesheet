// docs/prd/02-pay.md P-1~P-4, docs/prd/03-overtime.md O-1~O-3
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeWeek, computeWeeks, computeMonth, startOfWeek } from "./pay.ts";

const H = 3_600_000;
const monday = new Date(2026, 8, 21); // 2026-09-21 (월)
const at = (dayOffset, hour) => new Date(2026, 8, 21 + dayOffset, hour).getTime();
const shift = (dayOffset, from, hours) => ({ id: `${dayOffset}-${from}`, start: at(dayOffset, from), end: at(dayOffset, from) + hours * H });
const base = { hourlyWage: 10320, weeklyHours: 20, workDaysPerWeek: 5, fivePlus: true };

test("P-1 주 20시간·5일 개근 → 기본급 206,400 + 주휴 41,280", () => {
  const w = computeWeek(monday, [0, 1, 2, 3, 4].map((d) => shift(d, 10, 4)), base);
  assert.equal(w.basePay, 206400);
  assert.equal(w.holidayPay, 41280);
  assert.equal(w.overtimePay, 0);
  assert.equal(w.total, 247680);
});

test("P-2 4일만 근무하면 주휴 0원", () => {
  const w = computeWeek(monday, [0, 1, 2, 3].map((d) => shift(d, 10, 4)), base);
  assert.equal(w.holidayEligible, false);
  assert.equal(w.holidayPay, 0);
});

test("P-3 주 14시간 계약이면 개근해도 주휴 0원", () => {
  const s = { ...base, weeklyHours: 14, workDaysPerWeek: 2 };
  const w = computeWeek(monday, [shift(0, 10, 7), shift(1, 10, 7)], s);
  assert.equal(w.holidayPay, 0);
});

test("P-4 주휴는 40시간 기준으로 상한", () => {
  const s = { ...base, weeklyHours: 45, workDaysPerWeek: 1 };
  const w = computeWeek(monday, [shift(0, 9, 8)], s);
  assert.equal(w.holidayPay, 82560);
});

test("O-1 1일 4시간 계약에 하루 6시간 → 연장 2시간, 가산 10,320", () => {
  const w = computeWeek(monday, [shift(0, 10, 6)], base);
  assert.equal(w.overtimeMinutes, 120);
  assert.equal(w.overtimePay, 10320);
});

test("O-2 주 5일 각 5시간 → 연장 5시간 (중복 계산 없음)", () => {
  const w = computeWeek(monday, [0, 1, 2, 3, 4].map((d) => shift(d, 10, 5)), base);
  assert.equal(w.overtimeMinutes, 300);
  assert.equal(w.overtimePay, Math.round(300 * (10320 / 60) * 0.5));
});

test("O-3 5인 미만이면 가산 0원", () => {
  const w = computeWeek(monday, [shift(0, 10, 6)], { ...base, fivePlus: false });
  assert.equal(w.overtimeMinutes, 120);
  assert.equal(w.overtimePay, 0);
});

test("자정을 넘긴 근무는 출근일에 속한다", () => {
  const s = { id: "n", start: at(6, 22), end: at(6, 22) + 4 * H }; // 일요일 22시 → 월 02시
  const weeks = computeWeeks([s], base);
  assert.equal(weeks.length, 1);
  assert.equal(weeks[0].weekStart.getTime(), monday.getTime());
  assert.equal(weeks[0].workedMinutes, 240);
});

test("startOfWeek 는 일요일을 앞 주 월요일로 보낸다", () => {
  assert.equal(startOfWeek(at(6, 12)).getTime(), monday.getTime());
});

test("월 합계는 일요일이 그 달인 주만 더한다", () => {
  const weeks = computeWeeks([shift(0, 10, 4), shift(7, 10, 4)], base); // 9/21 주(일=9/27), 9/28 주(일=10/4)
  assert.equal(computeMonth(weeks, 2026, 8).weeks.length, 1);
  assert.equal(computeMonth(weeks, 2026, 9).weeks.length, 1);
});

// docs/prd/09-leave-substitution.md L-1~L-4, S-1
const day = (offset) => {
  const d = new Date(2026, 8, 21 + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const four = [0, 1, 2, 3].map((d) => shift(d, 10, 4));

test("L-1 4일 근무 + 유급 휴가 1일 → 주휴 41,280 + 휴가수당 41,280", () => {
  const w = computeWeek(monday, four, base, undefined, [{ date: day(4), kind: "paid_leave" }]);
  assert.equal(w.basePay, 165120);
  assert.equal(w.holidayPay, 41280);
  assert.equal(w.leavePay, 41280);
  assert.equal(w.total, 247680);
});

test("L-2 무급 휴가 1일 → 주휴는 받고 휴가수당 0", () => {
  const w = computeWeek(monday, four, base, undefined, [{ date: day(4), kind: "unpaid_leave" }]);
  assert.equal(w.holidayPay, 41280);
  assert.equal(w.leavePay, 0);
  assert.equal(w.excusedDays, 1);
});

test("L-3 5일 전부 휴가 → 주휴 0, 휴가수당만", () => {
  const all = [0, 1, 2, 3, 4].map((d) => ({ date: day(d), kind: "paid_leave" }));
  const [w] = computeWeeks([], base, undefined, all);
  assert.equal(w.holidayPay, 0);
  assert.equal(w.leavePay, 5 * 41280);
});

test("L-4 휴가 날 근무 기록이 있으면 근무로 센다", () => {
  const w = computeWeek(monday, [...four, shift(4, 10, 4)], base, undefined, [{ date: day(4), kind: "paid_leave" }]);
  assert.equal(w.leavePay, 0);
  assert.equal(w.excusedDays, 0);
  assert.equal(w.total, 247680);
});

test("S-1 대타로 빠진 날은 결근 아님 (무급과 같은 급여)", () => {
  const w = computeWeek(monday, four, base, undefined, [{ date: day(4), kind: "substitution" }]);
  assert.equal(w.holidayPay, 41280);
  assert.equal(w.leavePay, 0);
});

test("다른 주의 휴가는 이 주에 영향이 없다", () => {
  const w = computeWeek(monday, four, base, undefined, [{ date: day(7), kind: "paid_leave" }]);
  assert.equal(w.holidayPay, 0);
  assert.equal(w.leavePay, 0);
});
