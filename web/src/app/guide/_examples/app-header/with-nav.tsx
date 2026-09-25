"use client";
import { useState } from "react";
import { CalendarDays, ClipboardList, Clock, UserRound, Wallet } from "lucide-react";
import { AppHeader, BottomNav, type NavItem } from "@/components/shell";

const MENU = [
  { key: "clock", label: "출퇴근", icon: Clock },
  { key: "records", label: "기록", icon: CalendarDays },
  { key: "requests", label: "요청", icon: ClipboardList },
  { key: "pay", label: "급여", icon: Wallet },
  { key: "me", label: "내 정보", icon: UserRound },
];

// 제목은 활성 메뉴 이름과 같다 — 메뉴를 눌러 보면 제목이 따라 바뀐다
export default function AppHeaderWithNav() {
  const [tab, setTab] = useState("records");
  const items: NavItem[] = MENU.map((m) => ({ ...m, onSelect: () => setTab(m.key) }));
  const title = MENU.find((m) => m.key === tab)!.label;
  return (
    <>
      <AppHeader eyebrow="데모 카페 성수점" title={title} me={{ id: "user-demo-01", nickname: "김하늘" }} width="max-w-md" />
      <BottomNav items={items} active={tab} width="max-w-md" />
    </>
  );
}
