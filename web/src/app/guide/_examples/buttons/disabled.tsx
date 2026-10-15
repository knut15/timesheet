"use client";
import { BTN } from "@/components/ui";

// disabled — 주 버튼은 회색 바탕, 나머지는 반투명
export default function ButtonsDisabled() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button type="button" disabled className={BTN.primary}>저장 중…</button>
      <button type="button" disabled className={BTN.secondary}>취소</button>
      <button type="button" disabled className={BTN.small}>수정</button>
    </div>
  );
}
