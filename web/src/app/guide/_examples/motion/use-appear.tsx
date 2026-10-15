"use client";
import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { useAppear } from "@/components/motion";
import { BTN } from "@/components/ui";

// ref 를 붙인 요소가 마운트될 때 한 번 올라오며 나타난다
function Done() {
  const ref = useAppear<HTMLDivElement>();
  return (
    <div ref={ref} className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold">
      <CircleCheck size={18} aria-hidden className="text-ok" /> 저장했어요
    </div>
  );
}

export default function MotionUseAppear() {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <button type="button" className={BTN.primary} onClick={() => setShown((v) => !v)}>
        {shown ? "닫기" : "저장"}
      </button>
      {shown && <Done />}
    </div>
  );
}
