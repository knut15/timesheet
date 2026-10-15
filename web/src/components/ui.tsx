"use client";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { IconButton } from "./shell";
import { useEffect, useState } from "react";
import type { ShiftDto } from "@/api/client";
import type { Shift } from "@/lib/pay";

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
export const hm = (min: number) => `${Math.floor(min / 60)}시간${min % 60 ? ` ${min % 60}분` : ""}`;
export const time = (t: number) => new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
export const date = (t: number | Date) =>
  new Date(t).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
export const toLocalInput = (t: number) => {
  const d = new Date(t - new Date(t).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
};

/** 서버 기록을 급여 계산(pay.ts)이 받는 모양으로. */
export const toShift = (s: ShiftDto): Shift => ({
  id: s.id,
  start: Date.parse(s.start),
  end: s.end ? Date.parse(s.end) : null,
});

/** 그 달의 주를 모두 덮는 조회 범위. 월을 걸친 주를 위해 앞뒤로 8일 여유를 둔다. */
export function monthRange(year: number, month: number) {
  return {
    from: new Date(year, month, 1 - 8).toISOString(),
    to: new Date(year, month + 1, 1 + 8).toISOString(),
  };
}

/**
 * useApi 는 키가 바뀌어도 이전 data 를 지우지 않는다. 읽은 data 에 그 키를 같이 담아 두면
 * 화면이 "다른 키(다른 달)로 읽은 data" 를 로딩으로 볼 수 있다. 쓰는 곳: data?.key === key 인지 본다.
 */
export function keyed<T>(key: string, p: Promise<{ data?: T; error?: unknown }>) {
  return p.then((r) => ({ error: r.error, data: r.data === undefined ? undefined : { key, value: r.data } }));
}

export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** 숫자(시각·시간·금액·날짜)는 고정폭 글꼴 — 자릿수가 바뀌어도 흔들리지 않는다 (2026-10-15 B 시안) */
export const NUM = "font-mono tabular-nums";

/**
 * 버튼 모양. 색 테두리 없이 — 주 동작은 진한 바탕, 보통은 선, 추가는 점선 (2026-10-15 B 시안).
 * 높이: 기본 44px(h-11), 작은 것 32px(h-8). 모양만 주고 폭·여백은 쓰는 쪽에서 더한다.
 */
export const BTN = {
  primary: "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 text-[15px] font-semibold text-background disabled:bg-line disabled:text-muted",
  secondary: "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50",
  small: "inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-line bg-surface px-2.5 text-xs font-medium text-foreground hover:bg-background disabled:opacity-50",
  dashed: "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-dashed border-muted/60 px-4 text-sm font-medium text-muted hover:text-foreground",
  danger: "inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-line bg-surface px-2.5 text-xs font-medium text-foreground hover:border-warn/40 hover:text-warn",
} as const;

/** 카드. 구역을 나눌 때는 className="divide-y divide-line p-0" 으로 두고 안에 <div className="px-4 py-3.5"> 를 쌓는다 */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-4 ${className}`}>{children}</section>;
}

/**
 * 카드 구역 머리 — 작은 회색 글자, 앞에 lucide 아이콘(15px), 원하면 번호("01"), 오른쪽에 요약 값.
 * 제목 수준은 as 로 (기본 h2).
 */
export function SectionLabel({ icon: Icon, index, children, right, as: Tag = "h2" }: { icon?: LucideIcon; index?: string; children: React.ReactNode; right?: React.ReactNode; as?: "h2" | "h3" | "p" }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted">
      <Tag className="flex min-w-0 items-center gap-1.5 text-xs font-semibold">
        {Icon && <Icon size={15} strokeWidth={1.75} aria-hidden className="shrink-0" />}
        {index && <span className={`${NUM} text-muted/70`}>{index}</span>}
        <span className="truncate">{children}</span>
      </Tag>
      {right !== undefined && <span className={`shrink-0 ${NUM}`}>{right}</span>}
    </div>
  );
}

export function MonthPicker({ cursor, onChange }: { cursor: { year: number; month: number }; onChange: (c: { year: number; month: number }) => void }) {
  const move = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    onChange({ year: d.getFullYear(), month: d.getMonth() });
  };
  return (
    <div className="flex items-center justify-between">
      <IconButton variant="outline" icon={ChevronLeft} label="이전 달" onClick={() => move(-1)} />
      <p className={`font-semibold ${NUM}`}>{cursor.year}년 {cursor.month + 1}월</p>
      <IconButton variant="outline" icon={ChevronRight} label="다음 달" onClick={() => move(1)} />
    </div>
  );
}

export function useMonthCursor() {
  return useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // min-w-0: 격자 칸 안에서 줄어들 수 있게. 안쪽은 span — label 안에는 글자 수준 요소만 둔다
    <label className="block min-w-0 text-sm">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export function Spinner() {
  return <div className="flex flex-1 items-center justify-center py-20 text-sm text-muted">불러오는 중…</div>;
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return children ? <p className="appear text-sm text-warn">{children}</p> : null;
}

export const dayLabel = (t: number | Date) => new Date(t).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });

/** 요청 상태 표시. 수정 요청·휴가·대타가 같이 쓴다. docs/prd/08·09 */
const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "승인 대기", tone: "bg-caution/15 text-caution" },
  requested: { label: "동료 수락 대기", tone: "bg-caution/15 text-caution" },
  accepted: { label: "승인 대기", tone: "bg-caution/15 text-caution" },
  approved: { label: "승인", tone: "bg-ok/15 text-ok" },
  rejected: { label: "거절", tone: "bg-warn/15 text-warn" },
  declined: { label: "동료 거절", tone: "bg-warn/15 text-warn" },
  canceled: { label: "취소", tone: "bg-line/60 text-muted" },
};

export function StatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: "bg-line/60 text-muted" };
  return <span className={`inline-flex h-5 items-center whitespace-nowrap rounded-md px-1.5 text-[11px] font-semibold ${s.tone}`}>{s.label}</span>;
}
