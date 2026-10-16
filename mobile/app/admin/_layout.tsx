// 마스터(사장님) 화면 — 탭 화면들 위에 하위 화면(멤버 근무 기록·초대 코드)이 쌓인다. 마스터가 아니면 맞는 화면으로 보낸다 (docs/prd/07 D-5)
import { Redirect, Stack } from "expo-router";
import { useArea } from "@/auth/hooks";
import { C } from "@/theme";

export default function AdminLayout() {
  const { me, redirect } = useArea("master");
  if (redirect) return <Redirect href={redirect} />;
  if (!me?.membership) return null;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.background } }} />;
}
