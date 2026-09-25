"use client";
// 가입 뒤 소속이 없는 사용자. 매장을 만들면 마스터, 초대 코드를 등록하면 멤버. docs/prd/06-store-invite.md
import { useState } from "react";
import { api, errorCode } from "@/api/client";
import { useArea } from "@/auth/hooks";
import { logout, reloadMe } from "@/auth/session";
import { Card, ErrorText, Field, Spinner } from "@/components/ui";

const MESSAGES: Record<string, string> = {
  INVITE_INVALID: "사용할 수 없는 코드예요. 사장님께 새 코드를 받아 주세요.",
  TOO_MANY_REQUESTS: "시도가 너무 많아요. 1분 뒤에 다시 해 주세요.",
  ALREADY_IN_STORE: "이미 매장에 소속돼 있어요.",
};

export default function OnboardingPage() {
  const { me } = useArea("onboarding");
  const [code, setCode] = useState("");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState<{ which: "code" | "store"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!me) return <Spinner />;

  const run = async (which: "code" | "store", send: () => Promise<{ error?: unknown }>) => {
    setBusy(true);
    const { error } = await send();
    setBusy(false);
    if (error) return setError({ which, msg: MESSAGES[errorCode(error) ?? ""] ?? "잠시 뒤 다시 시도해 주세요." });
    await reloadMe(); // 소속이 생기면 useArea 가 역할에 맞는 화면으로 보낸다
  };

  return (
    <div className="mx-auto w-full max-w-sm flex-1 space-y-4 px-5 py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{me.user.nickname}님, 반가워요</h1>
        <p className="mt-1 text-sm text-muted">어떻게 시작할까요?</p>
      </div>

      <Card>
        <h2 className="font-semibold">알바생이에요</h2>
        <p className="mt-1 text-sm text-muted">사장님께 받은 초대 코드를 입력하세요.</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run("code", () => api.POST("/api/invites/redeem", { body: { code } }));
          }}
        >
          <Field label="초대 코드">
            <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="예: K7PX3MWA" autoCapitalize="characters" className="field font-mono tracking-widest uppercase" />
          </Field>
          {error?.which === "code" && <ErrorText>{error.msg}</ErrorText>}
          <button disabled={busy} className="w-full rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-50">코드 등록</button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold">사장님이에요</h2>
        <p className="mt-1 text-sm text-muted">매장을 만들고 알바생을 초대하세요.</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run("store", () => api.POST("/api/stores", { body: { name: storeName } }));
          }}
        >
          <Field label="매장 이름">
            <input required maxLength={50} value={storeName} onChange={(e) => setStoreName(e.target.value)} className="field" />
          </Field>
          {error?.which === "store" && <ErrorText>{error.msg}</ErrorText>}
          <button disabled={busy} className="w-full rounded-xl border border-accent py-3 font-semibold text-accent disabled:opacity-50">매장 만들기</button>
        </form>
      </Card>

      <button onClick={() => logout()} className="w-full py-2 text-sm text-muted">로그아웃</button>
    </div>
  );
}
