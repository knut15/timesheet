// 옛 버튼 이름 — 2026-09-25 에 shadcn buttonVariants 위에 만든 이름을 B 시안의 BTN 모양으로 잇는다 (2026-10-15).
// 새 코드는 styles.ts(ui.tsx)의 BTN 을 쓴다. 규칙은 timesheet-ui 스킬 §0 "버튼", 값은 DESIGN.md §3.
// 2026-09-25 결정 중 "색 테두리(파랑·빨강) 없음·주 동작 검정·지우기는 올리면 빨강" 은 그대로, "보통 동작 회색 채움" 은 B 의 회색 선으로 바뀌었다.
import { cn } from "@/lib/utils";
import { BTN } from "./styles";

/** 카드 안 작은 보통 동작 — 조건 수정·근무 기록·수정·복사 (h-8) */
export const BTN_ACCENT = BTN.small;
/** 카드 안 작은 지우기 동작 — 삭제·퇴사처리·취소(초대). 올리면 빨강 (h-8) */
export const BTN_WARN = BTN.danger;
/** 폼 아래 저장·취소 — 나란히 (h-11) */
export const ACT_SAVE = cn(BTN.primary, "flex-1");
export const ACT_CANCEL = cn(BTN.secondary, "flex-1");
/** 한 줄을 다 쓰는 큰 버튼 (h-11) */
export const BLOCK_PRIMARY = cn(BTN.primary, "w-full");
export const BLOCK_SECONDARY = cn(BTN.secondary, "w-full");
