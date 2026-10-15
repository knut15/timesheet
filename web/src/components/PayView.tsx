"use client";
// 월 급여 요약과 주별 내역. 멤버 화면과 마스터의 멤버 상세 화면이 같이 쓴다. 계산은 pay.ts 에만 있다.
import { useMemo } from "react";
import { CalendarDays, PiggyBank } from "lucide-react";
import { computeMonth, computeWeeks, type Absence, type PaySettings, type Shift, type WeekPay } from "@/lib/pay";
import { CountUp, Enter } from "./motion";
import { Card, hm, NUM, SectionLabel, won } from "./ui";

/**
 * 점선 이음 값 한 줄 — 이름 ··········· 값 (2026-10-15 B 시안 dl).
 * <dl className="mt-2.5 grid gap-1.5 text-[13px]"> 안에 쌓는다. 점선은 줄의 ::after 라 dl 구조(dt·dd)를 해치지 않는다.
 */
export function DotRow({ term, children, muted = false }: { term: React.ReactNode; children: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 after:order-1 after:min-w-3 after:flex-1 after:-translate-y-[3px] after:border-b after:border-dotted after:border-muted/40">
      <dt className="min-w-0 text-muted">{term}</dt>
      <dd className={`order-2 shrink-0 text-right ${muted ? "font-medium text-muted" : "font-semibold"}`}>{children}</dd>
    </div>
  );
}
const DL = "mt-2.5 grid gap-1.5 text-[13px]";

/** 주 머리의 짧은 날짜 — 10/13 (월) */
const short = (t: number | Date) => {
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} (${"일월화수목금토"[d.getDay()]})`;
};

export function PayView({ shifts, settings, year, month, now, absences = [], replay }: { shifts: Shift[]; settings: PaySettings; year: number; month: number; now: number; absences?: Absence[]; replay?: unknown }) {
  const weeks = useMemo(() => computeWeeks(shifts, settings, now, absences), [shifts, settings, now, absences]);
  const m = computeMonth(weeks, year, month);

  return (
    // 카드가 차례로 나타난다. replay 가 바뀌면(불러오기 끝) 다시
    <Enter className="space-y-3" replay={replay}>
      <Card>
        <SectionLabel icon={PiggyBank}>예상 급여 (세전)</SectionLabel>
        {/* 포인트 컬러: 큰 급여 숫자만 강조색 (2026-10-15 사용자 지시) */}
        <p className={`mt-1.5 text-[30px] font-semibold leading-tight text-accent ${NUM}`}>
          <CountUp value={m.total} format={won} />
        </p>
        <dl className={DL}>
          <DotRow term={`기본급 (${hm(m.workedMinutes)})`} muted={m.basePay === 0}><span className={NUM}>{won(m.basePay)}</span></DotRow>
          <DotRow term="주휴수당" muted={m.holidayPay === 0}><span className={NUM}>{won(m.holidayPay)}</span></DotRow>
          {m.leavePay > 0 && <DotRow term="휴가수당"><span className={NUM}>{won(m.leavePay)}</span></DotRow>}
          <DotRow term={`연장 가산 (${hm(m.overtimeMinutes)})`} muted={m.overtimePay === 0}><span className={NUM}>{won(m.overtimePay)}</span></DotRow>
        </dl>
        <p className="mt-2.5 text-xs leading-relaxed text-muted">일요일이 이 달에 속한 주를 합산해요. 휴게시간·야간수당·공제는 반영하지 않아요.</p>
      </Card>
      {m.weeks.length === 0 && <p className="text-center text-sm text-muted">이 달 기록이 없어요.</p>}
      {m.weeks.map((w) => (
        <WeekCard key={w.weekStart.getTime()} week={w} settings={settings} now={now} />
      ))}
    </Enter>
  );
}

export function holidayStatus(week: WeekPay, settings: PaySettings, now: number) {
  if (settings.weeklyHours < 15) return "대상 아님 (주 15시간 미만)";
  if (week.holidayEligible) return "개근";
  const days = `${week.workDays + week.excusedDays}/${settings.workDaysPerWeek}일`;
  if (week.workDays === 0 && week.excusedDays > 0) return "대상 아님 (그 주 전부 휴가)";
  return now < week.weekEnd.getTime() ? `진행 중 (${days})` : `미충족 (${days})`;
}

/** 주휴 상태 글자색 — 글자가 뜻을 담고 색은 보조다 */
const statusTone = (s: string) => (s === "개근" ? "text-ok" : s.startsWith("진행 중") ? "text-caution" : "");

function WeekCard({ week, settings, now }: { week: WeekPay; settings: PaySettings; now: number }) {
  const status = holidayStatus(week, settings, now);
  return (
    <Card>
      <SectionLabel icon={CalendarDays} right={won(week.total)}>
        <span className={NUM}>{short(week.weekStart)} ~ {short(week.weekEnd.getTime() - 1)}</span>
      </SectionLabel>
      <dl className={DL}>
        <DotRow term="근무">
          <span className={NUM}>{hm(week.workedMinutes)} · {week.workDays}일</span>
          {week.excusedDays > 0 && ` + 휴가·대타 ${week.excusedDays}일`}
        </DotRow>
        <DotRow term="기본급"><span className={NUM}>{won(week.basePay)}</span></DotRow>
        {week.leavePay > 0 && <DotRow term={`휴가수당 (${week.paidLeaveDays}일)`}><span className={NUM}>{won(week.leavePay)}</span></DotRow>}
        <DotRow term={<>주휴수당 · <span className={statusTone(status)}>{status}</span></>} muted={week.holidayPay === 0}><span className={NUM}>{won(week.holidayPay)}</span></DotRow>
        <DotRow term={`연장 ${hm(week.overtimeMinutes)}${settings.fivePlus ? "" : " (5인 미만)"}`} muted={week.overtimePay === 0}><span className={NUM}>{won(week.overtimePay)}</span></DotRow>
      </dl>
      {week.overtimeLimitExceeded && <p className="mt-3 text-sm text-warn">연장근로가 주 12시간을 넘었어요 (단시간근로자 한도).</p>}
    </Card>
  );
}
