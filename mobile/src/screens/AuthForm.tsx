// 로그인·가입 — 웹 web/src/components/AuthForm.tsx 의 앱판. 카드 없이 장면 + 제목, 그 아래 입력칸.
import { Link, Redirect } from "expo-router";
import { Clock, Coffee, KeyRound, Sparkles, Sun } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useArea } from "@/auth/hooks";
import { login, signup } from "@/auth/session";
import { Scene } from "@/components/illust";
import { Enter } from "@/components/motion";
import { Btn, ErrorText, Field, Input, T } from "@/components/ui";
import { C, alpha } from "@/theme";

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "이메일 또는 비밀번호가 맞지 않아요.",
  EMAIL_TAKEN: "이미 가입된 이메일이에요.",
  VALIDATION_FAILED: "입력값을 확인해 주세요. 비밀번호는 8자 이상이에요.",
  TOO_MANY_REQUESTS: "시도가 너무 많아요. 1분 뒤에 다시 해 주세요.",
};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { session, redirect } = useArea("guest");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (redirect) return <Redirect href={redirect} />;

  const submit = async () => {
    setBusy(true);
    try {
      const err = mode === "login" ? await login(email.trim(), password) : await signup(email.trim(), password, nickname.trim());
      setError(err ? (MESSAGES[err.code] ?? "잠시 뒤 다시 시도해 주세요.") : null);
    } catch {
      setError("서버에 닿지 못했어요. 인터넷 연결을 확인해 주세요.");
    }
    setBusy(false);
  };

  const notice =
    session.status === "anonymous" && session.reason === "reused"
      ? "다른 곳에서 세션이 사용돼 안전을 위해 로그아웃했어요. 다시 로그인해 주세요."
      : session.status === "anonymous" && session.reason === "expired"
        ? "로그인이 만료됐어요."
        : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 }} keyboardShouldPersistTaps="handled">
        <Enter gap={0}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 14 }}>
            {mode === "login" ? <Scene icon={Clock} accents={[{ icon: Coffee, at: "br" }, { icon: Sun, at: "tl" }]} /> : <Scene icon={KeyRound} accents={[{ icon: Sparkles, at: "tr" }]} />}
            <View>
              <T size={12} weight="semibold" color={C.muted}>타임시트</T>
              <T size={24} weight="bold" accessibilityRole="header" style={{ marginTop: 4, letterSpacing: -0.4 }}>{mode === "login" ? "로그인" : "가입하기"}</T>
            </View>
          </View>
          {notice && (
            <View style={{ marginTop: 24, borderRadius: 6, backgroundColor: alpha(C.warn, 0.1), padding: 12 }}>
              <T size={14} color={C.warn}>{notice}</T>
            </View>
          )}
          <View style={{ marginTop: 28, gap: 12 }}>
            <Field label="이메일">
              <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" accessibilityLabel="이메일" />
            </Field>
            <Field label="비밀번호">
              <Input value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === "login" ? "current-password" : "new-password"} textContentType={mode === "login" ? "password" : "newPassword"} accessibilityLabel="비밀번호" onSubmitEditing={mode === "login" ? submit : undefined} />
            </Field>
            {mode === "signup" && (
              <Field label="이름">
                <Input value={nickname} onChangeText={setNickname} maxLength={30} accessibilityLabel="이름" onSubmitEditing={submit} />
              </Field>
            )}
            <ErrorText>{error}</ErrorText>
            <Btn variant="primary" label={mode === "login" ? "로그인" : "가입하고 시작하기"} disabled={busy || !email || !password || (mode === "signup" && !nickname)} onPress={submit} style={{ marginTop: 6 }} />
          </View>
          <View style={{ marginTop: 18, flexDirection: "row", justifyContent: "center", gap: 4 }}>
            <T size={13} color={C.muted}>{mode === "login" ? "처음이신가요?" : "이미 계정이 있나요?"}</T>
            <Link href={mode === "login" ? "/signup" : "/login"} replace accessibilityRole="link">
              <T size={13} weight="semibold" color={C.accent}>{mode === "login" ? "가입하기" : "로그인"}</T>
            </Link>
          </View>
        </Enter>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
