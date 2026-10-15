"use client";
import { LogIn, Plus, Trash2 } from "lucide-react";
import { BTN } from "@/components/ui";

// 아이콘은 글자 앞, aria-hidden. 간격은 BTN 이 이미 준다(gap-1.5 / 작은 것 gap-1)
export default function ButtonsWithIcon() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button type="button" className={BTN.primary}>
        <LogIn size={18} aria-hidden /> 로그인
      </button>
      <button type="button" className={BTN.dashed}>
        <Plus size={16} aria-hidden /> 멤버 초대
      </button>
      <button type="button" className={BTN.danger}>
        <Trash2 size={14} aria-hidden /> 삭제
      </button>
    </div>
  );
}
