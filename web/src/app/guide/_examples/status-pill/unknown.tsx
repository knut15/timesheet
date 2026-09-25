import { StatusPill } from "@/components/ui";

// 표에 없는 값은 그 값을 회색으로 그대로 보인다
export default function StatusPillUnknown() {
  return <StatusPill status="expired" />;
}
