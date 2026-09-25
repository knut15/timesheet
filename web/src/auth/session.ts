// 인증 세션. web-auth 스킬 frontend.md 의 규칙을 따른다.
// 액세스 토큰은 이 모듈의 변수(메모리)에만 있다. 리프레시 토큰은 HttpOnly 쿠키라 JS 가 다루지 않는다.
import { authApi, errorCode, type ErrorResponse, type Me, type TokenResponse } from "@/api/client";

export type SessionState =
  | { status: "unknown" }
  | { status: "authenticated"; me: Me }
  | { status: "anonymous"; reason?: "logout" | "expired" | "reused" };

let state: SessionState = { status: "unknown" };
let accessToken: string | null = null;
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
      if (event.data.type === "login") void refreshSession();
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

async function fetchMe(): Promise<Me | null> {
  if (!accessToken) return null;
  const res = await fetch("/api/users/me", { headers: { Authorization: `Bearer ${accessToken}` }, credentials: "include" });
  return res.ok ? ((await res.json()) as Me) : null;
}

/** 토큰을 받은 뒤 소속까지 읽어야 화면이 역할에 맞게 갈린다. */
async function acceptTokens(body: TokenResponse) {
  accessToken = body.accessToken;
  const me = await fetchMe();
  if (me) setState({ status: "authenticated", me });
  else dropSession();
}

/** 매장을 만들거나 코드를 등록해 소속이 바뀐 뒤 부른다. */
export async function reloadMe() {
  const me = await fetchMe();
  if (me) setState({ status: "authenticated", me });
}

function dropSession(reason?: "logout" | "expired" | "reused") {
  accessToken = null;
  setState({ status: "anonymous", reason });
}

async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  const { data } = await authApi.GET("/api/auth/csrf");
  csrfToken = data!.csrfToken;
  return csrfToken;
}

/** single-flight + 탭 간 잠금. 성공하면 true. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= navigator.locks
    .request("auth-refresh", () => runRefresh(false))
    // lib.dom 타입은 콜백의 Promise 를 한 겹 더 감싼다. 실제 값은 boolean 이다 — then 으로 타입을 풀어 준다.
    .then((ok) => ok)
    .catch(() => {
      // API 에 닿지 못했다. 부팅 중이면 "확인 중" 에 멈추지 않게 익명으로 둔다
      if (state.status === "unknown") dropSession();
      return false;
    })
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
  if (data) {
    await acceptTokens(data);
    return true;
  }
  if (!retried && response.status === 409) return runRefresh(true);
  // 부팅 때 쿠키가 없던 것(처음 방문)과 로그인 중에 만료된 것을 구분한다
  const wasIn = state.status === "authenticated";
  dropSession(errorCode(error) === "REFRESH_TOKEN_REUSED" ? "reused" : wasIn ? "expired" : undefined);
  return false;
}

export async function signup(email: string, password: string, nickname: string): Promise<ErrorResponse | null> {
  const { error } = await authApi.POST("/api/auth/signup", { body: { email, password, nickname } });
  if (error) return error as ErrorResponse;
  return login(email, password);
}

export async function login(email: string, password: string): Promise<ErrorResponse | null> {
  const { data, error } = await withCsrf((csrf) =>
    authApi.POST("/api/auth/login", { body: { email, password }, params: { header: { "x-csrf-token": csrf } } }),
  );
  if (!data) return error as ErrorResponse;
  await acceptTokens(data);
  getChannel()?.postMessage({ type: "login" });
  return null;
}

export async function logout(): Promise<void> {
  await withCsrf((csrf) => authApi.POST("/api/auth/logout", { params: { header: { "x-csrf-token": csrf } } }));
  dropSession("logout");
  getChannel()?.postMessage({ type: "logout" });
}

function withAuth(request: Request): Request {
  if (accessToken) request.headers.set("Authorization", `Bearer ${accessToken}`);
  return request;
}

/** openapi-fetch 의 fetch 자리에 끼운다. 401 이면 refresh 후 1회 재시도. */
export async function authFetch(request: Request): Promise<Response> {
  const retry = request.clone(); // 본문은 한 번만 읽힌다 — 보내기 전에 복제해 둔다
  const response = await fetch(withAuth(request));
  if (response.status !== 401) return response;
  if (!(await refreshSession())) return response;
  return fetch(withAuth(retry));
}
