"use client";
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

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>{children}</section>;
}

export function MonthPicker({ cursor, onChange }: { cursor: { year: number; month: number }; onChange: (c: { year: number; month: number }) => void }) {
  const move = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    onChange({ year: d.getFullYear(), month: d.getMonth() });
  };
  return (
    <div className="flex items-center justify-between">
      <button onClick={() => move(-1)} className="px-3 py-2 text-muted" aria-label="이전 달">◀</button>
      <p className="font-semibold">{cursor.year}년 {cursor.month + 1}월</p>
      <button onClick={() => move(1)} className="px-3 py-2 text-muted" aria-label="다음 달">▶</button>
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
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function Spinner() {
  return <div className="flex flex-1 items-center justify-center py-20 text-sm text-muted">불러오는 중…</div>;
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return children ? <p className="text-sm text-warn">{children}</p> : null;
}

export const dayLabel = (t: number | Date) => new Date(t).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });

/** 요청 상태 표시. 수정 요청·휴가·대타가 같이 쓴다. docs/prd/08·09 */
const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "승인 대기", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  requested: { label: "동료 수락 대기", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  accepted: { label: "승인 대기", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  approved: { label: "승인", tone: "bg-green-500/15 text-green-700 dark:text-green-400" },
  rejected: { label: "거절", tone: "bg-warn/15 text-warn" },
  declined: { label: "동료 거절", tone: "bg-warn/15 text-warn" },
  canceled: { label: "취소", tone: "bg-line text-muted" },
};

export function StatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: "bg-line text-muted" };
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${s.tone}`}>{s.label}</span>;
}
