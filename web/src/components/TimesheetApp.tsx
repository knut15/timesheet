"use client";
// 멤버(알바생) 화면. 기록과 급여 조건은 서버에서 읽는다. docs/prd/01~04, 06, 08, 09
import { useEffect, useMemo, useState } from "react";
import { api, errorCode, type Absence, type Me, type MyMembership } from "@/api/client";
import { useArea } from "@/auth/hooks";
import { logout } from "@/auth/session";
import { GEOFENCE_RADIUS_M } from "@/lib/geo";
import { MINIMUM_WAGE, shiftMinutes, type PaySettings, type Shift } from "@/lib/pay";
import { setDeviceSettings, useDeviceSettings } from "@/lib/storage";
import { useApi } from "@/lib/useApi";
import { requestAlertPermissions, useGeofence } from "@/lib/useGeofence";
import { CalendarDays, ClipboardList, Clock, UserRound, Wallet } from "lucide-react";
import { RecordsPanel } from "./member/RecordsPanel";
import { RequestsPanel } from "./member/RequestsPanel";
import { PayView } from "./PayView";
import { AppHeader, Avatar, BottomNav, type NavItem } from "./shell";
import { Card, date, ErrorText, hm, keyed, MonthPicker, monthRange, Spinner, time, toShift, useMonthCursor, useNow, won } from "./ui";

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
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <AppHeader eyebrow={membership.store.name} title={TABS.find((t) => t.id === tab)!.label} me={me.user} width="max-w-md" logoUrl={membership.store.logoUrl} />
      <main className="flex-1 px-5 pb-28 pt-4">
        {tab === "clock" && <ClockPanel shifts={shifts} membership={membership} onChange={reload} />}
        {tab === "records" && (
          <div className="space-y-4">
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
          <div className="space-y-4">
            <MonthPicker cursor={cursor} onChange={setCursor} />
            <PayTab shifts={shifts} absences={absences} settings={settings} year={cursor.year} month={cursor.month} />
          </div>
        )}
        {tab === "me" && <MePanel me={me} membership={membership} />}
      </main>
      <BottomNav width="max-w-md" active={tab} items={TABS.map((t): NavItem => ({ key: t.id, label: t.label, icon: t.icon, badge: t.id === "requests" ? incoming : undefined, onSelect: () => setTab(t.id) }))} />
    </div>
  );
}

function PayTab(props: { shifts: Shift[]; absences: Absence[]; settings: PaySettings; year: number; month: number }) {
  const now = useNow(60_000);
  return <PayView {...props} now={now} />;
}

function ClockPanel({ shifts, membership, onChange }: { shifts: Shift[]; membership: MyMembership; onChange: () => void }) {
  const now = useNow(1_000);
  const device = useDeviceSettings();
  const open = shifts.find((s) => s.end === null);
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

  return (
    <div className="space-y-4">
      {geo.inside && !open && (
        <div role="alert" className="rounded-2xl bg-accent p-5 text-white">
          <p className="font-semibold">매장 {GEOFENCE_RADIUS_M}m 안이에요. 출근 체크하세요.</p>
          <button disabled={busy} onClick={() => punch("in")} className="mt-3 w-full rounded-xl bg-white py-3 font-bold text-accent">
            지금 출근
          </button>
        </div>
      )}

      <Card className="text-center">
        <p className="text-sm text-muted">{date(now)}</p>
        <p className="mt-1 font-mono text-5xl font-semibold tabular-nums">{new Date(now).toLocaleTimeString("ko-KR", { hour12: false })}</p>
        {open ? (
          <>
            <p className="mt-4 text-sm text-muted">
              {time(open.start)} 출근 · <span className="text-foreground">{hm(shiftMinutes(open, now))}</span> 근무 중
            </p>
            <button disabled={busy} onClick={() => punch("out")} className="mt-4 w-full rounded-xl bg-foreground py-4 text-lg font-bold text-background disabled:opacity-50">
              퇴근
            </button>
          </>
        ) : (
          <button disabled={busy} onClick={() => punch("in")} className="mt-6 w-full rounded-xl bg-accent py-4 text-lg font-bold text-white disabled:opacity-50">
            출근
          </button>
        )}
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">매장 근처 출근 알림</h2>
            <p className="text-sm text-muted">{GEOFENCE_RADIUS_M}m 안에 들어오면 알리고, 1분 뒤 한 번 더 알려요</p>
          </div>
          <button
            role="switch"
            aria-checked={device.alertsOn}
            aria-label="출근 알림"
            onClick={toggleAlerts}
            disabled={lat === null}
            className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${device.alertsOn ? "bg-accent" : "bg-line"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${device.alertsOn ? "left-6" : "left-1"}`} />
          </button>
        </div>
        {lat === null && <p className="mt-3 text-sm text-warn">사장님이 매장 위치를 아직 정하지 않았어요.</p>}
        {permError && <p className="mt-3 text-sm text-warn">{permError}</p>}
        {device.alertsOn && (
          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted">매장까지</dt>
            <dd className="text-right tabular-nums">{geo.distance === null ? "위치 확인 중…" : `${Math.round(geo.distance)}m ${geo.inside ? "(안)" : "(밖)"}`}</dd>
            <dt className="text-muted">GPS 정확도</dt>
            <dd className="text-right tabular-nums">{geo.position ? `±${Math.round(geo.position.accuracy)}m` : "-"}</dd>
            <dt className="text-muted">알림 상태</dt>
            <dd className="text-right">{alertLabel}</dd>
          </dl>
        )}
        {geo.error && <p className="mt-3 text-sm text-warn">{geo.error}</p>}
        {device.alertsOn && <p className="mt-3 text-xs text-muted">이 화면을 열어 둔 동안에만 위치를 확인해요.</p>}
      </Card>
    </div>
  );
}

function MePanel({ me, membership }: { me: Me; membership: MyMembership }) {
  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-4">
        <Avatar name={me.user.nickname} seed={me.user.id} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{me.user.nickname}</h2>
          <p className="truncate text-sm text-muted">{me.user.email}</p>
          <p className="mt-1 text-xs text-muted">{membership.store.name} · 멤버</p>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">근무 조건</h2>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted">매장</dt>
          <dd className="text-right">{membership.store.name}</dd>
          <dt className="text-muted">시급</dt>
          <dd className="text-right tabular-nums">{won(membership.hourlyWage)}</dd>
          <dt className="text-muted">1주 소정근로시간</dt>
          <dd className="text-right tabular-nums">{membership.weeklyHours}시간</dd>
          <dt className="text-muted">1주 소정근로일수</dt>
          <dd className="text-right tabular-nums">{membership.workDaysPerWeek}일</dd>
        </dl>
        {membership.hourlyWage < MINIMUM_WAGE && <p className="mt-3 text-sm text-warn">2026년 최저임금({won(MINIMUM_WAGE)})보다 낮아요.</p>}
        <p className="mt-3 text-xs text-muted">조건은 사장님이 정해요.</p>
      </Card>
      <button onClick={() => logout()} className="w-full rounded-xl border border-line py-3 text-sm">
        로그아웃
      </button>
    </div>
  );
}
