// 가이드 페이지 목록 — 목차·이전/다음·첫 화면 카드가 같이 읽는다. 순서와 묶음은 docs/design/component-guide.md §1-3.
// 페이지를 추가하면 여기 한 줄을 넣는다.
export type GuidePage = { href: string; label: string; description?: string };

export const GUIDE_NAV: { title: string; items: GuidePage[] }[] = [
  {
    title: "시작",
    items: [
      { href: "/guide", label: "소개" },
      { href: "/guide/foundations", label: "기초" },
    ],
  },
  {
    title: "셸",
    items: [
      { href: "/guide/components/app-header", label: "App Header", description: "모든 화면의 머리. 매장·역할, 화면 제목, 내 아바타." },
      { href: "/guide/components/bottom-nav", label: "Bottom Nav", description: "화면 하단 고정 내비게이션. 모든 로그인 화면의 푸터." },
      { href: "/guide/components/icon-button", label: "Icon Button", description: "아이콘만 있는 둥근 버튼. 이름은 aria-label 로." },
      { href: "/guide/components/avatar", label: "Avatar", description: "이름 이니셜과 사용자 id 로 고정된 색의 멤버 아바타." },
    ],
  },
  {
    title: "표시",
    items: [
      { href: "/guide/components/avatar-stack", label: "Avatar Stack", description: "달력 칸의 아바타 겹침. 4명 이상이면 2명 + +N." },
      { href: "/guide/components/status-pill", label: "Status Pill", description: "요청 상태 배지. 수정 요청·휴가·대타가 같이 쓴다." },
      { href: "/guide/components/card", label: "Card", description: "화면 본문을 묶는 흰 바탕 둥근 상자." },
      { href: "/guide/components/spinner", label: "Spinner", description: "불러오는 중 자리 표시 글자." },
      { href: "/guide/components/progress-bar", label: "Progress Bar", description: "목표 대비 값을 보이는 가로 막대. 읽는 값은 글자로." },
    ],
  },
  {
    title: "입력",
    items: [
      { href: "/guide/components/field", label: "Field", description: "입력칸 이름표와 .field 입력칸." },
      { href: "/guide/components/error-text", label: "Error Text", description: "오류 한 줄. 내용이 없으면 그리지 않는다." },
      { href: "/guide/components/month-picker", label: "Month Picker", description: "이전·다음 달 이동." },
      { href: "/guide/components/dialog", label: "Dialog", description: "화면 위 모달. 조건 수정 폼과 취소·저장." },
    ],
  },
  {
    title: "달력",
    items: [
      { href: "/guide/components/month-grid", label: "Month Grid", description: "월요일 시작 월 격자. 날짜 칸은 버튼." },
      { href: "/guide/components/calendar-legend", label: "Calendar Legend", description: "달력 표시 모양과 설명 글자." },
      { href: "/guide/components/view-toggle", label: "View Toggle", description: "달력·목록 보기 전환." },
    ],
  },
  {
    title: "화면 조각",
    items: [
      { href: "/guide/components/clock-card", label: "Clock Card", description: "출퇴근 탭의 시계, 지금 상태, 출근·퇴근 버튼." },
      { href: "/guide/components/today-dashboard", label: "Today Dashboard", description: "오늘 근무·처리할 것·이번 주·이번 달 요약 카드." },
      { href: "/guide/components/pay-view", label: "Pay View", description: "월 급여 요약과 주별 내역 카드." },
    ],
  },
];

export const GUIDE_PAGES = GUIDE_NAV.flatMap((g) => g.items);
