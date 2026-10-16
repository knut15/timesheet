// 표시 함수 — 웹 web/src/components/ui.tsx 의 같은 이름 함수와 같다. 계산은 @shared(웹 lib)가 맡는다.
import { useEffect, useState } from "react";
import type { ShiftDto } from "@/api/client";
import type { Shift } from "@shared/pay";

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
export const hm = (min: number) => `${Math.floor(min / 60)}시간${min % 60 ? ` ${min % 60}분` : ""}`;
export const time = (t: number) => new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
export const date = (t: number | Date) => new Date(t).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
export const dayLabel = (t: number | Date) => new Date(t).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });

/** 서버 기록을 급여 계산(pay.ts)이 받는 모양으로 */
export const toShift = (s: ShiftDto): Shift => ({ id: s.id, start: Date.parse(s.start), end: s.end ? Date.parse(s.end) : null });

/** 그 달의 주를 모두 덮는 조회 범위. 월을 걸친 주를 위해 앞뒤로 8일 여유를 둔다 */
export function monthRange(year: number, month: number) {
  return { from: new Date(year, month, 1 - 8).toISOString(), to: new Date(year, month + 1, 1 + 8).toISOString() };
}

/** useApi 는 키가 바뀌어도 이전 data 를 지우지 않는다 — 읽은 data 에 키를 같이 담아 "다른 달로 읽은 data" 를 로딩으로 본다 */
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

export function useMonthCursor() {
  return useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
}

/** <input type="datetime-local"> 값과 같은 "YYYY-MM-DDTHH:mm" (기기 시간대) */
export const toLocalInput = (t: number) => new Date(t - new Date(t).getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
