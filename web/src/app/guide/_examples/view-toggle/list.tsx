"use client";
import { useState } from "react";
import { ViewToggle } from "@/components/calendar/ViewToggle";

export default function ViewToggleList() {
  const [view, setView] = useState<"calendar" | "list">("list");
  return <ViewToggle value={view} onChange={setView} />;
}
