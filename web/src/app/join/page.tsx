"use client";
// 초대 링크 /join?code=XXXX — 코드를 잠시 기억해 두고 로그인·가입을 거쳐 온보딩에서 채워 준다. docs/prd/06
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { homeOf, useSession } from "@/auth/hooks";
import { Spinner } from "@/components/ui";
import { rememberInviteCode } from "@/lib/inviteLink";

function Join() {
  const params = useSearchParams();
  const session = useSession();
  const router = useRouter();
  const code = params.get("code");
  useEffect(() => {
    if (code) rememberInviteCode(code);
  }, [code]);
  useEffect(() => {
    const home = homeOf(session);
    if (home) router.replace(home); // 익명이면 /login → 가입 → /onboarding 에서 코드가 채워진다
  }, [session, router]);
  return <Spinner />;
}

export default function JoinPage() {
  // useSearchParams 는 정적 렌더에서 Suspense 경계가 필요하다
  return (
    <Suspense fallback={<Spinner />}>
      <Join />
    </Suspense>
  );
}
