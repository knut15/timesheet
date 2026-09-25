import { AppHeader } from "@/components/shell";

// 틀 폭 320px — 매장 이름이 길면 한 줄에서 말줄임
export default function AppHeaderTruncate() {
  return <AppHeader eyebrow="데모 카페 성수점 2층 테라스 별관 · 사장님" title="멤버" me={{ id: "user-demo-08", nickname: "Alex Kim" }} />;
}
