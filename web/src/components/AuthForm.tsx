"use client";
import Link from "next/link";
import { useState } from "react";
import { useArea } from "@/auth/hooks";
import { login, signup } from "@/auth/session";
import { Card, ErrorText, Field } from "./ui";

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "이메일 또는 비밀번호가 맞지 않아요.",
  EMAIL_TAKEN: "이미 가입된 이메일이에요.",
  VALIDATION_FAILED: "입력값을 확인해 주세요. 비밀번호는 8자 이상이에요.",
  TOO_MANY_REQUESTS: "시도가 너무 많아요. 1분 뒤에 다시 해 주세요.",
};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { session } = useArea("guest");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const err = mode === "login" ? await login(email, password) : await signup(email, password, nickname);
    setBusy(false);
    setError(err ? (MESSAGES[err.code] ?? "잠시 뒤 다시 시도해 주세요.") : null);
  };

  const notice =
    session.status === "anonymous" && session.reason === "reused"
      ? "다른 곳에서 세션이 사용돼 안전을 위해 로그아웃했어요. 다시 로그인해 주세요."
      : session.status === "anonymous" && session.reason === "expired"
        ? "로그인이 만료됐어요."
        : null;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-bold tracking-tight">타임시트</h1>
      <p className="mt-1 text-sm text-muted">{mode === "login" ? "로그인" : "가입하기"}</p>
      {notice && <p className="mt-4 rounded-xl bg-warn/10 p-3 text-sm text-warn">{notice}</p>}
      <Card className="mt-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label="이메일">
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          </Field>
          <Field label="비밀번호">
            <input
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />
          </Field>
          {mode === "signup" && (
            <Field label="이름">
              <input required maxLength={30} value={nickname} onChange={(e) => setNickname(e.target.value)} className="field" />
            </Field>
          )}
          <ErrorText>{error}</ErrorText>
          <button disabled={busy} className="w-full rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-50">
            {mode === "login" ? "로그인" : "가입하고 시작하기"}
          </button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted">
        {mode === "login" ? (
          <>처음이신가요? <Link href="/signup" className="text-accent">가입하기</Link></>
        ) : (
          <>이미 계정이 있나요? <Link href="/login" className="text-accent">로그인</Link></>
        )}
      </p>
    </div>
  );
}
