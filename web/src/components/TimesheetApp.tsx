"use client";
// 멤버(알바생) 화면. 기록과 급여 조건은 서버에서 읽는다. docs/prd/01~04, 06, 08, 09
import { useEffect, useMemo, useState } from "react";
import { api, errorCode, type Absence, type Me, type MyMembership, type MyRequests, type ScheduleException } from "@/api/client";
import { useArea } from "@/auth/hooks";
import { logout } from "@/auth/session";
import { GEOFENCE_RADIUS_M } from "@/lib/geo";
import { dayKey, MINIMUM_WAGE, parseDay, type PaySettings, type Shift } from "@/lib/pay";
import { scheduleText } from "@/lib/schedule";
import { setDeviceSettings, useDeviceSettings } from "@/lib/storage";
import { todayState, toMinute } from "@/lib/today";
import { useApi } from "@/lib/useApi";
import { requestAlertPermissions, useGeofence } from "@/lib/useGeofence";
import { cn } from "@/lib/utils";
import { BellRing, CalendarDays, ClipboardList, Clock, MapPin, NotebookText, UserRound, Wallet } from "lucide-react";
import { RecordsPanel } from "./member/RecordsPanel";
import { WeekRhythm, WeeklyHoursGauge, WorkDayDots } from "./member/WorkTermsCharts";
import { RequestsPanel } from "./member/RequestsPanel";
import { Enter } from "./motion";
import { DotRow, PayView, PayViewSkeleton } from "./PayView";
import { ClockCard, ClockCardSkeleton, TodayDashboard, TodayDashboardSkeleton, type ClockState } from "./TodayDashboard";
import { AppHeader, Avatar, BottomNav, BottomNavSkeleton, HeaderSkeleton, type NavItem } from "./shell";
import { Bone, BTN, Card, date, keyed, Loading, MonthPicker, monthRange, NUM, SectionLabel, time, toShift, useMonthCursor, useNow, won } from "./ui";

type Tab = "clock" | "records" | "requests" | "pay" | "me";
const TABS = [
  { id: "clock", label: "출퇴근", icon: Clock },
  { id: "records", label: "기록", icon: CalendarDays },
  { id: "requests", label: "요청", icon: ClipboardList },
  { id: "pay", label: "급여", icon: Wallet },
  { id: "me", label: "내 정보", icon: UserRound },
] as const;

export default function TimesheetApp() {
  const { me } = useArea("member");
  if (!me?.membership) return <MemberSkeleton />;
  return <MemberHome me={me} membership={me.membership} />;
}

/** 로그인 확인 전 — 멤버 셸과 출퇴근 탭(첫 화면) 모양 그대로 */
function MemberSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <HeaderSkeleton width="max-w-md" />
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-4">
        <div className="space-y-3">
          <ClockCardSkeleton />
          <TodayDashboardSkeleton />
          <Loading>
            <AlertCardFrame toggle={<span className={SWITCH_HIT}><Bone className="h-5 w-9 rounded-md" /></span>} />
          </Loading>
        </div>
      </main>
      <BottomNavSkeleton count={TABS.length} width="max-w-md" />
    </div>
  );
}

/** 스위치 그림은 36×20, 누르는 자리는 44px 로 넓힌다 (DESIGN.md §6) */
const SWITCH_HIT = "-mr-1 flex h-11 w-11 shrink-0 items-center justify-center";

/** 매장 근처 출근 알림 카드 — 윗구역은 고정 글자 + 오른쪽 스위치, 아래 구역(children)은 있을 때만 */
function AlertCardFrame({ toggle, children }: { toggle: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Card className="divide-y divide-line p-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <BellRing size={15} strokeWidth={1.75} aria-hidden className="shrink-0 text-muted" />
            매장 근처 출근 알림
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted"><span className={NUM}>{GEOFENCE_RADIUS_M}m</span> 안에 들어오면 알리고, 1분 뒤 한 번 더 알려요</p>
        </div>
        {toggle}
      </div>
      {children && <div className="px-4 py-3">{children}</div>}
    </Card>
  );
}

function MemberHome({ me, membership }: { me: Me; membership: MyMembership }) {
  const [tab, setTab] = useState<Tab>("clock");
  const [cursor, setCursor] = useMonthCursor();
  const range = monthRange(cursor.year, cursor.month);
  const rangeKey = `${range.from}|${range.to}`;
  // data 에 읽은 달의 키를 같이 담는다 — 달을 넘긴 직후 이전 달 data 를 새 달로 그리지 않게 (달력 명세 §6)
  const { data, error, reload } = useApi(() => keyed(rangeKey, api.GET("/api/shifts/me", { params: { query: range } })), rangeKey);
  const shifts = useMemo(() => (data?.value ?? []).map(toShift), [data]);
  const absRes = useApi(() => keyed(rangeKey, api.GET("/api/absences/me", { params: { query: range } })), rangeKey);
  const absences: Absence[] = useMemo(() => absRes.data?.value ?? [], [absRes.data]);
  const recordsLoading = data?.key !== rangeKey || absRes.data?.key !== rangeKey;
  const reqRes = useApi(() => api.GET("/api/requests/me"), "");
  const colleagues = useApi(() => api.GET("/api/stores/me/colleagues"), "");
  // 요청 상태가 바뀌면 기록·휴가도 바뀔 수 있다
  const reloadAll = () => {
    reload();
    absRes.reload();
    reqRes.reload();
  };
  const incoming = (reqRes.data?.substitutionsIn ?? []).filter((x) => x.status === "requested").length;
  const settings: PaySettings = {
    hourlyWage: membership.hourlyWage,
    weeklyHours: membership.weeklyHours,
    workDaysPerWeek: membership.workDaysPerWeek,
    fivePlus: membership.store.fivePlus,
  };

  const recordsFailed = !!error || !!absRes.error;
  // 출퇴근 탭은 이번 달 기록으로 오늘을 판정한다 — 기록·급여 탭에서 다른 달로 넘겼으면 이번 달로 되돌린다 (명세 member-today §6)
  const toThisMonth = () => {
    const d = new Date();
    if (cursor.year !== d.getFullYear() || cursor.month !== d.getMonth()) setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };
  const selectTab = (t: Tab) => {
    if (t === "clock") toThisMonth();
    setTab(t);
  };

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return (
    <div className="flex w-full flex-1 flex-col">
      <AppHeader
        eyebrow={membership.store.logoUrl ? "" : membership.store.name}
        logoUrl={membership.store.logoUrl}
        logoAlt={membership.store.name}
        title={TABS.find((t) => t.id === tab)!.label}
        me={me.user}
        width="max-w-md"
      />
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-4">
        {tab === "clock" && (
          <ClockPanel
            shifts={shifts}
            absences={absences}
            requests={reqRes.data}
            settings={settings}
            membership={membership}
            status={recordsFailed ? "error" : recordsLoading ? "loading" : "ready"}
            onChange={reload}
            onRetry={() => (reload(), absRes.reload())}
            onOpenPay={() => (toThisMonth(), setTab("pay"))}
            onOpenRequests={() => setTab("requests")}
          />
        )}
        {tab === "records" && (
          <div className="space-y-3">
            <MonthPicker cursor={cursor} onChange={setCursor} />
            <RecordsPanel
              shifts={shifts}
              absences={absences}
              corrections={reqRes.data?.corrections ?? []}
              year={cursor.year}
              month={cursor.month}
              loading={recordsLoading}
              failed={recordsFailed}
              onRetry={() => (reload(), absRes.reload())}
              onChange={reloadAll}
            />
          </div>
        )}
        {tab === "requests" && <RequestsPanel requests={reqRes.data} failed={!!reqRes.error} colleagues={colleagues.data ?? []} onChange={reloadAll} />}
        {tab === "pay" && (
          <div className="space-y-3">
            <MonthPicker cursor={cursor} onChange={setCursor} />
            {/* 읽기에 실패하면 예전처럼 PayView 를 그린다 — 실패한 동안 막대가 멈춰 있지 않게 */}
            <PayTab shifts={shifts} absences={absences} settings={settings} year={cursor.year} month={cursor.month} loading={recordsLoading && !recordsFailed} />
          </div>
        )}
        {tab === "me" && <MePanel me={me} membership={membership} />}
      </main>
      <BottomNav width="max-w-md" active={tab} items={TABS.map((t): NavItem => ({ key: t.id, label: t.label, icon: t.icon, badge: t.id === "requests" ? incoming : undefined, onSelect: () => selectTab(t.id) }))} />
    </div>
  );
}

function PayTab({ loading, ...props }: { shifts: Shift[]; absences: Absence[]; settings: PaySettings; year: number; month: number; loading: boolean }) {
  const now = useNow(60_000);
  if (loading) return <PayViewSkeleton year={props.year} month={props.month} now={now} />;
  return <PayView {...props} now={now} />;
}

function ClockPanel({
  shifts,
  absences,
  requests,
  settings,
  membership,
  status,
  onChange,
  onRetry,
  onOpenPay,
  onOpenRequests,
}: {
  shifts: Shift[];
  absences: Absence[];
  requests?: MyRequests | null;
  settings: PaySettings;
  membership: MyMembership;
  status: "loading" | "error" | "ready";
  onChange: () => void;
  onRetry: () => void;
  onOpenPay: () => void;
  onOpenRequests: () => void;
}) {
  const now = useNow(1_000);
  // 경과·합계는 전부 같은 분 단위 시각으로 — 시계 카드와 대시보드가 1분 어긋나지 않게 (명세 §2-3)
  const minuteNow = toMinute(now);
  const device = useDeviceSettings();
  const open = shifts.find((s) => s.end === null);
  const { lat, lng, name } = membership.store;
  const state: ClockState = status === "ready" ? todayState(shifts, absences, minuteNow) : { kind: status };
  // 오늘 퇴근했으면 내일 0시까지 다시 출근하지 않는다 — 50m 알림·배너도 끈다 (PRD 12 T-7)
  const doneToday = state.kind === "done";
  const geo = useGeofence({ enabled: device.alertsOn, storeLat: lat, storeLng: lng, storeName: name, clockedIn: !!open || doneToday });
  const [permError, setPermError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const punch = async (kind: "in" | "out") => {
    setBusy(true);
    setError(null);
    const r = kind === "in" ? await api.POST("/api/shifts/clock-in") : await api.POST("/api/shifts/clock-out");
    const code = errorCode(r.error);
    // 다른 기기에서 이미 찍었으면 서버 상태를 다시 읽어 맞춘다.
    if (code && code !== "ALREADY_CLOCKED_IN" && code !== "NOT_CLOCKED_IN") setError("저장하지 못했어요. 다시 시도해 주세요.");
    setBusy(false);
    onChange();
  };

  const toggleAlerts = async () => {
    if (device.alertsOn) return setDeviceSettings({ alertsOn: false });
    const err = await requestAlertPermissions();
    setPermError(err);
    if (!err) setDeviceSettings({ alertsOn: true });
  };

  const alertLabel = open
    ? "출근 완료 — 알림 없음"
    : doneToday
      ? "오늘 퇴근 — 내일 다시 알려요"
    : geo.alert.remindedAt
      ? `재알림 보냄 (${time(geo.alert.remindedAt)})`
      : geo.alert.firstSentAt
        ? `첫 알림 보냄 (${time(geo.alert.firstSentAt)}) — ${Math.max(0, 60 - Math.floor((now - geo.alert.firstSentAt) / 1000))}초 뒤 재알림`
        : "대기 중";

  return (
    // 카드가 차례로 나타나고, 기록을 다 읽으면(status 가 바뀌면) 다시
    <Enter className="space-y-3" replay={status}>
      {geo.inside && !open && !doneToday && (
        <div role="alert" className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
          <p className="flex items-start gap-2 text-sm font-semibold">
            <MapPin size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
            <span>매장 <span className={NUM}>{GEOFENCE_RADIUS_M}m</span> 안이에요. 출근 체크하세요.</span>
          </p>
          <button type="button" disabled={busy} onClick={() => punch("in")} className={cn(BTN.primary, "mt-3 w-full bg-accent text-on-accent")}>
            지금 출근
          </button>
        </div>
      )}

      <ClockCard now={now} minuteNow={minuteNow} state={state} busy={busy} error={error} onPunch={punch} onRetry={onRetry} />
      <TodayDashboard
        shifts={shifts}
        absences={absences}
        requests={requests}
        settings={settings}
        now={minuteNow}
        status={status}
        onRetry={onRetry}
        onOpenPay={onOpenPay}
        onOpenRequests={onOpenRequests}
      />

      <AlertCardFrame
        toggle={
          <button
            type="button"
            role="switch"
            aria-checked={device.alertsOn}
            aria-label="출근 알림"
            onClick={toggleAlerts}
            disabled={lat === null}
            className={`${SWITCH_HIT} disabled:opacity-40`}
          >
            <span aria-hidden className={`relative h-5 w-9 rounded-md ${device.alertsOn ? "bg-accent" : "bg-line"}`}>
              <span className={`absolute left-[3px] top-[3px] h-3.5 w-3.5 rounded-[3px] bg-white transition-transform duration-150 ease-[var(--ease-out)] ${device.alertsOn ? "translate-x-4" : ""}`} />
            </span>
          </button>
        }
      >
        {(lat === null || permError || device.alertsOn || geo.error) && (
          <>
            {lat === null && <p className="text-sm text-warn">사장님이 매장 위치를 아직 정하지 않았어요.</p>}
            {permError && <p className="text-sm text-warn">{permError}</p>}
            {device.alertsOn && (
              <dl className="grid gap-1.5 text-[13px]">
                <DotRow term="매장까지"><span className={NUM}>{geo.distance === null ? "위치 확인 중…" : `${Math.round(geo.distance)}m ${geo.inside ? "(안)" : "(밖)"}`}</span></DotRow>
                <DotRow term="GPS 정확도"><span className={NUM}>{geo.position ? `±${Math.round(geo.position.accuracy)}m` : "-"}</span></DotRow>
                <DotRow term="알림 상태">{alertLabel}</DotRow>
              </dl>
            )}
            {geo.error && <p className="mt-2 text-sm text-warn">{geo.error}</p>}
            {device.alertsOn && <p className="mt-2.5 text-xs text-muted">이 화면을 열어 둔 동안에만 위치를 확인해요.</p>}
          </>
        )}
      </AlertCardFrame>
    </Enter>
  );
}

/** 오늘 이후 날짜별 근무 변경 — 보기만 한다. 없으면 카드째 숨긴다. docs/prd/13 */
type Exceptions = { data: ScheduleException[] | null; error: unknown };

function MyScheduleExceptions({ data, error }: Exceptions) {
  // 읽는 동안은 2행 자리를 둔다. 읽고 나서 없거나 실패하면 예전처럼 카드째 숨긴다
  if (data === null && !error)
    return (
      <Loading>
        <Card>
          <SectionLabel icon={CalendarDays}>날짜별 근무 변경</SectionLabel>
          <ul className={EXC_ROWS}>
            {[0, 1].map((i) => (
              <li key={i} className={EXC_ROW}>
                {/* 막대를 span 으로 감싼다 — flex 항목이 되면 글자 줄(13px) 높이를 잃는다 */}
                <span><Bone className="inline-block h-3.5 w-24 align-middle" /></span>
                <span><Bone className="inline-block h-3.5 w-28 align-middle" /></span>
              </li>
            ))}
          </ul>
        </Card>
      </Loading>
    );
  if (!data?.length) return null;
  return (
    <Card>
      <SectionLabel icon={CalendarDays}>날짜별 근무 변경</SectionLabel>
      <ul className={EXC_ROWS}>
        {data.map((e) => (
          <li key={e.id} className={EXC_ROW}>
            <span>{date(parseDay(e.date))}</span>
            {/* 쉼은 회색 배지(취소 배지와 같은 bg-line/60), 근무는 시각 글자 */}
            {e.kind === "off" ? <span className="inline-flex h-5 items-center rounded-md bg-line/60 px-1.5 text-[11px] font-semibold text-muted">쉼</span> : <span>{`${e.start}~${e.end} 근무`}</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

// 카드 안 목록 — 줄 사이는 점선 (2026-10-15 B 시안 .list-row). 배지(h-5)가 있어도 줄 높이가 같게 min-h
const EXC_ROWS = "mt-1 divide-y divide-dashed divide-line";
const EXC_ROW = `flex min-h-10 items-center justify-between gap-2 py-2.5 text-[13px] ${NUM}`;

function MePanel({ me, membership }: { me: Me; membership: MyMembership }) {
  const now = useNow(60_000);
  const today = dayKey(now);
  const exceptions = useApi(() => api.GET("/api/schedule-exceptions/me", { params: { query: { from: today } } }), today);
  return (
    // 카드가 차례로 나타나고, 날짜별 근무 변경을 다 읽으면 다시
    <Enter className="space-y-3" replay={exceptions.data !== null || !!exceptions.error}>
      <Card className="flex items-center gap-3.5">
        <Avatar name={me.user.nickname} seed={me.user.id} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-bold">{me.user.nickname}</h2>
          <p className="truncate text-[13px] text-muted">{me.user.email}</p>
          <p className="mt-0.5 text-xs text-muted">{membership.store.name} · 멤버</p>
        </div>
      </Card>
      <Card>
        <SectionLabel icon={NotebookText}>근무 조건</SectionLabel>
        <dl className="mt-2.5 grid gap-1.5 text-[13px]">
          <DotRow term="매장">{membership.store.name}</DotRow>
          <DotRow term="시급"><span className={NUM}>{won(membership.hourlyWage)}</span></DotRow>
        </dl>
        {/* 시간표·주 시간·근무일은 그래프로 (2026-10-15 사용자 요청). 그래프마다 같은 내용을 글자로도 둔다 */}
        <div className="mt-4 space-y-4 border-t border-dashed border-line pt-3.5">
          <section>
            <div className="flex items-baseline justify-between gap-2 text-[13px]">
              <h3 className="text-muted">근무 시간표</h3>
              <span className={NUM}>{membership.schedule ? scheduleText(membership.schedule) : "정해지지 않음"}</span>
            </div>
            <div className="mt-2.5"><WeekRhythm schedule={membership.schedule ?? null} exceptions={exceptions.data ?? []} now={now} /></div>
          </section>
          <section>
            <div className="flex items-baseline justify-between gap-2 text-[13px]">
              <h3 className="text-muted">1주 소정근로시간</h3>
              <span className={NUM}>{membership.weeklyHours}시간</span>
            </div>
            <div className="mt-1"><WeeklyHoursGauge hours={membership.weeklyHours} /></div>
          </section>
          <section>
            <div className="flex items-baseline justify-between gap-2 text-[13px]">
              <h3 className="text-muted">1주 소정근로일수</h3>
              <span className={NUM}>{membership.workDaysPerWeek}일</span>
            </div>
            <div className="mt-2"><WorkDayDots schedule={membership.schedule ?? null} count={membership.workDaysPerWeek} /></div>
          </section>
        </div>
        {membership.hourlyWage < MINIMUM_WAGE && <p className="mt-3 text-sm text-warn">2026년 최저임금({won(MINIMUM_WAGE)})보다 낮아요.</p>}
        <p className="mt-2.5 text-xs text-muted">조건은 사장님이 정해요.</p>
      </Card>
      <MyScheduleExceptions data={exceptions.data} error={exceptions.error} />
      <button type="button" onClick={() => logout()} className={`${BTN.secondary} w-full`}>
        로그아웃
      </button>
    </Enter>
  );
}
