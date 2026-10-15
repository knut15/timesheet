"use client";
import { useState } from "react";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BTN, Field } from "@/components/ui";

// 기록 탭 요청 모달과 같은 틀 — 진짜는 RecordsPanel.tsx 의 RequestDialog(내부, export 안 됨)이고 API 로 보낸다.
// 여기서는 보내지 않고 닫기만 한다. 기록은 9월 24일(목) 오전 10:00 ~ 오후 02:00 (가짜)
const TEXT = {
  add: { title: "빠진 기록 추가 요청", desc: "출퇴근을 찍지 못한 날의 시각을 적어 주세요. 사장님이 승인하면 기록에 들어가요." },
  edit: { title: "수정 요청", desc: "바른 출퇴근 시각과 사유를 적어 주세요. 사장님이 승인하면 기록이 바뀌어요." },
  delete: { title: "삭제 요청", desc: "9월 24일 (목) 오전 10:00 ~ 오후 02:00 기록을 지워 달라고 요청해요. 사장님이 승인하면 기록에서 빠져요." },
} as const;

export default function DialogRequest() {
  const [mode, setMode] = useState<keyof typeof TEXT | null>(null);
  const text = mode ? TEXT[mode] : null;
  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setMode("edit")} className={BTN.small}><PencilLine size={13} aria-hidden />수정 요청</button>
        <button type="button" onClick={() => setMode("delete")} className={BTN.danger}><Trash2 size={13} aria-hidden />삭제 요청</button>
      </div>
      <button type="button" onClick={() => setMode("add")} className={`${BTN.dashed} w-full`}>
        <Plus size={16} aria-hidden /> 빠진 기록 추가 요청
      </button>
      <Dialog open={!!text} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] gap-4 overflow-y-auto rounded-2xl bg-surface p-5 ring-line sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">{text?.title}</DialogTitle>
            <DialogDescription className="text-[13px] text-muted">{text?.desc}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => (e.preventDefault(), setMode(null))} className="space-y-3">
            {mode !== "delete" && (
              <div className="grid grid-cols-1 gap-2">
                <Field label="바른 출근"><input type="datetime-local" required defaultValue={mode === "edit" ? "2026-09-24T10:00" : ""} className="field" /></Field>
                <Field label="바른 퇴근"><input type="datetime-local" required defaultValue={mode === "edit" ? "2026-09-24T14:00" : ""} className="field" /></Field>
              </div>
            )}
            <Field label="사유"><input required maxLength={200} placeholder="예: 퇴근을 깜빡했어요" className="field" /></Field>
            <DialogFooter className="-mx-5 -mb-5 mt-4 flex-row border-line bg-transparent px-5 py-4">
              <button type="button" onClick={() => setMode(null)} className={`${BTN.secondary} flex-1`}>취소</button>
              <button className={`${BTN.primary} flex-1`}>요청 보내기</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
