// 로그인·소속·역할에 맞는 첫 화면 — 웹 web/src/auth/hooks.ts 의 homeOf 와 같은 규칙.
import type { Me } from "@/api/client";
import { useSession, type SessionState } from "./session";

export type Area = "member" | "master" | "onboarding" | "guest";
export type Home = "/login" | "/onboarding" | "/admin" | "/member";

export function homeOf(session: SessionState): Home | null {
  if (session.status === "unknown") return null;
  if (session.status === "anonymous") return "/login";
  const m = session.me.membership;
  if (!m) return "/onboarding";
  return m.role === "master" ? "/admin" : "/member";
}

const areaOfHome: Record<Home, Area> = { "/login": "guest", "/onboarding": "onboarding", "/admin": "master", "/member": "member" };

/** 이 화면에 있어도 되면 me 를, 아니면 갈 곳(redirect)을 준다. 확인 중(unknown)이면 둘 다 null */
export function useArea(area: Area): { session: SessionState; me: Me | null; redirect: Home | null } {
  const session = useSession();
  const home = homeOf(session);
  const allowed = home !== null && areaOfHome[home] === area;
  return { session, me: allowed && session.status === "authenticated" ? session.me : null, redirect: home !== null && !allowed ? home : null };
}
