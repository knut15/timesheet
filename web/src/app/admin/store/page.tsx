"use client";
// 매장 설정 — 로고·이름·위치·5인 이상. docs/prd/07-admin.md, docs/prd/11-store-logo.md
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { CircleCheck, ImageUp, LocateFixed, MapPin, Store as StoreIcon } from "lucide-react";
import { api, type Store } from "@/api/client";
import { authFetch, reloadMe } from "@/auth/session";
import { Enter, reducedMotion, useAppear } from "@/components/motion";
import { BTN, Card, ErrorText, Field, NUM, SectionLabel, Spinner } from "@/components/ui";
import { useApi } from "@/lib/useApi";

export default function StorePage() {
  const { data, reload } = useApi(() => api.GET("/api/stores/me"), "");
  // 저장 횟수(0 이면 알림 없음). StoreForm 은 저장 뒤 다시 읽은 값으로 새로 그려지므로(key) 알림은 여기서 그린다 —
  // 안에 두면 다시 그려질 때 알림이 한 번 더 나타난다
  const [saved, setSaved] = useState(0);
  if (!data) return <Spinner />;
  return (
    <Enter className="space-y-3">
      <LogoCard store={data} onSaved={reload} />
      <StoreForm key={JSON.stringify(data)} store={data} onError={() => setSaved(0)} onSaved={() => { setSaved((n) => n + 1); reload(); }} />
      {/* 저장할 때마다 key 가 바뀌어 다시 나타난다 */}
      {saved > 0 && <SavedNote key={saved} />}
    </Enter>
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
    <Card className="space-y-3">
      <div>
        <SectionLabel icon={StoreIcon}>매장 로고</SectionLabel>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">헤더의 매장 이름 앞에 보여요. PNG·JPG·SVG, 1MB 이하. 가로로 긴 로고가 잘 보여요.</p>
      </div>
      <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-muted/40 bg-background">
        {store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 인증 쿠키로 받는 API 이미지
          <img src={store.logoUrl} alt={`${store.name} 로고`} className="h-10 w-auto max-w-48 object-contain" />
        ) : (
          <span className="text-xs text-muted">로고 없음</span>
        )}
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <label className={`${BTN.secondary} cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
          <ImageUp size={16} aria-hidden /> {store.logoUrl ? "로고 바꾸기" : "로고 올리기"}
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
          <button onClick={remove} disabled={busy} className={BTN.secondary}>지우기</button>
        )}
      </div>
    </Card>
  );
}

function StoreForm({ store, onSaved, onError }: { store: Store; onSaved: () => void; onError: () => void }) {
  const [form, setForm] = useState(store);
  const [error, setError] = useState<string | null>(null);

  const save = async (patch: Partial<Store>) => {
    const { error } = await api.PATCH("/api/stores/me", { body: { name: patch.name, lat: patch.lat, lng: patch.lng, fivePlus: patch.fivePlus } });
    if (error) {
      onError();
      return setError("저장하지 못했어요. 값을 확인해 주세요.");
    }
    setError(null);
    await reloadMe();
    onSaved();
  };

  const pickCurrentLocation = () => {
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => void save({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => {
        onError();
        setError(e.message || "위치를 가져오지 못했어요");
      },
      { enableHighAccuracy: true, timeout: 20_000 },
    );
  };
  const coord = (k: "lat" | "lng") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber });

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <Field label="매장 이름">
          <input value={form.name} maxLength={50} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
        </Field>
        {/* 체크 줄 — 왼쪽 상자 + 글자, 줄 전체가 44px 터치 영역 (B 시안 .check) */}
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[13px] font-medium">
          <input type="checkbox" checked={form.fivePlus} onChange={(e) => setForm({ ...form, fivePlus: e.target.checked })} className="h-[18px] w-[18px] shrink-0 accent-foreground" />
          <span>상시 5인 이상 사업장 (연장근로 50% 가산)</span>
        </label>
      </Card>
      <Card className="space-y-3">
        <div>
          <SectionLabel icon={MapPin}>매장 위치</SectionLabel>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">알바생이 이 위치 50m 안에 들어오면 출근 알림을 받아요.</p>
        </div>
        <button onClick={pickCurrentLocation} className={BTN.secondary}>
          <LocateFixed size={16} aria-hidden /> 현재 위치를 매장으로
        </button>
        <div className="grid grid-cols-2 gap-3">
          <Field label="위도"><input type="number" step={0.000001} value={form.lat ?? ""} onChange={coord("lat")} className={`field ${NUM}`} /></Field>
          <Field label="경도"><input type="number" step={0.000001} value={form.lng ?? ""} onChange={coord("lng")} className={`field ${NUM}`} /></Field>
        </div>
      </Card>
      <ErrorText>{error}</ErrorText>
      <button onClick={() => save(form)} className={`${BTN.primary} w-full`}>저장</button>
    </div>
  );
}

/** 저장 완료 알림 — 아래에서 올라오며 나타나고, 체크 아이콘이 0.5배에서 1배로 톡 커진다 */
function SavedNote() {
  const ref = useAppear<HTMLParagraphElement>();
  const tick = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    // 동작 줄이기면 크기 변화 없이 useAppear 의 투명도 변화만 남긴다
    if (!tick.current || reducedMotion()) return;
    const tween = gsap.fromTo(tick.current, { scale: 0.5 }, { scale: 1, duration: 0.4, ease: "back.out(2.5)", clearProps: "transform" });
    return () => {
      tween.kill();
    };
  }, []);
  return (
    <p ref={ref} className="flex items-center gap-1.5 text-sm font-medium text-accent">
      <span ref={tick} className="inline-flex">
        <CircleCheck size={18} aria-hidden />
      </span>
      저장했어요.
    </p>
  );
}
