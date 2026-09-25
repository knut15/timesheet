"use client";
// 매장 설정 — 로고·이름·위치·5인 이상. docs/prd/07-admin.md, docs/prd/11-store-logo.md
import { BLOCK_PRIMARY, BLOCK_SECONDARY } from "@/components/buttons";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { api, type Store } from "@/api/client";
import { authFetch, reloadMe } from "@/auth/session";
import { Card, ErrorText, Field } from "@/components/ui";
import { useApi } from "@/lib/useApi";
import { StoreSkeleton } from "../_skeletons";

export default function StorePage() {
  const { data, reload } = useApi(() => api.GET("/api/stores/me"), "");
  if (!data) return <StoreSkeleton />;
  return (
    <div className="space-y-4">
      <LogoCard store={data} onSaved={reload} />
      <StoreForm key={JSON.stringify(data)} store={data} onSaved={reload} />
    </div>
  );
}

const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const LOGO_MAX = 1024 * 1024;
const LOGO_MESSAGES: Record<string, string> = {
  LOGO_INVALID: "PNG·JPG·SVG 파일만 올릴 수 있어요. SVG 는 스크립트나 외부 링크가 없어야 해요.",
  PAYLOAD_TOO_LARGE: "1MB 이하 파일만 올릴 수 있어요.",
};

/** 로고 올리기·지우기. 파일 바이트를 그대로 PUT 한다 — 서버가 첫 바이트로 형식을 다시 확인한다 (docs/prd/11). */
function LogoCard({ store, onSaved }: { store: Store; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const done = async (res: Response) => {
    setBusy(false);
    if (!res.ok) {
      const code = (await res.json().catch(() => null))?.code as string | undefined;
      return setError(LOGO_MESSAGES[code ?? ""] ?? "올리지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
    setError(null);
    await reloadMe(); // 헤더의 로고가 바로 바뀐다
    onSaved();
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    // 서버 검사 전에 흔한 실수만 먼저 알려 준다
    if (!LOGO_TYPES.includes(file.type)) return setError(LOGO_MESSAGES.LOGO_INVALID!);
    if (file.size > LOGO_MAX) return setError(LOGO_MESSAGES.PAYLOAD_TOO_LARGE!);
    setBusy(true);
    await done(await authFetch(new Request("/api/stores/me/logo", { method: "PUT", body: file, headers: { "Content-Type": file.type } })));
  };
  const remove = async () => {
    if (!window.confirm("로고를 지울까요? 헤더에는 매장 이름만 남아요.")) return;
    setBusy(true);
    await done(await authFetch(new Request("/api/stores/me/logo", { method: "DELETE" })));
  };

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold">매장 로고</h2>
        <p className="mt-1 text-sm text-muted">헤더의 매장 이름 앞에 보여요. PNG·JPG·SVG, 1MB 이하. 가로로 긴 로고가 잘 보여요.</p>
      </div>
      <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-line bg-background">
        {store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 인증 쿠키로 받는 API 이미지
          <img src={store.logoUrl} alt={`${store.name} 로고`} className="h-10 w-auto max-w-48 object-contain" />
        ) : (
          <span className="text-sm text-muted">로고 없음</span>
        )}
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <label className={cn(BLOCK_PRIMARY, "flex-1 cursor-pointer", busy && "pointer-events-none opacity-50")}>
          {store.logoUrl ? "로고 바꾸기" : "로고 올리기"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,.png,.jpg,.jpeg,.svg"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = ""; // 같은 파일을 다시 골라도 onChange 가 오게
            }}
          />
        </label>
        {store.logoUrl && (
          <button onClick={remove} disabled={busy} className={cn(BLOCK_SECONDARY, "w-auto px-4 text-sm disabled:opacity-50")}>지우기</button>
        )}
      </div>
    </Card>
  );
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
        <button onClick={pickCurrentLocation} className={BLOCK_SECONDARY}>현재 위치를 매장으로</button>
        <div className="grid grid-cols-2 gap-3">
          <Field label="위도"><input type="number" step={0.000001} value={form.lat ?? ""} onChange={coord("lat")} className="field" /></Field>
          <Field label="경도"><input type="number" step={0.000001} value={form.lng ?? ""} onChange={coord("lng")} className="field" /></Field>
        </div>
      </Card>
      <ErrorText>{error}</ErrorText>
      {msg && !error && <p className="text-sm text-accent">{msg}</p>}
      <button onClick={() => save(form)} className={BLOCK_PRIMARY}>저장</button>
    </div>
  );
}
