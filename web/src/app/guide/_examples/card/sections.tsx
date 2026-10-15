"use client";
import { CalendarDays, Wallet } from "lucide-react";
import { Card, NUM, SectionLabel } from "@/components/ui";

// 구역 나누기 — 카드 여백을 없애고(p-0) 구역마다 px-4 py-3.5, 사이에 가는 선(divide-y)
export default function CardSections() {
  return (
    <Card className="divide-y divide-line p-0">
      <div className="px-4 py-3.5">
        <SectionLabel icon={CalendarDays} index="01" right="5일">
          이번 주 근무
        </SectionLabel>
        <p className={`mt-2 text-xl font-bold ${NUM}`}>18시간 30분</p>
      </div>
      <div className="px-4 py-3.5">
        <SectionLabel icon={Wallet} index="02">
          예상 급여
        </SectionLabel>
        <p className={`mt-2 text-xl font-bold ${NUM}`}>190,920원</p>
      </div>
    </Card>
  );
}
