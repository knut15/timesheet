// DESIGN.md 의 색 토큰 — globals.css 값이 대비 4.5:1 을 지키는지, 화면 코드가 토큰 밖 색을 쓰지 않는지
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** :root(라이트) 또는 다크 @media 안 :root 의 `--이름: #hex` 를 모은다. */
function readTokens(mode) {
  const dark = css.indexOf("@media (prefers-color-scheme: dark)");
  const scope = mode === "dark" ? css.slice(dark) : css.slice(0, dark);
  const block = scope.slice(scope.indexOf(":root"), scope.indexOf("}", scope.indexOf(":root")));
  return Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const luminance = (c) => {
  const [r, g, b] = c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [luminance(typeof a === "string" ? rgb(a) : a), luminance(typeof b === "string" ? rgb(b) : b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
/** fg 를 alpha 만큼 bg 위에 섞은 색 (Tailwind bg-ok/15 등) */
const mix = (fg, bg, alpha) => rgb(fg).map((v, i) => Math.round(v * alpha + rgb(bg)[i] * (1 - alpha)));

test("라이트·다크 글자 대비 4.5:1 이상", () => {
  for (const mode of ["light", "dark"]) {
    const t = readTokens(mode);
    const pairs = [
      ["foreground", "background"], ["foreground", "surface"],
      ["muted", "background"], ["muted", "surface"],
      ["accent", "surface"], ["on-accent", "accent"],
      ["warn", "surface"], ["ok", "surface"], ["caution", "surface"],
    ];
    for (const [fg, bg] of pairs) {
      assert.ok(t[fg] && t[bg], `${mode} 토큰 없음: ${fg} 또는 ${bg}`);
      assert.ok(contrast(t[fg], t[bg]) >= 4.5, `${mode} ${fg}/${bg} = ${contrast(t[fg], t[bg]).toFixed(2)}`);
    }
    // 취소 배지: StatusPill canceled 의 bg-line/60 바탕 위 muted 글자
    {
      const c = contrast(t.muted, mix(t.line, t.surface, 0.6));
      assert.ok(c >= 4.5, `${mode} muted/line60 = ${c.toFixed(2)}`);
    }
    // 내비 배지: bg-warn 위 text-background
    assert.ok(contrast(t.background, t.warn) >= 4.5, `${mode} background/warn`);
    // 상태 배지: 카드 위에 15% 섞은 바탕 (StatusPill 의 bg-*/15)
    for (const s of ["ok", "caution", "warn"]) {
      const c = contrast(t[s], mix(t[s], t.surface, 0.15));
      assert.ok(c >= 4.5, `${mode} ${s}/15 = ${c.toFixed(2)}`);
    }
  }
});

test("설계 §3-1 의 값 그대로", () => {
  assert.equal(readTokens("light").accent, "#0f766e");
  assert.equal(readTokens("dark").accent, "#2dd4bf");
  assert.equal(readTokens("dark")["on-accent"], "#05201d");
});

/** src 아래 .tsx 를 줄 단위로 훑어 "<상대경로>:<줄> <내용>" 을 돌려준다. */
function scanTsx(re) {
  const root = new URL("../", import.meta.url);
  const hits = [];
  for (const f of readdirSync(root, { recursive: true })) {
    if (!f.endsWith(".tsx")) continue;
    readFileSync(new URL(f, root), "utf8").split("\n").forEach((line, i) => {
      if (re.test(line)) hits.push(`${f}:${i + 1} ${line.trim()}`);
    });
  }
  return hits;
}

test("화면 코드에 직접 박은 색이 없다", () => {
  // 허용: 아바타 흰 글자(고정 배경색이라 다크와 무관), 토글 손잡이 bg-white
  const ALLOW = [/shell\.tsx:\d+ .*select-none.*text-white/, /TimesheetApp\.tsx:\d+ .*rounded-full bg-white transition/];
  const BAD = /\b(text|bg|border|ring)-(white|black|(green|emerald|amber|yellow|red|blue|stone|gray|slate)-\d{2,3})\b/;
  assert.deepEqual(scanTsx(BAD).filter((hit) => !ALLOW.some((re) => re.test(hit))), []);
});

test("transition-all 을 쓰지 않는다", () => {
  assert.deepEqual(scanTsx(/\btransition-all\b/), []);
});

test("취소 배지는 대비가 맞는 bg-line/60 을 쓴다", () => {
  // bg-line 그대로면 라이트에서 muted 글자 대비 4.35
  assert.deepEqual(scanTsx(/bg-line text-muted/), []);
});

// 애니메이션 리뷰(2026-10-08) — Emil Kowalski 기준
test("레이아웃 속성(left·top·width·height)을 전환하지 않는다", () => {
  assert.deepEqual(scanTsx(/transition-\[(left|top|right|bottom|width|height|margin|padding)/), []);
});

test("요소에 Tailwind transition 을 따로 주지 않는다 — globals.css 의 누름·색 전환을 덮는다", () => {
  assert.deepEqual(scanTsx(/className=.*\btransition(?![-\w])/), []);
});

test("온보딩 카드 두 장은 50ms 간격으로 등장한다", () => {
  assert.deepEqual(scanTsx(/appear \[animation-delay:50ms\]/).length, 1);
});

test("누름 축소는 버튼과 하단 주요 메뉴에만 — 가이드 목차 같은 목록 링크는 빼다", () => {
  assert.ok(css.includes('nav[aria-label="주요 메뉴"] a[href]'));
  assert.ok(!/(^|[\s,])nav a\[href\]/m.test(css), "nav a[href] 전체에 걸려 있다");
});

test("색 전환은 ease, 누름(transform)만 --ease-out", () => {
  for (const p of ["color", "background-color", "border-color"]) assert.ok(css.includes(`${p} 150ms ease,`) || css.includes(`${p} 150ms ease;`), p);
  assert.ok(css.includes("transform 120ms var(--ease-out)"));
});
