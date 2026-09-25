// 기기마다 다른 값만 localStorage 에 둔다. 근무 기록·급여 조건은 서버에 있다 (docs/prd/06-store-invite.md).
import { useSyncExternalStore } from "react";

export type DeviceSettings = { alertsOn: boolean };
const DEFAULT: DeviceSettings = { alertsOn: false };
const KEY = "timesheet.device";

const listeners = new Set<() => void>();
let cacheRaw: string | null | undefined;
let cacheVal: DeviceSettings = DEFAULT;

function get(): DeviceSettings {
  const raw = localStorage.getItem(KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cacheVal = { ...DEFAULT, ...(raw ? JSON.parse(raw) : {}) };
  }
  return cacheVal;
}

export function setDeviceSettings(next: DeviceSettings) {
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useDeviceSettings(): DeviceSettings {
  return useSyncExternalStore(subscribe, get, () => DEFAULT);
}
