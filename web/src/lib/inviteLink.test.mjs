// 초대 문자 주소·본문. docs/prd/06 "초대 코드 보내기"
import { test } from "node:test";
import assert from "node:assert/strict";
import { inviteMessage, joinUrl, smsHref } from "./inviteLink.ts";

test("가입 링크에 코드가 들어간다", () => {
  assert.equal(joinUrl("https://t.example", "K7PX3MWA"), "https://t.example/join?code=K7PX3MWA");
});

test("문자 주소 — 번호의 하이픈·공백을 빼고 본문은 인코딩", () => {
  const href = smsHref("010-1234 5678", "코드: A B");
  assert.equal(href, `sms:01012345678?&body=${encodeURIComponent("코드: A B")}`);
});

test("번호 없이도 문자 앱이 열린다", () => {
  assert.ok(smsHref("", "x").startsWith("sms:?&body="));
});

test("본문에 매장·코드·주소가 들어간다", () => {
  const m = inviteMessage("데모 카페", "K7PX3MWA", "https://t.example/join?code=K7PX3MWA");
  for (const part of ["[데모 카페]", "K7PX3MWA", "https://t.example/join?code=K7PX3MWA"]) assert.ok(m.includes(part), part);
});
