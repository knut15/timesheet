"use client";
import { useState } from "react";
import { CalendarDays, ClipboardList, Clock, UserRound, Wallet } from "lucide-react";
import { BottomNav, type NavItem } from "@/components/shell";

const MENU = [
  { key: "clock", label: "출퇴근", icon: Clock },
  { key: "records", label: "기록", icon: CalendarDays },
  { key: "requests", label: "요청", icon: ClipboardList },
  { key: "pay", label: "급여", icon: Wallet },
  { key: "me", label: "내 정보", icon: UserRound },
];

export default function BottomNavBasic() {
  const [tab, setTab] = useState("clock");
  const items: NavItem[] = MENU.map((m) => ({ ...m, onSelect: () => setTab(m.key) }));
  return <BottomNav items={items} active={tab} width="max-w-md" />;
}
