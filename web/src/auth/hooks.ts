"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { Me } from "@/api/client";
import { getServerSession, getSession, refreshSession, subscribe, type SessionState } from "./session";

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSession, getServerSession);
}

/** 앱 최상단에서 한 번. 새로고침 뒤 로그인 상태를 되살리는 조용한 갱신. */
export function useBootSession() {
  useEffect(() => {
    void refreshSession(); // StrictMode 의 두 번째 호출은 같은 promise 를 받는다
  }, []);
}

export type Area = "member" | "master" | "onboarding" | "guest";

/** 로그인·소속·역할에 맞는 첫 화면. */
export function homeOf(session: SessionState): string | null {
  if (session.status === "unknown") return null;
  if (session.status === "anonymous") return "/login";
  const m = session.me.membership;
  if (!m) return "/onboarding";
  return m.role === "master" ? "/admin" : "/";
}

const areaOfHome: Record<string, Area> = { "/login": "guest", "/onboarding": "onboarding", "/admin": "master", "/": "member" };

/**
 * 이 화면에 있어도 되는 사용자면 me 를, 아니면 null 을 돌려주고 맞는 화면으로 보낸다.
 * unknown 동안에는 아무것도 하지 않는다 — 곧장 보내면 새로고침마다 로그인 화면이 깜빡인다.
 */
export function useArea(area: Area): { session: SessionState; me: Me | null } {
  const session = useSession();
  const router = useRouter();
  const home = homeOf(session);
  const allowed = home !== null && areaOfHome[home] === area;
  useEffect(() => {
    if (home !== null && !allowed) router.replace(home);
  }, [home, allowed, router]);
  return { session, me: allowed && session.status === "authenticated" ? session.me : null };
}
