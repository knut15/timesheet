// 멤버 출퇴근 탭 — 웹 web/src/components/TimesheetApp.tsx 의 ClockPanel·AlertCardFrame 앱판.
// 시계 카드 · 오늘 근무 카드 · 매장 근처 출근 알림 카드. docs/design/member-today.md, docs/prd/12-member-today.md, docs/prd/04-geofence-notification.md
// 웹 useGeofence(탭이 열린 동안만 위치 확인) 대신 OS 지역 감시(lib/geofence.ts)를 쓴다.
import { useRouter } from "expo-router";
import { BellRing, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { api, errorCode } from "@/api/client";
import { Enter } from "@/components/motion";
import { Screen } from "@/components/shell";
import { Btn, Card, CardSection, DotRow, Switch, T } from "@/components/ui";
import { setDeviceSettings, useDeviceSettings } from "@/lib/device";
import { time, useNow } from "@/lib/format";
import { markClockedToday, requestAlertPermissions, startStoreGeofence, stopStoreGeofence, useStoreDistance } from "@/lib/geofence";
import { C, R, alpha } from "@/theme";
import { GEOFENCE_RADIUS_M, REMIND_AFTER_MS } from "@shared/geo";
import { todayState, toMinute } from "@shared/today";
import { ClockCard, type ClockState } from "./clock/ClockCard";
import { TodayDashboard } from "./clock/TodayDashboard";
import { useMember } from "./MemberData";

export function ClockTab() {
  const router = useRouter();
  const { shifts, absences, requests, settings, membership, recordsLoading, recordsFailed, reloadShifts, reloadRecords, toThisMonth } = useMember();
  const status = recordsFailed ? "error" : recordsLoading ? "loading" : "ready";
  const now = useNow(1_000);
  // 경과·합계는 전부 같은 분 단위 시각으로 — 시계 카드와 대시보드가 1분 어긋나지 않게 (명세 §2-3)
  const minuteNow = toMinute(now);
  const device = useDeviceSettings();
  const open = shifts.find((s) => s.end === null);
  const { lat, lng, name } = membership.store;
  const state: ClockState = status === "ready" ? todayState(shifts, absences, minuteNow) : { kind: status };
  // 오늘 퇴근했으면 내일 0시까지 다시 출근하지 않는다 — 50m 알림·배너도 끈다 (PRD 12 T-7)
  const doneToday = state.kind === "done";
  const clocked = !!open || doneToday;
  const geo = useStoreDistance({ enabled: device.alertsOn, storeLat: lat, storeLng: lng });
  const [permError, setPermError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 알림이 켜져 있으면 화면을 열 때와 사장님이 매장 위치를 바꿨을 때 감시를 지금 위치로 다시 건다.
  // 위치가 지워졌으면 감시를 멈춘다. 권한이 빠졌으면 OS 가 거절한다 — 스위치를 다시 누르면 권한부터 묻는다
  useEffect(() => {
    if (!device.alertsOn) return;
    if (lat === null || lng === null) void stopStoreGeofence();
    else startStoreGeofence({ lat, lng, name }).catch(() => {});
  }, [device.alertsOn, lat, lng, name]);

  // 기록을 다 읽으면 OS 감시 작업에 오늘 출근 여부를 알린다 — 출근했거나 오늘 퇴근했으면 오늘은 더 알리지 않는다
  useEffect(() => {
    if (status !== "ready") return;
    void markClockedToday(clocked);
  }, [status, clocked]);

  const punch = async (kind: "in" | "out") => {
    setBusy(true);
    setError(null);
    const r = kind === "in" ? await api.POST("/api/shifts/clock-in") : await api.POST("/api/shifts/clock-out");
    const code = errorCode(r.error);
    // 다른 기기에서 이미 찍었으면 서버 상태를 다시 읽어 맞춘다.
    if (code && code !== "ALREADY_CLOCKED_IN" && code !== "NOT_CLOCKED_IN") setError("저장하지 못했어요. 다시 시도해 주세요.");
    else if (kind === "in") void markClockedToday(true);
    setBusy(false);
    reloadShifts();
  };

  const toggleAlerts = async (on: boolean) => {
    if (!on) {
      await stopStoreGeofence();
      return setDeviceSettings({ alertsOn: false });
    }
    if (lat === null || lng === null) return;
    const err = await requestAlertPermissions();
    setPermError(err);
    if (err) return;
    await setDeviceSettings({ alertsOn: true });
    // 권한을 받았어도 OS 가 감시를 거절할 수 있다 — 그 이유를 보여 주고 스위치를 되돌린다
    await startStoreGeofence({ lat, lng, name }).catch((e: unknown) => {
      setPermError(e instanceof Error ? e.message : "출근 알림을 켜지 못했어요");
      return setDeviceSettings({ alertsOn: false });
    });
  };

  const { firstSentAt, remindAt } = geo.alert;
  const alertLabel = open
    ? "출근 완료 — 알림 없음"
    : doneToday
      ? "오늘 퇴근 — 내일 다시 알려요"
      : remindAt !== null && remindAt <= now
        ? `재알림 보냄 (${time(remindAt)})`
        : firstSentAt !== null
          ? `첫 알림 보냄 (${time(firstSentAt)}) — ${Math.max(0, Math.ceil(((remindAt ?? firstSentAt + REMIND_AFTER_MS) - now) / 1000))}초 뒤 재알림`
          : "대기 중";

  return (
    <Screen onRefresh={reloadRecords}>
      <Enter>
        {geo.inside && !open && !doneToday && (
          <View accessibilityRole="alert" style={{ borderRadius: R.card, borderWidth: 1, borderColor: alpha(C.accent, 0.3), backgroundColor: alpha(C.accent, 0.1), padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <View style={{ marginTop: 2 }}>
                <MapPin size={16} color={C.accent} />
              </View>
              <T size={14} weight="semibold" style={{ flex: 1 }}>
                매장 <T size={14} weight="semibold" mono>{GEOFENCE_RADIUS_M}m</T> 안이에요. 출근 체크하세요.
              </T>
            </View>
            <Btn variant="accent" label="지금 출근" disabled={busy} onPress={() => punch("in")} style={{ marginTop: 12 }} />
          </View>
        )}

        <ClockCard now={now} minuteNow={minuteNow} state={state} busy={busy} error={error} onPunch={punch} onRetry={reloadRecords} />
        <TodayDashboard
          shifts={shifts}
          absences={absences}
          requests={requests}
          settings={settings}
          now={minuteNow}
          status={status}
          onRetry={reloadRecords}
          onOpenPay={() => (toThisMonth(), router.navigate("/member/pay"))}
          onOpenRequests={() => router.navigate("/member/requests")}
        />

        <AlertCardFrame toggle={<Switch value={device.alertsOn} onChange={(v) => void toggleAlerts(v)} label="출근 알림" disabled={lat === null} />}>
          {(lat === null || permError || device.alertsOn || geo.error) && (
            <>
              {lat === null && <T size={14} color={C.warn}>사장님이 매장 위치를 아직 정하지 않았어요.</T>}
              {permError && <T size={14} color={C.warn}>{permError}</T>}
              {device.alertsOn && (
                <View style={{ gap: 6 }}>
                  <DotRow term="매장까지">
                    <T size={13} mono weight="semibold">{geo.distance === null ? "위치 확인 중…" : `${Math.round(geo.distance)}m ${geo.inside ? "(안)" : "(밖)"}`}</T>
                  </DotRow>
                  <DotRow term="GPS 정확도">
                    <T size={13} mono weight="semibold">{geo.position ? `±${Math.round(geo.position.accuracy)}m` : "-"}</T>
                  </DotRow>
                  <DotRow term="알림 상태">{alertLabel}</DotRow>
                </View>
              )}
              {geo.error && <T size={14} color={C.warn} style={{ marginTop: 8 }}>{geo.error}</T>}
              {/* 웹은 "이 화면을 열어 둔 동안에만 위치를 확인해요." — 앱은 OS 지역 감시라 닫아 두어도 알린다 */}
              {device.alertsOn && <T size={12} color={C.muted} style={{ marginTop: 10 }}>앱을 닫아 두어도 매장 근처에 오면 알려요.</T>}
            </>
          )}
        </AlertCardFrame>
      </Enter>
    </Screen>
  );
}

/** 매장 근처 출근 알림 카드 — 윗구역은 고정 글자 + 오른쪽 스위치, 아래 구역(children)은 있을 때만 */
function AlertCardFrame({ toggle, children }: { toggle: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Card flush>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View accessibilityRole="header" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BellRing size={15} strokeWidth={1.75} color={C.muted} />
            <T size={14} weight="semibold">매장 근처 출근 알림</T>
          </View>
          <T size={12} color={C.muted} style={{ marginTop: 2, lineHeight: 19 }}>
            <T size={12} mono color={C.muted}>{GEOFENCE_RADIUS_M}m</T> 안에 들어오면 알리고, 1분 뒤 한 번 더 알려요
          </T>
        </View>
        {/* 스위치 그림은 36×20, 누르는 자리는 44 — 오른쪽 4 를 당겨 그림 끝을 카드 안쪽 선에 맞춘다 (웹 -mr-1) */}
        <View style={{ marginRight: -4 }}>{toggle}</View>
      </View>
      {children ? <CardSection style={{ paddingVertical: 12 }}>{children}</CardSection> : null}
    </Card>
  );
}
