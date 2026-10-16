// 매장 설정 — 로고·이름·위치·5인 이상. 웹 web/src/app/admin/store/page.tsx 의 앱판. docs/prd/07-admin.md, docs/prd/11-store-logo.md
// 로고는 사진 보관함에서 골라 올린다(expo-image-picker, 2026-10-16 사용자 승인). 파일 바이트를 그대로 PUT — 서버가 첫 바이트로 형식을 다시 확인한다 (docs/prd/11).
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { CircleCheck, ImageUp, LocateFixed, MapPin, Store as StoreIcon } from "lucide-react-native";
import { useState } from "react";
import { Image, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { api, type Store } from "@/api/client";
import { API_URL, authHeaders, nativeFetch, reloadMe } from "@/auth/session";
import { Appear, Enter } from "@/components/motion";
import { Screen } from "@/components/shell";
import { Btn, Card, ErrorText, Field, Input, SectionLabel, T } from "@/components/ui";
import { useApi } from "@/lib/useApi";
import { C, F, R, alpha } from "@/theme";
import { Check, ConfirmSheet } from "./parts/common";
import { FIVE_PLUS_LABEL, LOCATION_NOTE, LOGO_NOTE, StoreSkeleton } from "./parts/skeletons";

export function StoreScreen() {
  const { data, reload } = useApi(() => api.GET("/api/stores/me"), "");
  // 저장 횟수(0 이면 알림 없음). StoreForm 은 저장 뒤 다시 읽은 값으로 새로 그려지므로(key) 알림은 여기서 그린다
  const [saved, setSaved] = useState(0);
  if (!data)
    return (
      <Screen>
        <StoreSkeleton />
      </Screen>
    );
  return (
    <Screen onRefresh={reload}>
      <Enter>
        <LogoCard store={data} onSaved={reload} />
        <StoreForm key={JSON.stringify(data)} store={data} onError={() => setSaved(0)} onSaved={() => { setSaved((n) => n + 1); reload(); }} />
        {/* 저장할 때마다 key 가 바뀌어 다시 나타난다 */}
        {saved > 0 && <SavedNote key={saved} />}
      </Enter>
    </Screen>
  );
}

const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const LOGO_MAX = 1024 * 1024;
const LOGO_MESSAGES: Record<string, string> = {
  LOGO_INVALID: "PNG·JPG·SVG 파일만 올릴 수 있어요. SVG 는 스크립트나 외부 링크가 없어야 해요.",
  PAYLOAD_TOO_LARGE: "1MB 이하 파일만 올릴 수 있어요.",
};

/** 로고 올리기·바꾸기·지우기 (웹 LogoCard 와 같은 문구). 로고 그림은 인증 헤더를 실어 받는다 */
function LogoCard({ store, onSaved }: { store: Store; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const done = async (res: Response) => {
    setBusy(false);
    if (!res.ok) {
      const code = ((await res.json().catch(() => null)) as { code?: string } | null)?.code;
      return setError(LOGO_MESSAGES[code ?? ""] ?? "올리지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
    setError(null);
    await reloadMe(); // 헤더의 로고가 바로 바뀐다
    onSaved();
  };

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
    const a = r.canceled ? undefined : r.assets[0];
    if (!a) return;
    const type = a.mimeType ?? "";
    // 서버 검사 전에 흔한 실수만 먼저 알려 준다
    if (!LOGO_TYPES.includes(type)) return setError(LOGO_MESSAGES.LOGO_INVALID!);
    if (a.fileSize && a.fileSize > LOGO_MAX) return setError(LOGO_MESSAGES.PAYLOAD_TOO_LARGE!);
    setBusy(true);
    try {
      const blob = await (await fetch(a.uri)).blob();
      await done(await nativeFetch(new Request(`${API_URL}/api/stores/me/logo`, { method: "PUT", body: blob, headers: { "Content-Type": type } })));
    } catch {
      setBusy(false);
      setError("올리지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
  };

  return (
    <Card style={{ gap: 12 }}>
      <View>
        <SectionLabel icon={StoreIcon}>매장 로고</SectionLabel>
        <T size={12} color={C.muted} style={{ marginTop: 6, lineHeight: 19 }}>{LOGO_NOTE}</T>
      </View>
      <View style={{ height: 64, alignItems: "center", justifyContent: "center", borderRadius: R.control, borderWidth: 1, borderStyle: "dashed", borderColor: alpha(C.muted, 0.4), backgroundColor: C.background }}>
        {store.logoUrl ? (
          <Image accessibilityLabel={`${store.name} 로고`} source={{ uri: API_URL + store.logoUrl, headers: authHeaders() }} style={{ height: 40, width: 192 }} resizeMode="contain" />
        ) : (
          <T size={12} color={C.muted}>로고 없음</T>
        )}
      </View>
      <ErrorText>{error}</ErrorText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Btn icon={ImageUp} label={store.logoUrl ? "로고 바꾸기" : "로고 올리기"} disabled={busy} onPress={pick} />
        {store.logoUrl && <Btn label="지우기" disabled={busy} onPress={() => setConfirm(true)} />}
      </View>
      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="로고를 지울까요?"
        description="헤더에는 매장 이름만 남아요."
        confirmLabel="지우기"
        onConfirm={async () => {
          setBusy(true);
          await done(await nativeFetch(new Request(`${API_URL}/api/stores/me/logo`, { method: "DELETE" })));
        }}
      />
    </Card>
  );
}

const num = (v: string) => {
  const n = Number(v);
  return v.trim() === "" || Number.isNaN(n) ? null : n;
};

function StoreForm({ store, onSaved, onError }: { store: Store; onSaved: () => void; onError: () => void }) {
  const [form, setForm] = useState(store);
  // 위도·경도는 쓰는 중인 글자("37." 등)를 그대로 둔다. 저장할 때 숫자로 (웹 valueAsNumber — 숫자가 아니면 null)
  const [lat, setLat] = useState(store.lat == null ? "" : String(store.lat));
  const [lng, setLng] = useState(store.lng == null ? "" : String(store.lng));
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

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

  const pickCurrentLocation = async () => {
    setError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        onError();
        return setError("위치 권한이 없어 위치를 가져오지 못했어요");
      }
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await save({ lat: p.coords.latitude, lng: p.coords.longitude });
    } catch (e) {
      onError();
      setError((e as Error | undefined)?.message || "위치를 가져오지 못했어요");
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 12 }}>
        <Field label="매장 이름">
          <Input value={form.name} maxLength={50} onChangeText={(name) => setForm({ ...form, name })} />
        </Field>
        <Check value={form.fivePlus} onChange={(fivePlus) => setForm({ ...form, fivePlus })} label={FIVE_PLUS_LABEL} />
      </Card>
      <Card style={{ gap: 12 }}>
        <View>
          <SectionLabel icon={MapPin}>매장 위치</SectionLabel>
          <T size={12} color={C.muted} style={{ marginTop: 6, lineHeight: 19 }}>{LOCATION_NOTE}</T>
        </View>
        <Btn variant="secondary" icon={LocateFixed} label="현재 위치를 매장으로" onPress={pickCurrentLocation} disabled={locating} style={{ alignSelf: "flex-start" }} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Field label="위도" style={{ flex: 1 }}>
            <Input keyboardType="numbers-and-punctuation" value={lat} onChangeText={setLat} style={{ fontFamily: F.mono }} />
          </Field>
          <Field label="경도" style={{ flex: 1 }}>
            <Input keyboardType="numbers-and-punctuation" value={lng} onChangeText={setLng} style={{ fontFamily: F.mono }} />
          </Field>
        </View>
      </Card>
      <ErrorText>{error}</ErrorText>
      <Btn variant="primary" label="저장" onPress={() => save({ ...form, lat: num(lat), lng: num(lng) })} full />
    </View>
  );
}

/** 저장 완료 알림 — 아래에서 올라오며 나타나고, 체크 아이콘이 톡 커진다 (동작 줄이기면 Reanimated 가 건너뛴다) */
function SavedNote() {
  return (
    <Appear style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Animated.View entering={ZoomIn.springify().damping(10)}>
        <CircleCheck size={18} color={C.accent} />
      </Animated.View>
      <T size={14} weight="medium" color={C.accent} accessibilityLiveRegion="polite">저장했어요.</T>
    </Appear>
  );
}
