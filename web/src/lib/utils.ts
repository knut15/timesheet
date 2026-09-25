import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn 컴포넌트가 쓰는 클래스 합치기 (autoqa 와 같은 구성) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
