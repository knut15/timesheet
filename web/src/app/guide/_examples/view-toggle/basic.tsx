"use client";
import { useState } from "react";
import { ViewToggle } from "@/components/calendar/ViewToggle";

export default function ViewToggleBasic() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  return <ViewToggle value={view} onChange={setView} />;
}
