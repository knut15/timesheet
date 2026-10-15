"use client";
import { BTN } from "@/components/ui";

export default function ButtonsVariants() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button type="button" className={BTN.primary}>출근하기</button>
      <button type="button" className={BTN.secondary}>취소</button>
      <button type="button" className={BTN.small}>수정</button>
      <button type="button" className={BTN.dashed}>휴가 추가</button>
      <button type="button" className={BTN.danger}>삭제</button>
    </div>
  );
}
