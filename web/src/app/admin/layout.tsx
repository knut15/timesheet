"use client";
// 마스터 관리 화면. 마스터가 아니면 useArea 가 맞는 화면으로 보낸다 (docs/prd/07-admin.md D-5).
import { usePathname } from "next/navigation";
import { CalendarDays, Inbox, LayoutDashboard, LogOut, Store, Users } from "lucide-react";
import { api, type Me } from "@/api/client";
import { useArea } from "@/auth/hooks";
import { logout } from "@/auth/session";
import { AppHeader, BottomNav, BottomNavSkeleton, HeaderSkeleton, IconButton, SubHeader, type Crumb } from "@/components/shell";
import { useApi } from "@/lib/useApi";
import { AdminPageSkeleton } from "./_skeletons";

const NAV = [
  { key: "/admin", href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { key: "/admin/calendar", href: "/admin/calendar", label: "달력", icon: CalendarDays },
  { key: "/admin/requests", href: "/admin/requests", label: "요청", icon: Inbox },
  { key: "/admin/members", href: "/admin/members", label: "멤버", icon: Users },
  { key: "/admin/store", href: "/admin/store", label: "매장", icon: Store },
];

/** 하위 화면 — 헤더에 브레드크럼, 아래에 서브헤더(뒤로 가기). 멤버 탭 안의 화면들이다 */
function subPage(pathname: string): { crumbs: Crumb[]; title: string; back: { href: string; label: string } } | null {
  const members = { label: "멤버", href: "/admin/members" };
  if (/^\/admin\/members\/[^/]+/.test(pathname)) return { crumbs: [members], title: "근무 기록", back: { href: members.href, label: "멤버 목록" } };
  if (pathname.startsWith("/admin/invites")) return { crumbs: [members], title: "초대 코드", back: { href: members.href, label: "멤버 목록" } };
  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { me } = useArea("master");
  const pathname = usePathname();
  // 로그인 확인 전 — 헤더·본문·하단 내비를 불러온 뒤와 같은 크기로 채운다
  if (!me?.membership)
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <HeaderSkeleton />
        {subPage(pathname) && <SubHeader backHref={subPage(pathname)!.back.href} backLabel={subPage(pathname)!.back.label} />}
        <main className="flex-1 px-5 pb-28 pt-5"><AdminPageSkeleton pathname={pathname} /></main>
        <BottomNavSkeleton count={NAV.length} />
      </div>
    );
  return <AdminShell me={me}>{children}</AdminShell>;
}

function AdminShell({ me, children }: { me: Me; children: React.ReactNode }) {
  const pathname = usePathname();
  // 화면을 옮길 때마다 대기 수를 다시 센다 — 요청 화면에서 처리하고 나오면 배지가 줄어든다
  const month = new Date().toISOString().slice(0, 7);
  const dash = useApi(() => api.GET("/api/stores/me/dashboard", { params: { query: { month } } }), `${pathname}|${month}`);
  // 하위 경로(/admin/members/[userId])도 부모 메뉴를 활성으로 본다. 초대는 멤버 화면 안의 화면이라 "멤버" 가 활성이다
  const path = pathname.startsWith("/admin/invites") ? "/admin/members" : pathname;
  const active = [...NAV].reverse().find((n) => (n.href === "/admin" ? path === "/admin" : path.startsWith(n.href)))?.key ?? "/admin";
  const sub = subPage(pathname);
  const title = sub?.title ?? NAV.find((n) => n.key === active)!.label;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <AppHeader
        eyebrow={me.membership!.store.logoUrl ? "사장님" : `${me.membership!.store.name} · 사장님`}
        title={title}
        crumbs={sub?.crumbs}
        me={me.user}
        logoUrl={me.membership!.store.logoUrl}
        logoAlt={me.membership!.store.name}
        actions={<IconButton icon={LogOut} label="로그아웃" onClick={() => logout()} />}
      />
      {sub && <SubHeader backHref={sub.back.href} backLabel={sub.back.label} />}
      <main className="flex-1 px-5 pb-28 pt-5">{children}</main>
      <BottomNav items={NAV.map((n) => (n.key === "/admin/requests" ? { ...n, badge: dash.data?.pendingRequests } : n))} active={active} />
    </div>
  );
}
