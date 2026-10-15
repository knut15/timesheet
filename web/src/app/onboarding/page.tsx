"use client";
// 가입 뒤 소속이 없는 사용자. 매장을 만들면 마스터, 초대 코드를 등록하면 멤버. docs/prd/06-store-invite.md
import { Coffee, DoorOpen, Sparkles, Store } from "lucide-react";
import { useState } from "react";
import { api, errorCode } from "@/api/client";
import { useArea } from "@/auth/hooks";
import { logout, reloadMe } from "@/auth/session";
import { Scene } from "@/components/illust";
import { BTN, Bone, Card, ErrorText, Field, Loading } from "@/components/ui";
import { clearInviteCode, peekInviteCode } from "@/lib/inviteLink";

const MESSAGES: Record<string, string> = {
  INVITE_INVALID: "사용할 수 없는 코드예요. 사장님께 새 코드를 받아 주세요.",
  TOO_MANY_REQUESTS: "시도가 너무 많아요. 1분 뒤에 다시 해 주세요.",
  ALREADY_IN_STORE: "이미 매장에 소속돼 있어요.",
};

export default function OnboardingPage() {
  const { me } = useArea("onboarding");
  // 초대 링크(/join?code=)로 들어왔으면 코드를 채워 둔다
  const [code, setCode] = useState(() => (typeof window === "undefined" ? "" : (peekInviteCode() ?? "")));
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState<{ which: "code" | "store"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!me) return <OnboardingSkeleton />;

  const run = async (which: "code" | "store", send: () => Promise<{ error?: unknown }>) => {
    setBusy(true);
    const { error } = await send();
    setBusy(false);
    if (error) return setError({ which, msg: MESSAGES[errorCode(error) ?? ""] ?? "잠시 뒤 다시 시도해 주세요." });
    clearInviteCode();
    await reloadMe(); // 소속이 생기면 useArea 가 역할에 맞는 화면으로 보낸다
  };

  return (
    // B 시안 13번 — 장면 + 인사, 그 아래 고를 카드 두 장. 카드 등장은 .appear 가 맡는다(Enter 를 겹치지 않는다)
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-10">
      <div className="flex items-end gap-3.5">
        <Scene icon={DoorOpen} accents={[{ icon: Sparkles, at: "tr" }]} />
        <div>
          <h1 className="text-2xl leading-snug font-bold tracking-tight">{me.user.nickname}님, 반가워요</h1>
          <p className="mt-1 text-sm text-muted">어떻게 시작할까요?</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <Card className="appear">
          <div className="flex items-center gap-2.5">
            <Coffee size={22} strokeWidth={1.5} aria-hidden className="shrink-0 text-muted" />
            <div>
              <h2 className="text-[15px] font-bold">알바생이에요</h2>
              <p className="mt-px text-xs text-muted">사장님께 받은 초대 코드를 입력하세요.</p>
            </div>
          </div>
          <form
            className="mt-2.5 grid gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              void run("code", () => api.POST("/api/invites/redeem", { body: { code } }));
            }}
          >
            <Field label="초대 코드">
              <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="예: K7PX3MWA" autoCapitalize="characters" className="field font-mono tracking-widest uppercase" />
            </Field>
            {error?.which === "code" && <ErrorText>{error.msg}</ErrorText>}
            <button disabled={busy} className={`${BTN.primary} w-full`}>코드 등록</button>
          </form>
        </Card>

        <Card className="appear [animation-delay:50ms]">
          <div className="flex items-center gap-2.5">
            <Store size={22} strokeWidth={1.5} aria-hidden className="shrink-0 text-muted" />
            <div>
              <h2 className="text-[15px] font-bold">사장님이에요</h2>
              <p className="mt-px text-xs text-muted">매장을 만들고 알바생을 초대하세요.</p>
            </div>
          </div>
          <form
            className="mt-2.5 grid gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              void run("store", () => api.POST("/api/stores", { body: { name: storeName } }));
            }}
          >
            <Field label="매장 이름">
              <input required maxLength={50} value={storeName} onChange={(e) => setStoreName(e.target.value)} className="field" />
            </Field>
            {error?.which === "store" && <ErrorText>{error.msg}</ErrorText>}
            <button disabled={busy} className={`${BTN.secondary} w-full`}>매장 만들기</button>
          </form>
        </Card>
      </div>

      <button onClick={() => logout()} className="mt-4.5 w-full py-2 text-[13px] text-muted underline">로그아웃</button>
    </div>
  );
}

/** 로그인 확인 전 — 아래 화면(B 시안 13번)과 같은 틀·같은 줄 높이 (2026-09-25 "layout shift 없도록 스켈레톤") */
function OnboardingSkeleton() {
  const card = (
    <Card>
      <div className="flex items-center gap-2.5">
        <Bone className="size-[22px] shrink-0 rounded-md" />
        <div>
          <div className="flex h-[22px] items-center"><Bone className="h-3.5 w-24" /></div>
          <div className="mt-px flex h-4 items-center"><Bone className="h-3 w-48" /></div>
        </div>
      </div>
      <div className="mt-2.5 grid gap-2.5">
        <div>
          <div className="flex h-5 items-center"><Bone className="h-3 w-16" /></div>
          <Bone className="mt-1.5 h-11 rounded-xl" />
        </div>
        <Bone className="h-11 rounded-xl" />
      </div>
    </Card>
  );
  return (
    <Loading className="mx-auto w-full max-w-sm flex-1 px-6 py-10">
      <div className="flex items-end gap-3.5">
        <div className="grid h-[72px] w-[96px] shrink-0 place-items-center"><Bone className="size-16 rounded-full" /></div>
        <div>
          <div className="flex h-[33px] items-center"><Bone className="h-6 w-48" /></div>
          <div className="mt-1 flex h-5 items-center"><Bone className="h-3.5 w-32" /></div>
        </div>
      </div>
      <div className="mt-6 grid gap-3">
        {card}
        {card}
      </div>
    </Loading>
  );
}
