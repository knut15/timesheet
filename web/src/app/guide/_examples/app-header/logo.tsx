import { AppHeader } from "@/components/shell";

// 매장 로고가 있으면 eyebrow 줄 앞에 둔다(높이 20px, 가로 최대 96px). 로고는 가이드용 가짜 그림
export default function AppHeaderLogo() {
  return (
    <AppHeader
      eyebrow="데모 카페 성수점"
      title="출퇴근"
      me={{ id: "user-demo-01", nickname: "김하늘" }}
      width="max-w-md"
      logoUrl="/guide/demo-logo.svg"
    />
  );
}
