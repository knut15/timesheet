"use client";
// 앱 셸 — 헤더·하단 내비게이션·멤버 아바타. 규칙은 .claude/skills/timesheet-ui/SKILL.md
import Link from "next/link";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { Bone } from "./ui";

/** 아바타 배경. 흰 글자와 대비 4.5:1 이상인 중간 채도만 둔다. */
const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#db2777", "#dc2626", "#c2410c", "#15803d", "#0f766e", "#4338ca"];

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

/** 한글 이름은 첫 글자, 로마자는 두 글자(대문자). */
export function initials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  if (/^[a-z]/i.test(t)) {
    const parts = t.split(/\s+/);
    return (parts.length > 1 ? parts[0]![0]! + parts[1]![0]! : t.slice(0, 2)).toUpperCase();
  }
  return [...t][0]!;
}

const SIZES = { xs: "h-[18px] w-[18px] text-[9px]", sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl" } as const;

/**
 * 멤버 아바타. 사진 업로드가 없으므로 이름 이니셜 + 사용자 id 로 고정된 색.
 * 같은 사람은 어느 화면에서나 같은 색이다. 옆에 이름을 같이 쓰면 decorative(기본), 혼자 쓰면 label 을 준다.
 */
export function Avatar({ name, seed, size = "md", label }: { name: string; seed: string; size?: keyof typeof SIZES; label?: string }) {
  const bg = AVATAR_COLORS[hash(seed) % AVATAR_COLORS.length];
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${SIZES[size]}`}
      style={{ backgroundColor: bg }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {initials(name)}
    </span>
  );
}

/** 모든 화면의 머리. 위 작은 줄(매장·역할) + 화면 제목, 오른쪽에 내 아바타와 동작. */
/**
 * width 는 본문 폭과 같게 준다 — 멤버 max-w-md, 관리 max-w-3xl.
 * logoUrl 이 있으면 eyebrow 줄 맨 앞에 매장 로고(높이 20px, 가로 최대 96px, 비율 유지)를 둔다 (docs/prd/11).
 * 로고가 매장 이름을 대신한다 — 부르는 쪽은 eyebrow 에서 매장 이름을 빼고, 이름은 logoAlt 로 넘긴다.
 */
export type Crumb = { label: string; href: string };

/** crumbs 가 있으면 제목 앞에 "멤버 › 근무 기록" 처럼 상위 화면 링크를 붙인다 (2026-09-25 사용자 요청) */
export function AppHeader({ eyebrow, title, me, actions, width = "max-w-3xl", logoUrl, logoAlt = "", crumbs }: { eyebrow: string; title: string; me: { id: string; nickname: string }; actions?: React.ReactNode; width?: string; logoUrl?: string | null; logoAlt?: string; crumbs?: Crumb[] }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur">
      <div className={`mx-auto flex ${width} items-center justify-between gap-3 px-5 py-3`}>
        <div className="min-w-0">
          {/* 줄 높이 h-5 고정 — 로고(20px)가 있어도 없어도 헤더 높이가 같다(스켈레톤과도 같게) */}
          <p className="flex h-5 min-w-0 items-center gap-1.5 text-xs font-medium text-muted">
            {/* 로고가 매장 이름 글자를 대신하므로 alt 에 매장 이름을 둔다 (2026-09-25 사용자 요청: 로고 옆 이름 글자 제거) */}
            {/* eslint-disable-next-line @next/next/no-img-element -- 인증 쿠키로 받는 API 이미지라 next/image 최적화 대상이 아니다 */}
            {logoUrl && <img src={logoUrl} alt={logoAlt} className="h-5 w-auto max-w-24 shrink-0 object-contain" />}
            {eyebrow && <span className="truncate">{eyebrow}</span>}
          </p>
          {crumbs?.length ? (
            <nav aria-label="현재 위치">
              <ol className="flex min-w-0 items-center gap-1 text-xl font-bold tracking-tight">
                {crumbs.map((c) => (
                  <li key={c.href} className="flex shrink-0 items-center gap-1">
                    <Link href={c.href} className="text-muted hover:text-foreground">{c.label}</Link>
                    <ChevronRight size={18} aria-hidden className="text-muted" />
                  </li>
                ))}
                <li className="min-w-0">
                  <h1 aria-current="page" className="truncate">{title}</h1>
                </li>
              </ol>
            </nav>
          ) : (
            <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <Avatar name={me.nickname} seed={me.id} label={`${me.nickname} (나)`} />
        </div>
      </div>
    </header>
  );
}

export type NavItem = { key: string; label: string; icon: LucideIcon; badge?: number } & ({ href: string } | { onSelect: () => void });

/** 하단 내비게이션 (푸터). 아이콘 위, 이름 아래. 활성 항목은 accent 색과 윗선. */
export function BottomNav({ items, active, width = "max-w-3xl" }: { items: NavItem[]; active: string; width?: string }) {
  return (
    <nav aria-label="주요 메뉴" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className={`mx-auto grid ${width}`} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const on = item.key === active;
          const Icon = item.icon;
          const className = `relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${on ? "text-accent" : "text-muted hover:text-foreground"}`;
          const body = (
            <>
              {on && <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-accent" />}
              <span className="relative">
                <Icon size={22} strokeWidth={on ? 2.4 : 1.8} aria-hidden />
                {!!item.badge && (
                  <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-warn px-1 text-center text-[10px] font-bold leading-4 text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              {item.label}
              {!!item.badge && <span className="sr-only"> (처리할 것 {item.badge}건)</span>}
            </>
          );
          return (
            <li key={item.key}>
              {"href" in item ? (
                <Link href={item.href} aria-current={on ? "page" : undefined} className={className}>{body}</Link>
              ) : (
                <button type="button" onClick={item.onSelect} aria-current={on ? "page" : undefined} className={className}>{body}</button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 헤더 오른쪽에 두는 아이콘 버튼. 이름은 aria-label 로. */
export function IconButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-line/60 hover:text-foreground">
      <Icon size={20} aria-hidden />
    </button>
  );
}

/** 로그인 확인 전 헤더 자리 — AppHeader 와 같은 높이(py-3 + 글자 두 줄 16+28 = 아바타 40 보다 큼). */
export function HeaderSkeleton({ width = "max-w-3xl" }: { width?: string }) {
  return (
    <div aria-hidden className="sticky top-0 z-20 border-b border-line bg-background/90">
      <div className={`mx-auto flex ${width} items-center justify-between gap-3 px-5 py-3`}>
        <div className="space-y-0">
          <div className="flex h-5 items-center"><Bone className="h-3 w-20" /></div>
          <div className="flex h-7 items-center"><Bone className="h-5 w-16" /></div>
        </div>
        <Bone className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

/** 로그인 확인 전 하단 내비 자리 — BottomNav 와 같은 h-16 칸 count 개 */
export function BottomNavSkeleton({ count, width = "max-w-3xl" }: { count: number; width?: string }) {
  return (
    <div aria-hidden className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)]">
      <div className={`mx-auto grid ${width}`} style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex h-16 flex-col items-center justify-center gap-1">
            <Bone className="h-[22px] w-[22px] rounded-md" />
            <Bone className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 하위 화면의 서브헤더 — 헤더 아래 헤더와 같은 폭의 띠에 뒤로 가기. 본문과 확실히 나뉜다 (2026-09-25 사용자 요청
 * "뒤로가기 버튼 영역을 width 100% 로 서브헤더 영역을 만들던지 확실히 구분되게").
 */
export function SubHeader({ backHref, backLabel, width = "max-w-3xl" }: { backHref: string; backLabel: string; width?: string }) {
  return (
    <div className="border-b border-line bg-surface">
      <div className={`mx-auto flex ${width} items-center px-3`}>
        <Link href={backHref} className="inline-flex h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted hover:bg-line/60 hover:text-foreground">
          <ChevronLeft size={18} aria-hidden />
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
