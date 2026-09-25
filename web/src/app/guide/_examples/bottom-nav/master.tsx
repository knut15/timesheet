"use client";
import { useState } from "react";
import { CalendarDays, Inbox, LayoutDashboard, Store, Users } from "lucide-react";
import { BottomNav, type NavItem } from "@/components/shell";

// 실제 마스터 화면은 href(라우트)로 이동한다. 가이드에서는 이동하지 않도록 onSelect 로 바꿔 쓴다
const MENU = [
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { key: "calendar", label: "달력", icon: CalendarDays },
  { key: "requests", label: "요청", icon: Inbox },
  { key: "members", label: "멤버", icon: Users },
  { key: "store", label: "매장", icon: Store },
];

export default function BottomNavMaster() {
  const [tab, setTab] = useState("requests");
  const items: NavItem[] = MENU.map((m) => ({ ...m, onSelect: () => setTab(m.key) }));
  return <BottomNav items={items} active={tab} width="max-w-md" />;
}
