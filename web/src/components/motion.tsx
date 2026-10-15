"use client";
// GSAP 모션 (2026-10-15 사용자 결정 — 화면 진입·출퇴근 누름·숫자 변화·완료 순간). 기준은 DESIGN.md §5.
// 모든 모션은 "동작 줄이기"(prefers-reduced-motion)면 이동·크기 변화 없이 투명도만 바꾼다.
import { gsap } from "gsap";
import { useEffect, useLayoutEffect, useRef } from "react";

// 서버 렌더에서는 useEffect 로 — 클라이언트에서는 그리기 전에 시작 상태를 잡아 깜빡임을 막는다
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 곡선. DESIGN.md 의 --ease-out 과 같은 성격(빠르게 출발, 천천히 멈춤) */
export const EASE = "power2.out";

/**
 * 화면 진입 — 바로 아래 자식들이 아래에서 8px 올라오며 차례로 나타난다 (0.32초, 0.06초 간격).
 * replay 가 바뀌면 다시 한다 (예: 불러오기가 끝나 내용이 바뀌었을 때).
 */
export function Enter({ children, className, replay }: { children: React.ReactNode; className?: string; replay?: unknown }) {
  const ref = useRef<HTMLDivElement>(null);
  useIsoLayoutEffect(() => {
    const items = ref.current?.children;
    if (!items?.length) return;
    const tween = reducedMotion()
      ? gsap.fromTo(items, { opacity: 0 }, { opacity: 1, duration: 0.2, clearProps: "opacity" })
      : gsap.fromTo(items, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.32, ease: EASE, stagger: 0.06, clearProps: "opacity,transform" });
    return () => {
      tween.kill();
    };
  }, [replay]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * 숫자 변화 — 처음에는 0에서, 그다음부터는 이전 값에서 새 값까지 0.6초 동안 올라가며 바뀐다.
 * 화면에는 format 결과를 그대로 그리고(서버 렌더·스크린 리더는 최종 값), 움직이는 동안만 글자를 바꾼다.
 */
export function CountUp({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  const fmt = useRef(format);
  // 움직이는 중에 쓸 format 은 렌더가 끝난 뒤 최신 것으로 바꿔 둔다 (렌더 중에 ref 를 바꾸지 않는다)
  useIsoLayoutEffect(() => {
    fmt.current = format;
  });
  useIsoLayoutEffect(() => {
    const el = ref.current;
    const from = prev.current;
    prev.current = value;
    // React 가 그린 글자 노드를 그대로 쓴다 — textContent 로 갈아 끼우면 React 가 들고 있는 노드가 문서에서 떨어진다
    const node = el?.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE || from === value || reducedMotion()) return;
    const set = (n: number) => {
      node.nodeValue = fmt.current(n);
    };
    const o = { v: from };
    const tween = gsap.to(o, {
      v: value,
      duration: 0.6,
      ease: EASE,
      onUpdate: () => set(Math.round(o.v)),
      onComplete: () => set(value),
    });
    return () => {
      tween.kill();
      set(value);
    };
  }, [value]);
  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}

/**
 * 글자가 바뀔 때 — 이전 글자가 위로 밀려 나가고 새 글자가 아래에서 올라온다 (출퇴근 상태 "근무 중" → "퇴근함").
 * 처음 그릴 때는 움직이지 않는다.
 */
export function SwapText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  useIsoLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    const tween = reducedMotion()
      ? gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      : gsap.fromTo(el, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.22, ease: EASE, clearProps: "transform" });
    return () => {
      tween.kill();
    };
  }, [text]);
  return (
    <span className={`inline-flex overflow-hidden ${className ?? ""}`}>
      <span ref={ref} className="inline-block">
        {text}
      </span>
    </span>
  );
}

/**
 * 드물게 나타나는 것(완료 상자·저장 알림) — 마운트될 때 아래에서 10px 올라오며 나타난다.
 * 돌려준 ref 를 그 요소에 붙인다.
 */
export function useAppear<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tween = reducedMotion()
      ? gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      : gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: EASE, clearProps: "transform" });
    return () => {
      tween.kill();
    };
  }, []);
  return ref;
}
