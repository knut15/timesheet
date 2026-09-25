// docs/prd/04-geofence-notification.md G-3~G-7
import { test } from "node:test";
import assert from "node:assert/strict";
import { distanceMeters, nextAlert, INITIAL_ALERT } from "./geo.ts";

test("G-3 위도 0.0004도 차이는 약 44m, 0.0005도는 약 56m", () => {
  const near = distanceMeters(37.5, 127.0, 37.5004, 127.0);
  const far = distanceMeters(37.5, 127.0, 37.5005, 127.0);
  assert.ok(near > 43 && near < 46, `near=${near}`);
  assert.ok(far > 54 && far < 57, `far=${far}`);
});

test("G-4·G-5 진입 → 첫 알림, 59초엔 없음, 60초에 재알림, 그 뒤엔 없음", () => {
  let r = nextAlert(INITIAL_ALERT, { inside: true, clockedIn: false, now: 0 });
  assert.equal(r.action, "first");
  r = nextAlert(r.state, { inside: true, clockedIn: false, now: 59_000 });
  assert.equal(r.action, "none");
  r = nextAlert(r.state, { inside: true, clockedIn: false, now: 60_000 });
  assert.equal(r.action, "remind");
  r = nextAlert(r.state, { inside: true, clockedIn: false, now: 180_000 });
  assert.equal(r.action, "none");
});

test("G-6 출근하면 재알림하지 않는다", () => {
  let r = nextAlert(INITIAL_ALERT, { inside: true, clockedIn: false, now: 0 });
  r = nextAlert(r.state, { inside: true, clockedIn: true, now: 60_000 });
  assert.equal(r.action, "none");
});

test("이미 출근한 상태로 들어오면 알림 없음", () => {
  assert.equal(nextAlert(INITIAL_ALERT, { inside: true, clockedIn: true, now: 0 }).action, "none");
});

test("G-7 나갔다 다시 들어오면 첫 알림부터", () => {
  let r = nextAlert(INITIAL_ALERT, { inside: true, clockedIn: false, now: 0 });
  r = nextAlert(r.state, { inside: false, clockedIn: false, now: 10_000 });
  r = nextAlert(r.state, { inside: true, clockedIn: false, now: 20_000 });
  assert.equal(r.action, "first");
});
