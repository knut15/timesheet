"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BTN, Field } from "@/components/ui";
import { digitsOf, withCommas } from "@/lib/schedule";

// 멤버 카드 "조건 수정" 과 같은 틀 — 작은 선 버튼(BTN.small)으로 열고, 아래 취소·저장(BTN.secondary·BTN.primary + flex-1)
export default function DialogBasic() {
  const [open, setOpen] = useState(false);
  const [wage, setWage] = useState(10320);
  return (
    <>
      <button onClick={() => setOpen(true)} className={BTN.small}>
        조건 수정
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-surface p-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">이서준 조건 수정</DialogTitle>
          </DialogHeader>
          <Field label="시급(원)">
            <input inputMode="numeric" value={withCommas(wage)} onChange={(e) => setWage(digitsOf(e.target.value))} className="field tabular-nums" />
          </Field>
          <DialogFooter className="-mx-5 -mb-5 flex-row border-line bg-transparent px-5 py-4">
            <button onClick={() => setOpen(false)} className={`${BTN.secondary} flex-1`}>취소</button>
            <button onClick={() => setOpen(false)} className={`${BTN.primary} flex-1`}>저장</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
