// 기초 페이지와 첫 화면의 견본 블록. 값의 원본은 루트 DESIGN.md §2 (코드는 web/src/app/globals.css, 명세는 docs/design/component-guide.md §2).
// 다크 값은 테마 전환 없이 hex 를 직접 칠해 보인다 — 토큰은 prefers-color-scheme 로만 바뀐다(§1-5).
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import {
  CalendarDays, ClipboardList, Clock, Hourglass, Inbox, LayoutDashboard, List, LogOut, Store, TriangleAlert, UserRound, Users, Wallet,
} from "lucide-react";
import { GUIDE_PAGES } from "./nav";

const TOKENS = [
  { name: "--background", tw: "bg-background", light: "#fafafa", dark: "#09090b", use: "페이지 바탕, 하단 내비 활성 칩, 주 버튼(BTN.primary) 글자" },
  { name: "--foreground", tw: "text-foreground", light: "#18181b", dark: "#fafafa", use: "본문 글자, 하단 내비 활성 글자, 주 버튼(BTN.primary) 바탕" },
  { name: "--surface", tw: "bg-surface", light: "#ffffff", dark: "#18181b", use: "카드, 헤더, 하단 내비, 입력칸(.field), 선 버튼, 아바타 겹침 경계(ring-surface)" },
  { name: "--line", tw: "border-line", light: "#e4e4e7", dark: "#27272a", use: "카드·헤더·내비·버튼 경계선, 중립 배지 바탕, 보기 전환 틀(60%)" },
  { name: "--muted", tw: "text-muted", light: "#6b6b74", dark: "#a1a1aa", use: "보조 글자, 비활성 메뉴, 구역 머리(SectionLabel), 점선 테두리, 장면 소품" },
  { name: "--accent", tw: "text-accent bg-accent", light: "#0f766e", dark: "#2dd4bf", use: "오늘·선택, 입력 포커스(테두리 + 15% 고리), 시계·큰 급여 숫자, 장면 원(10% 바탕), 강조 버튼 바탕" },
  { name: "--on-accent", tw: "text-on-accent bg-on-accent", light: "#ffffff", dark: "#05201d", use: "강조 버튼 글자, 출근 알림 카드 안 반전 버튼" },
  { name: "--warn", tw: "text-warn bg-warn", light: "#b91c1c", dark: "#f87171", use: "오류 글자, 내비 배지, 거절 상태, 퇴근 기록 없음" },
  { name: "--ok", tw: "text-ok bg-ok", light: "#166534", dark: "#4ade80", use: "승인 배지, 근무 중 점" },
  { name: "--caution", tw: "text-caution bg-caution", light: "#92400e", dark: "#fbbf24", use: "대기 배지, 요청 대기 아이콘" },
];

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="h-6 w-6 shrink-0 rounded-md border border-line" style={{ backgroundColor: hex }} />
      <span className="font-mono text-xs">
        <span className="sr-only">{label} </span>
        {hex}
      </span>
    </span>
  );
}

/** 첫 화면용 요약 — 색 토큰 전부, 라이트·다크 나란히 */
export function TokenSummary() {
  return (
    <div className="my-6 rounded-2xl border border-line bg-surface p-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {TOKENS.map((t) => (
          <li key={t.name} className="flex flex-wrap items-center justify-between gap-2">
            <code className="font-mono text-[13px]">{t.name}</code>
            <span className="flex gap-3">
              <Swatch hex={t.light} label="라이트" />
              <Swatch hex={t.dark} label="다크" />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link href="/guide/foundations" className="text-accent">기초 전체 보기 →</Link>
      </p>
    </div>
  );
}

/** 기초 페이지 색 토큰 표 */
export function ColorTokens() {
  // overflow-hidden: 안의 sr-only(절대 위치)가 스크롤 틀 밖으로 나가 문서 폭을 넓히지 않게
  return (
    <ScrollArea className="my-6 overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-line text-xs text-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">토큰</th>
            <th className="px-4 py-2.5 font-medium">Tailwind</th>
            <th className="px-4 py-2.5 font-medium">라이트</th>
            <th className="px-4 py-2.5 font-medium">다크</th>
            <th className="px-4 py-2.5 font-medium">쓰는 곳</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {TOKENS.map((t) => (
            <tr key={t.name} className="align-middle">
              <td className="px-4 py-3 font-mono text-[13px]">{t.name}</td>
              <td className="px-4 py-3 font-mono text-[13px] text-muted">{t.tw}</td>
              <td className="px-4 py-3"><Swatch hex={t.light} label="라이트" /></td>
              <td className="px-4 py-3"><Swatch hex={t.dark} label="다크" /></td>
              <td className="px-4 py-3 leading-6">{t.use}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

const TYPE = [
  { size: "9px", cls: "text-[9px]", use: "Avatar xs 이니셜, +N" },
  { size: "10px", cls: "text-[10px]", use: "내비 배지 숫자, 달력 칸 휴가 글자" },
  { size: "11px", cls: "text-[11px]", use: "내비 이름, StatusPill, 요일 줄, 범례, 달력 칸 시간" },
  { size: "12px", cls: "text-xs", use: "Field 이름(font-semibold), SectionLabel, 작은 버튼(BTN.small), Avatar sm" },
  { size: "14px", cls: "text-sm", use: "보조 설명, ErrorText, 보기 전환, 선 버튼(BTN.secondary)" },
  { size: "15px", cls: "text-[15px]", use: "헤더 매장 이름(font-medium), 주 버튼(BTN.primary)" },
  { size: "16px", cls: "text-base", use: "입력칸 .field (iOS 확대 방지 크기)" },
  { size: "18px", cls: "text-lg", use: "헤더 화면 이름(font-bold tracking-tight)" },
  { size: "20px", cls: "text-xl", use: "Avatar lg" },
  { size: "28px", cls: "text-[28px]", use: "대시보드 인건비(font-semibold text-accent, NUM)" },
  { size: "30px", cls: "text-[30px]", use: "급여 총액(font-semibold text-accent, NUM)" },
  { size: "40px", cls: "text-[40px]", use: "출퇴근 시계(font-semibold text-accent, NUM)" },
];

/** 글자 크기 표. 견본은 그 클래스로 실제로 그린다 */
export function TypeScale() {
  return (
    <ScrollArea className="my-6 overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b border-line text-xs text-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">크기</th>
            <th className="px-4 py-2.5 font-medium">클래스</th>
            <th className="px-4 py-2.5 font-medium">견본</th>
            <th className="px-4 py-2.5 font-medium">실제 쓰는 곳</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {TYPE.map((t) => (
            <tr key={t.cls} className="align-middle">
              <td className="px-4 py-3 tabular-nums">{t.size}</td>
              <td className="px-4 py-3 font-mono text-[13px] text-muted">{t.cls}</td>
              <td className={`whitespace-nowrap px-4 py-3 tabular-nums ${t.cls}`}>출퇴근 123</td>
              <td className="px-4 py-3 leading-6">{t.use}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

const ICONS = [
  { name: "Clock", Icon: Clock, use: "멤버 내비" },
  { name: "CalendarDays", Icon: CalendarDays, use: "멤버·마스터 내비" },
  { name: "ClipboardList", Icon: ClipboardList, use: "멤버 내비" },
  { name: "Wallet", Icon: Wallet, use: "멤버 내비" },
  { name: "UserRound", Icon: UserRound, use: "멤버 내비" },
  { name: "LayoutDashboard", Icon: LayoutDashboard, use: "마스터 내비" },
  { name: "Inbox", Icon: Inbox, use: "마스터 내비" },
  { name: "Users", Icon: Users, use: "마스터 내비" },
  { name: "Store", Icon: Store, use: "마스터 내비" },
  { name: "LogOut", Icon: LogOut, use: "헤더 로그아웃" },
  { name: "List", Icon: List, use: "보기 전환" },
  { name: "Hourglass", Icon: Hourglass, use: "달력 요청 대기" },
  { name: "TriangleAlert", Icon: TriangleAlert, use: "달력 퇴근 기록 없음" },
];

/** 지금 쓰는 lucide 아이콘 격자 */
export function IconGrid() {
  return (
    <ul className="my-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {ICONS.map(({ name, Icon, use }) => (
        <li key={name} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
          <Icon size={22} aria-hidden className="shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-mono text-xs">{name}</span>
            <span className="block truncate text-xs text-muted">{use}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** 첫 화면의 컴포넌트 카드 격자. 목차 순서 그대로 */
export function ComponentCards() {
  return (
    <ul className="my-6 grid gap-3 sm:grid-cols-2">
      {GUIDE_PAGES.filter((p) => p.description).map((p) => (
        <li key={p.href}>
          <Link href={p.href} className="block h-full rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-muted">
            <span className="block font-semibold">{p.label}</span>
            <span className="mt-1 block text-sm leading-6 text-muted">{p.description}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
