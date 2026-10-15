"use client";
import { useState } from "react";
import { CountUp } from "@/components/motion";
import { BTN, NUM, won } from "@/components/ui";

// 처음에는 0에서, 그다음부터는 이전 값에서 새 값까지 0.6초. 화면에 그리는 글자는 format 결과다
export default function MotionCountUp() {
  const [value, setValue] = useState(190920);
  return (
    <div className="flex flex-col items-center gap-3">
      <CountUp value={value} format={won} className={`text-3xl font-bold text-accent ${NUM}`} />
      <div className="flex gap-2">
        <button type="button" className={BTN.small} onClick={() => setValue(190920)}>9월</button>
        <button type="button" className={BTN.small} onClick={() => setValue(247680)}>10월</button>
      </div>
    </div>
  );
}
