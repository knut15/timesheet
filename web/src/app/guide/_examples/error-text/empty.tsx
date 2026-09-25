import { ErrorText } from "@/components/ui";

export default function ErrorTextEmpty() {
  const error = "";
  return (
    <div className="text-center">
      <p className="text-xs text-muted">이 아래에 아무것도 없다</p>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
