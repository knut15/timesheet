import { ACT_CANCEL, ACT_SAVE, BLOCK_PRIMARY, BLOCK_SECONDARY, BTN_ACCENT, BTN_WARN } from "@/components/buttons";
import { Card } from "@/components/ui";

// 버튼 네 모양 — 주 동작 검정(다크 모드 흰색) · 보통 회색 · 지우기는 회색 글자에 올리면 빨강
export default function ButtonVariants() {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button className={BTN_ACCENT}>조건 수정</button>
        <button className={BTN_ACCENT}>근무 기록</button>
        <button className={BTN_WARN}>퇴사처리</button>
      </div>
      <div className="flex gap-2">
        <button className={ACT_CANCEL}>취소</button>
        <button className={ACT_SAVE}>저장</button>
      </div>
      <button className={BLOCK_PRIMARY}>초대 코드 발급</button>
      <button className={BLOCK_SECONDARY}>현재 위치를 매장으로</button>
    </Card>
  );
}
