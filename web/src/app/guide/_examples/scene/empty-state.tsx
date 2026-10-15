"use client";
import { CalendarDays, Moon } from "lucide-react";
import { EmptyState } from "@/components/illust";
import { Card } from "@/components/ui";

// 화면에 하나만 둔다. 설명(children)은 없어도 된다
export default function SceneEmptyState() {
  return (
    <Card>
      <EmptyState icon={CalendarDays} accents={[{ icon: Moon, at: "tr" }]} title="이 달 기록이 없어요">
        출근을 누르면 여기에 근무가 쌓여요.
      </EmptyState>
    </Card>
  );
}
