"use client";
// 멤버(알바생) 화면. 기록과 급여 조건은 서버에서 읽는다. docs/prd/01~04, 06
import { useEffect, useMemo, useState } from "react";
import { api, errorCode, type Me, type MyMembership } from "@/api/client";
import { useArea } from "@/auth/hooks";
import { logout } from "@/auth/session";
import { GEOFENCE_RADIUS_M } from "@/lib/geo";
import { MINIMUM_WAGE, shiftMinutes, type PaySettings, type Shift } from "@/lib/pay";
import { setDeviceSettings, useDeviceSettings } from "@/lib/storage";
import { useApi } from "@/lib/useApi";
import { requestAlertPermissions, useGeofence } from "@/lib/useGeofence";
import { PayView } from "./PayView";
import { Card, date, ErrorText, hm, MonthPicker, monthRange, Spinner, time, toShift, useMonthCursor, useNow, won } from "./ui";

type Tab = "clock" | "records" | "pay" | "me";
const TABS: { id: Tab; label: string }[] = [
  { id: "clock", label: "출퇴근" },
  { id: "records", label: "기록" },
  { id: "pay", label: "급여" },
  { id: "me", label: "내 정보" },
];

export default function TimesheetApp() {
  const { me } = useArea("member");
  if (!me?.membership) return <Spinner />;
  return <MemberHome me={me} membership={me.membership} />;
}

function MemberHome({ me, membership }: { me: Me; membership: MyMembership }) {
  const [tab, setTab] = useState<Tab>("clock");
  const [cursor, setCursor] = useMonthCursor();
  const range = monthRange(cursor.year, cursor.month);
  const { data, reload } = useApi(() => api.GET("/api/shifts/me", { params: { query: range } }), `${range.from}|${range.to}`);
  const shifts = useMemo(() => (data ?? []).map(toShift), [data]);
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
      <header className="px-5 pb-3 pt-6">
        <p className="text-sm text-muted">{membership.store.name}</p>
        <h1 className="text-2xl font-bold tracking-tight">{me.user.nickname}님의 타임시트</h1>
      </header>
      <main className="flex-1 px-5 pb-28">
        {tab === "clock" && <ClockPanel shifts={shifts} membership={membership} onChange={reload} />}
        {tab === "records" && (
          <div className="space-y-4">
            <MonthPicker cursor={cursor} onChange={setCursor} />
            <RecordsList shifts={shifts} year={cursor.year} month={cursor.month} />
          </div>
        )}
        {tab === "pay" && (
          <div className="space-y-4">
            <MonthPicker cursor={cursor} onChange={setCursor} />
            <PayTab shifts={shifts} settings={settings} year={cursor.year} month={cursor.month} />
          </div>
        )}
        {tab === "me" && <MePanel me={me} membership={membership} />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`py-4 text-sm font-medium ${tab === t.id ? "text-accent" : "text-muted"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function PayTab(props: { shifts: Shift[]; settings: PaySettings; year: number; month: number }) {
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

/** 멤버는 자기 기록을 보기만 한다. 고치는 것은 마스터다 (docs/prd/06). */
function RecordsList({ shifts, year, month }: { shifts: Shift[]; year: number; month: number }) {
  const inMonth = shifts
    .filter((s) => {
      const d = new Date(s.start);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => b.start - a.start);
  if (inMonth.length === 0) return <Card><p className="text-center text-muted">이 달 기록이 없어요.</p></Card>;
  return (
    <ul className="space-y-3">
      {inMonth.map((s) => (
        <li key={s.id} className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="font-medium">{date(s.start)}</p>
          <p className="text-sm text-muted tabular-nums">
            {time(s.start)} ~ {s.end ? time(s.end) : "근무 중"} · {hm(shiftMinutes(s))}
          </p>
        </li>
      ))}
      <p className="px-1 text-xs text-muted">잘못 찍은 기록은 사장님께 수정을 요청하세요.</p>
    </ul>
  );
}

function MePanel({ me, membership }: { me: Me; membership: MyMembership }) {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-semibold">{me.user.nickname}</h2>
        <p className="text-sm text-muted">{me.user.email}</p>
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
