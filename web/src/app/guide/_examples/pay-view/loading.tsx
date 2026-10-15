import { PayViewSkeleton } from "@/components/PayView";

const now = new Date(2026, 8, 30, 18).getTime(); // 9월 30일 18:00 고정 — Basic 과 같다

// 기록·휴가를 읽는 중 — 요약 카드와 주 카드 4장(9월에 일요일이 든 주 중 now 까지 시작한 주)이 Basic 과 같은 높이
export default function PayViewLoading() {
  return <PayViewSkeleton year={2026} month={8} now={now} />;
}
