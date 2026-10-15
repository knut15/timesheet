"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/shell";

// outline — 본문 안에 두는 테두리 있는 모양. 아이콘은 18px
export default function IconButtonOutline() {
  const [n, setN] = useState(0);
  return (
    <div className="flex items-center gap-3">
      <IconButton variant="outline" icon={ChevronLeft} label="이전" onClick={() => setN((v) => v - 1)} />
      <span className="w-8 text-center font-mono tabular-nums">{n}</span>
      <IconButton variant="outline" icon={ChevronRight} label="다음" onClick={() => setN((v) => v + 1)} />
    </div>
  );
}
