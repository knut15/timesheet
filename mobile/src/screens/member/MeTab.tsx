// 멤버 내 정보 탭 — 웹 web/src/components/TimesheetApp.tsx 의 MePanel·MyScheduleExceptions 앱판.
// 아바타 · 근무 조건(그래프 셋) · 날짜별 근무 변경 · 로그아웃. docs/prd/13
import { CalendarDays, NotebookText } from "lucide-react-native";
import { View } from "react-native";
import { api, type ScheduleException } from "@/api/client";
import { logout } from "@/auth/session";
import { Enter } from "@/components/motion";
import { Screen } from "@/components/shell";
import { Avatar, Bone, Btn, Card, DotRow, Loading, Pill, SectionLabel, T } from "@/components/ui";
import { date, useNow, won } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { C } from "@/theme";
import { dayKey, MINIMUM_WAGE, parseDay } from "@shared/pay";
import { scheduleText } from "@shared/schedule";
import { useMember } from "./MemberData";
import { WeekRhythm, WeeklyHoursGauge, WorkDayDots } from "./me/WorkTermsCharts";
import { DashedList, DashedRule } from "./records/parts";

export function MeTab() {
  const { me, membership } = useMember();
  const now = useNow(60_000);
  const today = dayKey(now);
  const exceptions = useApi(() => api.GET("/api/schedule-exceptions/me", { params: { query: { from: today } } }), today);
  // 읽는 동안은 자리를 두고, 읽고 나서 없거나 실패하면 카드째 숨긴다 — 빈 칸이 카드 사이 간격을 늘리지 않게 여기서 거른다
  const showExceptions = (exceptions.data === null && !exceptions.error) || !!exceptions.data?.length;

  return (
    <Screen onRefresh={exceptions.reload}>
      {/* 카드가 처음 한 번 차례로 나타난다 (불러오기가 끝나도 다시 하지 않는다 — 깜빡임) */}
      <Enter>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Avatar name={me.user.nickname} seed={me.user.id} size="lg" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T size={17} weight="bold" numberOfLines={1} accessibilityRole="header">{me.user.nickname}</T>
            <T size={13} color={C.muted} numberOfLines={1}>{me.user.email}</T>
            <T size={12} color={C.muted} style={{ marginTop: 2 }}>{membership.store.name} · 멤버</T>
          </View>
        </Card>
        <Card>
          <SectionLabel tone="title" icon={NotebookText}>근무 조건</SectionLabel>
          <View style={{ marginTop: 10, gap: 6 }}>
            <DotRow term="매장">{membership.store.name}</DotRow>
            <DotRow term="시급"><T size={13} mono weight="semibold">{won(membership.hourlyWage)}</T></DotRow>
          </View>
          {/* 시간표·주 시간·근무일은 그래프로 (2026-10-15 사용자 요청). 그래프마다 같은 내용을 글자로도 둔다 */}
          <View style={{ marginTop: 16 }}><DashedRule /></View>
          <View style={{ gap: 16, paddingTop: 14 }}>
            <View>
              <TermHead term="근무 시간표" value={membership.schedule ? scheduleText(membership.schedule) : "정해지지 않음"} />
              <View style={{ marginTop: 10 }}><WeekRhythm schedule={membership.schedule ?? null} exceptions={exceptions.data ?? []} now={now} /></View>
            </View>
            <View>
              <TermHead term="1주 소정근로시간" value={`${membership.weeklyHours}시간`} />
              <View style={{ marginTop: 4 }}><WeeklyHoursGauge hours={membership.weeklyHours} /></View>
            </View>
            <View>
              <TermHead term="1주 소정근로일수" value={`${membership.workDaysPerWeek}일`} />
              <View style={{ marginTop: 8 }}><WorkDayDots schedule={membership.schedule ?? null} count={membership.workDaysPerWeek} /></View>
            </View>
          </View>
          {membership.hourlyWage < MINIMUM_WAGE && <T size={14} color={C.warn} style={{ marginTop: 12 }}>2026년 최저임금({won(MINIMUM_WAGE)})보다 낮아요.</T>}
          <T size={12} color={C.muted} style={{ marginTop: 10 }}>조건은 사장님이 정해요.</T>
        </Card>
        {showExceptions && <MyScheduleExceptions data={exceptions.data} />}
        <Btn variant="secondary" label="로그아웃" onPress={() => void logout()} full />
      </Enter>
    </Screen>
  );
}

/** 그래프 구역 머리 — 왼쪽 이름(회색), 오른쪽 같은 내용의 글자 값 */
function TermHead({ term, value }: { term: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
      <T size={13} color={C.muted} accessibilityRole="header">{term}</T>
      <T size={13} mono style={{ flexShrink: 1, textAlign: "right" }}>{value}</T>
    </View>
  );
}

// 카드 안 목록 — 줄 사이는 점선 (2026-10-15 B 시안 .list-row). 배지(20)가 있어도 줄 높이가 같게 minHeight 40
const EXC_ROW = { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingVertical: 10 } as const;
const LINE13 = Math.round(13 * 1.45);

/** 오늘 이후 날짜별 근무 변경 — 보기만 한다. data 가 null 이면 읽는 중(2행 자리) */
function MyScheduleExceptions({ data }: { data: ScheduleException[] | null }) {
  if (data === null)
    return (
      <Loading>
        <Card>
          <SectionLabel tone="title" icon={CalendarDays}>날짜별 근무 변경</SectionLabel>
          <DashedList style={{ marginTop: 4 }}>
            {[0, 1].map((i) => (
              <View key={i} style={EXC_ROW}>
                <View style={{ height: LINE13, justifyContent: "center" }}><Bone style={{ height: 14, width: 96 }} /></View>
                <View style={{ height: LINE13, justifyContent: "center" }}><Bone style={{ height: 14, width: 112 }} /></View>
              </View>
            ))}
          </DashedList>
        </Card>
      </Loading>
    );
  return (
    <Card>
      <SectionLabel tone="title" icon={CalendarDays}>날짜별 근무 변경</SectionLabel>
      <DashedList style={{ marginTop: 4 }}>
        {data.map((e) => (
          <View key={e.id} style={EXC_ROW}>
            <T size={13} mono>{date(parseDay(e.date))}</T>
            {/* 쉼은 회색 배지(취소 배지와 같은 line/60), 근무는 시각 글자 */}
            {e.kind === "off" ? <Pill label="쉼" /> : <T size={13} mono>{`${e.start}~${e.end} 근무`}</T>}
          </View>
        ))}
      </DashedList>
    </Card>
  );
}
