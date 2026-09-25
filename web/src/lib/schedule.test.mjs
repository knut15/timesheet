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
