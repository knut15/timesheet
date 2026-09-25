"use client";
// 초대 코드 발급·복사·취소. docs/prd/06-store-invite.md
import { useState } from "react";
import { api, type Invite } from "@/api/client";
import { Card, dayLabel, Spinner } from "@/components/ui";
import { useApi } from "@/lib/useApi";

const STATUS: Record<Invite["status"], string> = { active: "사용 가능", used: "사용됨", expired: "만료", revoked: "취소됨" };

export default function InvitesPage() {
  const { data, reload } = useApi(() => api.GET("/api/stores/me/invites"), "");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  if (!data) return <Spinner />;

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
        <button onClick={issue} disabled={busy} className="mt-4 w-full rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-50">
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
                <p className="mt-1 text-xs text-muted">
                  {i.status === "used" ? `${i.usedByNickname ?? "알 수 없음"}님이 사용` : `${dayLabel(Date.parse(i.expiresAt))}까지`}
                </p>
                {i.status === "active" && (
                  <div className="mt-3 flex gap-4 text-sm">
                    <button onClick={() => copy(i.code)} className="text-accent">{copied === i.code ? "복사됨" : "복사"}</button>
                    <button onClick={() => revoke(i.id)} className="text-warn">취소</button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
