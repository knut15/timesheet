"use client";
// 초대 코드 발급·보내기(문자·공유)·복사·취소. docs/prd/06-store-invite.md
import { ACT_CANCEL, ACT_SAVE, BLOCK_PRIMARY, BTN_ACCENT, BTN_WARN } from "@/components/buttons";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { MessageSquareText, Share2 } from "lucide-react";
import { api, type Invite } from "@/api/client";
import { Avatar } from "@/components/shell";
import { useSession } from "@/auth/hooks";
import { Card, dayLabel, Field } from "@/components/ui";
import { inviteMessage, joinUrl, smsHref } from "@/lib/inviteLink";
import { useApi } from "@/lib/useApi";
import { InvitesSkeleton } from "../_skeletons";

const STATUS: Record<Invite["status"], string> = { active: "사용 가능", used: "사용됨", expired: "만료", revoked: "취소됨" };

export default function InvitesPage() {
  const { data, reload } = useApi(() => api.GET("/api/stores/me/invites"), "");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const session = useSession();
  const storeName = session.status === "authenticated" ? (session.me.membership?.store.name ?? "") : "";
  if (!data) return <InvitesSkeleton />;

  const issue = async () => {
    setBusy(true);
    await api.POST("/api/stores/me/invites");
    setBusy(false);
    reload();
  };
  const revoke = async (id: string) => {
    await api.DELETE("/api/stores/me/invites/{inviteId}", { params: { path: { inviteId: id } } });
    reload();
  };
  const copy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-semibold">알바생 초대</h2>
        <p className="mt-1 text-sm text-muted">코드는 7일 동안, 한 명만 쓸 수 있어요. 알바생은 가입한 뒤 이 코드를 입력하면 매장에 들어와요.</p>
        <button onClick={issue} disabled={busy} className={cn(BLOCK_PRIMARY, "mt-4")}>
          초대 코드 발급
        </button>
      </Card>
      {data.length > 0 && (
        <ul className="space-y-3">
          {data.map((i) => (
            <li key={i.id}>
              <Card className={i.status === "active" ? "" : "opacity-60"}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-xl font-semibold tracking-widest">{i.code}</p>
                  <span className={`shrink-0 text-xs ${i.status === "active" ? "text-accent" : "text-muted"}`}>{STATUS[i.status]}</span>
                </div>
                {i.status === "used" ? (
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <Avatar name={i.usedByNickname ?? "?"} seed={i.usedByUserId ?? i.id} size="sm" />
                    {i.usedByNickname ?? "알 수 없음"}님이 사용
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted">{dayLabel(Date.parse(i.expiresAt))}까지</p>
                )}
                {i.status === "active" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => setSending(sending === i.id ? null : i.id)} className={cn(BTN_ACCENT, "gap-1")}>
                      <MessageSquareText size={16} aria-hidden /> 문자로 보내기
                    </button>
                    <button onClick={() => copy(i.code)} className={BTN_ACCENT}>{copied === i.code ? "복사됨" : "복사"}</button>
                    <button onClick={() => revoke(i.id)} className={BTN_WARN}>취소</button>
                  </div>
                )}
                {i.status === "active" && sending === i.id && <SendInvite code={i.code} storeName={storeName} />}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * 휴대폰 문자 앱으로 보낸다 — 서버가 문자를 보내지 않는다(사용자 결정). 사장님 번호로 나가고 "보내기" 는 사장님이 누른다.
 * 공유를 지원하는 폰에서는 공유 시트(카카오톡·문자 등)도 연다.
 */
function SendInvite({ code, storeName }: { code: string; storeName: string }) {
  const [phone, setPhone] = useState("");
  const url = joinUrl(window.location.origin, code);
  const body = inviteMessage(storeName || "타임시트", code, url);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  return (
    <div className="mt-3 space-y-3 rounded-xl bg-background p-3">
      <Field label="받는 사람 휴대폰 번호 (비우면 문자 앱에서 고르기)">
        <input type="tel" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className="field" />
      </Field>
      <pre className="whitespace-pre-wrap break-all rounded-lg bg-surface p-3 text-xs text-muted">{body}</pre>
      <div className="flex gap-2">
        <a href={smsHref(phone, body)} className={cn(ACT_SAVE, "h-10 gap-1.5")}>
          <MessageSquareText size={16} aria-hidden /> 문자 앱 열기
        </a>
        {canShare && (
          <button
            type="button"
            onClick={() => navigator.share({ title: "타임시트 초대", text: body }).catch(() => {})}
            className={cn(ACT_CANCEL, "h-10 flex-none gap-1.5 px-4")}
          >
            <Share2 size={16} aria-hidden /> 공유
          </button>
        )}
      </div>
      <p className="text-xs text-muted">휴대폰에서 열어야 문자 앱이 떠요. 컴퓨터에서는 &quot;복사&quot; 를 쓰세요.</p>
    </div>
  );
}
