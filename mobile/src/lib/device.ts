// 기기마다 다른 값 — 웹은 localStorage, 앱은 보안 저장소에 둔다. 근무 기록·급여 조건은 서버에 있다.
import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";

export type DeviceSettings = { alertsOn: boolean };
const DEFAULT: DeviceSettings = { alertsOn: false };
const KEY = "timesheet.device";

let value: DeviceSettings = DEFAULT;
const listeners = new Set<() => void>();

/** 앱을 켤 때 한 번 읽는다 (_layout) */
export async function loadDeviceSettings() {
  const raw = await SecureStore.getItemAsync(KEY);
  value = { ...DEFAULT, ...(raw ? (JSON.parse(raw) as Partial<DeviceSettings>) : {}) };
  listeners.forEach((l) => l());
}

export const getDeviceSettings = () => value;

export async function setDeviceSettings(next: DeviceSettings) {
  value = next;
  listeners.forEach((l) => l());
  await SecureStore.setItemAsync(KEY, JSON.stringify(next));
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const useDeviceSettings = () => useSyncExternalStore(subscribe, getDeviceSettings, getDeviceSettings);
