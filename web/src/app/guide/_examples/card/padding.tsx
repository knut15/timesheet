import { Card } from "@/components/ui";

// className 은 여백·간격 조정에만 쓴다 (달력 격자가 p-2.5 를 쓴다)
export default function CardPadding() {
  return (
    <Card className="p-2.5">
      <p className="text-sm">데모 카페 성수점</p>
    </Card>
  );
}
