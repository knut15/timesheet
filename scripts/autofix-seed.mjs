// autofix 순회용 계정 시드. AUTOFIX_STATE_DIR 에 master.json·member.json (Playwright storageState) 을 만든다.
// 두 번 돌려도 같은 계정·매장을 쓴다. playwright 는 autofix 저장소 것을 빌려 쓴다 (AUTOFIX_HOME, 기본 ~/Workspace/autofix).
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

const autofixHome = process.env.AUTOFIX_HOME ?? join(homedir(), "Workspace", "autofix");
const { chromium } = createRequire(join(autofixHome, "package.json"))("playwright");

const stateDir = process.env.AUTOFIX_STATE_DIR;
if (!stateDir) throw new Error("AUTOFIX_STATE_DIR 가 없습니다");
mkdirSync(stateDir, { recursive: true });

const BASE = "http://localhost:3200";
const PASSWORD = "autofix-pass-1234";
const ACCOUNTS = [
  { key: "master", email: "autofix-master@test.dev", nickname: "사장" },
  { key: "member", email: "autofix-member@test.dev", nickname: "알바" },
];

const browser = await chromium.launch();
try {
  let inviteCode = null;
  for (const account of ACCOUNTS) {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    // 브라우저 안에서 fetch 해 쿠키·Origin 을 실제 화면처럼 처리한다
    const call = (method, path, body, csrf) =>
      page.evaluate(
        async ([method, path, body, csrf]) => {
          const res = await fetch(path, {
            method,
            credentials: "include",
            headers: { ...(body ? { "content-type": "application/json" } : {}), ...(csrf ? { "x-csrf-token": csrf } : {}) },
            body: body ? JSON.stringify(body) : undefined,
          });
          return { status: res.status, json: await res.json().catch(() => null) };
        },
        [method, path, body, csrf],
      );
    const must = (res, what) => {
      if (res.status >= 400) throw new Error(`${account.key} ${what} 실패: ${res.status} ${JSON.stringify(res.json)}`);
      return res.json;
    };

    const csrf = must(await call("GET", "/api/auth/csrf"), "csrf").csrfToken;
    const credentials = { email: account.email, password: PASSWORD };
    let created = false;
    let res = await call("POST", "/api/auth/login", credentials, csrf);
    if (res.status === 401) {
      must(await call("POST", "/api/auth/signup", { ...credentials, nickname: account.nickname }, csrf), "signup");
      res = await call("POST", "/api/auth/login", credentials, csrf);
      created = true;
    }
    must(res, "login");
    const me = must(await call("GET", "/api/users/me"), "me");

    if (account.key === "master") {
      let storeCreated = false;
      if (!me.membership) {
        must(await call("POST", "/api/stores", { name: "autofix 매장" }, csrf), "매장 만들기");
        storeCreated = true;
      }
      inviteCode = must(await call("POST", "/api/stores/me/invites", {}, csrf), "초대 코드").code;
      console.log(`master ${created ? "created" : "reused"} (store ${storeCreated ? "created" : "reused"})`);
    } else {
      let joined = false;
      if (!me.membership) {
        must(await call("POST", "/api/invites/redeem", { code: inviteCode }, csrf), "초대 등록");
        joined = true;
      }
      console.log(`member ${created ? "created" : "reused"} (membership ${joined ? "created" : "reused"})`);
    }
    await context.storageState({ path: join(stateDir, `${account.key}.json`) });
    await context.close();
  }
} finally {
  await browser.close();
}
