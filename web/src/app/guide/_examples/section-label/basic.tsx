"use client";
import { Clock } from "lucide-react";
import { SectionLabel } from "@/components/ui";

export default function SectionLabelBasic() {
  return (
    <div className="w-full max-w-xs">
      <SectionLabel icon={Clock}>오늘 근무</SectionLabel>
    </div>
  );
}
