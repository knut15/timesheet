// 시계 표기 — 모바일 한 줄 (2026-09-25)
import { test } from "node:test";
import assert from "node:assert/strict";
import { clockText } from "./format.ts";

test("24시간 두 자리 HH:MM:SS", () => {
  assert.equal(clockText(new Date(2026, 8, 25, 9, 5, 7)), "09:05:07");
  assert.equal(clockText(new Date(2026, 8, 25, 23, 59, 59)), "23:59:59");
  assert.equal(clockText(new Date(2026, 8, 25, 0, 0, 0)), "00:00:00");
});

test("길이는 항상 8자 — 칸 폭이 초마다 바뀌지 않는다", () => {
  for (const h of [0, 9, 12, 23]) assert.equal(clockText(new Date(2026, 8, 25, h, 1, 2)).length, 8);
});
