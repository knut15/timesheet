"use client";
import { ClipboardList, Wallet } from "lucide-react";
import { SectionLabel } from "@/components/ui";

// 번호(index)와 오른쪽 요약 값(right). 둘 다 고정폭 숫자로 그린다
export default function SectionLabelIndexRight() {
  return (
    <div className="w-full max-w-xs space-y-4">
      <SectionLabel icon={ClipboardList} index="01" right="3건">
        보낸 요청
      </SectionLabel>
      <SectionLabel icon={Wallet} index="02" right="9월">
        예상 급여
      </SectionLabel>
    </div>
  );
}
