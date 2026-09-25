// docs/prd/12-member-today.md TD-1·TD-2, docs/design/member-today.md §5-1
import { registerHooks } from "node:module";
import { test } from "node:test";
import assert from "node:assert/strict";

// today.ts 는 "./pay" 를 확장자 없이 import 한다 — calendar.test.mjs 와 같은 방법으로 .ts 를 붙여 찾는다
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
const { todayShifts, todayState, toMinute } = await import("./today.ts");

const at = (d, h, m = 0) => new Date(2026, 8, d, h, m).getTime();
const now = at(25, 14, 32);
const s = (id, d, h1, m1, h2, m2) => ({ id, start: at(d, h1, m1), end: h2 == null ? null : at(d, h2, m2) });

test("TD-1 출근 전 — 오늘 기록·휴가 없음", () => {
  assert.deepEqual(todayState([s("a", 24, 10, 0, 15, 0)], [], now), { kind: "before" });
});

test("TD-1 근무 중 — 열린 기록", () => {
  const open = s("b", 25, 13, 30);
  const st = todayState([s("a", 25, 9, 2, 12, 30), open], [], now);
  assert.equal(st.kind, "working");
  assert.equal(st.open.id, "b");
});

test("TD-1 오늘 퇴근함 — 가장 늦은 퇴근", () => {
  const st = todayState([s("a", 25, 9, 0, 12, 0), s("b", 25, 13, 0, 18, 5)], [], at(25, 19));
  assert.deepEqual(st, { kind: "done", lastEnd: at(25, 18, 5) });
});

test("TD-1 오늘 휴가 — 유급이 대타보다 먼저 보인다", () => {
  const st = todayState([], [{ date: "2026-09-25", kind: "substitution" }, { date: "2026-09-25", kind: "paid_leave" }], now);
  assert.deepEqual(st, { kind: "off", absence: "paid_leave" });
});

test("휴가가 있어도 오늘 기록이 있으면 근무로 본다 (L-4)", () => {
  const st = todayState([s("a", 25, 9, 0, 12, 0)], [{ date: "2026-09-25", kind: "paid_leave" }], now);
  assert.equal(st.kind, "done");
});

test("어제 출근해 퇴근 안 한 기록은 근무 중, 오늘 목록에는 없다", () => {
  const y = s("y", 24, 22, 0);
  assert.equal(todayState([y], [], now).kind, "working");
  assert.deepEqual(todayShifts([y], now), []);
});

test("TD-2 오늘 목록은 출근 순, 다른 날 제외", () => {
  const list = todayShifts([s("b", 25, 13, 30), s("x", 24, 9, 0, 10, 0), s("a", 25, 9, 2, 12, 30)], now);
  assert.deepEqual(list.map((x) => x.id), ["a", "b"]);
});

test("분 단위 자르기", () => {
  assert.equal(toMinute(at(25, 14, 32) + 7_000), at(25, 14, 32));
});
