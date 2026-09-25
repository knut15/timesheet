"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui";
import { digitsOf, withCommas } from "@/lib/schedule";

// 멤버 카드 "조건 수정" 과 같은 틀 — 작은 테두리 버튼으로 열고, 아래 취소·저장(h-9)
export default function DialogBasic() {
  const [open, setOpen] = useState(false);
  const [wage, setWage] = useState(10320);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex h-8 items-center rounded-lg border border-accent px-2.5 text-xs font-semibold text-accent hover:bg-accent/10">
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
            <button onClick={() => setOpen(false)} className="h-9 flex-1 rounded-lg border border-line text-sm font-semibold">취소</button>
            <button onClick={() => setOpen(false)} className="h-9 flex-1 rounded-lg bg-accent text-sm font-semibold text-white">저장</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
