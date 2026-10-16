// 마스터 하단 탭 다섯 개 — 웹 app/admin/layout.tsx 의 NAV 와 같은 순서·이름·아이콘. 요청 배지는 이번 달 대기 수
import { Tabs, usePathname } from "expo-router";
import { CalendarDays, Inbox, LayoutDashboard, LogOut, Store, Users } from "lucide-react-native";
import { api } from "@/api/client";
import { logout, useSession } from "@/auth/session";
import { AppHeader, TabBar, type TabMeta } from "@/components/shell";
import { IconButton } from "@/components/ui";
import { useApi } from "@/lib/useApi";
import { C } from "@/theme";

export default function AdminTabs() {
  const session = useSession();
  const pathname = usePathname();
  // 화면을 옮길 때마다 대기 수를 다시 센다 — 요청 화면에서 처리하고 나오면 배지가 줄어든다
  const month = new Date().toISOString().slice(0, 7);
  const dash = useApi(() => api.GET("/api/stores/me/dashboard", { params: { query: { month } } }), `${pathname}|${month}`);
  if (session.status !== "authenticated" || !session.me.membership) return null;
  const { user, membership } = session.me;
  const meta: Record<string, TabMeta> = {
    index: { label: "대시보드", icon: LayoutDashboard },
    calendar: { label: "달력", icon: CalendarDays },
    requests: { label: "요청", icon: Inbox, badge: dash.data?.pendingRequests },
    members: { label: "멤버", icon: Users },
    store: { label: "매장", icon: Store },
  };
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} meta={meta} />}
      screenOptions={({ route }) => ({
        sceneStyle: { backgroundColor: C.background },
        header: () => (
          <AppHeader
            eyebrow={membership.store.logoUrl ? "사장님" : `${membership.store.name} · 사장님`}
            title={meta[route.name]?.label ?? ""}
            me={user}
            logoUrl={membership.store.logoUrl}
            logoAlt={membership.store.name}
            actions={<IconButton icon={LogOut} label="로그아웃" onPress={() => logout()} />}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="members" />
      <Tabs.Screen name="store" />
    </Tabs>
  );
}
