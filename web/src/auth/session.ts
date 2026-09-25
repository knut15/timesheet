// 인증 세션 — 쿠키판. 규칙은 .claude/skills/timesheet-auth/SKILL.md (web-auth 스킬의 cookie-session 변형).
// 액세스·리프레시 토큰은 둘 다 HttpOnly 쿠키라 JS 는 토큰을 보지 않는다. 이 모듈이 아는 것은 "누가 로그인했나" 와 CSRF 토큰뿐이다.
import { authApi, errorCode, type ErrorResponse, type Me } from "@/api/client";

export type SessionState =
  | { status: "unknown" }
  | { status: "authenticated"; me: Me }
  | { status: "anonymous"; reason?: "logout" | "expired" | "reused" };

let state: SessionState = { status: "unknown" };
let csrfToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

// 서버 렌더에서도 이 모듈이 평가된다. 브라우저 전용 객체는 처음 쓸 때 만든다.
let channel: BroadcastChannel | null = null;
function getChannel() {
  if (!channel && typeof window !== "undefined") {
    channel = new BroadcastChannel("auth");
    channel.onmessage = (event: MessageEvent<{ type: "login" | "logout" }>) => {
      if (event.data.type === "logout") dropSession("logout");
      if (event.data.type === "login") void bootSession();
    };
  }
  return channel;
}

export const getSession = () => state;
export const getServerSession = (): SessionState => ({ status: "unknown" });
export const subscribe = (fn: () => void) => {
  getChannel();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

function setState(next: SessionState) {
  state = next;
  listeners.forEach((fn) => fn());
}

function dropSession(reason?: "logout" | "expired" | "reused") {
  setState({ status: "anonymous", reason });
}

/** 쿠키로 /users/me 를 읽는다. 액세스 토큰이 만료됐으면 401. */
async function fetchMe(): Promise<{ me: Me | null; status: number }> {
  const res = await fetch("/api/users/me", { credentials: "include" });
  return { me: res.ok ? ((await res.json()) as Me) : null, status: res.status };
}

async function loadMe(): Promise<boolean> {
  const { me } = await fetchMe();
  if (me) setState({ status: "authenticated", me });
  return !!me;
}

/**
 * 부팅 — 로그인 유지의 핵심. 액세스 쿠키가 살아 있으면 바로, 만료됐으면 refresh 한 번 뒤 다시 읽는다.
 * refresh 쿠키가 30일 슬라이딩이라 앱을 계속 쓰는 한 다시 로그인할 일이 없다.
 */
export async function bootSession(): Promise<void> {
  try {
    const { me, status } = await fetchMe();
    if (me) return setState({ status: "authenticated", me });
    if (status === 401 && (await refreshSession())) return;
    if (state.status === "unknown") dropSession();
  } catch {
    // API 에 닿지 못했다. "확인 중" 에 멈추지 않게 익명으로 둔다
    if (state.status === "unknown") dropSession();
  }
}

/** 매장을 만들거나 코드를 등록해 소속이 바뀐 뒤 부른다. */
export async function reloadMe() {
  await loadMe();
}

async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  const { data } = await authApi.GET("/api/auth/csrf");
  csrfToken = data!.csrfToken;
  return csrfToken;
}

/** single-flight + 탭 간 잠금. 성공하면 true. 탭끼리 쿠키를 공유하므로 잠금 없이는 재사용 탐지가 오탐한다. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= navigator.locks
    .request("auth-refresh", () => runRefresh(false))
    // lib.dom 타입은 콜백의 Promise 를 한 겹 더 감싼다. 실제 값은 boolean 이다 — then 으로 타입을 풀어 준다.
    .then((ok) => ok)
    .catch(() => false)
    .finally(() => (refreshing = null));
  return refreshing!;
}

/** CSRF 토큰이 쿠키와 어긋나면(쿠키 만료·서버 비밀 교체) 새로 받아 한 번만 다시 보낸다. */
async function withCsrf<T extends { error?: unknown }>(send: (csrf: string) => Promise<T>): Promise<T> {
  const first = await send(await ensureCsrf());
  if (errorCode(first.error) !== "CSRF_TOKEN_INVALID") return first;
  csrfToken = null;
  return send(await ensureCsrf());
}

async function runRefresh(retried: boolean): Promise<boolean> {
  const { data, error, response } = await withCsrf((csrf) =>
    authApi.POST("/api/auth/refresh", { params: { header: { "x-csrf-token": csrf } } }),
  );
  if (data) return loadMe();
  if (!retried && response.status === 409) return runRefresh(true);
  // 부팅 때 쿠키가 없던 것(처음 방문)과 로그인 중에 만료된 것을 구분한다
  const wasIn = state.status === "authenticated";
  dropSession(errorCode(error) === "REFRESH_TOKEN_REUSED" ? "reused" : wasIn ? "expired" : undefined);
  return false;
}

export async function signup(email: string, password: string, nickname: string): Promise<ErrorResponse | null> {
  const { error } = await withCsrf((csrf) =>
    authApi.POST("/api/auth/signup", { body: { email, password, nickname }, params: { header: { "x-csrf-token": csrf } } }),
  );
  if (error) return error as ErrorResponse;
  return login(email, password);
}

export async function login(email: string, password: string): Promise<ErrorResponse | null> {
  const { data, error } = await withCsrf((csrf) =>
    authApi.POST("/api/auth/login", { body: { email, password }, params: { header: { "x-csrf-token": csrf } } }),
  );
  if (!data) return error as ErrorResponse;
  await loadMe();
  getChannel()?.postMessage({ type: "login" });
  return null;
}

export async function logout(): Promise<void> {
  await withCsrf((csrf) => authApi.POST("/api/auth/logout", { params: { header: { "x-csrf-token": csrf } } }));
  dropSession("logout");
  getChannel()?.postMessage({ type: "logout" });
}

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * openapi-fetch 의 fetch 자리에 끼운다.
 * - 변경 요청에는 X-CSRF-Token 을 붙인다 (쿠키 인증이라 서버가 모든 변경 요청을 검사한다)
 * - 401 이면 refresh 후 1회, CSRF 불일치면 토큰을 새로 받아 1회 재시도
 */
export async function authFetch(request: Request): Promise<Response> {
  const unsafe = UNSAFE.has(request.method);
  const retry = request.clone(); // 본문은 한 번만 읽힌다 — 보내기 전에 복제해 둔다
  const send = async (r: Request) => {
    if (unsafe) r.headers.set("X-CSRF-Token", await ensureCsrf());
    return fetch(r, { credentials: "include" });
  };
  const response = await send(request);
  if (response.status === 403 && unsafe && (await response.clone().json().catch(() => null))?.code === "CSRF_TOKEN_INVALID") {
    csrfToken = null;
    return send(retry);
  }
  if (response.status !== 401) return response;
  if (!(await refreshSession())) return response;
  return send(retry);
}
