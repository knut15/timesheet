import { ProgressBar } from "@/components/ui";

// max 를 넘으면 막대는 가득 차고 더 그리지 않는다. aria-valuenow 는 1200 으로 잘리고, 실제 값은 valueText 가 말한다
export default function ProgressBarOverflow() {
  return <ProgressBar value={1528} max={1200} label="이번 주 근무 시간" valueText="25시간 28분 / 20시간" />;
}
