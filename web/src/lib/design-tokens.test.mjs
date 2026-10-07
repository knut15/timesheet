// DESIGN.md 의 색 토큰 — globals.css 값이 대비 4.5:1 을 지키는지, 화면 코드가 토큰 밖 색을 쓰지 않는지
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
