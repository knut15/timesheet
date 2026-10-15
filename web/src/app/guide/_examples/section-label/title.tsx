"use client";
import { NotebookText, Plane } from "lucide-react";
import { Card, SectionLabel } from "@/components/ui";

// tone="title" — 카드 제목. "매장 근처 출근 알림" 과 같은 14px 굵게·본문색, 아이콘만 회색
export default function SectionLabelTitle() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <Card><SectionLabel tone="title" icon={Plane}>휴가 신청</SectionLabel></Card>
      <Card><SectionLabel tone="title" icon={NotebookText}>근무 조건</SectionLabel></Card>
    </div>
  );
}
