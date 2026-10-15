import { ProgressBar } from "@/components/ui";

// 이번 주 근무 시간 840분 / 소정 1,200분(20시간)
export default function ProgressBarBasic() {
  return <ProgressBar value={840} max={1200} label="이번 주 근무 시간" valueText="14시간 / 20시간" />;
}
