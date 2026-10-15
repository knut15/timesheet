"use client";
// 장면 일러스트 — lucide 아이콘 조합으로 뜻을 보여 준다. 사람 그림은 쓰지 않는다 (2026-10-15 사용자 결정, DESIGN.md §4).
// 가운데 옅은 강조색 원에 주인공 아이콘(강조색), 둘레에 작은 소품 1~2개(muted). 선 굵기 1.5.
import { gsap } from "gsap";
import type { LucideIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { EASE, reducedMotion } from "./motion";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** 소품 자리. 원 둘레의 네 모서리 중 하나 */
export type Accent = { icon: LucideIcon; at: "tl" | "tr" | "bl" | "br" };
const AT = { tl: "left-0 top-0", tr: "right-0 top-0", bl: "left-0 bottom-0", br: "right-0 bottom-0" } as const;

const SIZE = {
  // 장면 상자 / 원 / 주인공 아이콘 / 소품
  md: { box: "h-[72px] w-[96px]", disc: "h-16 w-16", icon: 30, accent: 16 },
  sm: { box: "h-14 w-[60px]", disc: "h-11 w-11", icon: 22, accent: 13 },
} as const;

/**
 * 원이 살짝 올라오고 소품이 하나씩 톡 튀어나온다 (소품 0.08초 간격). 장식이라 aria-hidden.
 */
export function Scene({ icon: Icon, accents = [], size = "md" }: { icon: LucideIcon; accents?: Accent[]; size?: keyof typeof SIZE }) {
  const ref = useRef<HTMLDivElement>(null);
  const z = SIZE[size];
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const disc = el.querySelector("[data-disc]");
    const small = el.querySelectorAll("[data-accent]");
    if (reducedMotion()) {
      const t = gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      return () => {
        t.kill();
      };
    }
    const tl = gsap.timeline();
    tl.fromTo(disc, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: EASE, clearProps: "transform" });
    if (small.length) tl.fromTo(small, { opacity: 0, scale: 0.4, rotate: -15 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.4, ease: "back.out(2.5)", stagger: 0.08, clearProps: "transform" }, 0.15);
    return () => {
      tl.kill();
    };
  }, []);
  return (
    <div ref={ref} aria-hidden className={`relative shrink-0 ${z.box}`}>
      <span data-disc className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent ${z.disc}`}>
        <Icon size={z.icon} strokeWidth={1.5} />
      </span>
      {accents.map(({ icon: A, at }, i) => (
        <span key={i} data-accent className={`absolute text-muted ${AT[at]}`}>
          <A size={z.accent} strokeWidth={1.5} />
        </span>
      ))}
    </div>
  );
}

/** 빈 상태 — 장면 + 한 줄 제목 + 설명. 화면에 하나만 두고, 작은 구역의 빈 상태는 글자만 쓴다 */
export function EmptyState({ icon, accents, title, children }: { icon: LucideIcon; accents?: Accent[]; title: string; children?: React.ReactNode }) {
  return (
    <div className="grid justify-items-center px-4 py-6 text-center">
      <Scene icon={icon} accents={accents} />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {children && <div className="mt-1 text-xs leading-relaxed text-muted">{children}</div>}
    </div>
  );
}
