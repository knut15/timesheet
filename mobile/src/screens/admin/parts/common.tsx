// 사장 화면들이 같이 쓰는 작은 부품 — 공통 기반(ui.tsx)에 없는 것만 여기 둔다.
// 점선 구분선, 체크 줄, 확인 대화상자, 고르기 버튼 목록, 날짜·시각 입력 검사, 하위 화면 머리.
import { useRouter } from "expo-router";
import { Check as CheckIcon, LogOut } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { logout, useSession } from "@/auth/session";
import { AppHeader, SubHeader } from "@/components/shell";
import { Btn, IconButton, Sheet, T } from "@/components/ui";
import { C, R } from "@/theme";

/**
 * 점선 가로줄 — 웹 `border-b border-dashed border-line`. iOS 는 한쪽 테두리만 점선으로 그리지 못해
 * 높이 1 칸 안에 네 변 점선 상자를 넣고 아랫부분을 잘라 윗변만 보이게 한다.
 */
export function Dash({ color = C.line }: { color?: string }) {
  return (
    <View style={{ height: 1, overflow: "hidden" }}>
      <View style={{ height: 2, borderWidth: 1, borderStyle: "dashed", borderColor: color }} />
    </View>
  );
}

/** 점선 세로줄 — 휴가·대타로 쉰 줄의 왼쪽 표시 (웹 `border-l-2 border-dashed border-l-muted`) */
export function DashLeft({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width: 2, overflow: "hidden", alignSelf: "stretch" }, style]}>
      <View style={{ flex: 1, width: 4, borderWidth: 2, borderStyle: "dashed", borderColor: C.muted }} />
    </View>
  );
}

/** 점선으로 나뉜 목록 — 마지막 줄 아래에는 선이 없다 (웹 `last:border-b-0`) */
export function DashedList<I>({ items, keyOf, render, style }: { items: I[]; keyOf: (i: I) => string; render: (i: I) => React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      {items.map((i, n) => (
        <View key={keyOf(i)}>
          {render(i)}
          {n < items.length - 1 && <Dash />}
        </View>
      ))}
    </View>
  );
}

/** 목록 한 줄의 모양 — 웹 ROW(`flex items-center gap-2.5 py-2.5 text-[13px]`) */
export const ROW: ViewStyle = { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 };

/** 체크 줄 — 왼쪽 18px 상자 + 글자, 줄 전체가 44px 누르는 자리 (웹 CHECK) */
export function Check({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} accessibilityLabel={label} onPress={() => onChange(!value)} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ height: 18, width: 18, borderRadius: 4, borderWidth: 1, borderColor: value ? C.foreground : C.muted, backgroundColor: value ? C.foreground : "transparent", alignItems: "center", justifyContent: "center" }}>
        {value && <CheckIcon size={13} strokeWidth={3} color={C.background} />}
      </View>
      <T size={13} weight="medium" style={{ flexShrink: 1 }}>{label}</T>
    </Pressable>
  );
}

/**
 * 확인 대화상자 — 웹 window.confirm 자리. 아래 버튼은 취소 · 확인 순서 (조건 수정 모달과 같은 순서).
 * 확인을 누르면 onConfirm 이 끝날 때까지 버튼을 막고, 끝나면 닫는다.
 */
export function ConfirmSheet({ open, onClose, title, description, confirmLabel, onConfirm }: { open: boolean; onClose: () => void; title: string; description?: string; confirmLabel: string; onConfirm: () => Promise<unknown> }) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title={title} description={description}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Btn variant="secondary" label="취소" onPress={onClose} style={{ flex: 1 }} />
        <Btn
          variant="primary"
          label={confirmLabel}
          disabled={busy}
          style={{ flex: 1 }}
          onPress={async () => {
            setBusy(true);
            await onConfirm();
            setBusy(false);
            onClose();
          }}
        />
      </View>
    </Sheet>
  );
}

/**
 * 하나 고르기 — 웹 <select> 자리. 앱에는 select 가 없어 고를 것을 버튼으로 늘어놓는다 (넘치면 다음 줄로).
 * 고른 것은 진한 바탕 (근무 요일 버튼과 같은 모양).
 */
export function Choice<V extends string>({ value, options, onChange }: { value: V | ""; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => [
              { minHeight: 44, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", borderRadius: R.control, borderWidth: 1, borderColor: on ? C.foreground : C.line, backgroundColor: on ? C.foreground : C.surface },
              pressed ? { transform: [{ scale: 0.97 }] } : null,
            ]}
          >
            <T size={13} weight="semibold" color={on ? C.background : C.muted}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── 날짜·시각 입력 ─────────────────────────────────────
// 앱에는 웹 <input type="date"/"time"/"datetime-local"> 이 없다. 고르는 라이브러리를 들이지 않고 글자로 쓰게 한 뒤 형식을 검사한다.

/** 기기 시간대의 오늘 "YYYY-MM-DD" (웹 requests/page.tsx today()) */
export const todayInput = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

/** "YYYY-MM-DD" 이고 실제로 있는 날짜인가 */
export function isDay(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]);
}

/** "HH:MM" 이고 30분 단위인가 — 웹 TIME_OPTIONS(00:00~23:30) 중 하나 */
export const isHalfHour = (v: string) => /^([01]\d|2[0-3]):(00|30)$/.test(v);

/** "YYYY-MM-DD HH:MM" (기기 시간대) → 밀리초. 형식이 틀리면 NaN. 웹 datetime-local 의 "T" 도 받는다 */
export function parseLocal(v: string) {
  const m = /^(\d{4}-\d{2}-\d{2})[ T]([01]\d|2[0-3]):([0-5]\d)$/.exec(v.trim());
  if (!m || !isDay(m[1]!)) return NaN;
  const [y, mo, d] = m[1]!.split("-").map(Number);
  return new Date(y!, mo! - 1, d!, Number(m[2]), Number(m[3])).getTime();
}

/** 밀리초 → "YYYY-MM-DD HH:MM" (기기 시간대) */
export const toLocalText = (t: number) => new Date(t - new Date(t).getTimezoneOffset() * 60_000).toISOString().slice(0, 16).replace("T", " ");

// ── 주휴 상태 ─────────────────────────────────────────

// ── 하위 화면 틀 ──────────────────────────────────────
/**
 * 멤버 탭 안의 하위 화면(근무 기록·초대 코드) 머리. 탭 밖(스택)이라 탭 레이아웃의 헤더가 없다 —
 * 웹 admin/layout.tsx 처럼 헤더에 "멤버 ›" 브레드크럼, 아래 띠에 "멤버 목록" 뒤로 가기.
 */
export function SubPage({ title, children }: { title: string; children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  if (session.status !== "authenticated" || !session.me.membership) return null;
  const { user, membership } = session.me;
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <AppHeader
        eyebrow={membership.store.logoUrl ? "사장님" : `${membership.store.name} · 사장님`}
        title={title}
        crumbs={[{ label: "멤버", href: "/admin/members" }]}
        me={user}
        logoUrl={membership.store.logoUrl}
        logoAlt={membership.store.name}
        actions={<IconButton icon={LogOut} label="로그아웃" onPress={() => logout()} />}
      />
      <SubHeader backLabel="멤버 목록" onBack={router.back} />
      {children}
    </View>
  );
}
