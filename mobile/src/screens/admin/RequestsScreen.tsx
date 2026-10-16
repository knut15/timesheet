// 마스터 요청 화면 — 기록 수정 요청 승인·거절, 휴가·대타 승인·거절, 직접 등록·삭제. 웹 web/src/app/admin/requests/page.tsx 의 앱판.
// docs/prd/08·09, 흐름 규칙은 .claude/skills/timesheet-requests/SKILL.md
import { ArrowLeftRight, ListChecks, PartyPopper, Plane } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { api, errorCode, type Correction, type LeaveReq, type Member, type Substitution } from "@/api/client";
import { EmptyState } from "@/components/illust";
import { Enter } from "@/components/motion";
import { Screen } from "@/components/shell";
import { Avatar, Btn, Card, ErrorText, Field, Input, SectionLabel, StatusPill, T } from "@/components/ui";
import { date, time } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { C, F } from "@/theme";
import { parseDay } from "@shared/pay";
import { Check, Choice, ConfirmSheet, Dash, isDay, ROW, todayInput } from "./parts/common";
import { RequestsSkeleton } from "./parts/skeletons";

const MESSAGES: Record<string, string> = {
  REQUEST_CLOSED: "이미 처리된 요청이에요.",
  ALREADY_CLOCKED_IN: "근무 중인 기록이 이미 있어 반영할 수 없어요.",
  NOT_FOUND: "대상 기록이 없어요. 요청을 거절해 주세요.",
  LEAVE_OVERLAP: "그 멤버의 다른 휴가와 날짜가 겹쳐요.",
  SUBSTITUTE_NOT_ACCEPTED: "대타 동료가 아직 수락하지 않았어요.",
  VALIDATION_FAILED: "입력값을 확인해 주세요.",
};
const msg = (e: unknown) => MESSAGES[errorCode(e) ?? ""] ?? "잠시 뒤 다시 시도해 주세요.";
const span = (s: string, e: string | null) => `${date(Date.parse(s))} ${time(Date.parse(s))} ~ ${e ? time(Date.parse(e)) : "근무 중"}`;
const range = (a: string, b: string) => (a === b ? date(parseDay(a)) : `${date(parseDay(a))} ~ ${date(parseDay(b))}`);
/** 앱은 날짜를 글자로 쓴다 — 형식이 틀리면 보내기 전에 알려 준다 (웹은 날짜 고르기 칸이라 이 오류가 없다) */
const DAY_FORMAT = "날짜는 2026-10-16 처럼 써 주세요.";

export function RequestsScreen() {
  const req = useApi(() => api.GET("/api/stores/me/requests"), "");
  const members = useApi(() => api.GET("/api/stores/me/members"), "");
  const refresh = () => {
    req.reload();
    members.reload();
  };
  if (!req.data || !members.data)
    return (
      <Screen>
        <RequestsSkeleton />
      </Screen>
    );
  const { corrections, leaves, substitutions } = req.data;
  const team = members.data.filter((m) => m.role === "member");
  const reload = req.reload;

  const pendingC = corrections.filter((c) => c.status === "pending");
  const pendingL = leaves.filter((l) => l.status === "pending");
  const waitingS = substitutions.filter((s) => s.status === "accepted" || s.status === "requested");
  const confirmedL = leaves.filter((l) => l.status === "approved");
  const confirmedS = substitutions.filter((s) => s.status === "approved");
  const closed = [
    ...corrections.filter((c) => c.status !== "pending").map((c) => ({ id: c.id, at: c.reviewedAt ?? c.createdAt, who: c.nickname, seed: c.userId, text: `기록 ${{ edit: "수정", add: "추가", delete: "삭제" }[c.action]}`, status: c.status })),
    ...leaves.filter((l) => l.status === "rejected" || l.status === "canceled").map((l) => ({ id: l.id, at: l.createdAt, who: l.nickname, seed: l.userId, text: `휴가 ${range(l.startDate, l.endDate)}`, status: l.status })),
    ...substitutions.filter((s) => ["declined", "rejected", "canceled"].includes(s.status)).map((s) => ({ id: s.id, at: s.createdAt, who: s.requesterNickname, seed: s.requesterId, text: `대타 ${date(parseDay(s.date))} → ${s.substituteNickname}`, status: s.status })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 20);

  const waiting = pendingC.length + pendingL.length + waitingS.length;
  const confirmedCount = confirmedL.length + confirmedS.length;

  return (
    <Screen onRefresh={refresh}>
      <Enter gap={24}>
        <View style={{ gap: 8 }}>
          <Head index="01" right={`${waiting}건`}>처리할 요청</Head>
          {waiting === 0 && (
            <Card>
              <EmptyState icon={ListChecks} accents={[{ icon: PartyPopper, at: "tr" }]} title="대기 중인 요청이 없어요.">
                멤버가 기록 수정·휴가·대타를 요청하면 여기에 모여요.
              </EmptyState>
            </Card>
          )}
          {pendingC.map((c) => <CorrectionCard key={c.id} c={c} onDone={reload} />)}
          {pendingL.map((l) => <LeaveCard key={l.id} l={l} onDone={reload} />)}
          {waitingS.map((s) => <SubCard key={s.id} s={s} onDone={reload} />)}
        </View>

        <View style={{ gap: 8 }}>
          <Head index="02">직접 등록</Head>
          {team.length === 0 ? (
            <Card>
              <T size={14} color={C.muted}>멤버가 있어야 등록할 수 있어요.</T>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              <DirectLeave team={team} onDone={reload} />
              {team.length >= 2 && <DirectSub team={team} onDone={reload} />}
            </View>
          )}
        </View>

        <View style={{ gap: 8 }}>
          <Head index="03" right={confirmedCount}>확정된 휴가·대타</Head>
          <Card style={{ paddingVertical: 6 }}>
            {confirmedCount === 0 ? (
              <T size={14} color={C.muted} style={{ paddingVertical: 10 }}>없어요.</T>
            ) : (
              <View>
                {confirmedL.map((l, i) => (
                  <View key={l.id}>
                    <ConfirmedRow seed={l.userId} who={l.nickname} text={`휴가 ${range(l.startDate, l.endDate)}`} sub={`${l.paid ? "유급" : "무급"}${l.byMaster ? " · 직접 등록" : ""}`}
                      onDelete={() => api.DELETE("/api/stores/me/leaves/{id}", { params: { path: { id: l.id } } })} onDone={reload} />
                    {(i < confirmedL.length - 1 || confirmedS.length > 0) && <Dash />}
                  </View>
                ))}
                {confirmedS.map((s, i) => (
                  <View key={s.id}>
                    <ConfirmedRow seed={s.requesterId} who={s.requesterNickname} text={`대타 ${date(parseDay(s.date))} → ${s.substituteNickname}님이 근무`}
                      onDelete={() => api.DELETE("/api/stores/me/substitutions/{id}", { params: { path: { id: s.id } } })} onDone={reload} />
                    {i < confirmedS.length - 1 && <Dash />}
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>

        {closed.length > 0 && (
          <View style={{ gap: 8 }}>
            <Head index="04">최근 처리</Head>
            <Card style={{ paddingVertical: 6 }}>
              {closed.map((r, i) => (
                <View key={r.id}>
                  <View style={ROW}>
                    <Avatar name={r.who} seed={r.seed} size="sm" />
                    <T size={13} numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>{`${r.who} · ${r.text}`}</T>
                    <StatusPill status={r.status} />
                  </View>
                  {i < closed.length - 1 && <Dash />}
                </View>
              ))}
            </Card>
          </View>
        )}
      </Enter>
    </Screen>
  );
}

function Head({ index, right, children }: { index: string; right?: React.ReactNode; children: string }) {
  return (
    <View style={{ paddingHorizontal: 4 }}>
      <SectionLabel index={index} right={right}>{children}</SectionLabel>
    </View>
  );
}

function Who({ name, seed, kind }: { name: string; seed: string; kind: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Avatar name={name} seed={seed} size="sm" />
      <T size={14} style={{ flexShrink: 1 }}>
        <T size={14} weight="semibold">{name}</T>
        <T size={14} color={C.muted}>{` · ${kind}`}</T>
      </T>
    </View>
  );
}

/** 승인·거절 버튼과 거절 메모. */
function Review({ onApprove, onReject, onDone, approveLabel = "승인", canApprove = true }: {
  onApprove: () => Promise<{ error?: unknown }>;
  onReject: (note: string) => Promise<{ error?: unknown }>;
  onDone: () => void;
  approveLabel?: string;
  canApprove?: boolean;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (f: () => Promise<{ error?: unknown }>) => {
    setBusy(true);
    const { error } = await f();
    setBusy(false);
    if (error) return setError(msg(error));
    onDone();
  };
  return (
    <View style={{ marginTop: 12, gap: 8 }}>
      <Input value={note} onChangeText={setNote} maxLength={200} placeholder="메모 (거절 사유 등, 선택)" />
      <ErrorText>{error}</ErrorText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {canApprove && <Btn variant="primary" label={approveLabel} disabled={busy} onPress={() => run(onApprove)} style={{ flex: 1 }} />}
        <Btn variant="secondary" label="거절" disabled={busy} onPress={() => run(() => onReject(note))} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

/** 이름·값 두 칸 줄 (웹 dl grid-cols-[3.5rem_1fr]) */
function Pair({ term, children, strong = false, mono = false }: { term: string; children: string; strong?: boolean; mono?: boolean }) {
  return (
    <View style={{ flexDirection: "row" }}>
      <T size={13} color={C.muted} style={{ width: 56 }}>{term}</T>
      <T size={13} mono={mono} weight={strong ? "semibold" : "regular"} style={{ flex: 1 }}>{children}</T>
    </View>
  );
}

function CorrectionCard({ c, onDone }: { c: Correction; onDone: () => void }) {
  const kind = { edit: "기록 수정 요청", add: "기록 추가 요청", delete: "기록 삭제 요청" }[c.action];
  return (
    <Card>
      <Who name={c.nickname} seed={c.userId} kind={kind} />
      <View style={{ marginTop: 12, gap: 6 }}>
        {c.current && <Pair term="지금" mono>{span(c.current.start, c.current.end)}</Pair>}
        {c.action !== "delete" && <Pair term="요청" mono strong>{span(c.start!, c.end)}</Pair>}
        <Pair term="사유">{c.reason}</Pair>
      </View>
      <Review
        approveLabel={c.action === "delete" ? "승인 (기록 삭제)" : "승인 (기록에 반영)"}
        onApprove={() => api.POST("/api/stores/me/corrections/{id}/approve", { params: { path: { id: c.id } }, body: {} })}
        onReject={(note) => api.POST("/api/stores/me/corrections/{id}/reject", { params: { path: { id: c.id } }, body: { note: note || undefined } })}
        onDone={onDone}
      />
    </Card>
  );
}

function LeaveCard({ l, onDone }: { l: LeaveReq; onDone: () => void }) {
  // 멤버는 유급 여부를 고르지 않는다. 사장님이 여기서 정한다 (기본 무급 — 체크해야 유급)
  const [paid, setPaid] = useState(false);
  return (
    <Card>
      <Who name={l.nickname} seed={l.userId} kind="휴가 신청" />
      <T size={14} mono weight="semibold" style={{ marginTop: 12 }}>{range(l.startDate, l.endDate)}</T>
      <T size={13} color={C.muted} style={{ marginTop: 2 }}>{l.reason}</T>
      <View style={{ marginTop: 8 }}>
        <Check value={paid} onChange={setPaid} label="유급 휴가로 승인 (체크 안 하면 무급)" />
      </View>
      <Review
        onApprove={() => api.POST("/api/stores/me/leaves/{id}/approve", { params: { path: { id: l.id } }, body: { paid } })}
        onReject={(note) => api.POST("/api/stores/me/leaves/{id}/reject", { params: { path: { id: l.id } }, body: { note: note || undefined } })}
        onDone={onDone}
      />
    </Card>
  );
}

function SubCard({ s, onDone }: { s: Substitution; onDone: () => void }) {
  const waiting = s.status === "requested";
  return (
    <Card>
      <Who name={s.requesterNickname} seed={s.requesterId} kind="대타 요청" />
      <T size={14} style={{ marginTop: 12 }}>
        <T size={14} mono weight="semibold">{date(parseDay(s.date))}</T>
        {" → "}
        <T size={14} weight="semibold">{s.substituteNickname}</T>
        님이 대신 근무
      </T>
      <T size={13} color={C.muted} style={{ marginTop: 2 }}>{s.reason}</T>
      <View style={{ marginTop: 8 }}>
        <StatusPill status={s.status} />
      </View>
      <Review
        canApprove={!waiting}
        onApprove={() => api.POST("/api/stores/me/substitutions/{id}/approve", { params: { path: { id: s.id } }, body: {} })}
        onReject={(note) => api.POST("/api/stores/me/substitutions/{id}/reject", { params: { path: { id: s.id } }, body: { note: note || undefined } })}
        onDone={onDone}
      />
      {waiting && <T size={12} color={C.muted} style={{ marginTop: 8 }}>동료가 수락하면 승인할 수 있어요.</T>}
    </Card>
  );
}

/** 멤버 고르기 — 웹 <select> 자리. 이름 버튼을 늘어놓는다 */
function MemberSelect({ team, value, onChange, label }: { team: Member[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <Field label={label}>
      <Choice value={value} options={team.map((m) => ({ value: m.userId, label: m.nickname }))} onChange={onChange} />
    </Field>
  );
}

/** 날짜 칸 — "YYYY-MM-DD" 를 글자로 쓴다 */
function DayInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <Input value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={10} style={{ fontFamily: F.mono }} />;
}

function DirectLeave({ team, onDone }: { team: Member[]; onDone: () => void }) {
  const [who, setWho] = useState("");
  const [start, setStart] = useState(todayInput());
  const [end, setEnd] = useState(todayInput());
  const [paid, setPaid] = useState(true);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    // 웹 form 의 required·min 검사 자리
    if (!who) return setError("멤버를 골라 주세요.");
    if (!isDay(start) || !isDay(end)) return setError(DAY_FORMAT);
    if (end < start) return setError("종료일은 시작일과 같거나 뒤여야 해요.");
    if (!reason.trim()) return setError("사유를 써 주세요.");
    const { error } = await api.POST("/api/stores/me/leaves", { body: { userId: who, startDate: start, endDate: end < start ? start : end, paid, reason } });
    if (error) return setError(msg(error));
    setError(null);
    setReason("");
    onDone();
  };
  return (
    <Card>
      <SectionLabel icon={Plane}>휴가 등록</SectionLabel>
      <View style={{ marginTop: 12, gap: 12 }}>
        <MemberSelect team={team} value={who} onChange={setWho} label="멤버" />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Field label="시작일" style={{ flex: 1 }}><DayInput value={start} onChange={setStart} /></Field>
          <Field label="종료일" style={{ flex: 1 }}><DayInput value={end} onChange={setEnd} /></Field>
        </View>
        <Check value={paid} onChange={setPaid} label="유급 휴가" />
        <Field label="사유"><Input maxLength={200} value={reason} onChangeText={setReason} /></Field>
        <ErrorText>{error}</ErrorText>
        <Btn variant="primary" label="등록 (바로 확정)" onPress={submit} full />
      </View>
    </Card>
  );
}

function DirectSub({ team, onDone }: { team: Member[]; onDone: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [day, setDay] = useState(todayInput());
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (!from || !to) return setError("쉬는 멤버와 대신 나올 멤버를 골라 주세요.");
    if (!isDay(day)) return setError(DAY_FORMAT);
    if (!reason.trim()) return setError("사유를 써 주세요.");
    const { error } = await api.POST("/api/stores/me/substitutions", { body: { requesterId: from, substituteId: to, date: day, reason } });
    if (error) return setError(from === to ? "쉬는 사람과 대신 나올 사람이 같아요." : msg(error));
    setError(null);
    setReason("");
    onDone();
  };
  return (
    <Card>
      <SectionLabel icon={ArrowLeftRight}>대타 등록</SectionLabel>
      <View style={{ marginTop: 12, gap: 12 }}>
        {/* 웹은 두 칸 나란히 — 앱은 이름 버튼 목록이라 위아래로 */}
        <MemberSelect team={team} value={from} onChange={setFrom} label="쉬는 멤버" />
        <MemberSelect team={team} value={to} onChange={setTo} label="대신 나올 멤버" />
        <Field label="날짜"><DayInput value={day} onChange={setDay} /></Field>
        <Field label="사유"><Input maxLength={200} value={reason} onChangeText={setReason} /></Field>
        <ErrorText>{error}</ErrorText>
        <Btn variant="secondary" label="등록 (바로 확정)" onPress={submit} full />
      </View>
    </Card>
  );
}

function ConfirmedRow({ seed, who, text, sub, onDelete, onDone }: { seed: string; who: string; text: string; sub?: string; onDelete: () => Promise<{ error?: unknown }>; onDone: () => void }) {
  const [asking, setAsking] = useState(false);
  return (
    <View style={ROW}>
      <Avatar name={who} seed={seed} size="sm" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T size={13} numberOfLines={1}>{`${who} · ${text}`}</T>
        {sub && <T size={12} color={C.muted}>{sub}</T>}
      </View>
      <Btn variant="danger" label="삭제" onPress={() => setAsking(true)} />
      <ConfirmSheet
        open={asking}
        onClose={() => setAsking(false)}
        title="이 휴가·대타를 지울까요?"
        description="급여 계산에서 빠져요."
        confirmLabel="삭제"
        onConfirm={async () => {
          await onDelete();
          onDone();
        }}
      />
    </View>
  );
}
