// 멤버 탭들이 같이 쓰는 데이터 — 웹 TimesheetApp.tsx 의 MemberHome 이 들고 있던 것을 그대로 옮겼다.
// 달 cursor 하나로 기록·휴가를 읽고, 출퇴근·기록·급여 탭이 같은 값을 본다. 요청·동료는 달과 무관하다.
import { createContext, useContext, useMemo } from "react";
import { api, type Absence, type Colleague, type Me, type MyMembership, type MyRequests } from "@/api/client";
import { keyed, monthRange, toShift, useMonthCursor } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { PaySettings, Shift } from "@shared/pay";

export type MemberData = {
  me: Me;
  membership: MyMembership;
  cursor: { year: number; month: number };
  setCursor: (c: { year: number; month: number }) => void;
  /** 출퇴근 탭은 이번 달로 오늘을 판정한다 — 다른 달로 넘겼으면 되돌린다 (명세 member-today §6) */
  toThisMonth: () => void;
  shifts: Shift[];
  absences: Absence[];
  recordsLoading: boolean;
  recordsFailed: boolean;
  requests: MyRequests | null;
  requestsFailed: boolean;
  colleagues: Colleague[];
  settings: PaySettings;
  /** 근무 기록만 다시 읽기 (출퇴근 뒤) */
  reloadShifts: () => void;
  /** 기록·휴가 다시 읽기 (실패 뒤 다시 시도) */
  reloadRecords: () => void;
  /** 요청 상태가 바뀌면 기록·휴가도 바뀔 수 있다 — 셋 다 */
  reloadAll: () => void;
  /** 받은 대타 요청 중 내가 답할 것 — 요청 탭 배지 */
  incoming: number;
};

const Ctx = createContext<MemberData | null>(null);

export function useMember(): MemberData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMember 는 member 탭 안에서만 쓴다");
  return v;
}

export function MemberDataProvider({ me, membership, children }: { me: Me; membership: MyMembership; children: React.ReactNode }) {
  const [cursor, setCursor] = useMonthCursor();
  const range = monthRange(cursor.year, cursor.month);
  const rangeKey = `${range.from}|${range.to}`;
  // data 에 읽은 달의 키를 같이 담는다 — 달을 넘긴 직후 이전 달 data 를 새 달로 그리지 않게 (달력 명세 §6)
  const shiftRes = useApi(() => keyed(rangeKey, api.GET("/api/shifts/me", { params: { query: range } })), rangeKey);
  const absRes = useApi(() => keyed(rangeKey, api.GET("/api/absences/me", { params: { query: range } })), rangeKey);
  const reqRes = useApi(() => api.GET("/api/requests/me"), "");
  const colleagues = useApi(() => api.GET("/api/stores/me/colleagues"), "");
  const shifts = useMemo(() => (shiftRes.data?.value ?? []).map(toShift), [shiftRes.data]);
  const absences = useMemo(() => absRes.data?.value ?? [], [absRes.data]);

  const value: MemberData = {
    me,
    membership,
    cursor,
    setCursor,
    toThisMonth: () => {
      const d = new Date();
      if (cursor.year !== d.getFullYear() || cursor.month !== d.getMonth()) setCursor({ year: d.getFullYear(), month: d.getMonth() });
    },
    shifts,
    absences,
    recordsLoading: shiftRes.data?.key !== rangeKey || absRes.data?.key !== rangeKey,
    recordsFailed: !!shiftRes.error || !!absRes.error,
    requests: reqRes.data,
    requestsFailed: !!reqRes.error,
    colleagues: colleagues.data ?? [],
    settings: { hourlyWage: membership.hourlyWage, weeklyHours: membership.weeklyHours, workDaysPerWeek: membership.workDaysPerWeek, fivePlus: membership.store.fivePlus },
    reloadShifts: shiftRes.reload,
    reloadRecords: () => (shiftRes.reload(), absRes.reload()),
    reloadAll: () => (shiftRes.reload(), absRes.reload(), reqRes.reload()),
    incoming: (reqRes.data?.substitutionsIn ?? []).filter((x) => x.status === "requested").length,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
