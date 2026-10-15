// 근무 시간표 표기·계산. docs/prd/13-work-schedule.md WS-1·WS-2·WS-6
import { test } from "node:test";
import assert from "node:assert/strict";
import { digitsOf, scheduleProblem, scheduleTerms, scheduleText, TIME_OPTIONS, withCommas } from "./schedule.ts";

test("WS-1 월·수·금 10:00~15:00 → 주 15시간·3일, 월요일부터 표기", () => {
  const s = { days: [5, 1, 3], start: "10:00", end: "15:00" };
  assert.deepEqual(scheduleTerms(s), { workDaysPerWeek: 3, weeklyHours: 15 });
  assert.equal(scheduleText(s), "월·수·금 10:00~15:00");
  assert.equal(scheduleText({ days: [0, 6], start: "09:30", end: "18:00" }), "토·일 09:30~18:00");
  assert.equal(scheduleProblem(s), null);
});

test("WS-2 요일 0개·퇴근 ≤ 출근·52시간 초과는 저장하지 않는다", () => {
  assert.match(scheduleProblem({ days: [], start: "10:00", end: "15:00" }), /요일/);
  assert.match(scheduleProblem({ days: [1], start: "15:00", end: "15:00" }), /퇴근/);
  assert.match(scheduleProblem({ days: [0, 1, 2, 3, 4, 5, 6], start: "08:00", end: "18:00" }), /52/);
});

test("시각 선택지는 30분 단위 48개", () => {
  assert.equal(TIME_OPTIONS.length, 48);
  assert.deepEqual([TIME_OPTIONS[0], TIME_OPTIONS[1], TIME_OPTIONS[47]], ["00:00", "00:30", "23:30"]);
});

test("WS-6 시급 입력 — 천 단위 쉼표 표기, 숫자만 읽기", () => {
  assert.equal(withCommas(12000), "12,000");
  assert.equal(withCommas(1000000), "1,000,000");
  assert.equal(digitsOf("12,0a00"), 12000);
  assert.equal(digitsOf(""), 0);
});

// 내 정보 주간 리듬 카드 — 다음 근무 (2026-10-15)
import { dayPlan, nextShift, untilText } from "./schedule.ts";
const MWF = { days: [1, 3, 5], start: "10:00", end: "15:00" };
// 2026-10-15 은 목요일
const at = (d, h, m = 0) => new Date(2026, 9, d, h, m);

test("다음 근무 — 쉬는 목요일 낮이면 금요일 10:00", () => {
  const r = nextShift(MWF, [], at(15, 13, 48));
  assert.equal(r.state, "next");
  assert.equal(r.at.getTime(), at(16, 10).getTime());
  assert.equal(untilText(r.at - at(15, 13, 48)), "20시간 12분");
});

test("다음 근무 — 근무하는 날 근무 중이면 working 과 끝나는 시각", () => {
  const r = nextShift(MWF, [], at(16, 11));
  assert.deepEqual(r, { state: "working", end: at(16, 15) });
});

test("다음 근무 — 오늘 근무가 끝났으면 다음 근무일", () => {
  const r = nextShift(MWF, [], at(16, 15, 0));
  assert.equal(r.at.getTime(), at(19, 10).getTime()); // 월요일
});

test("날짜별 변경이 시간표보다 먼저 — 금요일 쉼이면 월요일, 토요일 근무면 토요일", () => {
  const off = [{ date: "2026-10-16", kind: "off", start: null, end: null }];
  assert.equal(nextShift(MWF, off, at(15, 13)).at.getTime(), at(19, 10).getTime());
  const sat = [...off, { date: "2026-10-17", kind: "work", start: "12:00", end: "18:00" }];
  const r = nextShift(MWF, sat, at(15, 13));
  assert.equal(r.at.getTime(), at(17, 12).getTime());
  assert.deepEqual(dayPlan(MWF, sat, at(17, 0)), { start: "12:00", end: "18:00" });
});

test("시간표도 변경도 없으면 null", () => {
  assert.equal(nextShift(null, [], at(15, 13)), null);
});

test("남은 시간 글자", () => {
  assert.equal(untilText(90 * 60_000), "1시간 30분");
  assert.equal(untilText(26 * 3_600_000), "1일 2시간");
  assert.equal(untilText(5 * 60_000), "5분");
});
