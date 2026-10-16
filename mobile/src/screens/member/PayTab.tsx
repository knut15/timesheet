// 멤버 급여 탭 — 웹 TimesheetApp.tsx 의 tab === "pay" 구역과 PayTab
import { Screen } from "@/components/shell";
import { MonthPicker } from "@/components/ui";
import { useNow } from "@/lib/format";
import { useMember } from "./MemberData";
import { PayView, PayViewSkeleton } from "./pay/PayView";

export function PayTab() {
  const m = useMember();
  const now = useNow(60_000);
  const { year, month } = m.cursor;
  // 읽기에 실패하면 예전처럼 PayView 를 그린다 — 실패한 동안 막대가 멈춰 있지 않게
  const loading = m.recordsLoading && !m.recordsFailed;
  return (
    <Screen onRefresh={m.reloadRecords}>
      <MonthPicker cursor={m.cursor} onChange={m.setCursor} />
      {loading ? <PayViewSkeleton year={year} month={month} now={now} /> : <PayView shifts={m.shifts} absences={m.absences} settings={m.settings} year={year} month={month} now={now} />}
    </Screen>
  );
}
