"use client";
// 매장 50m 진입 감지와 출근 알림. docs/prd/04-geofence-notification.md
import { useCallback, useEffect, useRef, useState } from "react";
import { GEOFENCE_RADIUS_M, INITIAL_ALERT, distanceMeters, nextAlert, type AlertState } from "./geo";

type Position = { lat: number; lng: number; accuracy: number };

async function notify(title: string, body: string, tag: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification(title, { body, tag, requireInteraction: true, icon: "/favicon.ico" });
  else new Notification(title, { body, tag });
}

export function useGeofence(opts: {
  enabled: boolean;
  storeLat: number | null;
  storeLng: number | null;
  storeName: string;
  clockedIn: boolean;
}) {
  const { enabled, storeLat, storeLng, storeName, clockedIn } = opts;
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(INITIAL_ALERT);
  const alertRef = useRef<AlertState>(INITIAL_ALERT);

  const distance =
    position && storeLat !== null && storeLng !== null
      ? distanceMeters(position.lat, position.lng, storeLat, storeLng)
      : null;
  const inside = distance !== null && distance <= GEOFENCE_RADIUS_M;

  // 위치를 계속 받는다.
  useEffect(() => {
    if (!enabled || !("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setError(null);
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
      },
      (e) => setError(e.message || "위치를 가져오지 못했어요"),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  // 위치가 바뀔 때와 5초마다 알림 상태를 다시 판정한다 (60초 재알림용).
  const evaluate = useCallback(() => {
    const r = nextAlert(alertRef.current, { inside: enabled && inside, clockedIn, now: Date.now() });
    if (r.state !== alertRef.current) {
      alertRef.current = r.state;
      setAlert(r.state);
    }
    if (r.action === "first") notify("출근 체크하세요", `${storeName} 50m 안에 들어왔어요.`, "clockin-first");
    if (r.action === "remind") notify("아직 출근 전이에요", "첫 알림 뒤 1분이 지났어요. 출근 버튼을 눌러 주세요.", "clockin-remind");
  }, [enabled, inside, clockedIn, storeName]);

  useEffect(() => {
    evaluate();
    const t = setInterval(evaluate, 5_000);
    return () => clearInterval(t);
  }, [evaluate]);

  return { position, distance, inside, alert, error };
}

/** 사용자 동작(버튼) 안에서 불러야 권한 창이 뜬다. */
export async function requestAlertPermissions(): Promise<string | null> {
  if (!("geolocation" in navigator)) return "이 브라우저는 위치를 지원하지 않아요";
  if ("serviceWorker" in navigator) await navigator.serviceWorker.register("/sw.js");
  if (!("Notification" in window)) return "이 브라우저는 알림을 지원하지 않아요 (iOS 는 홈 화면에 추가한 뒤 사용)";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "알림 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요";
  return null;
}
