import { Redirect } from "expo-router";
import { homeOf } from "@/auth/hooks";
import { useSession } from "@/auth/session";

/** 첫 화면 — 로그인·소속·역할에 맞는 곳으로 보낸다 */
export default function Index() {
  const home = homeOf(useSession());
  return home ? <Redirect href={home} /> : null;
}
