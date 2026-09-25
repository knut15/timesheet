// 디자인 가이드 셸. 로그인 없이 보인다 — useArea 를 쓰지 않는다.
import type { Metadata } from "next";
import Link from "next/link";
import { GuideNav } from "@/components/guide/GuideNav";
import { GuidePager } from "@/components/guide/GuidePager";

export const metadata: Metadata = {
  title: { template: "%s · timesheet 디자인 가이드", default: "timesheet 디자인 가이드" },
};

export default function GuideLayout({ children }: LayoutProps<"/guide">) {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5">
      <header className="border-b border-line py-4">
        <Link href="/guide" className="text-lg font-bold tracking-tight">
          timesheet 디자인 가이드
        </Link>
      </header>
      <div className="md:grid md:grid-cols-[11rem_minmax(0,1fr)] md:gap-10">
        <GuideNav />
        <main className="min-w-0 max-w-3xl pb-24 pt-8">
          {children}
          <GuidePager />
        </main>
      </div>
    </div>
  );
}
