// 실행 중인 API 에 대고 도는 e2e. web-auth 스킬 verify.md S1~S14·S18·S19, docs/prd/06 I-1~I-8.
//   서버: pnpm dev  →  pnpm test:e2e
//   일부만: pnpm exec tsx --test --test-name-pattern="S5" test/e2e.test.ts  (플래그를 파일 앞에 둔다)
//   운영: API·WEB_ORIGINS 를 웹 주소로, DATABASE_URL 을 운영 DB 로. 모든 요청이 같은 실제 IP 로 잡히므로
//         S4·S19 의 실패 로그인 뒤 1분 안에 I-1 을 돌리면 로그인 제한(429)에 걸린다 — 따로 돌린다.
// S17(세션 상한)은 SESSION_MAX_AGE_SEC=5 로 띄운 서버에 S17=1 로 따로 돈다.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, test } from "node:test";
import { SignJWT } from "jose";
import { prisma } from "../src/db.js";
import { env } from "../src/env.js";

const API = process.env.API ?? "http://localhost:4200";
const ORIGIN = env.WEB_ORIGINS[0]!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ipSeq = 1;

/** 브라우저 역할: 쿠키 저장소 + CSRF 토큰 + 액세스 토큰. 테스트마다 IP 를 달리해 로그인 제한이 섞이지 않게 한다. */
class Client {
  jar = new Map<string, string>();
  csrf: string | null = null;
  access: string | null = null;
  ip = `10.0.0.${ipSeq++}`;

  async req(method: string, path: string, o: { body?: unknown; csrf?: boolean; auth?: boolean; headers?: Record<string, string> } = {}) {
    const csrf = o.csrf ? await this.ensureCsrf() : null; // 쿠키 헤더를 만들기 전에 csrf 쿠키를 받아 둔다
    const headers: Record<string, string> = { Origin: ORIGIN, "X-Forwarded-For": this.ip, ...o.headers };
    if (this.jar.size) headers.Cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    if (o.body !== undefined) headers["Content-Type"] = "application/json";
    if (csrf) headers["X-CSRF-Token"] = csrf;
    if (o.auth && this.access) headers.Authorization = `Bearer ${this.access}`;
    for (const [k, v] of Object.entries(headers)) if (v === "") delete headers[k];
    const res = await fetch(API + path, { method, headers, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
    const setCookies = res.headers.getSetCookie();
    for (const c of setCookies) {
      const [pair] = c.split(";");
      const [name, ...rest] = pair!.split("=");
      const value = rest.join("=");
      if (/Expires=Thu, 01 Jan 1970/i.test(c) || value === "") this.jar.delete(name!);
      else this.jar.set(name!, value);
    }
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, setCookies, headers: res.headers };
  }

  async ensureCsrf() {
    this.csrf ??= (await this.req("GET", "/api/auth/csrf")).body.csrfToken as string;
    return this.csrf;
  }

  async signupLogin(nickname = "tester") {
    const email = `${randomUUID()}@test.dev`;
    const password = "password-1234";
    assert.equal((await this.req("POST", "/api/auth/signup", { body: { email, password, nickname } })).status, 201);
    const r = await this.req("POST", "/api/auth/login", { csrf: true, body: { email, password } });
    assert.equal(r.status, 200);
    this.access = r.body.accessToken;
    return { email, password, user: r.body.user as { id: string } };
  }
}

after(() => prisma.$disconnect());

if (process.env.S17) {
  test("S17 세션 상한이 지나면 refresh 401", async () => {
    const c = new Client();
    await c.signupLogin();
    await sleep(6000);
    const r = await c.req("POST", "/api/auth/refresh", { csrf: true });
    assert.equal(r.status, 401);
    assert.equal(r.body.code, "REFRESH_TOKEN_INVALID");
  });
} else {
  describe("인증 (web-auth verify.md)", () => {
    test("S1·S2 가입, 대소문자만 다른 중복 가입", async () => {
      const c = new Client();
      const email = `${randomUUID()}@test.dev`;
      const r = await c.req("POST", "/api/auth/signup", { body: { email, password: "password-1234", nickname: "a" } });
      assert.equal(r.status, 201);
      assert.equal("passwordHash" in r.body || "password_hash" in r.body, false);
      const dup = await c.req("POST", "/api/auth/signup", { body: { email: email.toUpperCase(), password: "password-1234", nickname: "b" } });
      assert.equal(dup.status, 409);
      assert.equal(dup.body.code, "EMAIL_TAKEN");
    });

    test("S3 로그인 — 쿠키 속성과 no-store", async () => {
      const c = new Client();
      const email = `${randomUUID()}@test.dev`;
      await c.req("POST", "/api/auth/signup", { body: { email, password: "password-1234", nickname: "a" } });
      const r = await c.req("POST", "/api/auth/login", { csrf: true, body: { email, password: "password-1234" } });
      assert.equal(r.status, 200);
      const cookie = r.setCookies.find((s) => s.startsWith("refresh_token="))!;
      for (const attr of ["Path=/api/auth", "HttpOnly", "Secure", "SameSite=Strict", "Expires="]) assert.ok(cookie.includes(attr), `${attr} in ${cookie}`);
      assert.equal(r.headers.get("cache-control"), "no-store");
    });

    test("S4 틀린 비밀번호와 없는 이메일이 같은 응답, 비슷한 시간", async () => {
      const c = new Client();
      const { email } = await c.signupLogin();
      const time = async (e: string) => {
        const t = performance.now();
        const r = await c.req("POST", "/api/auth/login", { csrf: true, body: { email: e, password: "wrong-password" } });
        return { ms: performance.now() - t, r };
      };
      const a = await time(email);
      const b = await time(`${randomUUID()}@test.dev`);
      assert.equal(a.r.status, 401);
      assert.equal(b.r.status, 401);
      assert.equal(a.r.body.code, "INVALID_CREDENTIALS");
      assert.equal(b.r.body.code, "INVALID_CREDENTIALS");
      console.log(`  S4 응답 시간: 틀린 비밀번호 ${a.ms.toFixed(1)}ms, 없는 이메일 ${b.ms.toFixed(1)}ms`);
      assert.ok(Math.abs(a.ms - b.ms) < 50);
    });

    test("S5·S6 보호 API — Bearer 없음·변조·다른 aud·alg none 은 401", async () => {
      const c = new Client();
      const { user } = await c.signupLogin();
      assert.equal((await c.req("GET", "/api/users/me", { auth: true })).status, 200);
      const bare = new Client();
      const no = await bare.req("GET", "/api/users/me");
      assert.equal(no.status, 401);
      assert.equal(no.body.code, "ACCESS_TOKEN_INVALID");

      const tampered = c.access!.slice(0, -3) + (c.access!.endsWith("aaa") ? "bbb" : "aaa");
      assert.equal((await c.req("GET", "/api/users/me", { headers: { Authorization: `Bearer ${tampered}` } })).status, 401);

      const key = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
      const otherAud = await new SignJWT({ sid: randomUUID() }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id)
        .setIssuer("timesheet-api").setAudience("someone-else").setExpirationTime("5m").sign(key);
      assert.equal((await c.req("GET", "/api/users/me", { headers: { Authorization: `Bearer ${otherAud}` } })).status, 401);

      const [, payload] = c.access!.split(".");
      const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${payload}.`;
      // 운영(Vercel)에서는 방화벽이 서명 없는 JWT 를 앱에 닿기 전에 403 으로 막는다. 그것도 거부로 친다.
      const r6 = await fetch(`${API}/api/users/me`, { headers: { Authorization: `Bearer ${none}` } });
      const blockedByPlatform = r6.status === 403 && r6.headers.get("x-vercel-mitigated") === "deny";
      assert.ok(r6.status === 401 || blockedByPlatform, `alg none → ${r6.status}`);
    });

    test("S7·S8·S9 회전, grace 안 동시 요청, 재사용 탐지", async () => {
      const c = new Client();
      await c.signupLogin();
      const first = c.jar.get("refresh_token")!;
      const r7 = await c.req("POST", "/api/auth/refresh", { csrf: true });
      assert.equal(r7.status, 200);
      const second = c.jar.get("refresh_token")!;
      assert.notEqual(second, first);
      const rows = await prisma.refreshToken.findMany({ where: { userId: r7.body.user.id }, orderBy: { createdAt: "asc" } });
      assert.equal(rows[0]!.revokeReason, "rotated");
      assert.ok(rows[0]!.replacedBy);

      // 옛 쿠키를 든 다른 탭
      const stale = new Client();
      stale.ip = c.ip;
      stale.jar.set("refresh_token", first);
      stale.jar.set("csrf_token", c.jar.get("csrf_token")!);
      stale.csrf = c.csrf;
      const r8 = await stale.req("POST", "/api/auth/refresh", { csrf: true });
      assert.equal(r8.status, 409);
      assert.equal(r8.body.code, "REFRESH_TOKEN_ROTATED");
      assert.equal(await prisma.refreshToken.count({ where: { familyId: rows[0]!.familyId, revokedAt: null } }), 1);

      await sleep(11_000);
      stale.jar.set("refresh_token", first);
      const r9 = await stale.req("POST", "/api/auth/refresh", { csrf: true });
      assert.equal(r9.status, 401);
      assert.equal(r9.body.code, "REFRESH_TOKEN_REUSED");
      assert.ok(r9.setCookies.some((s) => s.startsWith("refresh_token=;") && s.includes("Path=/api/auth")));
      const fam = await prisma.refreshToken.findMany({ where: { familyId: rows[0]!.familyId }, orderBy: { createdAt: "asc" } });
      assert.equal(fam.filter((f) => f.revokedAt === null).length, 0);
      assert.equal(fam[0]!.revokeReason, "rotated");
      assert.equal(fam[1]!.revokeReason, "reuse_detected");
      const legit = await c.req("POST", "/api/auth/refresh", { csrf: true });
      assert.equal(legit.body.code, "REFRESH_TOKEN_REUSED");
    });

    test("S23 회전이 잠금을 기다리는 사이 옛 토큰이 오면 새 토큰까지 폐기된다", async () => {
      const c = new Client();
      const { user } = await c.signupLogin();
      const old = c.jar.get("refresh_token")!;
      await c.req("POST", "/api/auth/refresh", { csrf: true });
      await sleep(11_000); // grace 밖으로
      const [row] = await prisma.refreshToken.findMany({ where: { userId: user.id }, take: 1 });
      const familyId = row!.familyId;

      const stale = new Client();
      stale.ip = c.ip;
      stale.jar = new Map(c.jar);
      stale.jar.set("refresh_token", old);
      stale.csrf = c.csrf;

      // family 잠금을 먼저 쥐고 두 요청을 동시에 보낸 뒤 놓는다. 어느 쪽이 먼저 잠금을 얻든 살아 있는 행은 0 이어야 한다.
      let release!: () => void;
      const held = new Promise<void>((r) => (release = r));
      const locker = prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${familyId}::text, 0))`;
        await held;
      }, { timeout: 15_000 });
      await sleep(200);
      const both = Promise.all([c.req("POST", "/api/auth/refresh", { csrf: true }), stale.req("POST", "/api/auth/refresh", { csrf: true })]);
      await sleep(500);
      release();
      await locker;
      const [a, b] = await both;
      console.log(`  S23 최신 토큰 요청 ${a.status} ${a.body?.code ?? ""}, 옛 토큰 요청 ${b.status} ${b.body?.code}`);
      assert.equal(b.body.code, "REFRESH_TOKEN_REUSED");
      assert.equal(await prisma.refreshToken.count({ where: { familyId, revokedAt: null } }), 0);
    });

    test("S10~S13 CSRF — 헤더 없음, 위조, Origin 위조, Origin 없음", async () => {
      const c = new Client();
      await c.signupLogin();
      const noHeader = await c.req("POST", "/api/auth/refresh");
      assert.equal(noHeader.body.code, "CSRF_TOKEN_INVALID");

      const forged = new Client();
      forged.jar = new Map(c.jar);
      forged.jar.set("csrf_token", "abc.def");
      const r11 = await forged.req("POST", "/api/auth/refresh", { headers: { "X-CSRF-Token": "abc.def" } });
      assert.equal(r11.status, 403);
      assert.equal(r11.body.code, "CSRF_TOKEN_INVALID");

      const r12 = await c.req("POST", "/api/auth/refresh", { csrf: true, headers: { Origin: "http://evil.test" } });
      assert.equal(r12.body.code, "CSRF_ORIGIN_REJECTED");
      const r13 = await c.req("POST", "/api/auth/refresh", { csrf: true, headers: { Origin: "" } });
      assert.equal(r13.status, 403);
      assert.equal(r13.body.code, "CSRF_ORIGIN_REJECTED");
    });

    test("S14 로그아웃 — 쿠키 삭제, 멱등, 옛 쿠키는 INVALID", async () => {
      const c = new Client();
      await c.signupLogin();
      const old = c.jar.get("refresh_token")!;
      await c.req("POST", "/api/auth/refresh", { csrf: true });
      const cur = c.jar.get("refresh_token")!;
      const out = await c.req("POST", "/api/auth/logout", { csrf: true });
      assert.equal(out.status, 204);
      assert.ok(out.setCookies.some((s) => s.startsWith("refresh_token=;") && s.includes("Path=/api/auth")));
      c.jar.set("refresh_token", cur);
      assert.equal((await c.req("POST", "/api/auth/refresh", { csrf: true })).body.code, "REFRESH_TOKEN_INVALID");
      assert.equal((await c.req("POST", "/api/auth/logout", { csrf: true })).status, 204);
      c.jar.set("refresh_token", old);
      assert.equal((await c.req("POST", "/api/auth/refresh", { csrf: true })).body.code, "REFRESH_TOKEN_INVALID");
    });

    test("S18 다른 출처의 preflight 에 CORS 허용 헤더가 없다", async () => {
      const res = await fetch(`${API}/api/auth/refresh`, { method: "OPTIONS", headers: { Origin: "http://evil.test", "Access-Control-Request-Method": "POST" } });
      assert.equal(res.headers.get("access-control-allow-origin"), null);
    });

    test("S19 틀린 로그인 6번째는 429", async () => {
      const c = new Client();
      const codes: number[] = [];
      for (let i = 0; i < 6; i++) codes.push((await c.req("POST", "/api/auth/login", { csrf: true, body: { email: "x@test.dev", password: "nope-nope" } })).status);
      assert.deepEqual(codes, [401, 401, 401, 401, 401, 429]);
    });
  });

  describe("매장·초대 (docs/prd/06)", () => {
    test("I-1~I-8", async () => {
      const master = new Client();
      await master.signupLogin("사장");
      const created = await master.req("POST", "/api/stores", { auth: true, body: { name: "테스트 매장" } });
      assert.equal(created.status, 201);
      assert.equal(created.body.role, "master");

      const inv = await master.req("POST", "/api/stores/me/invites", { auth: true });
      assert.equal(inv.status, 201);
      assert.match(inv.body.code, /^[A-HJ-NP-Z2-9]{8}$/);

      // I-1 소문자·공백 섞어 입력해도 등록된다
      const alba = new Client();
      const { user: albaUser } = await alba.signupLogin("알바");
      const code = inv.body.code as string;
      const redeem = await alba.req("POST", "/api/invites/redeem", { auth: true, body: { code: ` ${code.slice(0, 4).toLowerCase()} ${code.slice(4)} ` } });
      assert.equal(redeem.status, 200);
      assert.equal(redeem.body.role, "member");
      const members = await master.req("GET", "/api/stores/me/members", { auth: true });
      assert.ok(members.body.some((m: { userId: string }) => m.userId === albaUser.id));

      // I-2 같은 코드 두 번째
      const other = new Client();
      await other.signupLogin();
      assert.equal((await other.req("POST", "/api/invites/redeem", { auth: true, body: { code } })).body.code, "INVITE_INVALID");

      // I-3 취소된 코드, 만료된 코드
      const inv2 = await master.req("POST", "/api/stores/me/invites", { auth: true });
      assert.equal((await master.req("DELETE", `/api/stores/me/invites/${inv2.body.id}`, { auth: true })).status, 204);
      assert.equal((await other.req("POST", "/api/invites/redeem", { auth: true, body: { code: inv2.body.code } })).body.code, "INVITE_INVALID");
      const inv3 = await master.req("POST", "/api/stores/me/invites", { auth: true });
      await prisma.invite.update({ where: { id: inv3.body.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
      assert.equal((await other.req("POST", "/api/invites/redeem", { auth: true, body: { code: inv3.body.code } })).body.code, "INVITE_INVALID");
      const list = await master.req("GET", "/api/stores/me/invites", { auth: true });
      const byId = Object.fromEntries(list.body.map((i: { id: string; status: string }) => [i.id, i]));
      assert.equal(byId[inv.body.id].status, "used");
      assert.equal(byId[inv.body.id].usedByNickname, "알바");
      assert.equal(byId[inv2.body.id].status, "revoked");
      assert.equal(byId[inv3.body.id].status, "expired");

      // I-4 이미 소속 있음
      assert.equal((await alba.req("POST", "/api/stores", { auth: true, body: { name: "x" } })).body.code, "ALREADY_IN_STORE");
      const inv4 = await master.req("POST", "/api/stores/me/invites", { auth: true });
      assert.equal((await alba.req("POST", "/api/invites/redeem", { auth: true, body: { code: inv4.body.code } })).body.code, "ALREADY_IN_STORE");

      // I-5 멤버가 마스터 API
      assert.equal((await alba.req("GET", "/api/stores/me/members", { auth: true })).status, 403);
      assert.equal((await alba.req("POST", "/api/stores/me/invites", { auth: true })).status, 403);

      // I-8 출퇴근, 중복 출근
      const inRes = await alba.req("POST", "/api/shifts/clock-in", { auth: true });
      assert.equal(inRes.status, 201);
      assert.equal((await alba.req("POST", "/api/shifts/clock-in", { auth: true })).body.code, "ALREADY_CLOCKED_IN");

      // I-7 마스터 대시보드에 열린 기록이 보인다
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const dash = await master.req("GET", `/api/stores/me/dashboard?month=${month}`, { auth: true });
      assert.equal(dash.status, 200);
      assert.ok(dash.body.shifts.some((s: { id: string; end: string | null }) => s.id === inRes.body.id && s.end === null));

      const outRes = await alba.req("POST", "/api/shifts/clock-out", { auth: true });
      assert.equal(outRes.status, 200);
      assert.ok(outRes.body.end);
      assert.equal((await alba.req("POST", "/api/shifts/clock-out", { auth: true })).body.code, "NOT_CLOCKED_IN");

      // 마스터가 시급을 바꾸고 기록을 고친다
      const upd = await master.req("PATCH", `/api/stores/me/members/${albaUser.id}`, { auth: true, body: { hourlyWage: 12000 } });
      assert.equal(upd.body.hourlyWage, 12000);
      const start = new Date(Date.now() - 3 * 3_600_000).toISOString();
      const end = new Date(Date.now() - 3_600_000).toISOString();
      const fix = await master.req("PATCH", `/api/stores/me/shifts/${inRes.body.id}`, { auth: true, body: { start, end } });
      assert.equal(fix.status, 200);
      assert.equal(fix.body.start, start);
      const bad = await master.req("PATCH", `/api/stores/me/shifts/${inRes.body.id}`, { auth: true, body: { start: end, end: start } });
      assert.equal(bad.body.code, "VALIDATION_FAILED");

      // I-6 다른 매장 마스터는 404
      const rival = new Client();
      await rival.signupLogin("옆가게");
      await rival.req("POST", "/api/stores", { auth: true, body: { name: "옆 매장" } });
      assert.equal((await rival.req("PATCH", `/api/stores/me/members/${albaUser.id}`, { auth: true, body: { hourlyWage: 1 } })).status, 404);
      assert.equal((await rival.req("PATCH", `/api/stores/me/shifts/${inRes.body.id}`, { auth: true, body: { start, end } })).status, 404);
      assert.equal((await rival.req("DELETE", `/api/stores/me/shifts/${inRes.body.id}`, { auth: true })).status, 404);
      const from = new Date(Date.now() - 86_400_000).toISOString();
      const to = new Date(Date.now() + 86_400_000).toISOString();
      assert.equal((await rival.req("GET", `/api/stores/me/members/${albaUser.id}/shifts?from=${from}&to=${to}`, { auth: true })).status, 404);

      // 내보내기 — 소속은 사라지고 기록은 남는다
      assert.equal((await master.req("DELETE", `/api/stores/me/members/${albaUser.id}`, { auth: true })).status, 204);
      assert.equal((await alba.req("GET", "/api/users/me", { auth: true })).body.membership, null);
      assert.equal(await prisma.shift.count({ where: { id: inRes.body.id } }), 1);
    });
  });
}
