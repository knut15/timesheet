"use client";
// 마스터 관리 화면. 마스터가 아니면 useArea 가 맞는 화면으로 보낸다 (docs/prd/07-admin.md D-5).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useArea } from "@/auth/hooks";
import { logout } from "@/auth/session";
import { Spinner } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/members", label: "멤버" },
  { href: "/admin/invites", label: "초대" },
  { href: "/admin/store", label: "매장" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { me } = useArea("master");
  const pathname = usePathname();
  if (!me?.membership) return <Spinner />;
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <header className="flex items-end justify-between gap-3 px-5 pb-3 pt-6">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">{me.membership.store.name} · 사장님</p>
          <h1 className="text-2xl font-bold tracking-tight">관리</h1>
        </div>
        <button onClick={() => logout()} className="shrink-0 text-sm text-muted">로그아웃</button>
      </header>
      <nav className="sticky top-0 z-10 border-b border-line bg-background/95 px-5 backdrop-blur">
        <div className="flex gap-5 overflow-x-auto">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`shrink-0 border-b-2 py-3 text-sm font-medium ${active(n.href) ? "border-accent text-accent" : "border-transparent text-muted"}`}>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="flex-1 px-5 py-5 pb-16">{children}</main>
    </div>
  );
}
