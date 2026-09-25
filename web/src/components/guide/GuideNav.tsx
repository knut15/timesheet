"use client";
// 가이드 목차. 넓은 화면에서는 왼쪽 고정 목록, 좁은 화면에서는 "목차" 버튼으로 펼치는 목록이다.
// 항목은 ./nav.ts 의 GUIDE_NAV.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GUIDE_NAV, GUIDE_PAGES } from "./nav";

export function GuideNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = GUIDE_PAGES.find((p) => p.href === pathname);
  const list = (onPick?: () => void) => (
    <div className="space-y-5">
      {GUIDE_NAV.map((g) => (
        <div key={g.title}>
          <p className="px-3 text-xs font-medium text-muted">{g.title}</p>
          <ul className="mt-1.5 space-y-0.5">
            {g.items.map((item) => {
              const on = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onPick}
                    aria-current={on ? "page" : undefined}
                    className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${on ? "bg-surface font-medium text-accent" : "text-muted hover:text-foreground"}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <nav aria-label="가이드 목차" className="md:sticky md:top-0 md:max-h-screen md:self-start md:overflow-y-auto md:py-8 md:[scrollbar-width:thin]">
      {/* 좁은 화면: 접힌 목차 */}
      <div className="border-b border-line py-2 md:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="guide-nav-list"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm"
        >
          <span className="font-medium">목차</span>
          <span className="truncate pl-3 text-muted">{current?.label}</span>
        </button>
        <div id="guide-nav-list" hidden={!open} className="pb-2 pt-2">
          {list(() => setOpen(false))}
        </div>
      </div>
      <div className="hidden md:block">{list()}</div>
    </nav>
  );
}
