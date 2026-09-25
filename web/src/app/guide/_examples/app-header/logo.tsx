import { AppHeader } from "@/components/shell";

// 매장 로고가 있으면 이름 글자 대신 로고를 둔다(높이 20px, 가로 최대 96px). 매장 이름은 logoAlt 로. 로고는 가이드용 가짜 그림
export default function AppHeaderLogo() {
  return (
    <AppHeader
      eyebrow=""
      title="출퇴근"
      me={{ id: "user-demo-01", nickname: "김하늘" }}
      width="max-w-md"
      logoUrl="/guide/demo-logo.svg"
      logoAlt="데모 카페 성수점"
    />
  );
}
