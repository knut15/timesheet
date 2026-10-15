"use client";
import { DotRow } from "@/components/PayView";
import { Card, hm, NUM, won } from "@/components/ui";

// 이름 ··· 값. dl 안에 쌓는다. 값이 없는 줄은 muted 로 옅게.
// 금액 계산은 pay.ts 가 하므로 여기서는 입력값(시급)과 시간만 보인다
export default function PayViewDotRow() {
  return (
    <Card>
      <dl className="mt-2.5 grid gap-1.5 text-[13px]">
        <DotRow term="시급"><span className={NUM}>{won(10320)}</span></DotRow>
        <DotRow term="근무"><span className={NUM}>{hm(1110)} · 5일</span></DotRow>
        <DotRow term="연장" muted><span className={NUM}>{hm(0)}</span></DotRow>
      </dl>
    </Card>
  );
}
