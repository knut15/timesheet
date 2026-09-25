"use client";
import { Avatar, initials } from "@/components/shell";

const PEOPLE = [
  { name: "김하늘", seed: "user-demo-01" },
  { name: "Alex Kim", seed: "user-demo-08" },
  { name: "Mia", seed: "user-demo-02" },
  { name: " ", seed: "user-demo-03" },
];

// 한글은 첫 글자, 로마자는 두 글자 대문자, 빈 이름은 "?"
export default function AvatarInitials() {
  return (
    <ul className="flex flex-wrap justify-center gap-6">
      {PEOPLE.map((p) => (
        <li key={p.seed} className="flex flex-col items-center gap-1.5 text-xs">
          <Avatar name={p.name} seed={p.seed} />
          <code className="font-mono">
            {JSON.stringify(p.name)} → {JSON.stringify(initials(p.name))}
          </code>
        </li>
      ))}
    </ul>
  );
}
