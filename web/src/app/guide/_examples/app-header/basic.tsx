import { AppHeader } from "@/components/shell";

export default function AppHeaderBasic() {
  return <AppHeader eyebrow="데모 카페 성수점" title="출퇴근" me={{ id: "user-demo-01", nickname: "김하늘" }} width="max-w-md" />;
}
