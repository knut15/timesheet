// 초대 코드 발급·보내기(문자·공유)·취소. 웹 web/src/app/admin/invites/page.tsx 의 앱판. docs/prd/06-store-invite.md
// 탭 밖(스택) 화면이라 머리(헤더·뒤로 가기)를 직접 그린다 — parts/common.tsx SubPage
// 앱에는 클립보드 라이브러리가 없다. 웹 "복사" 자리는 기기 공유 시트(Share) — 시트 안에 "복사" 가 있다.
import { MessageSquareText, Share2, TicketPlus } from "lucide-react-native";
import { useState } from "react";
import { Linking, Share, View } from "react-native";
import { api, type Invite } from "@/api/client";
import { useSession } from "@/auth/session";
import { Enter } from "@/components/motion";
import { Screen } from "@/components/shell";
import { Avatar, Btn, Card, ErrorText, Field, Input, Pill, T } from "@/components/ui";
import { dayLabel } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { C, R, alpha } from "@/theme";
import { inviteMessage, joinUrl, smsHref } from "@shared/inviteLink";
import { SubPage } from "./parts/common";
import { INVITE_INTRO, InvitesSkeleton } from "./parts/skeletons";

/** 가입 링크의 주소 — 앱에는 window.location 이 없어 웹 주소를 쓴다 */
const WEB_ORIGIN = "https://timesheet-brown-ten.vercel.app";
const STATUS: Record<Invite["status"], string> = { active: "사용 가능", used: "사용됨", expired: "만료", revoked: "취소됨" };

export function InvitesScreen() {
  return (
    <SubPage title="초대 코드">
      <Body />
    </SubPage>
  );
}

function Body() {
  const { data, reload } = useApi(() => api.GET("/api/stores/me/invites"), "");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const session = useSession();
  const storeName = session.status === "authenticated" ? (session.me.membership?.store.name ?? "") : "";
  if (!data)
    return (
      <Screen>
        <InvitesSkeleton />
      </Screen>
    );

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
  const message = (code: string) => inviteMessage(storeName || "타임시트", code, joinUrl(WEB_ORIGIN, code));
  const share = (code: string) => void Share.share({ title: "타임시트 초대", message: message(code) }).catch(() => {});

  return (
    <Screen onRefresh={reload}>
      <Enter>
        <Card>
          <T size={16} weight="semibold" accessibilityRole="header">알바생 초대</T>
          <T size={13} color={C.muted} style={{ marginTop: 4, lineHeight: 21 }}>{INVITE_INTRO}</T>
          <Btn variant="primary" icon={TicketPlus} label="초대 코드 발급" onPress={issue} disabled={busy} full style={{ marginTop: 16 }} />
        </Card>
        {data.length > 0 && (
          <View style={{ gap: 12 }}>
            {data.map((i) => (
              <Card key={i.id} style={i.status === "active" ? null : { opacity: 0.6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <T size={20} mono weight="semibold" style={{ letterSpacing: 2 }}>{i.code}</T>
                  {/* 쓸 수 있는 코드만 강조색, 나머지는 중립 */}
                  {i.status === "active" ? <Pill label={STATUS[i.status]} color={C.accent} bg={alpha(C.accent, 0.1)} /> : <Pill label={STATUS[i.status]} />}
                </View>
                {i.status === "used" ? (
                  <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Avatar name={i.usedByNickname ?? "?"} seed={i.usedByUserId ?? i.id} size="sm" />
                    <T size={13} color={C.muted}>{`${i.usedByNickname ?? "알 수 없음"}님이 사용`}</T>
                  </View>
                ) : (
                  <T size={12} color={C.muted} style={{ marginTop: 4 }}>
                    <T size={12} mono color={C.muted}>{dayLabel(Date.parse(i.expiresAt))}</T>까지
                  </T>
                )}
                {i.status === "active" && (
                  <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    <Btn variant="secondary" icon={MessageSquareText} label="문자로 보내기" onPress={() => setSending(sending === i.id ? null : i.id)} />
                    <Btn variant="secondary" icon={Share2} label="공유" onPress={() => share(i.code)} />
                    <Btn variant="secondary" label="취소" onPress={() => revoke(i.id)} />
                  </View>
                )}
                {i.status === "active" && sending === i.id && <SendInvite body={message(i.code)} onShare={() => share(i.code)} />}
              </Card>
            ))}
          </View>
        )}
      </Enter>
    </Screen>
  );
}

/**
 * 휴대폰 문자 앱으로 보낸다 — 서버가 문자를 보내지 않는다(사용자 결정). 사장님 번호로 나가고 "보내기" 는 사장님이 누른다.
 * 공유 시트(카카오톡·문자 등)도 연다.
 */
function SendInvite({ body, onShare }: { body: string; onShare: () => void }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const openSms = () => {
    setError(null);
    Linking.openURL(smsHref(phone, body)).catch(() => setError("문자 앱을 열지 못했어요. \"공유\" 를 써 주세요."));
  };
  return (
    <View style={{ marginTop: 12, gap: 12, borderRadius: R.control, borderWidth: 1, borderColor: C.line, backgroundColor: C.background, padding: 12 }}>
      <Field label="받는 사람 휴대폰 번호 (비우면 문자 앱에서 고르기)">
        <Input keyboardType="phone-pad" autoComplete="off" value={phone} onChangeText={setPhone} placeholder="010-0000-0000" />
      </Field>
      <View style={{ borderRadius: R.control, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, padding: 12 }}>
        <T size={12} mono color={C.muted} selectable>{body}</T>
      </View>
      <ErrorText>{error}</ErrorText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Btn variant="primary" icon={MessageSquareText} label="문자 앱 열기" onPress={openSms} style={{ flex: 1 }} />
        <Btn variant="secondary" icon={Share2} label="공유" onPress={onShare} />
      </View>
    </View>
  );
}
