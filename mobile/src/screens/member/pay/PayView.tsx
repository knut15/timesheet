// 월 급여 요약과 주별 내역. 웹 web/src/components/PayView.tsx 의 앱판. 계산은 @shared/pay(웹 pay.ts)에만 있다.
// 마스터의 멤버 상세 화면도 같은 모양이면 이것을 import 해서 쓴다.
import { useMemo } from "react";
import { CalendarDays, PiggyBank } from "lucide-react-native";
import { View } from "react-native";
import { CountUp, Enter } from "@/components/motion";
import { Bone, Card, DotRow, Loading, SectionLabel, T } from "@/components/ui";
import { hm, won } from "@/lib/format";
import { C } from "@/theme";
import { computeMonth, computeWeeks, type Absence, type PaySettings, type Shift, type WeekPay } from "@shared/pay";
import { LineBone, SectionLabelBone } from "../records/parts";

/** 점선 줄의 값 — 웹 dd: 기본 굵게, muted 면 보통 굵기 회색. 숫자는 고정폭 */
function Val({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return <T size={13} mono weight={muted ? "medium" : "semibold"} color={muted ? C.muted : C.foreground}>{children}</T>;
}
// 웹 DL "mt-2.5 grid gap-1.5 text-[13px]"
const DL = { marginTop: 10, gap: 6 } as const;

/** 주 머리의 짧은 날짜 — 10/13 (월) */
const short = (t: number | Date) => {
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} (${"일월화수목금토"[d.getDay()]})`;
};

export function PayView({ shifts, settings, year, month, now, absences = [] }: { shifts: Shift[]; settings: PaySettings; year: number; month: number; now: number; absences?: Absence[] }) {
  const weeks = useMemo(() => computeWeeks(shifts, settings, now, absences), [shifts, settings, now, absences]);
  const m = computeMonth(weeks, year, month);

  return (
    // 카드가 차례로 나타난다. 불러오는 동안은 PayViewSkeleton 이 그려지므로, 불러오기가 끝나면 여기서 다시 한 번
    <Enter>
      <Card>
        <SectionLabel tone="title" icon={PiggyBank}>예상 급여 (세전)</SectionLabel>
        {/* 포인트 컬러: 큰 급여 숫자만 강조색 (2026-10-15 사용자 지시) */}
        <CountUp value={m.total} format={won} size={30} weight="semibold" color={C.accent} style={{ marginTop: 6, lineHeight: 37.5 }} />
        <View style={DL}>
          <DotRow term={`기본급 (${hm(m.workedMinutes)})`} muted={m.basePay === 0}><Val muted={m.basePay === 0}>{won(m.basePay)}</Val></DotRow>
          <DotRow term="주휴수당" muted={m.holidayPay === 0}><Val muted={m.holidayPay === 0}>{won(m.holidayPay)}</Val></DotRow>
          {m.leavePay > 0 && <DotRow term="휴가수당"><Val>{won(m.leavePay)}</Val></DotRow>}
          <DotRow term={`연장 가산 (${hm(m.overtimeMinutes)})`} muted={m.overtimePay === 0}><Val muted={m.overtimePay === 0}>{won(m.overtimePay)}</Val></DotRow>
        </View>
        <Note />
      </Card>
      {m.weeks.length === 0 && <T size={14} color={C.muted} style={{ textAlign: "center" }}>이 달 기록이 없어요.</T>}
      {m.weeks.map((w) => (
        <WeekCard key={w.weekStart.getTime()} week={w} settings={settings} now={now} />
      ))}
    </Enter>
  );
}

const Note = () => <T size={12} color={C.muted} style={{ marginTop: 10, lineHeight: 19 }}>일요일이 이 달에 속한 주를 합산해요. 휴게시간·야간수당·공제는 반영하지 않아요.</T>;

/** 점선 줄 안의 값 자리 막대 — 글자 줄(13px) 안에 들어가 줄 높이를 바꾸지 않는다 */
const BoneRow = () => <DotRow term={<LineBone font={13} h={14} w={96} />}><LineBone font={13} h={14} w={80} /></DotRow>;

/**
 * 기록·휴가를 읽는 동안의 자리 — PayView 와 같은 카드·줄 높이에 값 대신 막대.
 * 주 카드 수는 "일요일이 이 달에 있고 now 까지 시작한 주" 수 — 매주 근무하는 사람의 주 카드 수와 같다.
 * 휴가수당·한도 경고 줄은 없는 것으로 둔다. 구역 머리·안내 글자처럼 데이터와 무관한 글자는 그대로 둔다.
 */
export function PayViewSkeleton({ year, month, now }: { year: number; month: number; now: number }) {
  return (
    <Loading>
      <Enter>
        <Card>
          <SectionLabel tone="title" icon={PiggyBank}>예상 급여 (세전)</SectionLabel>
          {/* 30px 글자 leading-tight 줄 = 37.5 */}
          <View style={{ marginTop: 6, height: 37.5, justifyContent: "center" }}><Bone style={{ height: 32, width: 160 }} /></View>
          <View style={DL}>
            <BoneRow />
            <BoneRow />
            <BoneRow />
          </View>
          <Note />
        </Card>
        {Array.from({ length: startedWeeks(year, month, now) }, (_, i) => (
          <Card key={i}>
            <SectionLabelBone icon={CalendarDays} w={128} right={<LineBone font={12} h={12} w={64} />} />
            <View style={DL}>
              <BoneRow />
              <BoneRow />
              <BoneRow />
              <BoneRow />
            </View>
          </Card>
        ))}
      </Enter>
    </Loading>
  );
}

/** 월요일 시작 주 가운데 일요일이 year·month 에 있고 now 이전에 시작한 주의 수 (스켈레톤 카드 수 — 금액 계산이 아니다) */
function startedWeeks(year: number, month: number, now: number) {
  let n = 0;
  for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) {
    const sunday = new Date(year, month, d);
    if (sunday.getDay() === 0 && new Date(year, month, d - 6).getTime() <= now) n++;
  }
  return n;
}

export function holidayStatus(week: WeekPay, settings: PaySettings, now: number) {
  if (settings.weeklyHours < 15) return "대상 아님 (주 15시간 미만)";
  if (week.holidayEligible) return "개근";
  const days = `${week.workDays + week.excusedDays}/${settings.workDaysPerWeek}일`;
  if (week.workDays === 0 && week.excusedDays > 0) return "대상 아님 (그 주 전부 휴가)";
  return now < week.weekEnd.getTime() ? `진행 중 (${days})` : `미충족 (${days})`;
}

/** 주휴 상태 글자색 — 글자가 뜻을 담고 색은 보조다. 웹은 클래스 이름, 앱은 색 값(해당 없으면 undefined = 이름 글자색 그대로) */
export const holidayTone = (s: string) => (s === "개근" ? C.ok : s.startsWith("진행 중") ? C.caution : undefined);

function WeekCard({ week, settings, now }: { week: WeekPay; settings: PaySettings; now: number }) {
  const status = holidayStatus(week, settings, now);
  return (
    <Card>
      <SectionLabel icon={CalendarDays} right={won(week.total)}>
        <T size={12} weight="semibold" mono color={C.muted}>{short(week.weekStart)} ~ {short(week.weekEnd.getTime() - 1)}</T>
      </SectionLabel>
      <View style={DL}>
        <DotRow term="근무">
          <T size={13} weight="semibold">
            <T size={13} weight="semibold" mono>{hm(week.workedMinutes)} · {week.workDays}일</T>
            {week.excusedDays > 0 && ` + 휴가·대타 ${week.excusedDays}일`}
          </T>
        </DotRow>
        <DotRow term="기본급"><Val>{won(week.basePay)}</Val></DotRow>
        {week.leavePay > 0 && <DotRow term={`휴가수당 (${week.paidLeaveDays}일)`}><Val>{won(week.leavePay)}</Val></DotRow>}
        <DotRow term={<T size={13} color={C.muted}>주휴수당 · <T size={13} color={holidayTone(status) ?? C.muted}>{status}</T></T>} muted={week.holidayPay === 0}>
          <Val muted={week.holidayPay === 0}>{won(week.holidayPay)}</Val>
        </DotRow>
        <DotRow term={`연장 ${hm(week.overtimeMinutes)}${settings.fivePlus ? "" : " (5인 미만)"}`} muted={week.overtimePay === 0}>
          <Val muted={week.overtimePay === 0}>{won(week.overtimePay)}</Val>
        </DotRow>
      </View>
      {week.overtimeLimitExceeded && <T size={14} color={C.warn} style={{ marginTop: 12 }}>연장근로가 주 12시간을 넘었어요 (단시간근로자 한도).</T>}
    </Card>
  );
}
