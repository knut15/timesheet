// 초대 링크 timesheet://join?code=XXXX — 코드를 기억해 두고 로그인·가입을 거쳐 온보딩에서 채워 준다 (docs/prd/06)
import { Redirect, useLocalSearchParams } from "expo-router";
import { homeOf } from "@/auth/hooks";
import { useSession } from "@/auth/session";
import { rememberInviteCode } from "@/lib/invite";

export default function Join() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  if (code) rememberInviteCode(code);
  const home = homeOf(useSession());
  return home ? <Redirect href={home} /> : null;
}
