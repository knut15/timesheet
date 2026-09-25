// 운영 성능 측정 — 멤버 앱 부팅 순서 그대로: /users/me → [shifts, absences, requests, colleagues] 병렬. docs/verify/performance.md
// 실행: DATABASE_URL=<운영> N=10 pnpm exec tsx scripts/perf-boot.mts  (끝나면 @test.dev 계정·매장을 지운다)
import { randomUUID } from "node:crypto";
import { prisma } from "../src/db.ts";

const WEB = "https://timesheet-brown-ten.vercel.app";
const API = "https://timesheet-api-hazel.vercel.app";
const ORIGIN = WEB;
const N = Number(process.env.N ?? 10);

class C {
  jar = new Map<string, string>(); csrf: string | null = null;
  constructor(public base: string) {}
  async req(method: string, path: string, body?: unknown) {
    const h: Record<string, string> = { Origin: ORIGIN };
    if (method !== "GET") h["X-CSRF-Token"] = this.csrf ??= (await this.req("GET", "/api/auth/csrf")).body.csrfToken;
    if (this.jar.size) h.Cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    if (body !== undefined) h["Content-Type"] = "application/json";
    const t0 = performance.now();
    const r = await fetch(this.base + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await r.text();
    const ms = performance.now() - t0;
    for (const c of r.headers.getSetCookie()) { const [p] = c.split(";"); const [k, ...v] = p!.split("="); this.jar.set(k!, v.join("=")); }
    return { status: r.status, body: text ? JSON.parse(text) : null, ms, bytes: text.length, vid: r.headers.get("x-vercel-id") ?? "", cache: r.headers.get("x-vercel-cache") ?? "" };
  }
}

const stats = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))]!; return { min: s[0]!, p50: q(0.5), p90: q(0.9), max: s[s.length - 1]! }; };

// 준비: 사장·멤버 가입(웹 경유), 매장·초대, 이번 달 평일 10~15시 기록 + 이전 달 한 달
const email = () => `${randomUUID()}@test.dev`;
const master = new C(WEB); const member = new C(WEB);
const me = email(), mm = email(), pw = "password-1234";
await master.req("POST", "/api/auth/signup", { email: me, password: pw, nickname: "성능사장" });
await master.req("POST", "/api/auth/login", { email: me, password: pw });
await master.req("POST", "/api/stores", { name: "성능 매장" });
const inv = await master.req("POST", "/api/stores/me/invites");
await member.req("POST", "/api/auth/signup", { email: mm, password: pw, nickname: "성능알바" });
const login = await member.req("POST", "/api/auth/login", { email: mm, password: pw });
await member.req("POST", "/api/invites/redeem", { code: inv.body.code });
const uid = login.body.user.id;
const ms = await prisma.membership.findUnique({ where: { userId: uid } });
const now = new Date();
const rows = [];
for (let d = new Date(now.getFullYear(), now.getMonth() - 1, 1); d < now; d.setDate(d.getDate() + 1)) {
  if (d.getDay() === 0 || d.getDay() === 6) continue;
  const s = new Date(d); s.setHours(10, 0, 0, 0); const e = new Date(d); e.setHours(15, 0, 0, 0);
  if (e < now) rows.push({ storeId: ms!.storeId, userId: uid, start: s, end: e });
}
await prisma.shift.createMany({ data: rows });
console.log(`seed shifts=${rows.length}`);

const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
const q = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
const paths = { me: "/api/users/me", shifts: `/api/shifts/me?${q}`, absences: `/api/absences/me?${q}`, requests: "/api/requests/me", colleagues: "/api/stores/me/colleagues" };

async function boot(c: C) {
  const t0 = performance.now();
  const a = await c.req("GET", paths.me);
  const [s, ab, r, co] = await Promise.all([c.req("GET", paths.shifts), c.req("GET", paths.absences), c.req("GET", paths.requests), c.req("GET", paths.colleagues)]);
  return { total: performance.now() - t0, me: a.ms, shifts: s.ms, absences: ab.ms, requests: r.ms, colleagues: co.ms, bytes: s.bytes, vid: a.vid, status: [a, s, ab, r, co].map((x) => x.status).join(",") };
}

for (const [label, base] of [["web(rewrite)", WEB], ["api(direct)", API]] as const) {
  const c = new C(base); c.jar = new Map(member.jar); c.csrf = member.csrf;
  const runs = [];
  for (let i = 0; i < N; i++) runs.push(await boot(c));
  const pick = (k: keyof (typeof runs)[0]) => stats(runs.map((r) => r[k] as number));
  console.log(`\n== ${label} n=${N} status=${runs[0]!.status} vercel-id=${runs[0]!.vid} shifts_bytes=${runs[0]!.bytes}`);
  for (const k of ["total", "me", "shifts", "absences", "requests", "colleagues"] as const) {
    const s = pick(k); console.log(`${k.padEnd(11)} min ${s.min.toFixed(0)}  p50 ${s.p50.toFixed(0)}  p90 ${s.p90.toFixed(0)}  max ${s.max.toFixed(0)}  (1회차 ${runs[0]![k].toFixed(0)})`);
  }
}

// 사장 대시보드 (웹 경유)
const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const dash = []; for (let i = 0; i < N; i++) dash.push((await master.req("GET", `/api/stores/me/dashboard?month=${month}`)).ms);
const ds = stats(dash); console.log(`\n== master dashboard(web) p50 ${ds.p50.toFixed(0)} p90 ${ds.p90.toFixed(0)} min ${ds.min.toFixed(0)} max ${ds.max.toFixed(0)}`);
// 헬스(DB 안 거침) — 네트워크·함수 기본 시간
const hc = new C(API); const h = []; for (let i = 0; i < N; i++) h.push((await hc.req("GET", "/health")).ms);
const hs = stats(h); console.log(`== api /health(DB 없음) p50 ${hs.p50.toFixed(0)} p90 ${hs.p90.toFixed(0)}`);
await prisma.$disconnect();
