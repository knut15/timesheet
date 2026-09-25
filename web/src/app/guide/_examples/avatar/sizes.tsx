import { Avatar } from "@/components/shell";

export default function AvatarSizes() {
  return (
    <div className="flex items-end gap-4">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-1.5 text-xs text-muted">
          <Avatar name="이서준" seed="user-demo-05" size={size} />
          {size}
        </div>
      ))}
    </div>
  );
}
