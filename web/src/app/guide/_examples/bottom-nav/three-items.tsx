"use client";
import { useState } from "react";
import { CalendarDays, Clock, UserRound } from "lucide-react";
import { BottomNav, type NavItem } from "@/components/shell";

const MENU = [
  { key: "clock", label: "출퇴근", icon: Clock },
  { key: "records", label: "기록", icon: CalendarDays },
  { key: "me", label: "내 정보", icon: UserRound },
];

export default function BottomNavThreeItems() {
  const [tab, setTab] = useState("clock");
  const items: NavItem[] = MENU.map((m) => ({ ...m, onSelect: () => setTab(m.key) }));
  return <BottomNav items={items} active={tab} width="max-w-md" />;
}
