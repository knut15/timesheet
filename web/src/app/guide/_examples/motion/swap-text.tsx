"use client";
import { useState } from "react";
import { SwapText } from "@/components/motion";
import { BTN } from "@/components/ui";

// 글자가 바뀔 때만 움직인다. 처음 그릴 때는 그대로
export default function MotionSwapText() {
  const [working, setWorking] = useState(true);
  return (
    <div className="flex flex-col items-center gap-3">
      <SwapText text={working ? "근무 중" : "퇴근함"} className="text-lg font-bold" />
      <button type="button" className={BTN.secondary} onClick={() => setWorking((v) => !v)}>
        {working ? "퇴근하기" : "출근하기"}
      </button>
    </div>
  );
}
