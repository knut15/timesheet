"use client";
// 사장 화면 불러오는 중 스켈레톤. 불러온 뒤 화면과 같은 틀(Card·padding·gap·grid)에 데이터 글자 대신 Bone 을 둔다 —
// 데이터가 들어와도 레이아웃이 움직이지 않게. 고정 문구(제목·안내·입력칸 이름)와 데이터 없이도 되는 링크는 실제 글자로 둔다.
// 페이지 파일은 default 외 export 를 둘 수 없어 여기 모은다. 로그인 확인 전 admin/layout.tsx 도 같은 것을 쓴다.
import { Bone, Card, Loading } from "@/components/ui";

// 글자 크기 → 줄 높이 칸과 그 안의 막대 높이 (text-xs 16, text-sm 20, text-base 24, text-xl 28, text-3xl 36)
const BOX = { xs: "h-4", sm: "h-5", base: "h-6", xl: "h-7", "3xl": "h-9" } as const;
const BAR = { xs: "h-3", sm: "h-3.5", base: "h-4", xl: "h-5", "3xl": "h-7" } as const;

/** 글자 한 줄 자리 — 칸은 그 글자의 줄 높이, 막대는 칸 안 가운데 */
function Line({ size = "sm", w, className = "" }: { size?: keyof typeof BOX; w: string; className?: string }) {
  return (
    <div className={`flex ${BOX[size]} items-center ${className}`}>
      <Bone className={`${BAR[size]} ${w}`} />
    </div>
  );
}

const times = <T,>(n: number, f: (i: number) => T) => Array.from({ length: n }, (_, i) => f(i));

/** MonthPicker 자리 — 화살표 IconButton h-10 두 개와 가운데 "2026년 9월" (text-base) */
function MonthPickerBone() {
  const arrow = (
    <div className="flex h-10 w-10 items-center justify-center">
      <Bone className="h-5 w-5 rounded-md" />
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

/** Field 자리 — 이름(text-sm 20) + mt-1 + .field h-11 */
function FieldBone({ label }: { label: string }) {
  return (
    <div className="min-w-0 text-sm">
      <span className="text-muted">{label}</span>
      <Bone className="mt-1 h-11 rounded-xl" />
    </div>
  );
}

const AvatarBone = ({ size }: { size: "sm" | "md" | "lg" }) => (
  <Bone className={`shrink-0 rounded-full ${{ sm: "h-8 w-8", md: "h-10 w-10", lg: "h-16 w-16" }[size]}`} />
);

// ── 대시보드 /admin ────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <Loading className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">지금 근무 중</h2>
            <Line w="w-24" />
          </div>
          <ul className="mt-3 space-y-2">
            {times(2, (i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AvatarBone size="sm" />
                  <Line w="w-14" />
                </div>
                <Line w="w-28" />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <MonthPickerBone />
          <p className="mt-2 text-sm text-muted">인건비 (예상, 세전)</p>
          <Line size="3xl" w="w-40" className="mt-1" />
          {/* 기본급·주휴·휴가·연장 가산 한 줄은 금액이 크면 좁은 카드에서 두 줄이 된다 — 흔한 쪽인 두 줄 */}
          <div className="mt-2">
            <Line size="xs" w="w-full" />
            <Line size="xs" w="w-3/5" />
          </div>
        </Card>
      </div>
      <Card className="p-0">
        <div className="px-5 pt-5">
          <Line size="base" w="w-24" />
        </div>
        <ul className="mt-2 divide-y divide-line">
          {times(3, (i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-5 py-4">
              <AvatarBone size="md" />
              <div className="min-w-0 flex-1">
                <Line size="base" w="w-16" />
                <Line size="xs" w="w-40" />
              </div>
              <Line size="base" w="w-20" />
            </li>
          ))}
        </ul>
      </Card>
    </Loading>
  );
}

// ── 달력 /admin/calendar ───────────────────────────────────────
// 달력 화면은 격자(MonthGrid busy)를 바로 그리고 요약 줄·범례·상세 자리만 아래 조각으로 채운다.

/** 달 요약 줄 "이번 달 3명 · 120시간" 자리 (text-sm) */
export function CalendarSummaryBone() {
  return <Line w="w-36" className="mt-1 px-1" />;
}

/** 범례 자리 — 항목 넷 한 줄 (text-[11px]) */
export function LegendBone() {
  return (
    <div className="flex h-4 items-center gap-3">
      {times(4, (i) => <Bone key={i} className="h-2.5 w-14" />)}
    </div>
  );
}

/** 선택한 날 멤버 행 자리 — MemberDayRow 와 같은 px-5 py-4, 아바타 sm + 이름(base) + 근무 한 줄(sm) */
export function DayRowsSkeleton() {
  return (
    <Card className="p-0">
      <ul className="divide-y divide-line">
        {times(2, (i) => (
          <li key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="self-start">
              <AvatarBone size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <Line size="base" w="w-16" />
              <Line w="w-44" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const WEEK = ["월", "화", "수", "목", "금", "토", "일"];

/** 로그인 확인 전(날짜를 서버에서 계산하지 않는다) 달력 전체 자리. 격자는 5주. */
function CalendarSkeleton() {
  return (
    <Loading className="space-y-4">
      <div>
        <MonthPickerBone />
        <CalendarSummaryBone />
      </div>
      <Card className="px-2 py-3">
        <div className="grid grid-cols-7">
          {WEEK.map((w) => (
            <span key={w} className="flex h-6 items-center justify-center text-[11px] text-muted">{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {times(35, (i) => (
            <div key={i} className="m-0.5 h-[60px] px-0.5 pt-0.5">
              <Bone className="h-5 w-5 rounded-full" />
            </div>
          ))}
        </div>
        <div className="mt-2 px-1">
          <LegendBone />
        </div>
      </Card>
      <section className="space-y-3">
        <Line w="w-40" className="px-1" />
        <DayRowsSkeleton />
      </section>
    </Loading>
  );
}

// ── 요청 /admin/requests ───────────────────────────────────────

function WhoBone() {
  return (
    <div className="flex items-center gap-2">
      <AvatarBone size="sm" />
      <Line w="w-32" />
    </div>
  );
}

export function RequestsSkeleton() {
  return (
    <Loading className="space-y-6">
      <section className="space-y-3">
        <Line w="w-24" />
        {/* 처리할 요청 카드 하나 — 기록 수정 요청 모양(지금·요청·사유 세 줄 + 메모 칸 + 승인·거절) */}
        <Card>
          <WhoBone />
          <div className="mt-3 space-y-1">
            <Line w="w-52" />
            <Line w="w-52" />
            <Line w="w-32" />
          </div>
          <div className="mt-3 space-y-2">
            <Bone className="h-11 rounded-xl" />
            <div className="flex gap-2">
              <Bone className="h-10 flex-1 rounded-xl" />
              <Bone className="h-10 flex-1 rounded-xl" />
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">직접 등록</h2>
        <Card>
          <h3 className="font-semibold">휴가 등록</h3>
          <div className="mt-3 space-y-3">
            <FieldBone label="멤버" />
            <div className="grid grid-cols-2 gap-2">
              <FieldBone label="시작일" />
              <FieldBone label="종료일" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>유급 휴가</span>
              <Bone className="h-5 w-5 rounded" />
            </div>
            <FieldBone label="사유" />
            <Bone className="h-12 rounded-xl" />
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">대타 등록</h3>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <FieldBone label="쉬는 멤버" />
              <FieldBone label="대신 나올 멤버" />
            </div>
            <FieldBone label="날짜" />
            <FieldBone label="사유" />
            <Bone className="h-12 rounded-xl" />
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">확정된 휴가·대타</h2>
        <ul className="space-y-2">
          {times(2, (i) => (
            <li key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <AvatarBone size="sm" />
                <Line w="w-44" />
              </div>
              <Line size="xs" w="w-8" />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">최근 처리</h2>
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {times(3, (i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <AvatarBone size="sm" />
                  <Line w="w-40" />
                </div>
                <Bone className="h-5 w-14 rounded-full" />
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </Loading>
  );
}

// ── 멤버 /admin/members ────────────────────────────────────────

/** 날짜별 변경 행 자리 — min-h-11 행 하나(날짜·내용 + 삭제 버튼 h-8). 멤버 카드 안에서 따로 불러올 때도 쓴다 */
export function ExceptionRowsSkeleton() {
  return (
    <ul className="mt-1">
      <li className="flex min-h-11 items-center justify-between gap-2">
        <Line w="w-36" />
        <Bone className="h-8 w-11 rounded-lg" />
      </li>
    </ul>
  );
}

export function MembersSkeleton() {
  return (
    <Loading className="space-y-3">
      <Bone className="h-14 rounded-2xl" />
      <ul className="space-y-3">
        {times(2, (i) => (
          <li key={i}>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <AvatarBone size="md" />
                <div className="min-w-0 flex-1">
                  <Line size="base" w="w-16" />
                  <Line w="w-40" />
                </div>
                <Bone className="h-8 w-[4.5rem] rounded-lg" />
              </div>
              {/* 조건 줄과 버튼 둘 — 좁은 폭에서는 불러온 뒤처럼 버튼이 다음 줄로 넘어간다 */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <Line w="w-64" />
                <div className="flex gap-2">
                  <Bone className="h-8 w-[4.5rem] rounded-lg" />
                  <Bone className="h-8 w-16 rounded-lg" />
                </div>
              </div>
              <div className="mt-4 border-t border-line pt-3 text-sm">
                <p className="font-semibold">날짜별 변경</p>
                <ExceptionRowsSkeleton />
                <Bone className="mt-2 h-8 rounded-lg" />
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
    <Loading className="space-y-4">
      <div>
        <div className="flex items-center gap-3">
          <AvatarBone size="lg" />
          <div className="min-w-0">
            <Line size="xl" w="w-20" />
            <Line w="w-44" />
          </div>
        </div>
      </div>
      <MonthPickerBone />
      <div className="grid grid-cols-2 rounded-xl border border-line p-1">
        {times(2, (i) => (
          <div key={i} className="flex h-9 items-center justify-center">
            <Bone className="h-3.5 w-14" />
          </div>
        ))}
      </div>
      <ul className="space-y-3">
        {times(3, (i) => (
          <li key={i} className="flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4">
            <div>
              <Line size="base" w="w-24" />
              <Line w="w-40" />
            </div>
            <div className="flex gap-2">
              <Bone className="h-8 w-11 rounded-lg" />
              <Bone className="h-8 w-11 rounded-lg" />
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
    <Loading className="space-y-4">
      <Card>
        <h2 className="font-semibold">알바생 초대</h2>
        <p className="mt-1 text-sm text-muted">코드는 7일 동안, 한 명만 쓸 수 있어요. 알바생은 가입한 뒤 이 코드를 입력하면 매장에 들어와요.</p>
        <Bone className="mt-4 h-12 rounded-xl" />
      </Card>
      <ul className="space-y-3">
        {times(2, (i) => (
          <li key={i}>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <Line size="xl" w="w-32" />
                <Line size="xs" w="w-12" />
              </div>
              <Line size="xs" w="w-16" className="mt-1" />
              <div className="mt-3 flex gap-4">
                <Line w="w-24" />
                <Line w="w-8" />
                <Line w="w-8" />
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
    <Loading className="space-y-4">
      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold">매장 로고</h2>
          <p className="mt-1 text-sm text-muted">헤더의 매장 이름 앞에 보여요. PNG·JPG·SVG, 1MB 이하. 가로로 긴 로고가 잘 보여요.</p>
        </div>
        <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-line bg-background">
          <Bone className="h-10 w-32" />
        </div>
        <Bone className="h-12 rounded-xl" />
      </Card>
      <div className="space-y-4">
        <Card className="space-y-4">
          <FieldBone label="매장 이름" />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>상시 5인 이상 사업장 (연장근로 50% 가산)</span>
            <Bone className="h-5 w-5 shrink-0 rounded" />
          </div>
        </Card>
        <Card className="space-y-4">
          <div>
            <h2 className="font-semibold">매장 위치</h2>
            <p className="mt-1 text-sm text-muted">알바생이 이 위치 50m 안에 들어오면 출근 알림을 받아요.</p>
          </div>
          <Bone className="h-12 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <FieldBone label="위도" />
            <FieldBone label="경도" />
          </div>
        </Card>
        <Bone className="h-12 rounded-xl" />
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
