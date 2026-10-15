"use client";
import { Card, NUM } from "@/components/ui";

export default function CardBasic() {
  return (
    <Card>
      <p className="text-sm text-muted">이번 주 근무</p>
      <p className={`mt-1 text-2xl font-bold ${NUM}`}>18시간 30분</p>
    </Card>
  );
}
