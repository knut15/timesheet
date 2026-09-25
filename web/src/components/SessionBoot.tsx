"use client";
import { useBootSession } from "@/auth/hooks";

export function SessionBoot() {
  useBootSession();
  return null;
}
