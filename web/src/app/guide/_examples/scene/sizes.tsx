"use client";
import { Inbox, Sparkles } from "lucide-react";
import { Scene } from "@/components/illust";

export default function SceneSizes() {
  return (
    <div className="flex items-end gap-8">
      {(["md", "sm"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2 text-xs text-muted">
          <Scene icon={Inbox} accents={[{ icon: Sparkles, at: "tr" }]} size={size} />
          {size}
        </div>
      ))}
    </div>
  );
}
