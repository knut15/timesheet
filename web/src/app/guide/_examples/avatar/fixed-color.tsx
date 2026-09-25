import { Avatar } from "@/components/shell";

const SEEDS = ["user-demo-01", "user-demo-02", "user-demo-03", "user-demo-04", "user-demo-05", "user-demo-06", "user-demo-07", "user-demo-08"];

// 윗줄: 같은 seed 는 이름이 달라도 같은 색. 아랫줄: seed 8개에 8색이 하나씩
export default function AvatarFixedColor() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <Avatar name="박도윤" seed="user-demo-06" />
        <Avatar name="Doyun Park" seed="user-demo-06" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SEEDS.map((seed) => (
          <Avatar key={seed} name="김하늘" seed={seed} size="sm" />
        ))}
      </div>
    </div>
  );
}
