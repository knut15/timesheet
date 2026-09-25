import { AvatarStack } from "@/components/calendar/AvatarStack";

const PEOPLE = [
  { userId: "user-demo-01", nickname: "김하늘" },
];

export default function AvatarStackBasic() {
  return <AvatarStack people={PEOPLE} />;
}
