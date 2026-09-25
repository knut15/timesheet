"use client";
import { LogOut } from "lucide-react";
import { AppHeader, IconButton, SubHeader } from "@/components/shell";

// 하위 화면 — 제목 앞 브레드크럼(멤버 › 근무 기록) + 헤더 아래 서브헤더(뒤로 가기)
export default function AppHeaderBreadcrumb() {
  return (
    <div>
      <AppHeader
        eyebrow="데모 카페 성수점 · 사장님"
        title="근무 기록"
        crumbs={[{ label: "멤버", href: "/guide/components/app-header" }]}
        me={{ id: "user-demo-08", nickname: "Alex Kim" }}
        actions={<IconButton icon={LogOut} label="로그아웃" onClick={() => {}} />}
      />
      <SubHeader backHref="/guide/components/app-header" backLabel="멤버 목록" />
    </div>
  );
}
