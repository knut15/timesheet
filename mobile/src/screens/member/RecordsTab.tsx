// 멤버 기록 탭 — 웹 TimesheetApp.tsx 의 tab === "records" 구역. 맨 위 월 이동, 아래 RecordsPanel
import { Screen } from "@/components/shell";
import { MonthPicker } from "@/components/ui";
import { useMember } from "./MemberData";
import { RecordsPanel } from "./records/RecordsPanel";

export function RecordsTab() {
  const m = useMember();
  return (
    <Screen onRefresh={m.reloadAll}>
      <MonthPicker cursor={m.cursor} onChange={m.setCursor} />
      <RecordsPanel
        shifts={m.shifts}
        absences={m.absences}
        corrections={m.requests?.corrections ?? []}
        year={m.cursor.year}
        month={m.cursor.month}
        loading={m.recordsLoading}
        failed={m.recordsFailed}
        onRetry={m.reloadRecords}
        onChange={m.reloadAll}
      />
    </Screen>
  );
}
