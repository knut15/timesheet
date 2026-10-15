"use client";
// 멤버 출퇴근 탭 — 시계 카드와 오늘 근무 대시보드. API 를 부르지 않는 표시 컴포넌트다. docs/design/member-today.md, docs/prd/12-member-today.md
// 모양은 2026-10-15 B 시안: 왼쪽 정렬 시계(강조색 40px), 날짜 옆 상태 태그, 구역 머리 SectionLabel, 점선 이음 줄(DotRow)
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { ArrowLeftRight, Bell, CalendarDays, CalendarOff, ChevronRight, CircleCheck, CircleDashed, Clock, Hourglass, House, Moon, PiggyBank, RefreshCw, Sparkle, TriangleAlert } from "lucide-react";
import type { MyRequests } from "@/api/client";
import { clockText } from "@/lib/format";
import { computeMonth, computeWeek, computeWeeks, shiftMinutes, startOfWeek, type Absence, type PaySettings, type Shift } from "@/lib/pay";
import { todayShifts, todayState, type TodayState } from "@/lib/today";
import { OpenDot } from "./calendar/MonthGrid";
import { Scene } from "./illust";
import { CountUp, SwapText, useAppear } from "./motion";
import { DotRow, holidayStatus, holidayTone } from "./PayView";
import { Bone, BTN, Card, date, dayLabel, ErrorText, hm, Loading, NUM, ProgressBar, SectionLabel, time, won } from "./ui";

export type ClockState = TodayState | { kind: "loading" } | { kind: "error" };

const OFF_TEXT: Record<Absence["kind"], { pill: string; desc: string }> = {
  paid_leave: { pill: "오늘 휴가", desc: "오늘은 유급 휴가예요" },
  unpaid_leave: { pill: "오늘 휴가", desc: "오늘은 무급 휴가예요" },
  substitution: { pill: "오늘 대타", desc: "오늘은 동료가 대신 근무해요" },
};

// 출근·퇴근 버튼 — 네 상태 모두 같은 높이(h-11). 주 동작은 진한 바탕, 출근 전만 강조색, 쉬는 날·다시 불러오기는 선 버튼
const PUNCH = "mt-3.5 w-full";
const DL = "mt-2.5 grid gap-1.5 text-[13px]";

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
  // 상태 태그 — 아이콘 모양 + 글자. 휴가·대타는 점선 테두리. 글자가 바뀔 때 아래에서 올라온다
  const pill = (icon: React.ReactNode, label: string, dashed = false) => (
    <p
      role="status"
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs font-semibold text-foreground ${dashed ? "border-dashed border-muted" : "border-muted/40"}`}
    >
      {icon}
      <SwapText text={label} />
    </p>
  );
  const desc = (text: string) => <p className={`mt-2.5 text-[13px] text-muted ${NUM}`}>{text}</p>;
  const note = (text: string) => <p className="mt-2 text-xs text-muted">{text}</p>;

  let tag: React.ReactNode;
  let body: React.ReactNode;
  switch (state.kind) {
    case "working": {
      const { open } = state;
      // 어제 출근해 아직 퇴근 안 한 기록은 날짜를 붙인다 (§2-3)
      const started = open.start < new Date(minuteNow).setHours(0, 0, 0, 0) ? `${dayLabel(open.start)} ${time(open.start)}` : time(open.start);
      tag = pill(<OpenDot />, "근무 중");
      body = (
        <>
          {desc(`${started} 출근 · 지금까지 ${hm(shiftMinutes(open, minuteNow))}`)}
          <button type="button" disabled={busy} onClick={() => onPunch("out")} className={cn(BTN.primary, PUNCH)}>
            퇴근
          </button>
        </>
      );
      break;
    }
    case "done":
      tag = pill(<CircleCheck aria-hidden size={12} className="text-accent" />, "오늘 퇴근함");
      body = (
        <>
          {desc(`${time(state.lastEnd)} 퇴근`)}
          {/* 다시 출근은 없다 — 내일 0시(날짜가 바뀌면 before)까지 막는다 (2026-09-25 사용자 결정). 비활성 모양은 BTN.primary 의 disabled */}
          <button type="button" disabled className={cn(BTN.primary, PUNCH)}>
            출근
          </button>
          <DoneBox />
        </>
      );
      break;
    case "off":
      tag = pill(<CalendarOff aria-hidden size={12} className="text-muted" />, OFF_TEXT[state.absence].pill, true);
      body = (
        <>
          {desc(OFF_TEXT[state.absence].desc)}
          <button type="button" disabled={busy} onClick={() => onPunch("in")} className={cn(BTN.secondary, PUNCH)}>
            출근
          </button>
          {note("쉬는 날에도 출근하면 근무로 기록돼요.")}
        </>
      );
      break;
    case "before":
      tag = pill(<CircleDashed aria-hidden size={12} className="text-muted" />, "출근 전");
      body = (
        <button type="button" disabled={busy} onClick={() => onPunch("in")} className={cn(BTN.primary, PUNCH, "bg-accent text-on-accent")}>
          출근
        </button>
      );
      break;
    case "loading":
      // 상태를 모르는 동안 태그·버튼 자리는 막대로 둔다 — 누를 것이 없다 (§2-4)
      tag = <TagBone />;
      body = <Bone className={`h-11 rounded-xl ${PUNCH}`} />;
      break;
    case "error":
      tag = pill(<TriangleAlert aria-hidden size={12} className="text-warn" />, "상태를 불러오지 못했어요");
      body = (
        <button type="button" onClick={onRetry} className={cn(BTN.secondary, PUNCH)}>
          <RefreshCw aria-hidden size={16} />
          다시 불러오기
        </button>
      );
      break;
  }

  const card = (
    <Card>
      <div className="flex min-h-6 items-center justify-between gap-2">
        <p className={`text-xs font-semibold text-muted ${NUM}`}>{date(now)}</p>
        {tag}
      </div>
      {/* 한 줄 고정: HH:MM:SS + 줄바꿈 금지 (2026-09-25). 포인트 컬러: 출퇴근 시계는 강조색 (2026-10-15 사용자 지시) */}
      <p className={`mt-2 whitespace-nowrap text-[40px] font-semibold leading-none tracking-tight text-accent ${NUM}`}>{clockText(now)}</p>
      {body}
      {error && (
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </Card>
  );
  return state.kind === "loading" ? <Loading label="상태 확인 중">{card}</Loading> : card;
}

/** 상태 태그 자리 막대 — 태그와 같은 높이(h-6), 출근 전 태그 폭쯤 */
function TagBone() {
  return <Bone className="h-6 w-[68px] shrink-0 rounded-md" />;
}

/**
 * 퇴근한 뒤의 완료 상자 — 나타날 때 한 번 올라오고, 집·달·반짝임 장면이 톡 튀어나온다.
 * 글자는 #8 문구(내일부터 다시 출근) 그대로, 머리만 "수고했어요" (2026-10-15 B 시안)
 */
function DoneBox() {
  const ref = useAppear<HTMLDivElement>();
  return (
    <div ref={ref} className="mt-3.5 flex items-center gap-3 rounded-xl border border-dashed border-muted/50 px-3 py-2.5">
      <Scene size="sm" icon={House} accents={[{ icon: Moon, at: "tr" }, { icon: Sparkle, at: "tl" }]} />
      <div className="min-w-0">
        <p className="text-sm font-semibold">수고했어요</p>
        <p className="text-xs leading-relaxed text-muted">오늘 근무를 마쳤어요. 내일부터 다시 출근할 수 있어요.</p>
      </div>
    </div>
  );
}

/**
 * 로그인 확인 전 첫 화면용 시계 카드 — 날짜·시계 글자까지 막대. 서버 렌더와 브라우저의 시각이 달라
 * 시계 글자를 그리면 hydration 이 어긋난다. 크기는 ClockCard 의 loading 과 같다 (태그 줄 h-6 · 시계 줄 40px · 버튼 h-11)
 */
export function ClockCardSkeleton() {
  return (
    <Loading label="상태 확인 중">
      <Card>
        <div className="flex min-h-6 items-center justify-between gap-2">
          <Bone className="h-3 w-24" />
          <TagBone />
        </div>
        <div className="mt-2 flex h-10 items-center"><Bone className="h-9 w-48" /></div>
        <Bone className={`h-11 rounded-xl ${PUNCH}`} />
      </Card>
    </Loading>
  );
}

/** "10/12" — 대시보드 이번 주 기간용 짧은 날짜 */
const monthDay = (t: number | Date) => `${new Date(t).getMonth() + 1}/${new Date(t).getDate()}`;

// 구역 번호(01·02…)는 보이는 장식 — 제목 이름은 "오늘"·"이번 주" 그대로 읽히게 aria-hidden
const Idx = ({ n }: { n: string }) => <span aria-hidden className={`mr-1.5 text-muted/70 ${NUM}`}>{n}</span>;
const SECTION = "px-4 py-3.5";

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
      <Card className="space-y-3">
        <ErrorText>오늘 근무를 불러오지 못했어요.</ErrorText>
        <button type="button" onClick={onRetry} className={BTN.secondary}>
          <RefreshCw aria-hidden size={16} />
          다시 불러오기
        </button>
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
  const holiday = holidayStatus(week, settings, now);

  return (
    <Card className="divide-y divide-line p-0">
      <section className={SECTION}>
        <SectionLabel icon={Clock} right={hm(view.todayTotal)}>
          <Idx n="01" />
          오늘
        </SectionLabel>
        {view.today.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">{view.off ? "오늘은 쉬는 날이에요." : "아직 오늘 기록이 없어요."}</p>
        ) : (
          <ul className={TODAY_ROWS}>
            {view.today.map((s) => (
              <li key={s.id} className={TODAY_ROW}>
                <span className="inline-flex items-center gap-1.5 text-muted">
                  {time(s.start)} ~{" "}
                  {s.end === null ? (
                    <>
                      <OpenDot />
                      <span className="font-semibold text-foreground">근무 중</span>
                    </>
                  ) : (
                    time(s.end)
                  )}
                </span>
                <span className="font-semibold">{hm(shiftMinutes(s, now))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {incoming + pending > 0 && (
        <section className={SECTION}>
          <SectionLabel icon={Bell} right={incoming + pending}>
            <Idx n="02" />
            처리할 것
          </SectionLabel>
          <div className="mt-2 space-y-1.5">
            {incoming > 0 && <TodoRow icon={<ArrowLeftRight aria-hidden size={15} className="text-foreground" />} label="받은 대타 요청" count={incoming} onClick={onOpenRequests} />}
            {pending > 0 && <TodoRow icon={<Hourglass aria-hidden size={15} className="text-caution" />} label="내 대기 요청" count={pending} onClick={onOpenRequests} />}
          </div>
        </section>
      )}

      <section className={SECTION}>
        {/* 기간은 짧게 "10/12 – 10/18" — 긴 "10월 12일 (월) ~ …" 는 375px 에서 제목을 "03 이…" 로 밀어냈다 (2026-10-15 사용자 요청) */}
        <SectionLabel icon={CalendarDays} right={`${monthDay(week.weekStart)} – ${monthDay(week.weekEnd.getTime() - 1)}`}>
          <Idx n="03" />
          이번 주
        </SectionLabel>
        <dl className={DL}>
          <DotRow term="근무 시간">
            <span className={NUM}>
              {hm(week.workedMinutes)}
              {settings.weeklyHours > 0 && ` / ${settings.weeklyHours}시간`}
            </span>
          </DotRow>
        </dl>
        {settings.weeklyHours > 0 && (
          <div className="mt-2">
            <ProgressBar
              value={week.workedMinutes}
              max={settings.weeklyHours * 60}
              label="이번 주 근무 시간"
              valueText={`${hm(week.workedMinutes)} / ${settings.weeklyHours}시간`}
            />
          </div>
        )}
        <dl className={DL_AFTER_BAR}>
          <DotRow term="근무한 날">
            <span className={NUM}>
              {week.workDays}일 / {settings.workDaysPerWeek}일{week.excusedDays > 0 && ` + 휴가·대타 ${week.excusedDays}일`}
            </span>
          </DotRow>
          <DotRow term="주휴수당">
            <span className={holidayTone(holiday)}>{holiday}</span>
          </DotRow>
        </dl>
      </section>

      <section>
        <button type="button" onClick={onOpenPay} className={`${PAY_ROW} text-left hover:bg-background`}>
          <span className="min-w-0">
            <PayLabel>{view.month + 1}월 예상 급여 (세전)</PayLabel>
            {/* 금액은 끊지 않는다 — 좁으면 오른쪽 링크가 다음 줄로 내려간다. 포인트 컬러: 큰 급여 숫자 (2026-10-15) */}
            <span className={PAY_AMOUNT}>
              <CountUp value={view.monthTotal} format={won} />
            </span>
          </span>
          <PayLink />
        </button>
      </section>
    </Card>
  );
}

const TODAY_ROWS = `mt-2 divide-y divide-dashed divide-line text-[13px] ${NUM}`;
const TODAY_ROW = "flex items-center justify-between gap-2 py-[7px]";
// 진행 막대가 있으면 막대 아래 8px, 없으면 점선 줄 간격(6px)과 같게
const DL_AFTER_BAR = "mt-2 grid gap-1.5 text-[13px]";
const PAY_ROW = "flex min-h-11 w-full flex-wrap items-end justify-between gap-x-3 gap-y-1 px-4 py-3.5";
const PAY_AMOUNT = `mt-1 block whitespace-nowrap text-[22px] font-semibold leading-tight text-accent ${NUM}`;

/** ④ 구역 머리 — 구역 전체가 버튼이라 제목 요소 대신 SectionLabel 과 같은 모양의 글자 */
function PayLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
      <PiggyBank size={15} strokeWidth={1.75} aria-hidden className="shrink-0" />
      <span>
        <Idx n="04" />
        {children}
      </span>
    </span>
  );
}

function PayLink() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-accent">
      급여 탭에서 자세히
      <ChevronRight aria-hidden size={15} />
    </span>
  );
}

/**
 * 기록·휴가를 읽는 동안의 자리 — ready 와 같은 Card·구역·줄 높이에 값 대신 막대 (§3-5).
 * 구역 이름처럼 데이터와 무관한 글자는 그대로 둔다. 오늘 기록은 2행, 처리할 것 구역은 없는 것(0건)으로 둔다.
 * 막대는 글자 줄 안의 inline-block 이라 줄 높이가 불러온 뒤와 같다.
 * progress: 소정 시간이 있어 이번 주 진행 막대 줄이 생기는지 (settings.weeklyHours > 0)
 * now 가 없으면(로그인 확인 전, 서버 렌더) 월 글자도 막대 — 서버와 브라우저의 달이 다를 수 있다
 */
export function TodayDashboardSkeleton({ now, progress = true }: { now?: number; progress?: boolean }) {
  const value = (w: string) => <Bone className={`inline-block h-3.5 align-middle ${w}`} />;
  const right = (w: string) => <Bone className={`inline-block h-3 align-middle ${w}`} />;
  return (
    <Loading>
      <Card className="divide-y divide-line p-0">
        <section className={SECTION}>
          <SectionLabel icon={Clock} right={right("w-16")}>
            <Idx n="01" />
            오늘
          </SectionLabel>
          <ul className={TODAY_ROWS}>
            {[0, 1].map((i) => (
              // 막대를 span 으로 감싼다 — flex 항목이 되면 글자 줄(13px) 높이를 잃는다
              <li key={i} className={TODAY_ROW}>
                <span>{value("w-36")}</span>
                <span>{value("w-16")}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className={SECTION}>
          <SectionLabel icon={CalendarDays} right={right("w-24")}>
            <Idx n="03" />
            이번 주
          </SectionLabel>
          <dl className={DL}>
            <DotRow term="근무 시간">{value("w-24")}</DotRow>
          </dl>
          {progress && (
            <div className="mt-2">
              <Bone className="h-2 w-full rounded-full" />
            </div>
          )}
          <dl className={DL_AFTER_BAR}>
            <DotRow term="근무한 날">{value("w-16")}</DotRow>
            <DotRow term="주휴수당">{value("w-24")}</DotRow>
          </dl>
        </section>
        <section>
          <div className={PAY_ROW}>
            <span className="min-w-0">
              {now === undefined ? (
                <span className="flex h-4 items-center"><Bone className="h-3 w-36" /></span>
              ) : (
                <PayLabel>{new Date(now).getMonth() + 1}월 예상 급여 (세전)</PayLabel>
              )}
              {/* text-[22px] leading-tight 줄 = 27.5px */}
              <span className="mt-1 flex h-[27.5px] items-center"><Bone className="h-6 w-28" /></span>
            </span>
            {/* 고정 글자는 그대로 — 좁은 폭에서 불러온 뒤와 같은 자리에서 줄바꿈된다 */}
            <PayLink />
          </div>
        </section>
      </Card>
    </Loading>
  );
}

/** 처리할 것 한 줄 — 옅은 주의색 바탕 + 왼쪽 굵은 선(2026-10-15 B 시안 .todo). 행 전체가 요청 탭으로 가는 버튼 */
function TodoRow({ icon, label, count, onClick }: { icon: React.ReactNode; label: string; count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border-l-[3px] border-caution bg-caution/10 px-3 text-left text-[13px]">
      {icon}
      <span className="flex-1 font-semibold">
        {label}
        <span className="sr-only"> — 요청 탭에서 보기</span>
      </span>
      <span className={`font-semibold text-caution ${NUM}`}>{count}건</span>
      <ChevronRight aria-hidden size={15} className="text-muted" />
    </button>
  );
}
