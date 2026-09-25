// 실행 중인 API 에 대고 도는 e2e. web-auth 스킬 verify.md S1~S14·S18·S19, docs/prd/06 I-1~I-8.
//   서버: pnpm dev  →  pnpm test:e2e
//   일부만: pnpm exec tsx --test --test-name-pattern="S5" test/e2e.test.ts  (플래그를 파일 앞에 둔다)
//   운영: API·WEB_ORIGINS 를 웹 주소로, DATABASE_URL 을 운영 DB 로. 모든 요청이 같은 실제 IP 로 잡히므로
//         S4·S19 의 실패 로그인 뒤 1분 안에 I-1 을 돌리면 로그인 제한(429)에 걸린다 — 따로 돌린다.
// S17(슬라이딩 세션)은 SESSION_MAX_AGE_SEC=5 로 띄운 서버에 S17=1 로 따로 돈다.
// 인증은 쿠키다 — 액세스 토큰(access_token)·리프레시 토큰(refresh_token) 모두 HttpOnly 쿠키로 오고 간다. docs/prd/05
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

/** 브라우저 역할: 쿠키 저장소 + CSRF 토큰. 테스트마다 IP 를 달리해 로그인 제한이 섞이지 않게 한다. */
class Client {
  jar = new Map<string, string>();
  csrf: string | null = null;
  ip = `10.0.0.${ipSeq++}`;

  get access() {
    return this.jar.get("access_token") ?? null;
  }

  /** GET 이 아니면 기본으로 CSRF 헤더를 싣는다 (브라우저 FE 와 같다). csrf: false 로 뺄 수 있다. */
  async req(method: string, path: string, o: { body?: unknown; csrf?: boolean; auth?: boolean; headers?: Record<string, string> } = {}) {
    const wantCsrf = o.csrf ?? method !== "GET";
    const csrf = wantCsrf ? await this.ensureCsrf() : null; // 쿠키 헤더를 만들기 전에 csrf 쿠키를 받아 둔다
    const headers: Record<string, string> = { Origin: ORIGIN, "X-Forwarded-For": this.ip };
    if (this.jar.size) headers.Cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    if (o.body !== undefined) headers["Content-Type"] = "application/json";
    if (csrf) headers["X-CSRF-Token"] = csrf;
    Object.assign(headers, o.headers); // 테스트가 준 헤더가 이긴다 (위조 시나리오)
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

  /** 파일 바이트를 그대로 보낸다 (로고 업로드). 쿠키·CSRF 는 req 와 같다 */
  async raw(method: string, path: string, body: Buffer, type: string) {
    const csrf = await this.ensureCsrf();
    const res = await fetch(API + path, {
      method,
      headers: { Origin: ORIGIN, "X-Forwarded-For": this.ip, Cookie: [...this.jar].map(([k, v]) => `${k}=${v}`).join("; "), "Content-Type": type, "X-CSRF-Token": csrf },
      body: new Uint8Array(body),
    });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { status: res.status, body: json, headers: res.headers };
  }

  async ensureCsrf() {
    this.csrf ??= (await this.req("GET", "/api/auth/csrf", { csrf: false })).body.csrfToken as string;
    return this.csrf;
  }

  async signupLogin(nickname = "tester") {
    const email = `${randomUUID()}@test.dev`;
    const password = "password-1234";
    assert.equal((await this.req("POST", "/api/auth/signup", { body: { email, password, nickname } })).status, 201);
    const r = await this.req("POST", "/api/auth/login", { csrf: true, body: { email, password } });
    assert.equal(r.status, 200);
    return { email, password, user: r.body.user as { id: string } };
  }
}

after(() => prisma.$disconnect());

if (process.env.S17) {
  test("S17 쓰지 않으면 세션 한도(5초) 뒤 refresh 401", async () => {
    const c = new Client();
    await c.signupLogin();
    await sleep(6000);
    const r = await c.req("POST", "/api/auth/refresh", { csrf: true });
    assert.equal(r.status, 401);
    assert.equal(r.body.code, "REFRESH_TOKEN_INVALID");
  });

  test("S17b 쓰는 동안은 한도가 밀린다 (슬라이딩) — 3초마다 refresh 하면 로그인 뒤 9초에도 유지", async () => {
    const c = new Client();
    await c.signupLogin();
    for (let i = 0; i < 3; i++) {
      await sleep(3000);
      const r = await c.req("POST", "/api/auth/refresh", { csrf: true });
      assert.equal(r.status, 200, `refresh #${i + 1}`);
    }
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
      const access = r.setCookies.find((s) => s.startsWith("access_token="))!;
      for (const attr of ["Path=/api;", "HttpOnly", "Secure", "SameSite=Strict", "Max-Age=600"]) assert.ok(access.includes(attr), `${attr} in ${access}`);
      assert.equal("accessToken" in r.body, false, "토큰은 본문에 없다");
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

    test("S5·S6 보호 API — 쿠키 없음·변조·다른 aud·alg none·Bearer 헤더는 401", async () => {
      const c = new Client();
      const { user } = await c.signupLogin();
      assert.equal((await c.req("GET", "/api/users/me")).status, 200);
      const bare = new Client();
      const no = await bare.req("GET", "/api/users/me");
      assert.equal(no.status, 401);
      assert.equal(no.body.code, "ACCESS_TOKEN_INVALID");

      /** access_token 쿠키만 바꿔 끼운 요청 */
      const withAccess = (token: string) => fetch(`${API}/api/users/me`, { headers: { Cookie: `access_token=${token}`, "X-Forwarded-For": c.ip } });
      const tampered = c.access!.slice(0, -3) + (c.access!.endsWith("aaa") ? "bbb" : "aaa");
      assert.equal((await withAccess(tampered)).status, 401);

      const key = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
      const otherAud = await new SignJWT({ sid: randomUUID() }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id)
        .setIssuer("timesheet-api").setAudience("someone-else").setExpirationTime("5m").sign(key);
      assert.equal((await withAccess(otherAud)).status, 401);

      const [, payload] = c.access!.split(".");
      const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${payload}.`;
      // 운영(Vercel)에서는 방화벽이 서명 없는 JWT 를 앱에 닿기 전에 403 으로 막는다. 그것도 거부로 친다.
      const r6 = await withAccess(none);
      const blockedByPlatform = r6.status === 403 && r6.headers.get("x-vercel-mitigated") === "deny";
      assert.ok(r6.status === 401 || blockedByPlatform, `alg none → ${r6.status}`);

      // 헤더로는 인증하지 않는다 — 유효한 토큰이어도 쿠키가 없으면 401
      const bearer = await fetch(`${API}/api/users/me`, { headers: { Authorization: `Bearer ${c.access}` } });
      assert.equal(bearer.status, 401);
    });

    test("X-1 쿠키 인증이라 모든 변경 요청에 CSRF 가 걸린다", async () => {
      const c = new Client();
      await c.signupLogin();
      const noToken = await c.req("POST", "/api/stores", { csrf: false, body: { name: "x" } });
      assert.equal(noToken.status, 403);
      assert.equal(noToken.body.code, "CSRF_TOKEN_INVALID");
      const evil = await c.req("POST", "/api/stores", { body: { name: "x" }, headers: { Origin: "http://evil.test" } });
      assert.equal(evil.body.code, "CSRF_ORIGIN_REJECTED");
      const ok = await c.req("POST", "/api/stores", { body: { name: "x" } });
      assert.equal(ok.status, 201);
    });

    test("X-2 로그인·refresh 가 새 access_token 쿠키를 주고, 로그아웃이 둘 다 지운다", async () => {
      const c = new Client();
      await c.signupLogin();
      const first = c.access;
      const r = await c.req("POST", "/api/auth/refresh");
      assert.equal(r.status, 200);
      assert.notEqual(c.access, first);
      const out = await c.req("POST", "/api/auth/logout");
      assert.ok(out.setCookies.some((s) => s.startsWith("access_token=;") && s.includes("Path=/api;")));
      assert.ok(out.setCookies.some((s) => s.startsWith("refresh_token=;")));
      assert.equal((await c.req("GET", "/api/users/me")).status, 401);
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
      const noHeader = await c.req("POST", "/api/auth/refresh", { csrf: false });
      assert.equal(noHeader.body.code, "CSRF_TOKEN_INVALID");

      const forged = new Client();
      forged.jar = new Map(c.jar);
      forged.jar.set("csrf_token", "abc.def");
      const r11 = await forged.req("POST", "/api/auth/refresh", { csrf: false, headers: { "X-CSRF-Token": "abc.def" } });
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
      assert.equal(byId[inv.body.id].usedByUserId, albaUser.id);
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

  describe("수정 요청·휴가·대타 (docs/prd/08·09)", () => {
    /** 마스터 1 + 멤버 2 로 매장을 세운다 */
    async function setupStore() {
      const master = new Client();
      await master.signupLogin("사장");
      await master.req("POST", "/api/stores", { body: { name: "요청 테스트 매장" } });
      const join = async (name: string) => {
        const c = new Client();
        const { user } = await c.signupLogin(name);
        const inv = await master.req("POST", "/api/stores/me/invites");
        assert.equal((await c.req("POST", "/api/invites/redeem", { body: { code: inv.body.code } })).status, 200);
        return { c, id: user.id };
      };
      return { master, a: await join("알바A"), b: await join("알바B") };
    }
    const iso = (h: number) => new Date(Date.UTC(2026, 8, 20, h)).toISOString();

    test("C-1~C-7 기록 수정 요청과 승인", async () => {
      const { master, a, b } = await setupStore();
      await a.c.req("POST", "/api/shifts/clock-in");
      const shift = (await a.c.req("POST", "/api/shifts/clock-out")).body; // 퇴근 응답이 그 기록이다
      assert.ok(shift.id);

      // C-7 퇴근 < 출근
      assert.equal((await a.c.req("POST", "/api/corrections", { body: { action: "edit", shiftId: shift.id, start: iso(12), end: iso(10), reason: "x" } })).body.code, "VALIDATION_FAILED");
      // C-1 수정 요청 → 승인 → 기록 반영
      const edit = await a.c.req("POST", "/api/corrections", { body: { action: "edit", shiftId: shift.id, start: iso(1), end: iso(5), reason: "퇴근을 늦게 찍었어요" } });
      assert.equal(edit.status, 201);
      assert.equal(edit.body.current.start, shift.start);
      // C-4 같은 기록 두 번째
      assert.equal((await a.c.req("POST", "/api/corrections", { body: { action: "delete", shiftId: shift.id, reason: "x" } })).body.code, "REQUEST_PENDING");
      // C-6 남의 기록, 멤버가 승인
      assert.equal((await b.c.req("POST", "/api/corrections", { body: { action: "delete", shiftId: shift.id, reason: "x" } })).status, 404);
      assert.equal((await a.c.req("POST", `/api/stores/me/corrections/${edit.body.id}/approve`, { body: {} })).status, 403);
      const ok = await master.req("POST", `/api/stores/me/corrections/${edit.body.id}/approve`, { body: { note: "확인" } });
      assert.equal(ok.status, 200);
      assert.equal(ok.body.status, "approved");
      const after = await prisma.shift.findUniqueOrThrow({ where: { id: shift.id } });
      assert.equal(after.start.toISOString(), iso(1));
      assert.equal(after.end!.toISOString(), iso(5));
      // C-5 처리된 요청 다시
      assert.equal((await master.req("POST", `/api/stores/me/corrections/${edit.body.id}/approve`, { body: {} })).body.code, "REQUEST_CLOSED");
      assert.equal((await a.c.req("POST", `/api/corrections/${edit.body.id}/cancel`)).body.code, "REQUEST_CLOSED");

      // C-2 추가 → 기록 생김, 삭제 → 기록 사라짐
      const add = await a.c.req("POST", "/api/corrections", { body: { action: "add", start: iso(10), end: iso(14), reason: "출근을 안 찍었어요" } });
      await master.req("POST", `/api/stores/me/corrections/${add.body.id}/approve`, { body: {} });
      assert.equal(await prisma.shift.count({ where: { userId: a.id, start: new Date(iso(10)) } }), 1);
      const del = await a.c.req("POST", "/api/corrections", { body: { action: "delete", shiftId: shift.id, reason: "잘못 찍음" } });
      await master.req("POST", `/api/stores/me/corrections/${del.body.id}/approve`, { body: {} });
      assert.equal(await prisma.shift.count({ where: { id: shift.id } }), 0);

      // C-3 거절 → 기록 그대로
      const [left] = await prisma.shift.findMany({ where: { userId: a.id } });
      const rej = await a.c.req("POST", "/api/corrections", { body: { action: "delete", shiftId: left!.id, reason: "x" } });
      const r = await master.req("POST", `/api/stores/me/corrections/${rej.body.id}/reject`, { body: { note: "기록이 맞아요" } });
      assert.equal(r.body.status, "rejected");
      assert.equal(r.body.reviewNote, "기록이 맞아요");
      assert.equal(await prisma.shift.count({ where: { id: left!.id } }), 1);

      const mine = await a.c.req("GET", "/api/requests/me");
      assert.equal(mine.body.corrections.length, 4);
    });

    test("L·S·M 휴가와 대타", async () => {
      const { master, a, b } = await setupStore();
      // 휴가 신청(유급 여부 없음) → 겹침 409 → 마스터가 유급 여부를 정해 승인
      const lv = await a.c.req("POST", "/api/leaves", { body: { startDate: "2026-10-05", endDate: "2026-10-06", reason: "가족 행사" } });
      assert.equal(lv.status, 201);
      assert.equal(lv.body.status, "pending");
      assert.equal(lv.body.paid, null, "승인 전에는 미정");
      assert.equal((await a.c.req("POST", "/api/leaves", { body: { startDate: "2026-10-06", endDate: "2026-10-07", reason: "x" } })).body.code, "LEAVE_OVERLAP");
      assert.equal((await master.req("POST", `/api/stores/me/leaves/${lv.body.id}/approve`, { body: {} })).body.code, "VALIDATION_FAILED", "승인에 paid 필수");
      const ap = await master.req("POST", `/api/stores/me/leaves/${lv.body.id}/approve`, { body: { paid: false } });
      assert.equal(ap.body.status, "approved");
      assert.equal(ap.body.paid, false);

      // 대타: 자기 자신 400, 수락 전 승인 409 SUBSTITUTE_NOT_ACCEPTED, 수락 → 승인
      assert.equal((await a.c.req("POST", "/api/substitutions", { body: { date: "2026-10-08", substituteId: a.id, reason: "x" } })).status, 400);
      const sub = await a.c.req("POST", "/api/substitutions", { body: { date: "2026-10-08", substituteId: b.id, reason: "병원" } });
      assert.equal(sub.body.status, "requested");
      assert.equal((await master.req("POST", `/api/stores/me/substitutions/${sub.body.id}/approve`, { body: {} })).body.code, "SUBSTITUTE_NOT_ACCEPTED");
      assert.equal((await a.c.req("POST", `/api/substitutions/${sub.body.id}/accept`)).status, 404); // 요청자는 수락 못 함
      assert.equal((await b.c.req("POST", `/api/substitutions/${sub.body.id}/accept`)).body.status, "accepted");
      assert.equal((await master.req("POST", `/api/stores/me/substitutions/${sub.body.id}/approve`, { body: {} })).body.status, "approved");

      // 결근 아닌 날: 휴가 2일(무급) + 대타 1일
      const range = "from=2026-10-01T00:00:00Z&to=2026-10-31T00:00:00Z";
      const abs = (await a.c.req("GET", `/api/absences/me?${range}`)).body as { date: string; kind: string }[];
      assert.deepEqual(abs.map((x) => `${x.date}:${x.kind}`).sort(), ["2026-10-05:unpaid_leave", "2026-10-06:unpaid_leave", "2026-10-08:substitution"]);

      // M-1 직접 등록은 바로 approved, 삭제하면 빠진다
      const direct = await master.req("POST", "/api/stores/me/leaves", { body: { userId: b.id, startDate: "2026-10-12", endDate: "2026-10-12", paid: true, reason: "연차" } });
      assert.equal(direct.body.status, "approved");
      assert.equal(direct.body.byMaster, true);
      const dsub = await master.req("POST", "/api/stores/me/substitutions", { body: { requesterId: b.id, substituteId: a.id, date: "2026-10-13", reason: "사장 배정" } });
      assert.equal(dsub.body.status, "approved");
      const storeAbs = (await master.req("GET", `/api/stores/me/absences?${range}`)).body as { userId: string }[];
      assert.equal(storeAbs.filter((x) => x.userId === b.id).length, 2);
      assert.equal((await master.req("DELETE", `/api/stores/me/leaves/${direct.body.id}`)).status, 204);
      assert.equal((await master.req("DELETE", `/api/stores/me/substitutions/${dsub.body.id}`)).status, 204);
      assert.equal(((await master.req("GET", `/api/stores/me/absences?${range}`)).body as { userId: string }[]).filter((x) => x.userId === b.id).length, 0);

      // 대기 수가 대시보드에 온다: 새 휴가 신청 1건
      await b.c.req("POST", "/api/leaves", { body: { startDate: "2026-11-02", endDate: "2026-11-02", reason: "x" } });
      const dash = await master.req("GET", "/api/stores/me/dashboard?month=2026-10");
      assert.equal(dash.body.pendingRequests, 1);
      assert.equal(dash.body.absences.length, 3);
      // 다른 매장 마스터는 404
      const rival = new Client();
      await rival.signupLogin("옆가게");
      await rival.req("POST", "/api/stores", { body: { name: "옆" } });
      assert.equal((await rival.req("POST", `/api/stores/me/leaves/${lv.body.id}/reject`, { body: {} })).status, 404);
      // 동료 목록은 나를 뺀 멤버
      const col = (await a.c.req("GET", "/api/stores/me/colleagues")).body as { userId: string }[];
      assert.deepEqual(col.map((x) => x.userId), [b.id]);
    });
  });

  describe("매장 로고 (docs/prd/11)", () => {
    // 1x1 투명 PNG
    const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#2563eb"/></svg>');

    test("LG-1~LG-7 올리기·형식 검사·SVG 안전·크기·권한·교체·삭제", async () => {
      const master = new Client();
      await master.signupLogin("사장");
      await master.req("POST", "/api/stores", { body: { name: "로고 매장" } });
      const alba = new Client();
      await alba.signupLogin("알바");
      const inv = await master.req("POST", "/api/stores/me/invites");
      await alba.req("POST", "/api/invites/redeem", { body: { code: inv.body.code } });

      // 없으면 null·404
      assert.equal((await master.req("GET", "/api/stores/me")).body.logoUrl, null);
      assert.equal((await alba.req("GET", "/api/stores/me/logo")).status, 404);

      // LG-1 PNG 올리기 → logoUrl, 멤버도 같은 바이트를 받는다
      const up = await master.raw("PUT", "/api/stores/me/logo", PNG, "image/png");
      assert.equal(up.status, 200);
      assert.match(up.body.logoUrl, /^\/api\/stores\/me\/logo\?v=\d+$/);
      const got = await fetch(API + "/api/stores/me/logo", { headers: { Cookie: [...alba.jar].map(([k, v]) => `${k}=${v}`).join("; ") } });
      assert.equal(got.status, 200);
      assert.equal(got.headers.get("content-type"), "image/png");
      assert.equal(got.headers.get("x-content-type-options"), "nosniff");
      assert.ok(got.headers.get("content-security-policy")!.includes("sandbox"));
      assert.deepEqual(Buffer.from(await got.arrayBuffer()), PNG);
      // /users/me 의 매장에도 logoUrl 이 오고, 로고 바이트는 오지 않는다
      const me = await alba.req("GET", "/api/users/me");
      assert.equal(me.body.membership.store.logoUrl, up.body.logoUrl);
      assert.equal("logo" in me.body.membership.store, false);

      // LG-2 이름만 PNG 인 텍스트, 형식 불일치
      assert.equal((await master.raw("PUT", "/api/stores/me/logo", Buffer.from("not a png"), "image/png")).body.code, "LOGO_INVALID");
      assert.equal((await master.raw("PUT", "/api/stores/me/logo", PNG, "image/jpeg")).body.code, "LOGO_INVALID");
      // LG-3 위험한 SVG 는 거부
      for (const bad of [
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.test/x.png"/></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div/></foreignObject></svg>',
        '<html><svg/></html>',
      ]) assert.equal((await master.raw("PUT", "/api/stores/me/logo", Buffer.from(bad), "image/svg+xml")).body?.code, "LOGO_INVALID", bad);
      // 허용 목록 밖 종류는 본문을 읽지 않아 비어 있다 → LOGO_INVALID
      assert.equal((await master.raw("PUT", "/api/stores/me/logo", PNG, "image/gif")).body.code, "LOGO_INVALID");

      // LG-4 1MB 초과 413
      const big = Buffer.concat([PNG, Buffer.alloc(1024 * 1024)]);
      const tooBig = await master.raw("PUT", "/api/stores/me/logo", big, "image/png");
      assert.equal(tooBig.status, 413);

      // LG-6 멤버는 못 올린다, CSRF 없이 403
      assert.equal((await alba.raw("PUT", "/api/stores/me/logo", PNG, "image/png")).status, 403);
      const noCsrf = await fetch(API + "/api/stores/me/logo", { method: "PUT", headers: { Origin: ORIGIN, Cookie: [...master.jar].map(([k, v]) => `${k}=${v}`).join("; "), "Content-Type": "image/png" }, body: new Uint8Array(PNG) });
      assert.equal(noCsrf.status, 403);
      assert.equal((await fetch(API + "/api/stores/me/logo")).status, 401);

      // LG-7 SVG 로 교체 → 주소 바뀜, 지우면 null·404
      const svgUp = await master.raw("PUT", "/api/stores/me/logo", SVG, "image/svg+xml");
      assert.equal(svgUp.status, 200);
      assert.notEqual(svgUp.body.logoUrl, up.body.logoUrl);
      assert.equal((await master.req("DELETE", "/api/stores/me/logo")).status, 204);
      assert.equal((await master.req("GET", "/api/stores/me")).body.logoUrl, null);
      assert.equal((await master.req("GET", "/api/stores/me/logo")).status, 404);
    });
  });
}
