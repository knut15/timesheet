// 사장 화면 불러오는 중 스켈레톤 — 웹 web/src/app/admin/_skeletons.tsx 의 앱판.
// 불러온 뒤 화면과 같은 틀(Card·여백·간격)에 데이터 글자 대신 Bone 을 둔다. 고정 문구(제목·안내·입력칸 이름)는 실제 글자로 둔다.
// 글자 줄 칸 높이는 앱 글자(T)의 줄 높이(글자 크기 × 1.45)에 맞춘다 — 데이터가 들어와도 레이아웃이 움직이지 않게.
// 막대 높이·폭은 웹 값 그대로(px). 화면 쪽 크기를 바꾸면 여기도 같이 바꾼다.
import { ArrowLeftRight, Coins, MapPin, Plane, Store as StoreIcon, Timer, Wallet } from "lucide-react-native";
import { View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { Bone, Card, CardSection, Loading, SectionLabel, T } from "@/components/ui";
import { C, R, alpha } from "@/theme";
import { Dash, ROW } from "./common";

// 글자 크기 → [줄 칸 높이, 막대 높이]. 28 은 인건비 금액(줄 높이 35 로 고정, 웹 leading-tight)
const SIZE = { xs: [17, 12], "13": [19, 14], sm: [20, 14], base: [23, 16], xl: [29, 20], "28": [35, 24] } as const;

/** 글자 한 줄 자리 — 칸은 그 글자의 줄 높이, 막대는 칸 안 가운데 */
export function Line({ size = "sm", w, style }: { size?: keyof typeof SIZE; w: DimensionValue; style?: StyleProp<ViewStyle> }) {
  const [box, bar] = SIZE[size];
  return (
    <View style={[{ height: box, justifyContent: "center" }, style]}>
      <Bone style={{ height: bar, width: w }} />
    </View>
  );
}

const times = <X,>(n: number, f: (i: number) => X) => Array.from({ length: n }, (_, i) => f(i));

/** MonthPicker 자리 — 테두리 있는 44 화살표 둘과 가운데 "2026년 9월" (15px) */
export function MonthPickerBone() {
  const arrow = (
    <View style={{ height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: R.control, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface }}>
      <Bone style={{ height: 16, width: 16 }} />
    </View>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      {arrow}
      <Line size="base" w={96} />
      {arrow}
    </View>
  );
}

/** Field 자리 — 이름(12px) + 간격 6 + 입력칸 44 */
export function FieldBone({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: 6, minWidth: 0 }, style]}>
      <T size={12} weight="semibold" color={C.muted}>{label}</T>
      <Bone style={{ height: 44 }} />
    </View>
  );
}

/** 체크 줄 자리 — 왼쪽 상자 18 + 글자, 줄 높이 44 */
export function CheckBone({ label }: { label: string }) {
  return (
    <View style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Bone style={{ height: 18, width: 18, borderRadius: 4 }} />
      <T size={13} weight="medium" style={{ flexShrink: 1 }}>{label}</T>
    </View>
  );
}

/** 아바타 자리 — ui.tsx Avatar 와 같은 크기·모서리 */
export function AvatarBone({ size }: { size: "sm" | "md" | "lg" }) {
  const z = { sm: [32, 6], md: [40, 8], lg: [64, 12] }[size];
  return <Bone style={{ height: z[0], width: z[0], borderRadius: z[1] }} />;
}

/** 카드 안 목록 행 자리 — 점선 행 + 아바타 sm + 두 줄(13px·12px). 대시보드·달력·요청이 같이 쓴다 */
function ListRowBones({ n, right }: { n: number; right?: React.ReactNode }) {
  return (
    <View style={{ marginTop: 4 }}>
      {times(n, (i) => (
        <View key={i}>
          <View style={ROW}>
            <AvatarBone size="sm" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Line size="13" w={56} />
              <Line size="xs" w={144} />
            </View>
            {right}
          </View>
          {i < n - 1 && <Dash />}
        </View>
      ))}
    </View>
  );
}

// ── 대시보드 ─────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <Loading>
      <View style={{ gap: 12 }}>
        <Card>
          <SectionLabel icon={Timer} right={<Bone style={{ height: 12, width: 96 }} />}>지금 근무 중</SectionLabel>
          <ListRowBones n={2} right={<Bone style={{ height: 7, width: 7, borderRadius: 4 }} />} />
        </Card>
        <Card>
          <MonthPickerBone />
          <View style={{ marginTop: 12 }}>
            <SectionLabel icon={Wallet}>인건비 (예상, 세전)</SectionLabel>
          </View>
          <Line size="28" w={160} style={{ marginTop: 6 }} />
          {/* 기본급·주휴·휴가·연장 가산 한 줄은 좁은 카드에서 두 줄이 된다 — 흔한 쪽인 두 줄 */}
          <View style={{ marginTop: 4 }}>
            <Line size="xs" w="100%" />
            <Line size="xs" w="60%" />
          </View>
        </Card>
        <Card>
          <SectionLabel icon={Coins}>멤버별</SectionLabel>
          <ListRowBones n={3} right={<Line size="13" w={80} />} />
        </Card>
      </View>
    </Loading>
  );
}

// ── 달력 ─────────────────────────────────────────────
// 달력 화면은 격자(MonthGrid busy)를 바로 그리고 요약 줄·범례·상세 자리만 아래 조각으로 채운다.

/** 달 요약 줄 "이번 달 3명 · 120시간" 자리 (가운데, 13px) */
export function CalendarSummaryBone() {
  return (
    <View style={{ marginTop: 4, alignItems: "center" }}>
      <Line size="13" w={144} />
    </View>
  );
}

/** 범례 자리 — 항목 넷 한 줄 (11px) */
export function LegendBone() {
  return (
    <View style={{ height: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
      {times(4, (i) => <Bone key={i} style={{ height: 10, width: 56 }} />)}
    </View>
  );
}

/** 선택한 날 멤버 행 자리 — 점선 행 둘 */
export function DayRowsSkeleton() {
  return <ListRowBones n={2} right={<Bone style={{ height: 15, width: 15 }} />} />;
}

// ── 요청 ─────────────────────────────────────────────

/** 요청 카드 머리 — 아바타 sm + "이름 · 종류" (14px) */
function WhoBone() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <AvatarBone size="sm" />
      <Line w={128} />
    </View>
  );
}

function Head({ index, right, children }: { index: string; right?: React.ReactNode; children: string }) {
  return (
    <View style={{ paddingHorizontal: 4 }}>
      <SectionLabel index={index} right={right}>{children}</SectionLabel>
    </View>
  );
}

export function RequestsSkeleton() {
  return (
    <Loading>
      <View style={{ gap: 24 }}>
        <View style={{ gap: 8 }}>
          <Head index="01" right={<Bone style={{ height: 12, width: 24 }} />}>처리할 요청</Head>
          {/* 기록 수정 요청 모양 — 지금·요청·사유 세 줄 + 메모 칸 + 승인·거절 */}
          <Card>
            <WhoBone />
            <View style={{ marginTop: 12, gap: 6 }}>
              <Line size="13" w={208} />
              <Line size="13" w={208} />
              <Line size="13" w={128} />
            </View>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Bone style={{ height: 44 }} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Bone style={{ height: 44, flex: 1 }} />
                <Bone style={{ height: 44, flex: 1 }} />
              </View>
            </View>
          </Card>
        </View>

        <View style={{ gap: 8 }}>
          <Head index="02">직접 등록</Head>
          <View style={{ gap: 12 }}>
            <Card>
              <SectionLabel icon={Plane}>휴가 등록</SectionLabel>
              <View style={{ marginTop: 12, gap: 12 }}>
                <FieldBone label="멤버" />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <FieldBone label="시작일" style={{ flex: 1 }} />
                  <FieldBone label="종료일" style={{ flex: 1 }} />
                </View>
                <CheckBone label="유급 휴가" />
                <FieldBone label="사유" />
                <Bone style={{ height: 44 }} />
              </View>
            </Card>
            <Card>
              <SectionLabel icon={ArrowLeftRight}>대타 등록</SectionLabel>
              <View style={{ marginTop: 12, gap: 12 }}>
                <FieldBone label="쉬는 멤버" />
                <FieldBone label="대신 나올 멤버" />
                <FieldBone label="날짜" />
                <FieldBone label="사유" />
                <Bone style={{ height: 44 }} />
              </View>
            </Card>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Head index="03" right={<Bone style={{ height: 12, width: 12 }} />}>확정된 휴가·대타</Head>
          <Card style={{ paddingVertical: 6 }}>
            <ListRowBones n={2} right={<Bone style={{ height: 32, width: 44 }} />} />
          </Card>
        </View>

        <View style={{ gap: 8 }}>
          <Head index="04">최근 처리</Head>
          <Card style={{ paddingVertical: 6 }}>
            {times(3, (i) => (
              <View key={i}>
                <View style={ROW}>
                  <AvatarBone size="sm" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Line size="13" w={160} />
                  </View>
                  <Bone style={{ height: 20, width: 56, borderRadius: R.pill }} />
                </View>
                {i < 2 && <Dash />}
              </View>
            ))}
          </Card>
        </View>
      </View>
    </Loading>
  );
}

// ── 멤버 ─────────────────────────────────────────────

/** 날짜별 변경 행 자리 — 점선 행 하나: 날짜·내용(13px) + 삭제 버튼 32 */
export function ExceptionRowsSkeleton() {
  return (
    <View style={{ marginTop: 2 }}>
      <View style={ROW}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Line size="13" w={144} />
        </View>
        <Bone style={{ height: 32, width: 44 }} />
      </View>
    </View>
  );
}

export function MembersSkeleton() {
  return (
    <Loading>
      <View style={{ gap: 12 }}>
        <Bone style={{ height: 56, borderRadius: R.card }} />
        {times(2, (i) => (
          <Card key={i} flush>
            <CardSection first style={{ paddingVertical: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <AvatarBone size="md" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Line size="base" w={64} />
                  <Line size="xs" w={160} />
                </View>
                <Bone style={{ height: 32, width: 72 }} />
              </View>
              {/* 근무 시간표 줄과 조건 수정·퇴사처리 */}
              <Line size="xs" w={256} style={{ marginTop: 10, maxWidth: "100%" }} />
              <View style={{ marginTop: 10, flexDirection: "row", gap: 6 }}>
                <Bone style={{ height: 32, width: 72 }} />
                <Bone style={{ height: 32, width: 64 }} />
              </View>
            </CardSection>
            <CardSection style={{ paddingVertical: 14 }}>
              <SectionLabel>날짜별 변경</SectionLabel>
              <ExceptionRowsSkeleton />
              <Bone style={{ marginTop: 6, height: 36 }} />
            </CardSection>
          </Card>
        ))}
      </View>
    </Loading>
  );
}

// ── 멤버 상세 ─────────────────────────────────────────

export function MemberDetailSkeleton() {
  return (
    <Loading>
      <View style={{ gap: 12 }}>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <AvatarBone size="lg" />
          <View style={{ minWidth: 0 }}>
            <Line size="xl" w={80} />
            <Line size="13" w={176} />
          </View>
        </Card>
        <MonthPickerBone />
        {/* 보기 전환 틀 — 옅은 바탕 안 40 둘 */}
        <View style={{ flexDirection: "row", borderRadius: R.control, backgroundColor: alpha(C.line, 0.6), padding: 3 }}>
          {times(2, (i) => (
            <View key={i} style={{ flex: 1, height: 40, alignItems: "center", justifyContent: "center" }}>
              <Bone style={{ height: 14, width: 56, backgroundColor: C.surface }} />
            </View>
          ))}
        </View>
        <Card flush>
          {times(3, (i) => (
            <CardSection key={i} first={i === 0} style={{ paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <View style={{ minWidth: 0 }}>
                <Line w={96} />
                <Line size="13" w={160} style={{ marginTop: 2 }} />
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Bone style={{ height: 32, width: 44 }} />
                <Bone style={{ height: 32, width: 44 }} />
              </View>
            </CardSection>
          ))}
        </Card>
      </View>
    </Loading>
  );
}

// ── 초대 ─────────────────────────────────────────────

export const INVITE_INTRO = "코드는 7일 동안, 한 명만 쓸 수 있어요. 알바생은 가입한 뒤 이 코드를 입력하면 매장에 들어와요.";

export function InvitesSkeleton() {
  return (
    <Loading>
      <View style={{ gap: 12 }}>
        <Card>
          <T size={16} weight="semibold">알바생 초대</T>
          <T size={13} color={C.muted} style={{ marginTop: 4, lineHeight: 21 }}>{INVITE_INTRO}</T>
          <Bone style={{ marginTop: 16, height: 44 }} />
        </Card>
        {times(2, (i) => (
          <Card key={i}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <Line size="xl" w={128} />
              <Bone style={{ height: 20, width: 56, borderRadius: R.pill }} />
            </View>
            <Line size="xs" w={64} style={{ marginTop: 4 }} />
            {/* 문자로 보내기·복사·취소 — 44 버튼 셋 */}
            <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              <Bone style={{ height: 44, width: 128 }} />
              <Bone style={{ height: 44, width: 80 }} />
              <Bone style={{ height: 44, width: 56 }} />
            </View>
          </Card>
        ))}
      </View>
    </Loading>
  );
}

// ── 매장 ─────────────────────────────────────────────

export const LOGO_NOTE = "헤더의 매장 이름 앞에 보여요. PNG·JPG·SVG, 1MB 이하. 가로로 긴 로고가 잘 보여요.";
export const LOCATION_NOTE = "알바생이 이 위치 50m 안에 들어오면 출근 알림을 받아요.";
export const FIVE_PLUS_LABEL = "상시 5인 이상 사업장 (연장근로 50% 가산)";

export function StoreSkeleton() {
  return (
    <Loading>
      <View style={{ gap: 12 }}>
        <Card style={{ gap: 12 }}>
          <View>
            <SectionLabel icon={StoreIcon}>매장 로고</SectionLabel>
            <T size={12} color={C.muted} style={{ marginTop: 6, lineHeight: 19 }}>{LOGO_NOTE}</T>
          </View>
          <View style={{ height: 64, alignItems: "center", justifyContent: "center", borderRadius: R.control, borderWidth: 1, borderStyle: "dashed", borderColor: alpha(C.muted, 0.4), backgroundColor: C.background }}>
            <Bone style={{ height: 40, width: 128 }} />
          </View>
          <Line size="13" w={176} />
        </Card>
        <Card style={{ gap: 12 }}>
          <FieldBone label="매장 이름" />
          <CheckBone label={FIVE_PLUS_LABEL} />
        </Card>
        <Card style={{ gap: 12 }}>
          <View>
            <SectionLabel icon={MapPin}>매장 위치</SectionLabel>
            <T size={12} color={C.muted} style={{ marginTop: 6, lineHeight: 19 }}>{LOCATION_NOTE}</T>
          </View>
          {/* "현재 위치를 매장으로" — 글자 폭 버튼 */}
          <Bone style={{ height: 44, width: 192 }} />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <FieldBone label="위도" style={{ flex: 1 }} />
            <FieldBone label="경도" style={{ flex: 1 }} />
          </View>
        </Card>
        <Bone style={{ height: 44 }} />
      </View>
    </Loading>
  );
}
