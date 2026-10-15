"use client";
// 멤버(알바생) 화면. 기록과 급여 조건은 서버에서 읽는다. docs/prd/01~04, 06, 08, 09
import { useEffect, useMemo, useState } from "react";
import { api, errorCode, type Absence, type Me, type MyMembership } from "@/api/client";
import { useArea } from "@/auth/hooks";
import { logout } from "@/auth/session";
import { GEOFENCE_RADIUS_M } from "@/lib/geo";
import { dayKey, MINIMUM_WAGE, shiftMinutes, type PaySettings, type Shift } from "@/lib/pay";
import { setDeviceSettings, useDeviceSettings } from "@/lib/storage";
import { useApi } from "@/lib/useApi";
import { requestAlertPermissions, useGeofence } from "@/lib/useGeofence";
import { cn } from "@/lib/utils";
import { BellRing, CalendarDays, ClipboardList, Clock, House, MapPin, Moon, NotebookText, Sparkle, UserRound, Wallet } from "lucide-react";
import { Scene } from "./illust";
import { RecordsPanel } from "./member/RecordsPanel";
import { RequestsPanel } from "./member/RequestsPanel";
import { Enter, SwapText, useAppear } from "./motion";
import { DotRow, PayView } from "./PayView";
import { AppHeader, Avatar, BottomNav, type NavItem } from "./shell";
import { BTN, Card, date, ErrorText, hm, keyed, MonthPicker, monthRange, NUM, SectionLabel, Spinner, time, toShift, useMonthCursor, useNow, won } from "./ui";

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
  if (!me?.membership) return <Spinner />;
  return <MemberHome me={me} membership={me.membership} />;
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
        {tab === "clock" && <ClockPanel shifts={shifts} ready={!recordsLoading} membership={membership} onChange={reload} />}
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
              failed={!!error || !!absRes.error}
              onRetry={() => (reload(), absRes.reload())}
              onChange={reloadAll}
            />
          </div>
        )}
        {tab === "requests" && <RequestsPanel requests={reqRes.data} colleagues={colleagues.data ?? []} onChange={reloadAll} />}
        {tab === "pay" && (
          <div className="space-y-3">
            <MonthPicker cursor={cursor} onChange={setCursor} />
            <PayTab shifts={shifts} absences={absences} settings={settings} year={cursor.year} month={cursor.month} replay={recordsLoading} />
          </div>
        )}
        {tab === "me" && <MePanel me={me} membership={membership} />}
      </main>
      <BottomNav width="max-w-md" active={tab} items={TABS.map((t): NavItem => ({ key: t.id, label: t.label, icon: t.icon, badge: t.id === "requests" ? incoming : undefined, onSelect: () => setTab(t.id) }))} />
    </div>
  );
}

function PayTab(props: { shifts: Shift[]; absences: Absence[]; settings: PaySettings; year: number; month: number; replay: unknown }) {
  const now = useNow(60_000);
  return <PayView {...props} now={now} />;
}

/** 24시간제 시:분 — 10:02 */
const hhmm = (t: number) => new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
/** 경과·근무 시간 — 4:30 */
const clockHm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;

function ClockPanel({ shifts, ready, membership, onChange }: { shifts: Shift[]; ready: boolean; membership: MyMembership; onChange: () => void }) {
  const now = useNow(1_000);
  const device = useDeviceSettings();
  const open = shifts.find((s) => s.end === null);
  // 오늘 출근한 기록. 열린 기록이 없고 오늘 기록이 있으면 "오늘은 퇴근함" 으로 본다 — 서버 기록으로 판단하므로 새로고침해도 같다
  const todayKey = dayKey(now);
  const today = shifts.filter((s) => dayKey(s.start) === todayKey).sort((a, b) => a.start - b.start);
  const doneToday = !open && today.length > 0 ? today : null;
  const { lat, lng, name } = membership.store;
  const geo = useGeofence({ enabled: device.alertsOn, storeLat: lat, storeLng: lng, storeName: name, clockedIn: !!open });
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
    : geo.alert.remindedAt
      ? `재알림 보냄 (${time(geo.alert.remindedAt)})`
      : geo.alert.firstSentAt
        ? `첫 알림 보냄 (${time(geo.alert.firstSentAt)}) — ${Math.max(0, 60 - Math.floor((now - geo.alert.firstSentAt) / 1000))}초 뒤 재알림`
        : "대기 중";

  const state = open ? "근무 중" : doneToday ? "퇴근함" : "출근 전";

  return (
    // 카드가 차례로 나타나고, 기록을 다 읽으면 다시
    <Enter className="space-y-3" replay={ready}>
      {geo.inside && !open && (
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

      <Card>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs font-semibold text-muted ${NUM}`}>{date(now)}</p>
          {/* 상태 태그 — 점 + 글자. 글자가 바뀔 때 위로 밀려 바뀐다 */}
          <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-muted/40 px-2 text-xs font-semibold">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${open ? "bg-ok ring-[3px] ring-ok/20" : "bg-muted ring-[3px] ring-line"}`} />
            <SwapText text={state} />
          </span>
        </div>
        {/* 포인트 컬러: 출퇴근 시계는 강조색 (2026-10-15 사용자 지시) */}
        <p className={`mt-2 text-[40px] font-semibold leading-none tracking-tight text-accent ${NUM}`}>{new Date(now).toLocaleTimeString("ko-KR", { hour12: false })}</p>
        {open ? (
          <p className={`mt-2.5 flex gap-4 text-[13px] text-muted ${NUM}`}>
            <span>출근 <b className="font-semibold text-foreground">{hhmm(open.start)}</b></span>
            <span>경과 <b className="font-semibold text-foreground">{clockHm(shiftMinutes(open, now))}</b></span>
          </p>
        ) : (
          doneToday && (
            <p className={`mt-2.5 flex gap-4 text-[13px] text-muted ${NUM}`}>
              <span>출근 <b className="font-semibold text-foreground">{hhmm(doneToday[0]!.start)}</b></span>
              <span>퇴근 <b className="font-semibold text-foreground">{hhmm(doneToday[doneToday.length - 1]!.end!)}</b></span>
            </p>
          )
        )}
        {open ? (
          <button type="button" disabled={busy} onClick={() => punch("out")} className={`${BTN.primary} mt-3.5 w-full`}>
            퇴근
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => punch("in")} className={cn(BTN.primary, "mt-3.5 w-full bg-accent text-on-accent")}>
            출근
          </button>
        )}
        {doneToday && <DoneBox minutes={doneToday.reduce((sum, s) => sum + shiftMinutes(s, now), 0)} />}
        <div className="mt-3 empty:hidden">
          <ErrorText>{error}</ErrorText>
        </div>
      </Card>

      <Card className="divide-y divide-line p-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <BellRing size={15} strokeWidth={1.75} aria-hidden className="shrink-0 text-muted" />
              매장 근처 출근 알림
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted"><span className={NUM}>{GEOFENCE_RADIUS_M}m</span> 안에 들어오면 알리고, 1분 뒤 한 번 더 알려요</p>
          </div>
          {/* 스위치 그림은 36×20, 누르는 자리는 44px 로 넓힌다 */}
          <button
            role="switch"
            aria-checked={device.alertsOn}
            aria-label="출근 알림"
            onClick={toggleAlerts}
            disabled={lat === null}
            className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center disabled:opacity-40"
          >
            <span aria-hidden className={`relative h-5 w-9 rounded-md ${device.alertsOn ? "bg-accent" : "bg-line"}`}>
              <span className={`absolute left-[3px] top-[3px] h-3.5 w-3.5 rounded-[3px] bg-white transition-transform duration-150 ease-[var(--ease-out)] ${device.alertsOn ? "translate-x-4" : ""}`} />
            </span>
          </button>
        </div>
        {(lat === null || permError || device.alertsOn || geo.error) && (
          <div className="px-4 py-3">
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
          </div>
        )}
      </Card>
    </Enter>
  );
}

/** 퇴근한 뒤의 완료 상자 — 나타날 때 한 번 올라오고, 집·달·반짝임 장면이 톡 튀어나온다 */
function DoneBox({ minutes }: { minutes: number }) {
  const ref = useAppear<HTMLDivElement>();
  return (
    <div ref={ref} className="mt-3.5 flex items-center gap-3 rounded-xl border border-dashed border-muted/50 px-3 py-2.5">
      <Scene size="sm" icon={House} accents={[{ icon: Moon, at: "tr" }, { icon: Sparkle, at: "tl" }]} />
      <div className="min-w-0">
        <p className="text-sm font-semibold">수고했어요</p>
        <p className={`text-xs text-muted ${NUM}`}>오늘 {hm(minutes)}</p>
      </div>
    </div>
  );
}

function MePanel({ me, membership }: { me: Me; membership: MyMembership }) {
  return (
    <Enter className="space-y-3">
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
          <DotRow term="1주 소정근로시간"><span className={NUM}>{membership.weeklyHours}시간</span></DotRow>
          <DotRow term="1주 소정근로일수"><span className={NUM}>{membership.workDaysPerWeek}일</span></DotRow>
        </dl>
        {membership.hourlyWage < MINIMUM_WAGE && <p className="mt-3 text-sm text-warn">2026년 최저임금({won(MINIMUM_WAGE)})보다 낮아요.</p>}
        <p className="mt-2.5 text-xs text-muted">조건은 사장님이 정해요.</p>
      </Card>
      <button type="button" onClick={() => logout()} className={`${BTN.secondary} w-full`}>
        로그아웃
      </button>
    </Enter>
  );
}
