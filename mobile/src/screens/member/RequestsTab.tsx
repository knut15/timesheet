// 멤버 요청 탭 — 웹 TimesheetApp.tsx 의 tab === "requests" 구역
import { Screen } from "@/components/shell";
import { useMember } from "./MemberData";
import { RequestsPanel } from "./requests/RequestsPanel";

export function RequestsTab() {
  const m = useMember();
  return (
    <Screen onRefresh={m.reloadAll}>
      <RequestsPanel requests={m.requests} failed={m.requestsFailed} colleagues={m.colleagues} onChange={m.reloadAll} />
    </Screen>
  );
}
