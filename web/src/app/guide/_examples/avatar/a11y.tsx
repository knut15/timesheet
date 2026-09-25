import { Avatar } from "@/components/shell";

export default function AvatarA11y() {
  return (
    <div className="flex flex-wrap justify-center gap-10 text-sm">
      <div className="flex flex-col items-center gap-2">
        <span className="flex items-center gap-2">
          <Avatar name="최유나" seed="user-demo-04" /> 최유나
        </span>
        <span className="text-xs text-muted">스크린리더: 이름 글자만 읽음</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar name="최유나" seed="user-demo-04" label="최유나" />
        <span className="text-xs text-muted">스크린리더: 최유나, 이미지</span>
      </div>
    </div>
  );
}
