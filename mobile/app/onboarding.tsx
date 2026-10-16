// 가입 뒤 소속이 없는 사용자. 매장을 만들면 마스터, 초대 코드를 등록하면 멤버 (docs/prd/06-store-invite.md). 웹 app/onboarding 의 앱판
import { Redirect } from "expo-router";
import { Coffee, DoorOpen, Sparkles, Store } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { api, errorCode } from "@/api/client";
import { useArea } from "@/auth/hooks";
import { logout, reloadMe } from "@/auth/session";
import { Scene } from "@/components/illust";
import { Appear } from "@/components/motion";
import { Btn, Card, ErrorText, Field, Input, T } from "@/components/ui";
import { clearInviteCode, peekInviteCode } from "@/lib/invite";
import { C, F } from "@/theme";

const MESSAGES: Record<string, string> = {
  INVITE_INVALID: "사용할 수 없는 코드예요. 사장님께 새 코드를 받아 주세요.",
  TOO_MANY_REQUESTS: "시도가 너무 많아요. 1분 뒤에 다시 해 주세요.",
  ALREADY_IN_STORE: "이미 매장에 소속돼 있어요.",
};

export default function Onboarding() {
  const { me, redirect } = useArea("onboarding");
  // 초대 링크(timesheet://join?code=)로 들어왔으면 코드를 채워 둔다
  const [code, setCode] = useState(() => peekInviteCode() ?? "");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState<{ which: "code" | "store"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (redirect) return <Redirect href={redirect} />;
  if (!me) return null;

  const run = async (which: "code" | "store", send: () => Promise<{ error?: unknown }>) => {
    setBusy(true);
    const { error } = await send().catch(() => ({ error: { code: "NETWORK" } }));
    setBusy(false);
    if (error) return setError({ which, msg: MESSAGES[errorCode(error) ?? ""] ?? "잠시 뒤 다시 시도해 주세요." });
    clearInviteCode();
    await reloadMe(); // 소속이 생기면 useArea 가 역할에 맞는 화면으로 보낸다
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 14 }}>
          <Scene icon={DoorOpen} accents={[{ icon: Sparkles, at: "tr" }]} />
          <View style={{ flexShrink: 1 }}>
            <T size={24} weight="bold" accessibilityRole="header" style={{ letterSpacing: -0.4 }}>{me.user.nickname}님, 반가워요</T>
            <T size={14} color={C.muted} style={{ marginTop: 4 }}>어떻게 시작할까요?</T>
          </View>
        </View>

        <View style={{ marginTop: 24, gap: 12 }}>
          <Appear>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Coffee size={22} strokeWidth={1.5} color={C.muted} />
                <View>
                  <T size={15} weight="bold">알바생이에요</T>
                  <T size={12} color={C.muted}>사장님께 받은 초대 코드를 입력하세요.</T>
                </View>
              </View>
              <View style={{ marginTop: 10, gap: 10 }}>
                <Field label="초대 코드">
                  <Input value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="예: K7PX3MWA" autoCapitalize="characters" autoCorrect={false} accessibilityLabel="초대 코드" style={{ fontFamily: F.mono, letterSpacing: 3 }} />
                </Field>
                {error?.which === "code" && <ErrorText>{error.msg}</ErrorText>}
                <Btn variant="primary" label="코드 등록" disabled={busy || !code.trim()} onPress={() => run("code", () => api.POST("/api/invites/redeem", { body: { code: code.trim() } }))} />
              </View>
            </Card>
          </Appear>

          <Appear>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Store size={22} strokeWidth={1.5} color={C.muted} />
                <View>
                  <T size={15} weight="bold">사장님이에요</T>
                  <T size={12} color={C.muted}>매장을 만들고 알바생을 초대하세요.</T>
                </View>
              </View>
              <View style={{ marginTop: 10, gap: 10 }}>
                <Field label="매장 이름">
                  <Input value={storeName} onChangeText={setStoreName} maxLength={50} accessibilityLabel="매장 이름" />
                </Field>
                {error?.which === "store" && <ErrorText>{error.msg}</ErrorText>}
                <Btn label="매장 만들기" disabled={busy || !storeName.trim()} onPress={() => run("store", () => api.POST("/api/stores", { body: { name: storeName.trim() } }))} />
              </View>
            </Card>
          </Appear>
        </View>

        <Pressable accessibilityRole="button" onPress={() => logout()} style={{ marginTop: 18, paddingVertical: 8, alignItems: "center" }}>
          <T size={13} color={C.muted} style={{ textDecorationLine: "underline" }}>로그아웃</T>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
