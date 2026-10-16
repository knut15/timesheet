// 인증 세션 — 앱 토큰판 (docs/prd/14-native-app.md, 2026-10-15 사용자 결정 "앱 전용 토큰 방식 추가").
// 웹은 두 토큰이 HttpOnly 쿠키다. 앱에는 쿠키가 없어 서버가 토큰을 본문으로 준다.
// - 액세스 토큰(10분): 메모리에만 둔다
// - 리프레시 토큰(30일 슬라이딩): 기기 보안 저장소(iOS Keychain / Android Keystore, expo-secure-store)에 둔다
// 회전·재사용 탐지·grace 는 서버가 웹과 똑같이 한다. 앱은 한 번에 하나만 refresh 한다(single-flight).
import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";
import { forgetStoreGeofence } from "@/lib/geofence";
import type { components } from "../../../web/src/api/schema";

type Me = components["schemas"]["MeDto"];
type ErrorResponse = components["schemas"]["ErrorResponse"];
type NativeSession = components["schemas"]["NativeSessionResponse"];

/** 개발 빌드는 이 Mac 의 API(시뮬레이터에서 localhost 가 Mac 이다), 배포 빌드는 운영 API. EXPO_PUBLIC_API_URL 로 덮을 수 있다 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? "http://localhost:4200" : "https://timesheet-api-hazel.vercel.app");

const REFRESH_KEY = "timesheet.refresh";
const NATIVE = { "X-Client": "native" } as const;

export type SessionState =
  | { status: "unknown" }
  | { status: "authenticated"; me: Me }
  | { status: "anonymous"; reason?: "logout" | "expired" | "reused" };

let state: SessionState = { status: "unknown" };
let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

export const getSession = () => state;
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const useSession = () => useSyncExternalStore(subscribe, getSession, getSession);

/** 지금 액세스 토큰 — 로고처럼 fetch 밖에서 인증 헤더가 필요한 곳(Image)에 쓴다 */
export const authHeaders = (): Record<string, string> => (accessToken ? { ...NATIVE, Authorization: `Bearer ${accessToken}` } : { ...NATIVE });

function setState(next: SessionState) {
  state = next;
  listeners.forEach((fn) => fn());
}

async function dropSession(reason?: "logout" | "expired" | "reused") {
  accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await forgetStoreGeofence().catch(() => {});
  setState({ status: "anonymous", reason });
}

async function post(path: string, body?: unknown) {
  const res = await fetch(API_URL + path, {
    method: "POST",
    headers: { ...NATIVE, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function keep(s: NativeSession) {
  accessToken = s.accessToken;
  await SecureStore.setItemAsync(REFRESH_KEY, s.refreshToken);
}

async function fetchMe(): Promise<{ me: Me | null; status: number }> {
  const res = await fetch(`${API_URL}/api/users/me`, { headers: authHeaders() });
  return { me: res.ok ? ((await res.json()) as Me) : null, status: res.status };
}

async function loadMe(): Promise<boolean> {
  const { me } = await fetchMe();
  if (me) setState({ status: "authenticated", me });
  return !!me;
}

/** 부팅 — 저장소에 리프레시 토큰이 있으면 회전해서 액세스 토큰을 받고 /users/me 를 읽는다. 앱을 쓰는 한 다시 로그인할 일이 없다 */
export async function bootSession(): Promise<void> {
  try {
    if (await refreshSession()) return;
  } catch {
    // API 에 닿지 못했다. "확인 중" 에 멈추지 않게 익명으로 둔다
  }
  if (state.status === "unknown") setState({ status: "anonymous" });
}

/** 매장을 만들거나 코드를 등록해 소속이 바뀐 뒤 부른다 */
export async function reloadMe() {
  await loadMe();
}

/** single-flight. 성공하면 true */
export function refreshSession(): Promise<boolean> {
  refreshing ??= runRefresh(false).finally(() => (refreshing = null));
  return refreshing;
}

async function runRefresh(retried: boolean): Promise<boolean> {
  const token = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!token) return false;
  const r = await post("/api/auth/refresh", { refreshToken: token });
  if (r.status === 200) {
    await keep(r.body as NativeSession);
    return loadMe();
  }
  // 409: 같은 토큰으로 방금 회전이 끝났다. 저장소의 새 토큰으로 한 번만 다시
  if (!retried && r.status === 409) return runRefresh(true);
  // 401·409 만 세션이 끝난 것이다. 5xx·429 같은 일시 오류에 토큰을 지우면 서버 세션이 살아 있는데도 다시 로그인해야 한다
  if (r.status !== 401 && r.status !== 409) throw new Error(`refresh ${r.status}`);
  const wasIn = state.status === "authenticated";
  await dropSession((r.body as ErrorResponse | null)?.code === "REFRESH_TOKEN_REUSED" ? "reused" : wasIn ? "expired" : undefined);
  return false;
}

export async function signup(email: string, password: string, nickname: string): Promise<ErrorResponse | null> {
  const r = await post("/api/auth/signup", { email, password, nickname });
  if (r.status !== 201) return r.body as ErrorResponse;
  return login(email, password);
}

export async function login(email: string, password: string): Promise<ErrorResponse | null> {
  const r = await post("/api/auth/login", { email, password });
  if (r.status !== 200) return r.body as ErrorResponse;
  await keep(r.body as NativeSession);
  await loadMe();
  return null;
}

export async function logout(): Promise<void> {
  const token = await SecureStore.getItemAsync(REFRESH_KEY);
  if (token) await post("/api/auth/logout", { refreshToken: token }).catch(() => null);
  await dropSession("logout");
}

/**
 * openapi-fetch 의 fetch 자리에 끼운다. X-Client·Authorization 을 싣고, 401 이면 refresh 후 1회 재시도.
 * CSRF 는 없다 — 서버가 X-Client: native 요청은 검사하지 않는다 (쿠키를 쓰지 않으므로).
 */
export async function nativeFetch(request: Request): Promise<Response> {
  const retry = request.clone(); // 본문은 한 번만 읽힌다 — 보내기 전에 복제해 둔다
  const send = (r: Request) => {
    for (const [k, v] of Object.entries(authHeaders())) r.headers.set(k, v);
    return fetch(r);
  };
  const response = await send(request);
  if (response.status !== 401) return response;
  if (!(await refreshSession())) return response;
  return send(retry);
}
