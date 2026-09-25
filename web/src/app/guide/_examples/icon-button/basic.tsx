"use client";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { IconButton } from "@/components/shell";

export default function IconButtonBasic() {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      <IconButton icon={LogOut} label="로그아웃" onClick={() => setPressed(true)} />
      <p className="text-xs text-muted">{pressed ? "로그아웃 눌림" : "버튼을 눌러 보세요"}</p>
    </div>
  );
}
