// 멤버의 요청 탭 — 휴가 신청, 대타 요청, 받은 대타 수락·거절, 내 요청 목록. 웹 web/src/components/member/RequestsPanel.tsx 의 앱판. docs/prd/08·09
// 흐름 규칙은 .claude/skills/timesheet-requests/SKILL.md
// 웹의 <input type="date"> 는 "YYYY-MM-DD" 글자 입력으로, <select> 동료 고르기는 동료 버튼 목록으로 바꿨다.
import { useState } from "react";
import { ArrowLeftRight, ClipboardList, Coffee, Plane, Sofa } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { api, errorCode, type Colleague, type MyRequests } from "@/api/client";
import { EmptyState } from "@/components/illust";
import { Enter } from "@/components/motion";
import { Avatar, Bone, Btn, Card, ErrorText, Field, Input, Loading, SectionLabel, StatusPill, T } from "@/components/ui";
import { date, time } from "@/lib/format";
import { C, R } from "@/theme";
import { parseDay } from "@shared/pay";
import { DashedList, isDay, LineBone } from "../records/parts";

const MESSAGES: Record<string, string> = {
  LEAVE_OVERLAP: "이미 신청한 휴가와 날짜가 겹쳐요.",
  VALIDATION_FAILED: "입력값을 확인해 주세요.",
  REQUEST_CLOSED: "이미 처리된 요청이에요.",
  NOT_FOUND: "대상을 찾을 수 없어요.",
};
const msg = (e: unknown) => MESSAGES[errorCode(e) ?? ""] ?? "잠시 뒤 다시 시도해 주세요.";
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
// 웹은 입력칸(required·type="date")이 막는 것 — 앱은 보내기 전에 막는다
const DAY_FORMAT = "날짜를 2026-10-16 처럼 적어 주세요.";
const NEED_REASON = "사유를 적어 주세요.";
const dayInput = { placeholder: "YYYY-MM-DD", keyboardType: "numbers-and-punctuation", autoCapitalize: "none", autoCorrect: false, maxLength: 10 } as const;

export function RequestsPanel({ requests, failed = false, colleagues, onChange }: { requests: MyRequests | null; failed?: boolean; colleagues: Colleague[]; onChange: () => void }) {
  const incoming = (requests?.substitutionsIn ?? []).filter((s) => s.status === "requested");
  return (
    // 카드가 차례로 나타난다
    <Enter>
      {incoming.length > 0 && (
        <Card>
          <SectionLabel tone="title" icon={ArrowLeftRight} right={incoming.length}>받은 대타 요청</SectionLabel>
          <DashedList style={{ marginTop: 4 }}>
            {incoming.map((s) => (
              <IncomingSub key={s.id} sub={s} onChange={onChange} />
            ))}
          </DashedList>
        </Card>
      )}
      <LeaveForm onDone={onChange} />
      <SubstitutionForm colleagues={colleagues} onDone={onChange} />
      {/* 읽기 전(null)이면 목록 자리. 읽기에 실패하면 예전처럼 목록을 숨긴다 */}
      {requests || failed ? <MyList requests={requests} onChange={onChange} /> : <MyListSkeleton />}
    </Enter>
  );
}

function IncomingSub({ sub, onChange }: { sub: MyRequests["substitutionsIn"][number]; onChange: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const act = async (kind: "accept" | "decline") => {
    const { error } = await api.POST(`/api/substitutions/{id}/${kind}`, { params: { path: { id: sub.id } } });
    if (error) return setError(msg(error));
    onChange();
  };
  return (
    <View style={{ paddingVertical: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar name={sub.requesterNickname} seed={sub.requesterId} size="sm" />
        <T size={14} style={{ flex: 1 }}>
          <T size={14} weight="semibold">{sub.requesterNickname}</T>님이 <T size={14} weight="semibold" mono>{date(parseDay(sub.date))}</T> 대타를 부탁했어요
        </T>
      </View>
      <T size={13} color={C.muted} style={{ marginTop: 6 }}>{sub.reason}</T>
      <ErrorText>{error}</ErrorText>
      <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
        <Btn variant="primary" label="수락" onPress={() => act("accept")} style={{ flex: 1 }} />
        <Btn variant="secondary" label="거절" onPress={() => act("decline")} style={{ flex: 1 }} />
      </View>
      <T size={12} color={C.muted} style={{ marginTop: 8 }}>수락하면 사장님이 승인해야 확정돼요.</T>
    </View>
  );
}

function LeaveForm({ onDone }: { onDone: () => void }) {
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const submit = async () => {
    if (!isDay(start) || !isDay(end)) return setError(DAY_FORMAT);
    if (!reason.trim()) return setError(NEED_REASON);
    const { error } = await api.POST("/api/leaves", { body: { startDate: start, endDate: end < start ? start : end, reason } });
    if (error) return setError(msg(error));
    setError(null);
    setReason("");
    setSent(true);
    onDone();
  };
  return (
    <Card>
      <SectionLabel tone="title" icon={Plane}>휴가 신청</SectionLabel>
      <T size={13} color={C.muted} style={{ marginTop: 6, lineHeight: 21 }}>유급·무급은 사장님이 승인하면서 정해요.</T>
      <View style={{ marginTop: 12, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Field label="시작일" style={{ flex: 1 }}><Input {...dayInput} value={start} onChangeText={setStart} accessibilityLabel="시작일" /></Field>
          <Field label="종료일" style={{ flex: 1 }}><Input {...dayInput} value={end} onChangeText={setEnd} accessibilityLabel="종료일" /></Field>
        </View>
        <Field label="사유"><Input value={reason} onChangeText={setReason} maxLength={200} accessibilityLabel="사유" /></Field>
        <ErrorText>{error}</ErrorText>
        {sent && !error && <T size={14} color={C.accent}>신청했어요. 사장님 승인을 기다려요.</T>}
        <Btn variant="primary" label="신청" onPress={submit} full />
      </View>
    </Card>
  );
}

function SubstitutionForm({ colleagues, onDone }: { colleagues: Colleague[]; onDone: () => void }) {
  const [day, setDay] = useState(today());
  const [who, setWho] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  if (colleagues.length === 0) return null;
  const submit = async () => {
    if (!isDay(day)) return setError(DAY_FORMAT);
    if (!who) return setError("대신 나올 동료를 골라 주세요.");
    if (!reason.trim()) return setError(NEED_REASON);
    const { error } = await api.POST("/api/substitutions", { body: { date: day, substituteId: who, reason } });
    if (error) return setError(msg(error));
    setError(null);
    setReason("");
    setSent(true);
    onDone();
  };
  return (
    <Card>
      <SectionLabel tone="title" icon={ArrowLeftRight}>대타 요청</SectionLabel>
      <T size={13} color={C.muted} style={{ marginTop: 6, lineHeight: 21 }}>동료가 수락하고 사장님이 승인하면 그날은 결근으로 세지 않아요.</T>
      <View style={{ marginTop: 12, gap: 12 }}>
        <Field label="날짜"><Input {...dayInput} value={day} onChangeText={setDay} accessibilityLabel="날짜" /></Field>
        {/* 웹 <select> 자리 — 동료마다 버튼 하나, 고른 동료는 진한 테두리 + 굵은 글자 */}
        <Field label="대신 나올 동료">
          <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {colleagues.map((c) => {
              const on = c.userId === who;
              return (
                <Pressable
                  key={c.userId}
                  accessibilityRole="radio"
                  accessibilityLabel={c.nickname}
                  accessibilityState={{ checked: on }}
                  onPress={() => setWho(c.userId)}
                  style={({ pressed }) => [
                    { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 6, paddingRight: 12, borderRadius: R.control, borderWidth: 1, borderColor: on ? C.foreground : C.line, backgroundColor: on ? C.background : C.surface },
                    pressed ? { transform: [{ scale: 0.97 }] } : null,
                  ]}
                >
                  <Avatar name={c.nickname} seed={c.userId} size="sm" />
                  <T size={14} weight={on ? "semibold" : "medium"} color={on ? C.foreground : C.muted}>{c.nickname}</T>
                </Pressable>
              );
            })}
          </View>
        </Field>
        <Field label="사유"><Input value={reason} onChangeText={setReason} maxLength={200} accessibilityLabel="사유" /></Field>
        <ErrorText>{error}</ErrorText>
        {sent && !error && <T size={14} color={C.accent}>요청했어요. 동료의 수락을 기다려요.</T>}
        <Btn variant="secondary" label="요청" onPress={submit} full />
      </View>
    </Card>
  );
}

/** 내 요청 목록을 읽는 동안 — MyList 와 같은 Card·행 틀(위아래 10)에 3행. 행마다 종류(12px)·내용(13px) 줄 자리 막대와 상태 배지(20) 자리 */
function MyListSkeleton() {
  return (
    <Loading>
      <Card>
        <SectionLabel tone="title" icon={ClipboardList} right={<Bone style={{ height: 12, width: 12, borderRadius: 4 }} />}>내 요청</SectionLabel>
        <DashedList style={{ marginTop: 4 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingVertical: 10 }}>
              <View style={{ minWidth: 0 }}>
                <LineBone font={12} h={12} w={56} />
                <View style={{ marginTop: 1 }}><LineBone font={13} h={14} w={160} /></View>
              </View>
              <Bone style={{ height: 20, width: 56, borderRadius: R.pill }} />
            </View>
          ))}
        </DashedList>
      </Card>
    </Loading>
  );
}

type Row = { key: string; kind: string; text: string; status: string; note: string | null; createdAt: string; cancel?: () => Promise<{ error?: unknown }> };

function MyList({ requests, onChange }: { requests: MyRequests | null; onChange: () => void }) {
  const [error, setError] = useState<string | null>(null);
  if (!requests) return null;
  const range = (a: string, b: string) => (a === b ? date(parseDay(a)) : `${date(parseDay(a))} ~ ${date(parseDay(b))}`);
  const rows: Row[] = [
    ...requests.corrections.map((c): Row => ({
      key: c.id,
      kind: { edit: "기록 수정", add: "기록 추가", delete: "기록 삭제" }[c.action],
      text: c.action === "delete" ? `${c.current ? `${date(Date.parse(c.current.start))} ${time(Date.parse(c.current.start))} 기록` : "기록"}` : `${date(Date.parse(c.start!))} ${time(Date.parse(c.start!))} ~ ${time(Date.parse(c.end!))}`,
      status: c.status,
      note: c.reviewNote,
      createdAt: c.createdAt,
      cancel: c.status === "pending" ? () => api.POST("/api/corrections/{id}/cancel", { params: { path: { id: c.id } } }) : undefined,
    })),
    ...requests.leaves.map((l): Row => ({
      key: l.id,
      // 유급 여부는 승인 뒤에만 정해진다 (승인 전 paid = null)
      kind: `휴가${l.paid === null ? "" : l.paid ? " (유급)" : " (무급)"}${l.byMaster ? " · 사장님 등록" : ""}`,
      text: range(l.startDate, l.endDate),
      status: l.status,
      note: l.reviewNote,
      createdAt: l.createdAt,
      cancel: l.status === "pending" && !l.byMaster ? () => api.POST("/api/leaves/{id}/cancel", { params: { path: { id: l.id } } }) : undefined,
    })),
    ...requests.substitutionsOut.map((s): Row => ({
      key: s.id,
      kind: "대타 요청",
      text: `${date(parseDay(s.date))} · ${s.substituteNickname}님`,
      status: s.status,
      note: s.reviewNote,
      createdAt: s.createdAt,
      cancel: s.status === "requested" || s.status === "accepted" ? () => api.POST("/api/substitutions/{id}/cancel", { params: { path: { id: s.id } } }) : undefined,
    })),
    ...requests.substitutionsIn
      .filter((s) => s.status !== "requested")
      .map((s): Row => ({ key: s.id, kind: "대타 (내가 대신)", text: `${date(parseDay(s.date))} · ${s.requesterNickname}님 대신`, status: s.status, note: s.reviewNote, createdAt: s.createdAt })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Card>
      <SectionLabel tone="title" icon={ClipboardList} right={rows.length}>내 요청</SectionLabel>
      <ErrorText>{error}</ErrorText>
      {rows.length === 0 ? (
        // 화면의 주 빈 상태라 장면 일러스트를 둔다
        <EmptyState icon={Sofa} accents={[{ icon: Coffee, at: "br" }]} title="아직 요청이 없어요.">
          기록이 틀렸거나 쉬어야 하는 날이 있으면 위에서 요청하세요.
        </EmptyState>
      ) : (
        <DashedList style={{ marginTop: 4 }}>
          {rows.map((r) => (
            <View key={r.key} style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingVertical: 10 }}>
              <View style={{ minWidth: 0, flexShrink: 1 }}>
                <T size={12} color={C.muted}>{r.kind}</T>
                <T size={13} weight="medium" mono style={{ marginTop: 1 }}>{r.text}</T>
                {r.note && <T size={12} color={C.muted} style={{ marginTop: 2 }}>사장님: {r.note}</T>}
              </View>
              <View style={{ flexShrink: 0, alignItems: "flex-end", gap: 6 }}>
                <StatusPill status={r.status} />
                {r.cancel && (
                  // 목록 안 보조 동작이라 작은 버튼(32)
                  <Btn
                    variant="small"
                    label="취소"
                    onPress={async () => {
                      const { error } = await r.cancel!();
                      if (error) setError(msg(error));
                      onChange();
                    }}
                  />
                )}
              </View>
            </View>
          ))}
        </DashedList>
      )}
    </Card>
  );
}
