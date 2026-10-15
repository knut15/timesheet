"use client";
import { BTN } from "@/components/ui";

// 폭·바깥 여백은 쓰는 쪽에서 더한다
export default function ButtonsFullWidth() {
  return (
    <div className="w-full space-y-2">
      <button type="button" className={`${BTN.primary} w-full`}>코드 등록</button>
      <button type="button" className={`${BTN.secondary} w-full`}>매장 만들기</button>
    </div>
  );
}
