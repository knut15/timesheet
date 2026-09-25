"use client";
// 매장 설정 — 이름·위치·5인 이상. docs/prd/07-admin.md
import { useState } from "react";
import { api, type Store } from "@/api/client";
import { reloadMe } from "@/auth/session";
import { Card, ErrorText, Field, Spinner } from "@/components/ui";
import { useApi } from "@/lib/useApi";

export default function StorePage() {
  const { data, reload } = useApi(() => api.GET("/api/stores/me"), "");
  if (!data) return <Spinner />;
  return <StoreForm key={JSON.stringify(data)} store={data} onSaved={reload} />;
}

function StoreForm({ store, onSaved }: { store: Store; onSaved: () => void }) {
  const [form, setForm] = useState(store);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async (patch: Partial<Store>) => {
    const { error } = await api.PATCH("/api/stores/me", { body: { name: patch.name, lat: patch.lat, lng: patch.lng, fivePlus: patch.fivePlus } });
    if (error) return setError("저장하지 못했어요. 값을 확인해 주세요.");
    setError(null);
    setMsg("저장했어요.");
    await reloadMe();
    onSaved();
  };

  const pickCurrentLocation = () => {
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => void save({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => setError(e.message || "위치를 가져오지 못했어요"),
      { enableHighAccuracy: true, timeout: 20_000 },
    );
  };
  const coord = (k: "lat" | "lng") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber });

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <Field label="매장 이름">
          <input value={form.name} maxLength={50} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
        </Field>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>상시 5인 이상 사업장 (연장근로 50% 가산)</span>
          <input type="checkbox" checked={form.fivePlus} onChange={(e) => setForm({ ...form, fivePlus: e.target.checked })} className="h-5 w-5 accent-[var(--accent)]" />
        </label>
      </Card>
      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold">매장 위치</h2>
          <p className="mt-1 text-sm text-muted">알바생이 이 위치 50m 안에 들어오면 출근 알림을 받아요.</p>
        </div>
        <button onClick={pickCurrentLocation} className="w-full rounded-xl border border-accent py-3 font-semibold text-accent">현재 위치를 매장으로</button>
        <div className="grid grid-cols-2 gap-3">
          <Field label="위도"><input type="number" step={0.000001} value={form.lat ?? ""} onChange={coord("lat")} className="field" /></Field>
          <Field label="경도"><input type="number" step={0.000001} value={form.lng ?? ""} onChange={coord("lng")} className="field" /></Field>
        </div>
      </Card>
      <ErrorText>{error}</ErrorText>
      {msg && !error && <p className="text-sm text-accent">{msg}</p>}
      <button onClick={() => save(form)} className="w-full rounded-xl bg-accent py-3 font-semibold text-white">저장</button>
    </div>
  );
}
