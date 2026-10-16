// 매장 50m 출근 알림 — 앱판 (docs/prd/04-geofence-notification.md, docs/prd/14-native-app.md).
// 웹은 탭이 열려 있을 때만 위치를 받았다. 앱은 OS 의 지역 감시(iOS Region Monitoring · Android Geofencing API)에 매장 반경을 맡긴다.
// 그래서 앱을 닫아 두어도 들어올 때 OS 가 앱을 깨워 아래 작업을 부른다.
//   들어옴 → 첫 알림을 바로, 재알림을 60초 뒤로 예약 (G-4·G-5)
//   나감   → 예약한 재알림 취소, 상태 처음으로 (G-7)
//   출근   → 앱이 markClockedToday 를 불러 재알림 취소 (G-6). 오늘 출근·퇴근한 날에는 들어와도 알리지 않는다 (PRD 12 T-7)
// 판정 숫자(50m, 60초)는 웹과 같은 @shared/geo 에서 가져온다.
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import { useEffect, useState } from "react";
import { GEOFENCE_RADIUS_M, REMIND_AFTER_MS, distanceMeters } from "@shared/geo";
import { dayKey } from "@shared/pay";

export const GEOFENCE_TASK = "timesheet-store-geofence";
const REMIND_ID = "clockin-remind";
// 화면이 잠긴 동안 깨어난 작업도 읽을 수 있게 "처음 잠금 해제 뒤" 접근으로 둔다
const KEYCHAIN = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };
const DAY_KEY = "timesheet.geofence.clockedDay";
const STATE_KEY = "timesheet.geofence.alert";
const STORE_KEY = "timesheet.geofence.store";

/** 화면에 보여 줄 알림 상태 — 첫 알림 보낸 시각, 재알림 예약 시각 */
export type GeoAlert = { firstSentAt: number | null; remindAt: number | null };
const NONE: GeoAlert = { firstSentAt: null, remindAt: null };

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await SecureStore.getItemAsync(key, KEYCHAIN);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
const writeJson = (key: string, v: unknown) => SecureStore.setItemAsync(key, JSON.stringify(v), KEYCHAIN);

async function onEnter() {
  if ((await SecureStore.getItemAsync(DAY_KEY, KEYCHAIN)) === dayKey(Date.now())) return;
  const store = await readJson<{ name: string } | null>(STORE_KEY, null);
  const now = Date.now();
  await Notifications.scheduleNotificationAsync({
    content: { title: "출근 체크하세요", body: `${store?.name ?? "매장"} ${GEOFENCE_RADIUS_M}m 안에 들어왔어요.` },
    trigger: null,
  });
  await Notifications.cancelScheduledNotificationAsync(REMIND_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: REMIND_ID,
    content: { title: "아직 출근 전이에요", body: "첫 알림 뒤 1분이 지났어요. 출근 버튼을 눌러 주세요." },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: REMIND_AFTER_MS / 1000 },
  });
  await writeJson(STATE_KEY, { firstSentAt: now, remindAt: now + REMIND_AFTER_MS } satisfies GeoAlert);
}

async function resetAlert() {
  await Notifications.cancelScheduledNotificationAsync(REMIND_ID).catch(() => {});
  await writeJson(STATE_KEY, NONE);
}

// 모듈을 처음 읽을 때 등록한다 — 앱이 백그라운드에서 깨어나도 같은 작업을 찾을 수 있게 _layout 이 가장 먼저 import 한다
TaskManager.defineTask<{ eventType: Location.GeofencingEventType }>(GEOFENCE_TASK, async ({ data, error }) => {
  if (error || !data) return;
  if (data.eventType === Location.GeofencingEventType.Enter) await onEnter();
  if (data.eventType === Location.GeofencingEventType.Exit) await resetAlert();
});

/** 버튼을 누른 동안 부른다. 알림 → 위치(사용 중) → 위치(항상) 순서로 묻는다. 막히면 이유를, 다 받으면 null */
export async function requestAlertPermissions(): Promise<string | null> {
  const n = await Notifications.requestPermissionsAsync();
  if (!n.granted) return "알림 권한이 꺼져 있어요. 설정 앱에서 타임시트 알림을 허용해 주세요";
  const fg = await Location.requestForegroundPermissionsAsync();
  if (!fg.granted) return "위치 권한이 꺼져 있어요. 설정 앱에서 위치를 허용해 주세요";
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (!bg.granted) return "앱을 닫아 두어도 알리려면 위치 권한을 '항상'으로 바꿔 주세요";
  return null;
}

/** 매장 반경 감시를 켠다. 매장 위치가 바뀌었으면 새 위치로 다시 건다 */
export async function startStoreGeofence(store: { lat: number; lng: number; name: string }) {
  await writeJson(STORE_KEY, { name: store.name });
  await Location.startGeofencingAsync(GEOFENCE_TASK, [
    { identifier: "store", latitude: store.lat, longitude: store.lng, radius: GEOFENCE_RADIUS_M, notifyOnEnter: true, notifyOnExit: true },
  ]);
}

export async function stopStoreGeofence() {
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false)) await Location.stopGeofencingAsync(GEOFENCE_TASK);
  await resetAlert();
}

/** 출근했거나 오늘 퇴근했다 — 오늘은 더 알리지 않는다. 출근 기록이 없으면(null) 다시 알린다 */
export async function markClockedToday(clocked: boolean) {
  if (clocked) {
    await SecureStore.setItemAsync(DAY_KEY, dayKey(Date.now()), KEYCHAIN);
    await resetAlert();
  } else {
    await SecureStore.deleteItemAsync(DAY_KEY, KEYCHAIN);
  }
}

type Position = { lat: number; lng: number; accuracy: number };

/**
 * 화면이 열린 동안 — 매장까지 거리·GPS 정확도·알림 상태를 보여 준다 (G-8). 알림은 OS 감시가 보내므로 여기서는 보내지 않는다.
 * inside 면 화면 위에 "지금 출근" 배너를 띄운다 (G-4).
 */
export function useStoreDistance(opts: { enabled: boolean; storeLat: number | null; storeLng: number | null }) {
  const { enabled, storeLat, storeLng } = opts;
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<GeoAlert>(NONE);

  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | null = null;
    let alive = true;
    Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 5_000, distanceInterval: 5 }, (p) => {
      setError(null);
      setPosition({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? 0 });
    })
      .then((s) => (alive ? (sub = s) : s.remove()))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "위치를 가져오지 못했어요"));
    return () => {
      alive = false;
      sub?.remove();
    };
  }, [enabled]);

  // 작업이 남긴 알림 상태를 5초마다 읽는다 (재알림까지 남은 초를 보여 주려고)
  useEffect(() => {
    if (!enabled) return setAlert(NONE);
    const read = () => void readJson<GeoAlert>(STATE_KEY, NONE).then(setAlert);
    read();
    const t = setInterval(read, 5_000);
    return () => clearInterval(t);
  }, [enabled]);

  const distance = position && storeLat !== null && storeLng !== null ? distanceMeters(position.lat, position.lng, storeLat, storeLng) : null;
  return { position, distance, inside: distance !== null && distance <= GEOFENCE_RADIUS_M, alert, error };
}
