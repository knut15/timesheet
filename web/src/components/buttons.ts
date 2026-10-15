// 앱 버튼 모양 — shadcn Button(buttonVariants) 위에 크기만 얹는다. 규칙은 timesheet-ui 스킬 §0 "버튼".
// 2026-09-25 "버튼 디자인이 너무 촌스럽다 파랑 빨강. 모던하게" — 색 테두리(파랑·빨강)를 없애고
// 주 동작은 검정(다크 모드 흰색) 채움, 보통 동작은 회색 채움, 지우기·퇴사처리는 회색 글자에 올리면 빨강.
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const small = "h-8 px-2.5 text-xs";

/** 카드 안 작은 보통 동작 — 조건 수정·근무 기록·수정·복사 */
export const BTN_ACCENT = cn(buttonVariants({ variant: "secondary" }), small);
/** 카드 안 작은 지우기 동작 — 삭제·퇴사처리·취소(초대) */
export const BTN_WARN = cn(buttonVariants({ variant: "ghost" }), small, "text-muted hover:bg-warn/10 hover:text-warn dark:hover:bg-warn/15");
/** 폼 아래 저장·취소 (h-9, 나란히) */
export const ACT_SAVE = cn(buttonVariants({ size: "lg" }), "flex-1 font-semibold");
export const ACT_CANCEL = cn(buttonVariants({ variant: "secondary", size: "lg" }), "flex-1 font-semibold");
/** 한 줄을 다 쓰는 큰 버튼 (h-12) */
export const BLOCK_PRIMARY = cn(buttonVariants(), "h-12 w-full rounded-xl text-base font-semibold");
export const BLOCK_SECONDARY = cn(buttonVariants({ variant: "secondary" }), "h-12 w-full rounded-xl text-base font-semibold");
