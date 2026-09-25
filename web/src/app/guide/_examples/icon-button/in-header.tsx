"use client";
import { LogOut } from "lucide-react";
import { AppHeader, IconButton } from "@/components/shell";

export default function IconButtonInHeader() {
  return (
    <AppHeader
      eyebrow="데모 카페 성수점 · 사장님"
      title="대시보드"
      me={{ id: "user-demo-08", nickname: "Alex Kim" }}
      actions={<IconButton icon={LogOut} label="로그아웃" onClick={() => {}} />}
    />
  );
}
