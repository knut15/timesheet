// 기초 페이지와 첫 화면의 견본 블록. 값은 docs/design/component-guide.md §2 (원본은 web/src/app/globals.css).
// 다크 값은 테마 전환 없이 hex 를 직접 칠해 보인다 — 토큰은 prefers-color-scheme 로만 바뀐다(§1-5).
import Link from "next/link";
import {
  CalendarDays, ClipboardList, Clock, Hourglass, Inbox, LayoutDashboard, List, LogOut, Store, TriangleAlert, UserRound, Users, Wallet,
} from "lucide-react";
import { GUIDE_PAGES } from "./nav";

const TOKENS = [
  { name: "--background", tw: "bg-background", light: "#f5f5f4", dark: "#0c0a09", use: "페이지 바탕, 입력칸(.field), 보기 전환 틀" },
  { name: "--foreground", tw: "text-foreground", light: "#1c1917", dark: "#f5f5f4", use: "본문 글자" },
  { name: "--surface", tw: "bg-surface", light: "#ffffff", dark: "#1c1917", use: "카드, 하단 내비, 아바타 겹침 경계(ring-surface)" },
  { name: "--line", tw: "border-line", light: "#e7e5e4", dark: "#292524", use: "카드·헤더·내비 경계선, 중립 배지 바탕" },
  { name: "--muted", tw: "text-muted", light: "#78716c", dark: "#a8a29e", use: "보조 글자, 비활성 메뉴, 점선 테두리" },
  { name: "--accent", tw: "text-accent bg-accent", light: "#2563eb", dark: "#3b82f6", use: "활성 메뉴, 오늘·선택, 입력 포커스" },
  { name: "--warn", tw: "text-warn bg-warn", light: "#dc2626", dark: "#f87171", use: "오류 글자, 대기 배지, 거절 상태, 퇴근 기록 없음" },
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

/** 첫 화면용 요약 — 토큰 7개, 라이트·다크 나란히 */
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
  // relative: 안의 sr-only(절대 위치)가 스크롤 틀 밖으로 나가 문서 폭을 넓히지 않게
  return (
    <div className="relative my-6 overflow-x-auto rounded-2xl border border-line bg-surface">
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
    </div>
  );
}

const TYPE = [
  { size: "9px", cls: "text-[9px]", use: "Avatar xs 이니셜, +N" },
  { size: "10px", cls: "text-[10px]", use: "내비 배지 숫자, 달력 칸 휴가 글자" },
  { size: "11px", cls: "text-[11px]", use: "내비 이름, 요일 줄, 범례, 달력 칸 시간" },
  { size: "12px", cls: "text-xs", use: "헤더 위 작은 줄, StatusPill, Avatar sm" },
  { size: "14px", cls: "text-sm", use: "Field 이름, 보조 설명, ErrorText, 보기 전환" },
  { size: "16px", cls: "text-base", use: "입력칸 .field (iOS 확대 방지 크기)" },
  { size: "20px", cls: "text-xl", use: "헤더 제목(font-bold tracking-tight), Avatar lg" },
  { size: "30px", cls: "text-3xl", use: "급여 총액(font-bold)" },
];

/** 글자 크기 표. 견본은 그 클래스로 실제로 그린다 */
export function TypeScale() {
  return (
    <div className="relative my-6 overflow-x-auto rounded-2xl border border-line bg-surface">
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
    </div>
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
