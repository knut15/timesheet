// 네이티브 앱 토큰 방식 e2e (docs/prd/14-native-app.md 의 N1~N8). 실행 중인 API 에 대고 돈다.
//   서버: pnpm dev  →  pnpm exec tsx --test test/native.test.ts
// 앱은 쿠키가 없다 — X-Client: native 를 붙이면 토큰이 본문으로 오고, API 는 Authorization: Bearer 로 부른다. CSRF 검사는 없다.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, test } from "node:test";
import { prisma } from "../src/db.js";

const API = process.env.API ?? "http://localhost:4200";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ipSeq = 1;

type Res = { status: number; body: any; setCookies: string[] };

/** 앱 역할: 쿠키 저장소가 없다. Origin 도 보내지 않는다 (앱의 fetch 는 Origin 을 싣지 않는다) */
class App {
  ip = `10.9.0.${ipSeq++}`;
  access: string | null = null;
  refresh: string | null = null;

  async req(method: string, path: string, o: { body?: unknown; bearer?: string | null; native?: boolean; headers?: Record<string, string> } = {}): Promise<Res> {
    const headers: Record<string, string> = { "X-Forwarded-For": this.ip };
    if (o.native ?? true) headers["X-Client"] = "native";
    const bearer = o.bearer === undefined ? this.access : o.bearer;
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
    if (o.body !== undefined) headers["Content-Type"] = "application/json";
    Object.assign(headers, o.headers);
    const res = await fetch(API + path, { method, headers, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, setCookies: res.headers.getSetCookie() };
  }

  async signupLogin() {
    const email = `${randomUUID()}@test.dev`;
    const password = "password-1234";
    assert.equal((await this.req("POST", "/api/auth/signup", { body: { email, password, nickname: "앱" } })).status, 201);
    const r = await this.req("POST", "/api/auth/login", { body: { email, password } });
    assert.equal(r.status, 200);
    this.access = r.body.accessToken;
    this.refresh = r.body.refreshToken;
    return { email, password, login: r };
  }
}

after(async () => {
  await prisma.$disconnect();
});

describe("네이티브 토큰 방식", () => {
  test("N1 로그인 — 토큰이 본문으로 오고 쿠키는 없다", async () => {
    const app = new App();
    const { login } = await app.signupLogin();
    assert.equal(login.setCookies.length, 0);
    assert.equal(typeof login.body.accessToken, "string");
    assert.equal(typeof login.body.refreshToken, "string");
    assert.ok(!Number.isNaN(Date.parse(login.body.refreshExpiresAt)));
    assert.equal(login.body.expiresIn, 600);
  });

  test("N2 Bearer 로 /users/me 200 — X-Client 없이 Bearer 만이면 401 (웹 규칙 그대로)", async () => {
    const app = new App();
    await app.signupLogin();
    assert.equal((await app.req("GET", "/api/users/me")).status, 200);
    const web = await app.req("GET", "/api/users/me", { native: false });
    assert.equal(web.status, 401);
    assert.equal(web.body.code, "ACCESS_TOKEN_INVALID");
  });

  test("N3 X-Client: native 면 access_token 쿠키는 보지 않는다", async () => {
    const app = new App();
    await app.signupLogin();
    const r = await app.req("GET", "/api/users/me", { bearer: null, headers: { Cookie: `access_token=${app.access}` } });
    assert.equal(r.status, 401);
  });

  test("N4 변경 요청에 Origin·CSRF 없이 통과 — 매장 만들기 201", async () => {
    const app = new App();
    await app.signupLogin();
    const r = await app.req("POST", "/api/stores", { body: { name: `앱 매장 ${randomUUID().slice(0, 6)}` } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
  });

  test("N5 같은 요청을 X-Client 없이 보내면 CSRF 로 막힌다", async () => {
    const app = new App();
    await app.signupLogin();
    const r = await app.req("POST", "/api/stores", { native: false, body: { name: "x" } });
    assert.equal(r.status, 403);
    assert.match(r.body.code, /^CSRF_/);
  });

  test("N6 회전 — 본문 refreshToken 으로 새 두 토큰, 옛 것을 grace 안에 다시 쓰면 409", async () => {
    const app = new App();
    await app.signupLogin();
    const old = app.refresh!;
    const r = await app.req("POST", "/api/auth/refresh", { bearer: null, body: { refreshToken: old } });
    assert.equal(r.status, 200);
    assert.equal(r.setCookies.length, 0);
    assert.notEqual(r.body.refreshToken, old);
    app.access = r.body.accessToken;
    app.refresh = r.body.refreshToken;
    assert.equal((await app.req("GET", "/api/users/me")).status, 200);
    const again = await app.req("POST", "/api/auth/refresh", { bearer: null, body: { refreshToken: old } });
    assert.equal(again.status, 409);
    assert.equal(again.body.code, "REFRESH_TOKEN_ROTATED");
  });

  test("N7 grace(10초) 뒤 옛 토큰 재사용 → 401 REUSED, 세션 전체 폐기", async () => {
    const app = new App();
    await app.signupLogin();
    const old = app.refresh!;
    const r = await app.req("POST", "/api/auth/refresh", { bearer: null, body: { refreshToken: old } });
    assert.equal(r.status, 200);
    await sleep(11_000);
    const reused = await app.req("POST", "/api/auth/refresh", { bearer: null, body: { refreshToken: old } });
    assert.equal(reused.status, 401);
    assert.equal(reused.body.code, "REFRESH_TOKEN_REUSED");
    const latest = await app.req("POST", "/api/auth/refresh", { bearer: null, body: { refreshToken: r.body.refreshToken } });
    assert.equal(latest.status, 401);
  });

  test("N8 로그아웃 — 본문 refreshToken 의 세션을 끊는다. 쿠키를 지우는 Set-Cookie 도 없다", async () => {
    const app = new App();
    await app.signupLogin();
    const out = await app.req("POST", "/api/auth/logout", { body: { refreshToken: app.refresh } });
    assert.equal(out.status, 204);
    assert.equal(out.setCookies.length, 0);
    const r = await app.req("POST", "/api/auth/refresh", { bearer: null, body: { refreshToken: app.refresh } });
    assert.equal(r.status, 401);
  });

  test("N9 본문 없이 refresh → 401 REFRESH_TOKEN_INVALID", async () => {
    const app = new App();
    const r = await app.req("POST", "/api/auth/refresh", { bearer: null });
    assert.equal(r.status, 401);
    assert.equal(r.body.code, "REFRESH_TOKEN_INVALID");
  });
});
