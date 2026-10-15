"use client";
import { useState } from "react";
import { Clock, Coffee, RotateCcw, Sun } from "lucide-react";
import { Scene } from "@/components/illust";
import { BTN } from "@/components/ui";

// 출퇴근 = 시계 + 커피 잔 + 해. 처음 그릴 때만 움직이므로 key 를 바꿔 다시 그린다
export default function SceneBasic() {
  const [n, setN] = useState(0);
  return (
    <div className="flex flex-col items-center gap-4">
      <Scene key={n} icon={Clock} accents={[{ icon: Coffee, at: "br" }, { icon: Sun, at: "tl" }]} />
      <button type="button" className={BTN.small} onClick={() => setN((v) => v + 1)}>
        <RotateCcw size={14} aria-hidden /> 다시 보기
      </button>
    </div>
  );
}
