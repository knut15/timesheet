// 멤버(알바생) 화면 — 하단 탭 다섯 개. 웹 TimesheetApp.tsx 의 TABS 와 같은 순서·이름·아이콘 (docs/prd/01~04, 06, 08, 09)
import { Redirect, Tabs } from "expo-router";
import { CalendarDays, ClipboardList, Clock, UserRound, Wallet } from "lucide-react-native";
import { useArea } from "@/auth/hooks";
import { AppHeader, TabBar, type TabMeta } from "@/components/shell";
import { MemberDataProvider, useMember } from "@/screens/member/MemberData";
import { C } from "@/theme";

export default function MemberLayout() {
  const { me, redirect } = useArea("member");
  if (redirect) return <Redirect href={redirect} />;
  if (!me?.membership) return null;
  return (
    <MemberDataProvider me={me} membership={me.membership}>
      <MemberTabs />
    </MemberDataProvider>
  );
}

function MemberTabs() {
  const { me, membership, incoming, toThisMonth } = useMember();
  const meta: Record<string, TabMeta> = {
    index: { label: "출퇴근", icon: Clock },
    records: { label: "기록", icon: CalendarDays },
    requests: { label: "요청", icon: ClipboardList, badge: incoming },
    pay: { label: "급여", icon: Wallet },
    me: { label: "내 정보", icon: UserRound },
  };
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} meta={meta} />}
      screenOptions={({ route }) => ({
        sceneStyle: { backgroundColor: C.background },
        header: () => (
          <AppHeader
            eyebrow={membership.store.logoUrl ? "" : membership.store.name}
            logoUrl={membership.store.logoUrl}
            logoAlt={membership.store.name}
            title={meta[route.name]?.label ?? ""}
            me={me.user}
          />
        ),
      })}
      screenListeners={({ route }) => ({ tabPress: () => route.name === "index" && toThisMonth() })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="pay" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
