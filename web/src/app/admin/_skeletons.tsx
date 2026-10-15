"use client";
// 사장 화면 불러오는 중 스켈레톤. 불러온 뒤 화면과 같은 틀(Card·padding·gap·grid)에 데이터 글자 대신 Bone 을 둔다 —
// 데이터가 들어와도 레이아웃이 움직이지 않게. 고정 문구(제목·안내·입력칸 이름)와 데이터 없이도 되는 링크는 실제 글자로 둔다.
// 페이지 파일은 default 외 export 를 둘 수 없어 여기 모은다. 로그인 확인 전 admin/layout.tsx 도 같은 것을 쓴다.
// 크기는 2026-10-15 B 시안 화면에 맞춘다 — 화면 쪽 크기를 바꾸면 여기도 같이 바꾼다.
import { ArrowLeftRight, Coins, MapPin, Plane, Store as StoreIcon, Timer, Wallet } from "lucide-react";
import { Bone, Card, Loading, SectionLabel } from "@/components/ui";

// 글자 크기 → 줄 높이 칸과 그 안의 막대 높이 (text-xs 16, text-[13px] 19.5, text-sm 20, text-base 24, text-xl 28, text-[28px] leading-tight 35)
const BOX = { xs: "h-4", "13": "h-[19.5px]", sm: "h-5", base: "h-6", xl: "h-7", "28": "h-[35px]" } as const;
const BAR = { xs: "h-3", "13": "h-3.5", sm: "h-3.5", base: "h-4", xl: "h-5", "28": "h-6" } as const;

/** 글자 한 줄 자리 — 칸은 그 글자의 줄 높이, 막대는 칸 안 가운데 */
function Line({ size = "sm", w, className = "" }: { size?: keyof typeof BOX; w: string; className?: string }) {
  return (
    <div className={`flex ${BOX[size]} items-center ${className}`}>
      <Bone className={`${BAR[size]} ${w}`} />
    </div>
  );
}

const times = <T,>(n: number, f: (i: number) => T) => Array.from({ length: n }, (_, i) => f(i));

/** MonthPicker 자리 — 화살표 IconButton h-11 두 개와 가운데 "2026년 9월" (text-base) */
function MonthPickerBone() {
  const arrow = (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface">
      <Bone className="h-4 w-4 rounded-md" />
    </div>
  );
  return (
    <div className="flex items-center justify-between">
      {arrow}
      <Line size="base" w="w-24" />
      {arrow}
    </div>
  );
}

/** Field 자리 — ui.tsx Field 와 같은 틀: 이름(text-xs, 줄은 text-sm 20) + mt-1.5 + .field h-11 */
function FieldBone({ label }: { label: string }) {
  return (
    <div className="block min-w-0 text-sm">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <div className="mt-1.5">
        <Bone className="h-11 rounded-xl" />
      </div>
    </div>
  );
}

/** 체크 줄 자리 — 왼쪽 상자 18px + 글자, 줄 높이 44px (B 시안 .check) */
function CheckBone({ label }: { label: string }) {
  return (
    <div className="flex min-h-11 items-center gap-2 text-[13px] font-medium">
      <Bone className="h-[18px] w-[18px] shrink-0 rounded" />
      <span>{label}</span>
    </div>
  );
}

const AvatarBone = ({ size }: { size: "sm" | "md" | "lg" }) => (
  // 아바타는 둥근 사각형 — shell.tsx SIZES 와 같은 모서리
  <Bone className={`shrink-0 ${{ sm: "h-8 w-8 rounded-[6px]", md: "h-10 w-10 rounded-[8px]", lg: "h-16 w-16 rounded-[12px]" }[size]}`} />
);

/** 카드 안 목록 행 자리 — 점선 행(py-2.5) + 아바타 sm + 두 줄(13px·12px). 대시보드·달력·요청이 같이 쓴다 */
function ListRowBone({ right }: { right?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 border-b border-dashed border-line py-2.5 last:border-b-0">
      <AvatarBone size="sm" />
      <div className="min-w-0 flex-1">
        <Line size="13" w="w-14" />
        <Line size="xs" w="w-36" />
      </div>
      {right}
    </li>
  );
}

// ── 대시보드 /admin ────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <Loading className="grid gap-3 sm:grid-cols-2">
      <Card>
        <SectionLabel icon={Timer} right={<Bone className="h-3 w-24" />}>지금 근무 중</SectionLabel>
        <ul className="mt-1">
          {times(2, (i) => <ListRowBone key={i} right={<Bone className="h-[7px] w-[7px] shrink-0 rounded-full" />} />)}
        </ul>
      </Card>
      <Card>
        <MonthPickerBone />
        <div className="mt-3">
          <SectionLabel icon={Wallet}>인건비 (예상, 세전)</SectionLabel>
        </div>
        <Line size="28" w="w-40" className="mt-1.5" />
        {/* 기본급·주휴·휴가·연장 가산 한 줄은 금액이 크면 좁은 카드에서 두 줄이 된다 — 흔한 쪽인 두 줄 */}
        <div className="mt-1">
          <Line size="xs" w="w-full" />
          <Line size="xs" w="w-3/5" />
        </div>
      </Card>
      <Card className="sm:col-span-2">
        <SectionLabel icon={Coins}>멤버별</SectionLabel>
        <ul className="mt-1">
          {times(3, (i) => <ListRowBone key={i} right={<Line size="13" w="w-20" />} />)}
        </ul>
      </Card>
    </Loading>
  );
}

// ── 달력 /admin/calendar ───────────────────────────────────────
// 달력 화면은 격자(MonthGrid busy)를 바로 그리고 요약 줄·범례·상세 자리만 아래 조각으로 채운다.

/** 달 요약 줄 "이번 달 3명 · 120시간" 자리 (가운데, text-[13px]) */
export function CalendarSummaryBone() {
  return (
    <div className="mt-1 flex justify-center">
      <Line size="13" w="w-36" />
    </div>
  );
}

/** 범례 자리 — 항목 넷 한 줄 (text-[11px]) */
export function LegendBone() {
  return (
    <div className="flex h-4 items-center gap-3">
      {times(4, (i) => <Bone key={i} className="h-2.5 w-14" />)}
    </div>
  );
}

/** 선택한 날 멤버 행 자리 — 날짜 상세 카드 안 목록(ul mt-1)과 같은 점선 행 둘 */
export function DayRowsSkeleton() {
  return (
    <ul className="mt-1">
      {times(2, (i) => <ListRowBone key={i} right={<Bone className="h-[15px] w-[15px] shrink-0 rounded-md" />} />)}
    </ul>
  );
}

const WEEK = ["월", "화", "수", "목", "금", "토", "일"];

/** 로그인 확인 전(날짜를 서버에서 계산하지 않는다) 달력 전체 자리. 격자는 MonthGrid(마스터 칸 64)와 같은 틀, 5주. */
function CalendarSkeleton() {
  return (
    <Loading className="space-y-3">
      <div>
        <MonthPickerBone />
        <CalendarSummaryBone />
      </div>
      <Card className="p-2.5">
        <div className="grid grid-cols-7 gap-[3px]">
          {WEEK.map((w) => (
            <span key={w} className="flex h-6 items-center justify-center text-[11px] font-semibold text-muted">{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[3px]">
          {times(35, (i) => (
            <div key={i} className="flex h-[60px] flex-col justify-between rounded-md border border-line bg-surface p-1">
              <Bone className="h-2.5 w-3" />
              <Bone className="h-2.5 w-6 self-end" />
            </div>
          ))}
        </div>
        <div className="mt-2.5 px-0.5">
          <LegendBone />
        </div>
      </Card>
      <Card>
        <Line size="xs" w="w-40" />
        <DayRowsSkeleton />
      </Card>
    </Loading>
  );
}

// ── 요청 /admin/requests ───────────────────────────────────────

/** 요청 카드 머리 — 아바타 sm + "이름 · 종류" (text-sm) */
function WhoBone() {
  return (
    <div className="flex items-center gap-2.5">
      <AvatarBone size="sm" />
      <Line w="w-32" />
    </div>
  );
}

export function RequestsSkeleton() {
  return (
    <Loading className="space-y-6">
      <section className="space-y-2">
        <div className="px-1"><SectionLabel index="01" right={<Bone className="h-3 w-6" />}>처리할 요청</SectionLabel></div>
        {/* 처리할 요청 카드 하나 — 기록 수정 요청 모양(지금·요청·사유 세 줄 + 메모 칸 + 승인·거절 h-11) */}
        <Card>
          <WhoBone />
          <div className="mt-3 space-y-1.5">
            <Line size="13" w="w-52" />
            <Line size="13" w="w-52" />
            <Line size="13" w="w-32" />
          </div>
          <div className="mt-3 space-y-2">
            <Bone className="h-11 rounded-xl" />
            <div className="flex gap-2">
              <Bone className="h-11 flex-1 rounded-xl" />
              <Bone className="h-11 flex-1 rounded-xl" />
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-2">
        <div className="px-1"><SectionLabel index="02">직접 등록</SectionLabel></div>
        <div className="grid items-start gap-3 sm:grid-cols-2">
          <Card>
            <SectionLabel as="h3" icon={Plane}>휴가 등록</SectionLabel>
            <div className="mt-3 space-y-3">
              <FieldBone label="멤버" />
              <div className="grid grid-cols-2 gap-2">
                <FieldBone label="시작일" />
                <FieldBone label="종료일" />
              </div>
              <CheckBone label="유급 휴가" />
              <FieldBone label="사유" />
              <Bone className="h-11 rounded-xl" />
            </div>
          </Card>
          <Card>
            <SectionLabel as="h3" icon={ArrowLeftRight}>대타 등록</SectionLabel>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <FieldBone label="쉬는 멤버" />
                <FieldBone label="대신 나올 멤버" />
              </div>
              <FieldBone label="날짜" />
              <FieldBone label="사유" />
              <Bone className="h-11 rounded-xl" />
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-2">
        <div className="px-1"><SectionLabel index="03" right={<Bone className="h-3 w-3" />}>확정된 휴가·대타</SectionLabel></div>
        <Card className="py-1.5">
          <ul>
            {times(2, (i) => <ListRowBone key={i} right={<Bone className="h-8 w-11 shrink-0 rounded-xl" />} />)}
          </ul>
        </Card>
      </section>

      <section className="space-y-2">
        <div className="px-1"><SectionLabel index="04">최근 처리</SectionLabel></div>
        <Card className="py-1.5">
          <ul>
            {times(3, (i) => (
              <li key={i} className="flex items-center gap-2.5 border-b border-dashed border-line py-2.5 last:border-b-0">
                <AvatarBone size="sm" />
                <div className="min-w-0 flex-1">
                  <Line size="13" w="w-40" />
                </div>
                <Bone className="h-5 w-14 rounded-md" />
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </Loading>
  );
}

// ── 멤버 /admin/members ────────────────────────────────────────

/** 날짜별 변경 행 자리 — 점선 행(py-2.5) 하나: 날짜·내용(13px) + 삭제 버튼 h-8. 멤버 카드 안에서 따로 불러올 때도 쓴다 */
export function ExceptionRowsSkeleton() {
  return (
    <ul className="mt-0.5">
      <li className="flex items-center gap-2.5 border-b border-dashed border-line py-2.5 last:border-b-0">
        <div className="min-w-0 flex-1">
          <Line size="13" w="w-36" />
        </div>
        <Bone className="h-8 w-11 shrink-0 rounded-xl" />
      </li>
    </ul>
  );
}

export function MembersSkeleton() {
  return (
    <Loading className="space-y-3">
      <Bone className="h-14 rounded-2xl" />
      <ul className="grid items-start gap-3 sm:grid-cols-2">
        {times(2, (i) => (
          <li key={i}>
            <Card className="divide-y divide-line p-0">
              <div className="px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <AvatarBone size="md" />
                  <div className="min-w-0 flex-1">
                    <Line size="base" w="w-16" />
                    <Line size="xs" w="w-40" />
                  </div>
                  <Bone className="h-8 w-[4.5rem] shrink-0 rounded-xl" />
                </div>
                {/* 근무 시간표 줄과 조건 수정·퇴사처리 */}
                <Line size="xs" w="w-64 max-w-full" className="mt-2.5" />
                <div className="mt-2.5 flex gap-1.5">
                  <Bone className="h-8 w-[4.5rem] rounded-xl" />
                  <Bone className="h-8 w-16 rounded-xl" />
                </div>
              </div>
              <div className="px-4 py-3.5">
                <SectionLabel as="p">날짜별 변경</SectionLabel>
                <ExceptionRowsSkeleton />
                <Bone className="mt-1.5 h-9 rounded-xl" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Loading>
  );
}

// ── 멤버 상세 /admin/members/[userId] ──────────────────────────

export function MemberDetailSkeleton() {
  return (
    <Loading className="space-y-3">
      <Card className="flex items-center gap-3">
        <AvatarBone size="lg" />
        <div className="min-w-0">
          <Line size="xl" w="w-20" />
          <Line size="13" w="w-44" />
        </div>
      </Card>
      <MonthPickerBone />
      {/* 보기 전환 틀 — bg-line/60 p-[3px] 안 h-10 둘 */}
      <div className="grid grid-cols-2 rounded-xl bg-line/60 p-[3px]">
        {times(2, (i) => (
          <div key={i} className="flex h-10 items-center justify-center">
            <Bone className="h-3.5 w-14 bg-surface" />
          </div>
        ))}
      </div>
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {times(3, (i) => (
          <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <Line w="w-24" />
              <Line size="13" w="w-40" className="mt-0.5" />
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Bone className="h-8 w-11 rounded-xl" />
              <Bone className="h-8 w-11 rounded-xl" />
            </div>
          </li>
        ))}
      </ul>
    </Loading>
  );
}

// ── 초대 /admin/invites ────────────────────────────────────────

export function InvitesSkeleton() {
  return (
    <Loading className="space-y-3">
      <Card>
        <h2 className="font-semibold">알바생 초대</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">코드는 7일 동안, 한 명만 쓸 수 있어요. 알바생은 가입한 뒤 이 코드를 입력하면 매장에 들어와요.</p>
        <Bone className="mt-4 h-11 rounded-xl" />
      </Card>
      <ul className="grid items-start gap-3 sm:grid-cols-2">
        {times(2, (i) => (
          <li key={i}>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <Line size="xl" w="w-32" />
                <Bone className="h-5 w-14 shrink-0 rounded-md" />
              </div>
              <Line size="xs" w="w-16" className="mt-1" />
              {/* 문자로 보내기·복사·취소 — 44px 버튼 셋 (DESIGN.md §6) */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Bone className="h-11 w-32 rounded-xl" />
                <Bone className="h-11 w-20 rounded-xl" />
                <Bone className="h-11 w-14 rounded-xl" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Loading>
  );
}

// ── 매장 /admin/store ──────────────────────────────────────────

export function StoreSkeleton() {
  return (
    <Loading className="space-y-3">
      <Card className="space-y-3">
        <div>
          <SectionLabel icon={StoreIcon}>매장 로고</SectionLabel>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">헤더의 매장 이름 앞에 보여요. PNG·JPG·SVG, 1MB 이하. 가로로 긴 로고가 잘 보여요.</p>
        </div>
        <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-muted/40 bg-background">
          <Bone className="h-10 w-32" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-11 w-32 rounded-xl" />
        </div>
      </Card>
      <div className="space-y-3">
        <Card className="space-y-3">
          <FieldBone label="매장 이름" />
          <CheckBone label="상시 5인 이상 사업장 (연장근로 50% 가산)" />
        </Card>
        <Card className="space-y-3">
          <div>
            <SectionLabel icon={MapPin}>매장 위치</SectionLabel>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">알바생이 이 위치 50m 안에 들어오면 출근 알림을 받아요.</p>
          </div>
          {/* "현재 위치를 매장으로" — 글자 폭 버튼 (BTN.secondary, w-full 아님) */}
          <Bone className="h-11 w-48 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <FieldBone label="위도" />
            <FieldBone label="경도" />
          </div>
        </Card>
        <Bone className="h-11 rounded-xl" />
      </div>
    </Loading>
  );
}

/** 로그인 확인 전 본문 자리 — 지금 경로의 화면 스켈레톤 */
export function AdminPageSkeleton({ pathname }: { pathname: string }) {
  if (pathname.startsWith("/admin/calendar")) return <CalendarSkeleton />;
  if (pathname.startsWith("/admin/requests")) return <RequestsSkeleton />;
  if (pathname.startsWith("/admin/members/")) return <MemberDetailSkeleton />;
  if (pathname.startsWith("/admin/members")) return <MembersSkeleton />;
  if (pathname.startsWith("/admin/invites")) return <InvitesSkeleton />;
  if (pathname.startsWith("/admin/store")) return <StoreSkeleton />;
  return <DashboardSkeleton />;
}
