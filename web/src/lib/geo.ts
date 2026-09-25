// 매장 반경 판정과 출근 알림 상태. 규칙은 docs/prd/04-geofence-notification.md 를 따른다.

export const GEOFENCE_RADIUS_M = 50;
export const REMIND_AFTER_MS = 60_000;

/** 두 좌표 사이 거리(m). 하버사인 공식. */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type AlertState = { firstSentAt: number | null; remindedAt: number | null };
export type AlertAction = "none" | "first" | "remind";

export const INITIAL_ALERT: AlertState = { firstSentAt: null, remindedAt: null };

/** 지금 알림을 보낼지 정하고 다음 상태를 돌려준다. 밖으로 나가거나 출근하면 처음으로 돌아간다. */
export function nextAlert(
  state: AlertState,
  input: { inside: boolean; clockedIn: boolean; now: number },
): { state: AlertState; action: AlertAction } {
  const { inside, clockedIn, now } = input;
  if (!inside || clockedIn) return { state: INITIAL_ALERT, action: "none" };
  if (state.firstSentAt === null) return { state: { firstSentAt: now, remindedAt: null }, action: "first" };
  if (state.remindedAt === null && now - state.firstSentAt >= REMIND_AFTER_MS) {
    return { state: { ...state, remindedAt: now }, action: "remind" };
  }
  return { state, action: "none" };
}
