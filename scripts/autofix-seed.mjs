// autofix 순회용 계정 시드. AUTOFIX_STATE_DIR 에 master.json·member.json (Playwright storageState) 을 만든다.
// 두 번 돌려도 같은 계정·매장을 쓴다. 웹의 rewrite 를 거치지 않고 로컬 API(4200)에 직접 요청한다
// (server/test/e2e.test.ts 의 Client 와 같은 방식: Origin 헤더, CSRF 토큰, Set-Cookie 를 모아 다음 요청에 싣는다).
import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const stateDir = process.env.AUTOFIX_STATE_DIR;
if (!stateDir) throw new Error("AUTOFIX_STATE_DIR 가 없습니다");
mkdirSync(stateDir, { recursive: true });

const API = "http://localhost:4200";
const ORIGIN = "http://localhost:3200";
const PASSWORD = "autofix-pass-1234";
const ACCOUNTS = [
  { key: "master", email: "autofix-master@test.dev", nickname: "사장" },
  { key: "member", email: "autofix-member@test.dev", nickname: "알바" },
];

// Set-Cookie 한 줄을 Playwright storageState 의 쿠키 모양으로 바꾼다
function parseSetCookie(line) {
  const [pair, ...attrs] = line.split(";").map((s) => s.trim());
  const eq = pair.indexOf("=");
  const cookie = {
    name: pair.slice(0, eq),
    value: pair.slice(eq + 1),
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
    expires: -1,
  };
  for (const attr of attrs) {
    const [k, ...rest] = attr.split("=");
    const v = rest.join("=");
    switch (k.toLowerCase()) {
      case "path": cookie.path = v; break;
      case "httponly": cookie.httpOnly = true; break;
      case "secure": cookie.secure = true; break;
      case "samesite": cookie.sameSite = v[0].toUpperCase() + v.slice(1).toLowerCase(); break;
      case "max-age": cookie.expires = Math.floor(Date.now() / 1000) + Number(v); break;
      case "expires": if (cookie.expires === -1) cookie.expires = Math.floor(Date.parse(v) / 1000); break;
    }
  }
  return cookie;
}

class Client {
  jar = new Map(); // name → storageState 쿠키
  csrf = null;

  async req(method, path, body) {
    if (method !== "GET") this.csrf ??= (await this.req("GET", "/api/auth/csrf")).json.csrfToken;
    const headers = { Origin: ORIGIN };
    if (this.jar.size) headers.Cookie = [...this.jar.values()].map((c) => `${c.name}=${c.value}`).join("; ");
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (method !== "GET") headers["X-CSRF-Token"] = this.csrf;
    const res = await fetch(API + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const line of res.headers.getSetCookie()) {
      const cookie = parseSetCookie(line);
      if (cookie.value === "" || (cookie.expires !== -1 && cookie.expires <= Date.now() / 1000)) this.jar.delete(cookie.name);
      else this.jar.set(cookie.name, cookie);
    }
    const text = await res.text();
    return { status: res.status, json: text ? JSON.parse(text) : null };
  }
}

let inviteCode = null;
for (const account of ACCOUNTS) {
  const client = new Client();
  const must = (res, what) => {
    if (res.status >= 400) throw new Error(`${account.key} ${what} 실패: ${res.status} ${JSON.stringify(res.json)}`);
    return res.json;
  };

  const credentials = { email: account.email, password: PASSWORD };
  let created = false;
  let res = await client.req("POST", "/api/auth/login", credentials);
  if (res.status === 401) {
    must(await client.req("POST", "/api/auth/signup", { ...credentials, nickname: account.nickname }), "signup");
    res = await client.req("POST", "/api/auth/login", credentials);
    created = true;
  }
  must(res, "login");
  const me = must(await client.req("GET", "/api/users/me"), "me");

  if (account.key === "master") {
    let storeCreated = false;
    if (!me.membership) {
      must(await client.req("POST", "/api/stores", { name: "autofix 매장" }), "매장 만들기");
      storeCreated = true;
    }
    inviteCode = must(await client.req("POST", "/api/stores/me/invites", {}), "초대 코드").code;
    console.log(`master ${created ? "created" : "reused"} (store ${storeCreated ? "created" : "reused"})`);
  } else {
    let joined = false;
    if (!me.membership) {
      must(await client.req("POST", "/api/invites/redeem", { code: inviteCode }), "초대 등록");
      joined = true;
    }
    console.log(`member ${created ? "created" : "reused"} (membership ${joined ? "created" : "reused"})`);
  }
  writeFileSync(join(stateDir, `${account.key}.json`), JSON.stringify({ cookies: [...client.jar.values()], origins: [] }, null, 2));
}
