"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ACT_CANCEL, ACT_SAVE, BTN_ACCENT } from "@/components/buttons";
import { Field } from "@/components/ui";
import { digitsOf, withCommas } from "@/lib/schedule";

// 멤버 카드 "조건 수정" 과 같은 틀 — 작은 회색 버튼으로 열고, 아래 취소·저장(h-9, components/buttons.ts)
export default function DialogBasic() {
  const [open, setOpen] = useState(false);
  const [wage, setWage] = useState(10320);
  return (
    <>
      <button onClick={() => setOpen(true)} className={BTN_ACCENT}>
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
            <button onClick={() => setOpen(false)} className={ACT_CANCEL}>취소</button>
            <button onClick={() => setOpen(false)} className={ACT_SAVE}>저장</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
