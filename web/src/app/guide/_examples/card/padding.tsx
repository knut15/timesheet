import { Card } from "@/components/ui";

// className 은 여백·간격 조정에만 쓴다 (달력 격자가 px-2 py-3 을 쓴다)
export default function CardPadding() {
  return (
    <Card className="px-2 py-3">
      <p className="text-sm">데모 카페 성수점</p>
    </Card>
  );
}
