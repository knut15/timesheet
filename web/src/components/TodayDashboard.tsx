"use client";
// 멤버 출퇴근 탭 — 시계 카드와 오늘 근무 대시보드. API 를 부르지 않는 표시 컴포넌트다. docs/design/member-today.md, docs/prd/12-member-today.md
import { ACT_CANCEL } from "@/components/buttons";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { ArrowLeftRight, CalendarOff, ChevronRight, CircleCheck, CircleDashed, Hourglass, RefreshCw, TriangleAlert } from "lucide-react";
import type { MyRequests } from "@/api/client";
import { clockText } from "@/lib/format";
import { computeMonth, computeWeek, computeWeeks, shiftMinutes, startOfWeek, type Absence, type PaySettings, type Shift } from "@/lib/pay";
import { todayShifts, todayState, type TodayState } from "@/lib/today";
import { OpenDot } from "./calendar/MonthGrid";
import { holidayStatus } from "./PayView";
import { Bone, Card, date, dayLabel, ErrorText, hm, Loading, ProgressBar, time, won } from "./ui";

export type ClockState = TodayState | { kind: "loading" } | { kind: "error" };

const OFF_TEXT: Record<Absence["kind"], { pill: string; desc: string }> = {
  paid_leave: { pill: "오늘 휴가", desc: "오늘은 유급 휴가예요" },
  unpaid_leave: { pill: "오늘 휴가", desc: "오늘은 무급 휴가예요" },
  substitution: { pill: "오늘 대타", desc: "오늘은 동료가 대신 근무해요" },
};

const BUTTON = "mt-4 w-full rounded-xl py-4 text-lg font-bold disabled:opacity-50";
const SECONDARY = "border border-accent bg-transparent text-accent";

/** 시계 + 지금 상태 + 출근·퇴근 버튼. §2 */
export function ClockCard({
  now,
  minuteNow,
  state,
  busy = false,
  error = null,
  onPunch,
  onRetry,
}: {
  now: number;
  minuteNow: number;
  state: ClockState;
  busy?: boolean;
  error?: string | null;
  onPunch: (kind: "in" | "out") => void;
  onRetry: () => void;
}) {
  const pill = (icon: React.ReactNode, label: string, dashed = false) => (
    <p
      role="status"
      className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold text-foreground ${dashed ? "border-dashed border-muted" : "border-line"}`}
    >
      {icon}
      {label}
    </p>
  );
  const desc = (text: string) => <p className="mt-2 text-sm text-muted">{text}</p>;

  let body: React.ReactNode;
  switch (state.kind) {
    case "working": {
      const { open } = state;
      // 어제 출근해 아직 퇴근 안 한 기록은 날짜를 붙인다 (§2-3)
      const started = open.start < new Date(minuteNow).setHours(0, 0, 0, 0) ? `${dayLabel(open.start)} ${time(open.start)}` : time(open.start);
      body = (
        <>
          {pill(<OpenDot />, "근무 중")}
          {desc(`${started} 출근 · 지금까지 ${hm(shiftMinutes(open, minuteNow))}`)}
          <button disabled={busy} onClick={() => onPunch("out")} className={`${BUTTON} bg-foreground text-background`}>
            퇴근
          </button>
        </>
      );
      break;
    }
    case "done":
      body = (
        <>
          {pill(<CircleCheck aria-hidden size={14} className="text-accent" />, "오늘 퇴근함")}
          {desc(`${time(state.lastEnd)} 퇴근`)}
          {/* 다시 출근은 없다 — 내일 0시(날짜가 바뀌면 before)까지 막는다 (2026-09-25 사용자 결정) */}
          <button disabled className={`${BUTTON} bg-line text-muted`}>
            출근
          </button>
          <p className="mt-2 text-xs text-muted">오늘 근무를 마쳤어요. 내일부터 다시 출근할 수 있어요.</p>
        </>
      );
      break;
    case "off":
      body = (
        <>
          {pill(<CalendarOff aria-hidden size={14} className="text-muted" />, OFF_TEXT[state.absence].pill, true)}
          {desc(OFF_TEXT[state.absence].desc)}
          <button disabled={busy} onClick={() => onPunch("in")} className={`${BUTTON} ${SECONDARY}`}>
            출근
          </button>
          <p className="mt-2 text-xs text-muted">쉬는 날에도 출근하면 근무로 기록돼요.</p>
        </>
      );
      break;
    case "before":
      body = (
        <>
          {pill(<CircleDashed aria-hidden size={14} className="text-muted" />, "출근 전")}
          <button disabled={busy} onClick={() => onPunch("in")} className={`${BUTTON} bg-accent text-white`}>
            출근
          </button>
        </>
      );
      break;
    case "loading":
      // 상태를 모르는 동안 버튼 자리는 막대로 둔다 — 누를 것이 없다 (§2-4)
      body = (
        <Loading label="상태 확인 중">
          <ClockLoadingBody />
        </Loading>
      );
      break;
    case "error":
      body = (
        <>
          {pill(<TriangleAlert aria-hidden size={14} className="text-warn" />, "상태를 불러오지 못했어요")}
          <button onClick={onRetry} className={`${BUTTON} ${SECONDARY} inline-flex items-center justify-center gap-2`}>
            <RefreshCw aria-hidden size={16} />
            다시 불러오기
          </button>
        </>
      );
      break;
  }

  return (
    <Card className="text-center">
      <p className="text-sm text-muted">{date(now)}</p>
      {/* 한 줄 고정: HH:MM:SS + 줄바꿈 금지 (2026-09-25 모바일에서 초가 다음 줄로 넘어가던 것) */}
      <p className="mt-1 whitespace-nowrap font-mono text-5xl font-semibold tabular-nums">{clockText(now)}</p>
      {body}
      {error && (
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </Card>
  );
}

/** 알약·버튼 자리 막대. 크기는 before 와 같다: 알약 30px(py-1 + text-sm 줄 20 + 테두리 2) · 버튼 60px(py-4 + text-lg 줄 28) */
function ClockLoadingBody() {
  return (
    <>
      <div className="mt-3 flex justify-center">
        <Bone className="h-[30px] w-[88px] rounded-full" />
      </div>
      <Bone className="mt-4 h-15 w-full rounded-xl" />
    </>
  );
}

/**
 * 로그인 확인 전 첫 화면용 시계 카드 — 날짜·시계 글자까지 막대. 서버 렌더와 브라우저의 시각이 달라
 * 시계 글자를 그리면 hydration 이 어긋난다. 크기는 ClockCard 의 loading 과 같다 (text-sm 줄 20 · text-5xl 줄 48)
 */
export function ClockCardSkeleton() {
  return (
    <Card className="text-center">
      <Loading label="상태 확인 중">
        <div className="flex h-5 items-center justify-center"><Bone className="h-4 w-36" /></div>
        <div className="mt-1 flex h-12 items-center justify-center"><Bone className="h-11 w-56" /></div>
        <ClockLoadingBody />
      </Loading>
    </Card>
  );
}

/** 오늘 · 처리할 것 · 이번 주 · 이번 달. now 에는 분 단위 시각(minuteNow)을 넘긴다. §3 */
export function TodayDashboard({
  shifts,
  absences,
  requests,
  settings,
  now,
  status,
  onRetry,
  onOpenPay,
  onOpenRequests,
}: {
  shifts: Shift[];
  absences: Absence[];
  requests?: MyRequests | null;
  settings: PaySettings;
  now: number;
  status: "loading" | "error" | "ready";
  onRetry: () => void;
  onOpenPay: () => void;
  onOpenRequests: () => void;
}) {
  const view = useMemo(() => {
    const today = todayShifts(shifts, now);
    const weekStart = startOfWeek(now);
    const weeks = computeWeeks(shifts, settings, now, absences);
    // 이번 주에 기록·휴가가 하나도 없으면 목록에 없다 — 빈 주를 만든다 (§3-3)
    const week = weeks.find((w) => w.weekStart.getTime() === weekStart.getTime()) ?? computeWeek(weekStart, [], settings, now, absences);
    const d = new Date(now);
    return {
      today,
      todayTotal: today.reduce((sum, s) => sum + shiftMinutes(s, now), 0),
      off: todayState(shifts, absences, now).kind === "off",
      week,
      month: d.getMonth(),
      monthTotal: computeMonth(weeks, d.getFullYear(), d.getMonth()).total,
    };
  }, [shifts, absences, settings, now]);

  if (status === "loading") return <TodayDashboardSkeleton now={now} progress={settings.weeklyHours > 0} />;
  if (status === "error") {
    return (
      <Card className="p-0">
        <div className="space-y-3 px-5 py-4">
          <ErrorText>오늘 근무를 불러오지 못했어요.</ErrorText>
          <button onClick={onRetry} className={cn(ACT_CANCEL, "h-10 flex-none gap-2 px-4")}>
            <RefreshCw aria-hidden size={16} />
            다시 불러오기
          </button>
        </div>
      </Card>
    );
  }

  const incoming = requests ? requests.substitutionsIn.filter((x) => x.status === "requested").length : 0;
  const pending = requests
    ? requests.corrections.filter((x) => x.status === "pending").length +
      requests.leaves.filter((x) => x.status === "pending").length +
      requests.substitutionsOut.filter((x) => x.status === "requested" || x.status === "accepted").length
    : 0;
  const { week } = view;

  return (
    <Card className="divide-y divide-line p-0">
      <section className="px-5 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">오늘</h2>
          <p className="font-semibold tabular-nums">{hm(view.todayTotal)}</p>
        </div>
        {view.today.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{view.off ? "오늘은 쉬는 날이에요." : "아직 오늘 기록이 없어요."}</p>
        ) : (
          <ul className="mt-2 text-sm">
            {view.today.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-1">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  {time(s.start)} ~{" "}
                  {s.end === null ? (
                    <>
                      <OpenDot />
                      <span className="text-foreground">근무 중</span>
                    </>
                  ) : (
                    time(s.end)
                  )}
                </span>
                <span className="tabular-nums">{hm(shiftMinutes(s, now))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {incoming + pending > 0 && (
        <section className="px-5 py-3">
          <h2 className="text-sm font-semibold">처리할 것</h2>
          <div className="mt-1">
            {incoming > 0 && <TodoRow icon={<ArrowLeftRight aria-hidden size={16} className="text-foreground" />} label="받은 대타 요청" count={incoming} onClick={onOpenRequests} />}
            {pending > 0 && <TodoRow icon={<Hourglass aria-hidden size={16} className="text-amber-700 dark:text-amber-400" />} label="내 대기 요청" count={pending} onClick={onOpenRequests} />}
          </div>
        </section>
      )}

      <section className="px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <h2 className="text-sm font-semibold">이번 주</h2>
          <p className="text-xs text-muted">
            {date(week.weekStart)} ~ {date(week.weekEnd.getTime() - 1)}
          </p>
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-muted">근무 시간</dt>
          <dd className="text-right tabular-nums">
            {hm(week.workedMinutes)}
            {settings.weeklyHours > 0 && ` / ${settings.weeklyHours}시간`}
          </dd>
          {settings.weeklyHours > 0 && (
            <dd className="col-span-2 py-1">
              <ProgressBar
                value={week.workedMinutes}
                max={settings.weeklyHours * 60}
                label="이번 주 근무 시간"
                valueText={`${hm(week.workedMinutes)} / ${settings.weeklyHours}시간`}
              />
            </dd>
          )}
          <dt className="text-muted">근무한 날</dt>
          <dd className="text-right tabular-nums">
            {week.workDays}일 / {settings.workDaysPerWeek}일{week.excusedDays > 0 && ` + 휴가·대타 ${week.excusedDays}일`}
          </dd>
          <dt className="text-muted">주휴수당</dt>
          <dd className="text-right">{holidayStatus(week, settings, now)}</dd>
        </dl>
      </section>

      <section>
        <button onClick={onOpenPay} className="flex min-h-11 w-full flex-wrap items-end justify-between gap-x-3 gap-y-1 px-5 py-4 text-left hover:bg-background">
          <span>
            <span className="block text-sm text-muted">{view.month + 1}월 예상 급여 (세전)</span>
            {/* 금액은 끊지 않는다 — 좁으면 오른쪽 링크가 다음 줄로 내려간다 */}
            <span className="block whitespace-nowrap text-xl font-bold tabular-nums">{won(view.monthTotal)}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-sm text-accent">
            급여 탭에서 자세히
            <ChevronRight aria-hidden size={16} />
          </span>
        </button>
      </section>
    </Card>
  );
}

/**
 * 기록·휴가를 읽는 동안의 자리 — ready 와 같은 Card·구역·줄 높이에 값 대신 막대 (§3-5).
 * 구역 이름처럼 데이터와 무관한 글자는 그대로 둔다. 오늘 기록은 2행, 처리할 것 구역은 없는 것(0건)으로 둔다.
 * progress: 소정 시간이 있어 이번 주 진행 막대 줄이 생기는지 (settings.weeklyHours > 0)
 * now 가 없으면(로그인 확인 전, 서버 렌더) 월 글자도 막대 — 서버와 브라우저의 달이 다를 수 있다
 */
export function TodayDashboardSkeleton({ now, progress = true }: { now?: number; progress?: boolean }) {
  const value = <dd className="flex h-5 items-center justify-end"><Bone className="h-4 w-24" /></dd>;
  return (
    <Loading>
      <Card className="divide-y divide-line p-0">
        <section className="px-5 py-4">
          <div className="flex h-6 items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">오늘</h2>
            <Bone className="h-5 w-20" />
          </div>
          <ul className="mt-2 text-sm">
            {[0, 1].map((i) => (
              <li key={i} className="flex h-7 items-center justify-between gap-2">
                <Bone className="h-4 w-32" />
                <Bone className="h-4 w-16" />
              </li>
            ))}
          </ul>
        </section>
        <section className="px-5 py-4">
          <div className="flex h-5 items-center justify-between gap-x-2">
            <h2 className="text-sm font-semibold">이번 주</h2>
            <Bone className="h-3 w-28" />
          </div>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-muted">근무 시간</dt>
            {value}
            {progress && (
              <dd className="col-span-2 py-1">
                <Bone className="h-2 w-full rounded-full" />
              </dd>
            )}
            <dt className="text-muted">근무한 날</dt>
            {value}
            <dt className="text-muted">주휴수당</dt>
            {value}
          </dl>
        </section>
        <section>
          <div className="flex min-h-11 w-full flex-wrap items-end justify-between gap-x-3 gap-y-1 px-5 py-4">
            <span>
              {now === undefined ? (
                <span className="flex h-5 items-center"><Bone className="h-4 w-32" /></span>
              ) : (
                <span className="block text-sm text-muted">{new Date(now).getMonth() + 1}월 예상 급여 (세전)</span>
              )}
              <span className="flex h-7 items-center"><Bone className="h-6 w-28" /></span>
            </span>
            {/* 고정 글자는 그대로 — 좁은 폭에서 불러온 뒤와 같은 자리에서 줄바꿈된다 */}
            <span className="inline-flex shrink-0 items-center gap-0.5 text-sm text-accent">
              급여 탭에서 자세히
              <ChevronRight aria-hidden size={16} />
            </span>
          </div>
        </section>
      </Card>
    </Loading>
  );
}

function TodoRow({ icon, label, count, onClick }: { icon: React.ReactNode; label: string; count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex min-h-11 w-full items-center gap-3 text-left text-sm">
      {icon}
      <span className="flex-1">
        {label}
        <span className="sr-only"> — 요청 탭에서 보기</span>
      </span>
      <span className="font-semibold tabular-nums">{count}건</span>
      <ChevronRight aria-hidden size={16} className="text-muted" />
    </button>
  );
}
