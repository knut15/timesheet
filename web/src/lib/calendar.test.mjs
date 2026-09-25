// 근무 달력 계산. docs/prd/10-calendar.md CAL-1~CAL-4, docs/design/calendar.md §3·§7·§9
import { registerHooks } from "node:module";
import { test } from "node:test";
import assert from "node:assert/strict";

// calendar.ts 는 앱 번들러 규칙대로 "./pay" 를 확장자 없이 import 한다. node 에서는 .ts 를 붙여 찾는다.
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (e) {
      if (specifier.startsWith(".") && !/\.[cm]?[jt]s$/.test(specifier)) return next(`${specifier}.ts`, context);
      throw e;
    }
  },
});
const { monthCells, compactHours, memberDays, masterDays, dayAriaLabel, dateLabel } = await import("./calendar.ts");

const at = (y, m, d, h = 0, min = 0) => new Date(y, m, d, h, min).getTime();
const iso = (t) => new Date(t).toISOString();
const rows = (cells) => cells.length / 7;
const lead = (cells) => cells.findIndex((c) => c.inMonth);

test("CAL-1 2026년 9월 — 1일이 화요일이라 앞에 8월 31일(월) 한 칸, 5줄", () => {
  assert.equal(new Date(2026, 8, 1).getDay(), 2); // 실제 달력 확인: 화요일
  const cells = monthCells(2026, 8);
  assert.equal(lead(cells), 1);
  assert.deepEqual(cells[0], { key: "2026-08-31", day: 31, inMonth: false });
  assert.equal(cells[1].key, "2026-09-01");
  assert.equal(rows(cells), 5);
  assert.equal(cells.filter((c) => c.inMonth).length, 30);
  assert.equal(cells.at(-1).key, "2026-10-04"); // 마지막 칸은 일요일
});

test("CAL-1 2026년 2월 — 1일이 일요일이라 앞 6칸, 6줄이 아니라 필요한 5줄", () => {
  assert.equal(new Date(2026, 1, 1).getDay(), 0);
  const cells = monthCells(2026, 1);
  assert.equal(lead(cells), 6);
  assert.equal(rows(cells), 5);
  assert.equal(cells.filter((c) => c.inMonth).length, 28);
});

test("CAL-1 2027년 2월 — 1일이 월요일, 28일이라 딱 4줄", () => {
  assert.equal(new Date(2027, 1, 1).getDay(), 1);
  const cells = monthCells(2027, 1);
  assert.equal(lead(cells), 0);
  assert.equal(rows(cells), 4);
  assert.ok(cells.every((c) => c.inMonth));
});

test("CAL-1 2026년 3월 — 1일 일요일 + 31일이면 6줄", () => {
  const cells = monthCells(2026, 2);
  assert.equal(lead(cells), 6);
  assert.equal(rows(cells), 6);
});

test("CAL-1 모든 칸은 월요일부터 일요일 순서다 (2026년 전체)", () => {
  for (let m = 0; m < 12; m++) {
    const cells = monthCells(2026, m);
    cells.forEach((c, i) => {
      const [y, mo, d] = c.key.split("-").map(Number);
      assert.equal(new Date(y, mo - 1, d).getDay(), (i + 1) % 7, `${c.key}`);
    });
  }
});

test("compactHours 경계 — 0·45·59·60·240·270·599·600·870", () => {
  assert.equal(compactHours(0), "");
  assert.equal(compactHours(45), "0.8h");
  assert.equal(compactHours(59), "1h");
  assert.equal(compactHours(60), "1h");
  assert.equal(compactHours(240), "4h");
  assert.equal(compactHours(270), "4.5h");
  assert.equal(compactHours(599), "10h"); // 10시간 미만이지만 소수 한 자리 반올림이 10.0
  assert.equal(compactHours(600), "10h");
  assert.equal(compactHours(870), "15h"); // 14시간 30분 → 정수 반올림
});

test("자정을 넘긴 근무는 출근한 날 한 칸에만 붙는다", () => {
  const s = { id: "a", start: at(2026, 8, 22, 22), end: at(2026, 8, 23, 3) };
  const days = memberDays([s], [], [], at(2026, 8, 25, 12));
  assert.equal(days.get("2026-09-22").minutes, 300);
  assert.equal(days.has("2026-09-23"), false);
});

test("같은 날 근무 두 번은 시간을 합친다", () => {
  const days = memberDays(
    [
      { id: "a", start: at(2026, 8, 22, 9), end: at(2026, 8, 22, 13, 30) },
      { id: "b", start: at(2026, 8, 22, 18), end: at(2026, 8, 22, 20) },
    ],
    [],
    [],
    at(2026, 8, 25),
  );
  assert.equal(days.get("2026-09-22").minutes, 390);
});

test("CAL-3 휴가 날에 근무가 겹치면 시간과 휴가를 둘 다 가진다", () => {
  const days = memberDays(
    [{ id: "a", start: at(2026, 8, 24, 9), end: at(2026, 8, 24, 13) }],
    [
      { date: "2026-09-24", kind: "paid_leave" },
      { date: "2026-09-26", kind: "substitution" },
    ],
    [],
    at(2026, 8, 30),
  );
  assert.deepEqual(days.get("2026-09-24"), { minutes: 240, open: null, absence: "paid_leave", pending: false });
  assert.deepEqual(days.get("2026-09-26"), { minutes: 0, open: null, absence: "substitution", pending: false });
});

test("CAL-4 퇴근 안 찍은 기록 — 오늘이면 today, 지난 날이면 stale. 시간은 지금까지", () => {
  const now = at(2026, 8, 25, 11, 10);
  const days = memberDays(
    [
      { id: "a", start: at(2026, 8, 25, 9), end: null },
      { id: "b", start: at(2026, 8, 23, 9), end: null },
    ],
    [],
    [],
    now,
  );
  assert.equal(days.get("2026-09-25").open, "today");
  assert.equal(days.get("2026-09-25").minutes, 130);
  assert.equal(days.get("2026-09-23").open, "stale");
});

test("대기 중인 수정 요청 — 수정·삭제는 원래 기록의 날, 추가는 요청한 날. 끝난 요청은 무시", () => {
  const days = memberDays([], [], [
    { status: "pending", current: { start: iso(at(2026, 8, 23, 9)), end: null }, start: iso(at(2026, 8, 20, 9)) },
    { status: "pending", current: null, start: iso(at(2026, 8, 21, 10)) },
    { status: "approved", current: null, start: iso(at(2026, 8, 19, 10)) },
  ], at(2026, 8, 25));
  assert.equal(days.get("2026-09-23").pending, true);
  assert.equal(days.get("2026-09-21").pending, true);
  assert.equal(days.has("2026-09-20"), false);
  assert.equal(days.has("2026-09-19"), false);
});

const dash = {
  members: [
    { userId: "boss", nickname: "사장", role: "master" },
    { userId: "a", nickname: "민지", role: "member" },
    { userId: "b", nickname: "준호", role: "member" },
    { userId: "c", nickname: "서연", role: "member" },
    { userId: "d", nickname: "도윤", role: "member" },
  ],
  shifts: [
    { id: "b1", userId: "b", start: iso(at(2026, 8, 22, 12)), end: iso(at(2026, 8, 22, 18)) },
    { id: "a1", userId: "a", start: iso(at(2026, 8, 22, 9)), end: iso(at(2026, 8, 22, 13, 30)) },
    { id: "b2", userId: "b", start: iso(at(2026, 8, 22, 19)), end: iso(at(2026, 8, 22, 21)) },
    { id: "c1", userId: "c", start: iso(at(2026, 8, 22, 18)), end: null },
    { id: "x1", userId: "boss", start: iso(at(2026, 8, 22, 8)), end: iso(at(2026, 8, 22, 20)) },
    { id: "gone", userId: "left", start: iso(at(2026, 8, 22, 8)), end: iso(at(2026, 8, 22, 20)) },
  ],
  absences: [
    { userId: "d", date: "2026-09-22", kind: "paid_leave" },
    { userId: "d", date: "2026-09-23", kind: "unpaid_leave" },
  ],
};

test("마스터 집계 — 인원은 사람 수(같은 사람 두 번은 한 명), 시간은 전부 합, 마스터는 뺀다, 첫 출근 순", () => {
  const now = at(2026, 8, 22, 20);
  const day = masterDays(dash, [], now).get("2026-09-22");
  assert.deepEqual(day.people.map((p) => p.nickname), ["민지", "준호", "서연"]);
  // 민지 270 + 준호 360 + 120 + 서연 (18:00~20:00 진행 중) 120
  assert.equal(day.minutes, 270 + 360 + 120 + 120);
  assert.equal(day.openCount, 1);
  assert.equal(day.staleCount, 0);
  assert.equal(day.absentCount, 1);
});

test("마스터 집계 — 다음 날이 되면 열린 기록은 stale, 쉰 사람만 있는 날, 대기 요청 수", () => {
  const now = at(2026, 8, 24, 9);
  const days = masterDays(
    dash,
    [
      { userId: "a", status: "pending", current: { start: iso(at(2026, 8, 22, 9)), end: null }, start: null },
      { userId: "b", status: "pending", current: null, start: iso(at(2026, 8, 22, 10)) },
      { userId: "boss", status: "pending", current: null, start: iso(at(2026, 8, 22, 10)) },
      { userId: "c", status: "rejected", current: null, start: iso(at(2026, 8, 22, 10)) },
    ],
    now,
  );
  const d22 = days.get("2026-09-22");
  assert.equal(d22.openCount, 0);
  assert.equal(d22.staleCount, 1);
  assert.equal(d22.pendingCount, 2);
  const d23 = days.get("2026-09-23");
  assert.equal(d23.people.length, 0);
  assert.equal(d23.absentCount, 1);
});

test("CAL-9 읽는 이름 — 명세 §7 예시 형식", () => {
  // 명세 §7 예시의 요일은 하루씩 어긋나 있다 (2026-09-22 는 화요일). 실제 달력 요일로 확인한다
  assert.equal(dateLabel("2026-09-21"), "9월 21일 월요일");
  assert.equal(dayAriaLabel("2026-09-22", false, { minutes: 270, open: null, absence: null, pending: false }, "member"), "9월 22일 화요일, 4시간 30분 근무");
  assert.equal(dayAriaLabel("2026-09-25", true, { minutes: 130, open: "today", absence: null, pending: false }, "member"), "9월 25일 금요일, 오늘, 2시간 10분 근무, 근무 중");
  assert.equal(dayAriaLabel("2026-09-23", false, { minutes: 540, open: "stale", absence: null, pending: true }, "member"), "9월 23일 수요일, 9시간 근무, 퇴근 기록 없음, 수정 요청 대기 중");
  assert.equal(dayAriaLabel("2026-09-24", false, { minutes: 0, open: null, absence: "paid_leave", pending: false }, "member"), "9월 24일 목요일, 유급 휴가");
  assert.equal(dayAriaLabel("2026-09-27", false, undefined, "member"), "9월 27일 일요일, 기록 없음");
  assert.equal(
    dayAriaLabel("2026-09-22", false, { people: [{}, {}, {}], minutes: 870, openCount: 1, staleCount: 0, absentCount: 2, pendingCount: 1 }, "master"),
    "9월 22일 화요일, 3명 근무 14시간 30분, 휴가·대타 2명, 근무 중 1명, 수정 요청 대기 1건",
  );
  assert.equal(dayAriaLabel("2026-09-27", false, undefined, "master"), "9월 27일 일요일, 근무 없음");
});
