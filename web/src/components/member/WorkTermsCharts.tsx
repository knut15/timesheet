"use client";
// 내 정보 탭 근무 조건 그래프 (2026-10-15 사용자 요청 "이 데이터는 그래프로 그려줘", Recharts).
// 주간 리듬 카드(이번 주 요일 카드 + 다음 근무까지) · 주 시간 게이지(주휴 15h·법정 40h 기준선, Recharts) · 근무일 점.
// 색은 토큰 — 막대는 강조색(text-accent 의 currentColor), 축·기준선·트랙은 muted 에 투명도. SVG 속성에는 var() 를 쓰지 않는다. 한 사람의 값이라 범례 없이 구역 이름이 제목이다.
import { gsap } from "gsap";
import { CalendarClock, Sofa, Sun } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DAY_NAMES, WEEK_ORDER, dayPlan, nextShift, untilText, type DayException, type Schedule } from "@/lib/schedule";
import { EASE, reducedMotion } from "../motion";
import { NUM } from "../styles";

const minutesOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const durationText = (h: number) => `${Math.floor(h)}시간${h % 1 ? " 30분" : ""}`;

// Recharts 기본 애니메이션(1.5초)은 DESIGN.md §5 보다 길다 — 0.4초, 동작 줄이기면 끈다
const animation = () => (reducedMotion() ? { isAnimationActive: false } : { animationDuration: 400, animationEasing: "ease-out" as const });

/** 툴팁 — 카드 모양, 글자는 본문색(계열 색을 글자에 쓰지 않는다) */
function Tip({ children }: { children: React.ReactNode }) {
  return <div className={`rounded-xl border border-line bg-surface px-2.5 py-1.5 text-xs text-foreground shadow-sm ${NUM}`}>{children}</div>;
}

/**
 * 주간 리듬 카드 — 이번 주 월~일 카드 7장. 근무하는 날은 해 + 시각 + 시간, 쉬는 날은 소파 (2026-10-15 사용자 선택 "주간 리듬 카드").
 * 날짜별 근무 변경이 시간표보다 먼저다. 위 줄은 "지금 근무 시간" 또는 "다음 근무까지 …".
 */
export function WeekRhythm({ schedule, exceptions, now }: { schedule: Schedule | null; exceptions: DayException[]; now: number }) {
  const ref = useRef<HTMLOListElement>(null);
  const today = new Date(now);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
  const todayKey = today.toDateString();
  const next = nextShift(schedule, exceptions, today);

  // 카드가 왼쪽부터 0.04초 간격으로 톡 — 동작 줄이기면 투명도만
  useLayoutEffect(() => {
    const cards = ref.current?.children;
    if (!cards?.length) return;
    const t = reducedMotion()
      ? gsap.fromTo(cards, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      : gsap.fromTo(cards, { opacity: 0, y: 6, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: EASE, stagger: 0.04, clearProps: "transform" });
    return () => {
      t.kill();
    };
  }, []);

  return (
    <div>
      <p className="flex items-center gap-1.5 text-[13px]" role="status">
        {next?.state === "working" ? (
          <>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ok ring-3 ring-ok/20" />
            <span>지금 근무 시간이에요 · <b className={`font-semibold ${NUM}`}>{hhmm(next.end)}</b> 까지</span>
          </>
        ) : next ? (
          <>
            <CalendarClock size={15} aria-hidden className="text-muted" />
            <span>
              다음 근무까지 <b className={`font-semibold text-accent ${NUM}`}>{untilText(next.at.getTime() - now)}</b>{" "}
              <span className={`text-muted ${NUM}`}>({DAY_NAMES[next.at.getDay()]} {next.start})</span>
            </span>
          </>
        ) : (
          <span className="text-muted">정해진 근무가 없어요</span>
        )}
      </p>
      <ol ref={ref} className="mt-2.5 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const plan = dayPlan(schedule, exceptions, d);
          const isToday = d.toDateString() === todayKey;
          const past = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const hours = plan ? (minutesOf(plan.end) - minutesOf(plan.start)) / 60 : 0;
          const name = DAY_NAMES[d.getDay()];
          return (
            <li
              key={d.toDateString()}
              aria-label={`${name}요일${isToday ? " (오늘)" : ""} ${plan ? `${plan.start}~${plan.end} 근무 ${durationText(hours)}` : "쉬는 날"}`}
              aria-current={isToday ? "date" : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl border px-0.5 py-2 ${plan ? "border-accent/25 bg-accent/10" : "border-dashed border-line"} ${isToday ? "ring-2 ring-accent ring-offset-1 ring-offset-surface" : ""} ${past ? "opacity-55" : ""}`}
            >
              <span aria-hidden className={`text-[11px] ${isToday ? "font-bold text-accent" : "font-semibold text-muted"}`}>{name}</span>
              {plan ? <Sun aria-hidden size={16} strokeWidth={1.75} className="text-accent" /> : <Sofa aria-hidden size={16} strokeWidth={1.5} className="text-muted" />}
              <span aria-hidden className={`text-[10px] leading-tight ${NUM} ${plan ? "text-foreground" : "text-muted"}`}>{plan ? `${plan.start.slice(0, 2)}-${plan.end.slice(0, 2)}` : "쉼"}</span>
              <span aria-hidden className={`text-[10px] font-semibold leading-tight ${NUM} ${plan ? "text-foreground" : "invisible"}`}>{plan ? `${hours}h` : "0h"}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** 주 시간 게이지 — 0~40시간 막대 하나, 주휴수당 기준 15시간·법정 40시간 기준선 */
export function WeeklyHoursGauge({ hours }: { hours: number }) {
  const max = Math.max(40, Math.ceil(hours));
  return (
    <figure>
      <figcaption className="sr-only">1주 소정근로시간 {hours}시간 — 주휴수당 기준 15시간 {hours >= 15 ? "이상" : "미만"}, 법정 40시간</figcaption>
      <div aria-hidden className="h-[52px] text-muted">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[{ name: "주 시간", hours }]} layout="vertical" margin={{ top: 14, right: 22, bottom: 0, left: 8 }} /* 오른쪽 끝 "법정 40h" 글자가 잘리지 않게 */>
            <XAxis type="number" domain={[0, max]} ticks={[0, 15, 40]} tick={{ fill: "currentColor", fontSize: 11 }} tickFormatter={(v: number) => `${v}h`} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip cursor={false} content={({ active }) => (active ? <Tip>주 {hours}시간</Tip> : null)} />
            <ReferenceLine x={15} stroke="currentColor" strokeDasharray="3 3" label={{ value: "주휴 15h", position: "top", fill: "currentColor", fontSize: 10 }} />
            <ReferenceLine x={40} stroke="currentColor" strokeDasharray="3 3" label={{ value: "법정 40h", position: "top", fill: "currentColor", fontSize: 10 }} />
            <Bar dataKey="hours" fill="currentColor" className="text-accent" radius={4} barSize={12} background={{ fill: "currentColor", fillOpacity: 0.15, radius: 4 }} {...animation()} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/** 근무일 점 — 월~일 7개 중 근무하는 요일만 채운다. 시간표가 없으면 일수만큼 앞에서부터 */
export function WorkDayDots({ schedule, count }: { schedule: Schedule | null; count: number }) {
  const on = (i: number, d: number) => (schedule ? schedule.days.includes(d) : i < count);
  return (
    <div className="flex items-center justify-between" role="img" aria-label={`1주 소정근로일수 ${count}일${schedule ? ` (${WEEK_ORDER.filter((d) => schedule.days.includes(d)).map((d) => DAY_NAMES[d]).join("·")})` : ""}`}>
      {WEEK_ORDER.map((d, i) => (
        <span key={d} aria-hidden className="flex flex-col items-center gap-1">
          <span className={`h-3.5 w-3.5 rounded-full border ${on(i, d) ? "border-accent bg-accent" : "border-muted/40"}`} />
          {schedule && <span className="text-[11px] text-muted">{DAY_NAMES[d]}</span>}
        </span>
      ))}
    </div>
  );
}
