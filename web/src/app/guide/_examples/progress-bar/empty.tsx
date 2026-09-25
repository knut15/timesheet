import { ProgressBar } from "@/components/ui";

// 값 0 → 채움 없이 빈 칸만
export default function ProgressBarEmpty() {
  return <ProgressBar value={0} max={1200} label="이번 주 근무 시간" valueText="0시간 / 20시간" />;
}
