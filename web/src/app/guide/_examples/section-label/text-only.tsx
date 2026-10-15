"use client";
import { SectionLabel } from "@/components/ui";

// 아이콘 없이 글자만. 제목 수준이 h2 가 아니면 as 로 바꾼다
export default function SectionLabelTextOnly() {
  return (
    <div className="w-full max-w-xs">
      <SectionLabel as="h3" right="2명">
        지금 근무 중
      </SectionLabel>
    </div>
  );
}
