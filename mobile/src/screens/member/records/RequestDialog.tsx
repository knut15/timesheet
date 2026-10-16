// 빠진 기록 추가·수정·삭제 요청 대화상자 — 웹 RecordsPanel.tsx 의 RequestDialog·CorrectionForm 의 앱판.
// (2026-10-15 사용자 요청 "빠진기록 요청은 모달팝업으로", "수정 요청도 마찬가지야", "삭제도 마찬가지로")
// 웹의 datetime-local 대신 "YYYY-MM-DD HH:mm" 글자로 받는다 (날짜 고르기 라이브러리를 들이지 않는다).
import { useState } from "react";
import { View } from "react-native";
import { api, errorCode } from "@/api/client";
import { Btn, ErrorText, Field, Input, Sheet } from "@/components/ui";
import { date, time, toLocalInput } from "@/lib/format";
import { C } from "@/theme";
import type { Shift } from "@shared/pay";
import { parseLocalDateTime } from "./parts";

const MESSAGES: Record<string, string> = {
  REQUEST_PENDING: "이 기록에는 이미 대기 중인 요청이 있어요.",
  VALIDATION_FAILED: "퇴근은 출근보다 늦어야 하고, 사유가 필요해요.",
  NOT_FOUND: "기록을 찾을 수 없어요.",
};

export type Form = { mode: "edit" | "delete" | "add"; shift?: Shift };

const DIALOG_TEXT = {
  add: { title: "빠진 기록 추가 요청", desc: () => "출퇴근을 찍지 못한 날의 시각을 적어 주세요. 사장님이 승인하면 기록에 들어가요." },
  edit: { title: "수정 요청", desc: () => "바른 출퇴근 시각과 사유를 적어 주세요. 사장님이 승인하면 기록이 바뀌어요." },
  delete: {
    title: "삭제 요청",
    desc: (s?: Shift) => `${s ? `${date(s.start)} ${time(s.start)} ~ ${s.end ? time(s.end) : "근무 중"} 기록을 ` : ""}지워 달라고 요청해요. 사장님이 승인하면 기록에서 빠져요.`,
  },
} as const;

/** "YYYY-MM-DD HH:mm" — 웹 datetime-local 값의 T 를 띄어쓰기로 */
const toInput = (t: number) => toLocalInput(t).replace("T", " ");

/** form 이 null 이면 닫혀 있고, 닫으면(바깥·뒤로·취소) 폼 상태를 지운다 */
export function RequestDialog({ form, onClose, onChange }: { form: Form | null; onClose: () => void; onChange: () => void }) {
  const text = form ? DIALOG_TEXT[form.mode] : null;
  return (
    <Sheet open={!!text} onClose={onClose} title={text?.title ?? ""} description={text?.desc(form?.shift)}>
      {/* 열 때마다 새 폼 — 이전 입력이 남지 않게 key 로 다시 만든다 */}
      {form && <CorrectionForm key={`${form.mode}-${form.shift?.id ?? ""}`} form={form} onDone={() => (onClose(), onChange())} onCancel={onClose} />}
    </Sheet>
  );
}

function CorrectionForm({ form, onDone, onCancel }: { form: Form; onDone: () => void; onCancel: () => void }) {
  const base = form.shift;
  const [start, setStart] = useState(base ? toInput(base.start) : "");
  const [end, setEnd] = useState(base?.end ? toInput(base.end) : "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    let times = {};
    if (form.mode !== "delete") {
      // 웹은 입력칸(required·datetime-local)이 막는 것 — 앱은 여기서 막는다
      const s = parseLocalDateTime(start);
      const e = parseLocalDateTime(end);
      if (s === null || e === null) return setError("시각을 2026-10-16 09:00 처럼 적어 주세요.");
      times = { start: new Date(s).toISOString(), end: new Date(e).toISOString() };
    }
    if (!reason.trim()) return setError("사유를 적어 주세요.");
    const { error } = await api.POST("/api/corrections", { body: { action: form.mode, shiftId: base?.id, reason, ...times } });
    if (error) return setError(MESSAGES[errorCode(error) ?? ""] ?? "잠시 뒤 다시 시도해 주세요.");
    onDone();
  };

  return (
    <View style={{ gap: 12 }}>
      {form.mode !== "delete" && (
        <View style={{ gap: 8 }}>
          <Field label="바른 출근">
            <Input value={start} onChangeText={setStart} placeholder="YYYY-MM-DD HH:mm" keyboardType="numbers-and-punctuation" autoCapitalize="none" autoCorrect={false} maxLength={16} accessibilityLabel="바른 출근" />
          </Field>
          <Field label="바른 퇴근">
            <Input value={end} onChangeText={setEnd} placeholder="YYYY-MM-DD HH:mm" keyboardType="numbers-and-punctuation" autoCapitalize="none" autoCorrect={false} maxLength={16} accessibilityLabel="바른 퇴근" />
          </Field>
        </View>
      )}
      <Field label="사유">
        <Input value={reason} onChangeText={setReason} maxLength={200} placeholder="예: 퇴근을 깜빡했어요" accessibilityLabel="사유" />
      </Field>
      <ErrorText>{error}</ErrorText>
      {/* 웹 DialogFooter — 위에 선, 취소 · 요청 보내기 */}
      <View style={{ flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 16, marginTop: 4 }}>
        <Btn variant="secondary" label="취소" onPress={onCancel} style={{ flex: 1 }} />
        <Btn variant="primary" label="요청 보내기" onPress={submit} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
