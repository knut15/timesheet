"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Enter } from "@/components/motion";
import { BTN, Card } from "@/components/ui";

// 바로 아래 자식(카드 3장)이 차례로 올라온다. 처음 그릴 때 한 번만 — 다시 보려면 key 를 바꿔 새로 그린다
export default function MotionEnter() {
  const [n, setN] = useState(0);
  return (
    <div className="w-full space-y-3">
      <Enter key={n} className="space-y-2">
        <Card>오늘 근무</Card>
        <Card>이번 주 합계</Card>
        <Card>예상 급여</Card>
      </Enter>
      <button type="button" className={BTN.small} onClick={() => setN((v) => v + 1)}>
        <RotateCcw size={14} aria-hidden /> 다시 보기
      </button>
    </div>
  );
}
