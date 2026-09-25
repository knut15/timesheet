"use client";
// 마스터 관리 화면. 마스터가 아니면 useArea 가 맞는 화면으로 보낸다 (docs/prd/07-admin.md D-5).
import { usePathname } from "next/navigation";
import { Inbox, LayoutDashboard, LogOut, Store, TicketPlus, Users } from "lucide-react";
import { api, type Me } from "@/api/client";
import { useArea } from "@/auth/hooks";
import { logout } from "@/auth/session";
import { AppHeader, BottomNav, IconButton } from "@/components/shell";
import { Spinner } from "@/components/ui";
import { useApi } from "@/lib/useApi";

const NAV = [
  { key: "/admin", href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { key: "/admin/requests", href: "/admin/requests", label: "요청", icon: Inbox },
  { key: "/admin/members", href: "/admin/members", label: "멤버", icon: Users },
  { key: "/admin/invites", href: "/admin/invites", label: "초대", icon: TicketPlus },
  { key: "/admin/store", href: "/admin/store", label: "매장", icon: Store },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { me } = useArea("master");
  if (!me?.membership) return <Spinner />;
  return <AdminShell me={me}>{children}</AdminShell>;
}

function AdminShell({ me, children }: { me: Me; children: React.ReactNode }) {
  const pathname = usePathname();
  // 화면을 옮길 때마다 대기 수를 다시 센다 — 요청 화면에서 처리하고 나오면 배지가 줄어든다
  const month = new Date().toISOString().slice(0, 7);
  const dash = useApi(() => api.GET("/api/stores/me/dashboard", { params: { query: { month } } }), `${pathname}|${month}`);
  // 하위 경로(/admin/members/[userId])도 부모 메뉴를 활성으로 본다
  const active = [...NAV].reverse().find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)))?.key ?? "/admin";
  const title = NAV.find((n) => n.key === active)!.label;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <AppHeader
        eyebrow={`${me.membership!.store.name} · 사장님`}
        title={title}
        me={me.user}
        actions={<IconButton icon={LogOut} label="로그아웃" onClick={() => logout()} />}
      />
      <main className="flex-1 px-5 pb-28 pt-5">{children}</main>
      <BottomNav items={NAV.map((n) => (n.key === "/admin/requests" ? { ...n, badge: dash.data?.pendingRequests } : n))} active={active} />
    </div>
  );
}
