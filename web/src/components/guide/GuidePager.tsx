"use client";
// 페이지 맨 아래 이전·다음 링크. 순서는 목차(./nav.ts)와 같다.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GUIDE_PAGES } from "./nav";

export function GuidePager() {
  const pathname = usePathname();
  const i = GUIDE_PAGES.findIndex((p) => p.href === pathname);
  if (i < 0) return null;
  const prev = GUIDE_PAGES[i - 1];
  const next = GUIDE_PAGES[i + 1];
  return (
    <nav aria-label="이전·다음 페이지" className="mt-16 flex justify-between gap-3 border-t border-line pt-6 text-sm">
      {prev ? (
        <Link href={prev.href} className="min-w-0 rounded-xl px-3 py-2 hover:bg-surface">
          <span className="block text-xs text-muted">이전</span>
          <span className="block truncate font-medium">{prev.label}</span>
        </Link>
      ) : <span />}
      {next && (
        <Link href={next.href} className="min-w-0 rounded-xl px-3 py-2 text-right hover:bg-surface">
          <span className="block text-xs text-muted">다음</span>
          <span className="block truncate font-medium">{next.label}</span>
        </Link>
      )}
    </nav>
  );
}
