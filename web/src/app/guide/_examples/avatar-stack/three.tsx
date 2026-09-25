import { AvatarStack } from "@/components/calendar/AvatarStack";

const PEOPLE = [
  { userId: "user-demo-01", nickname: "김하늘" },
  { userId: "user-demo-05", nickname: "이서준" },
  { userId: "user-demo-06", nickname: "박도윤" },
];

export default function AvatarStackThree() {
  return <AvatarStack people={PEOPLE} />;
}
