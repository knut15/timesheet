import { Bone, Card, Loading } from "@/components/ui";

// 불러온 카드와 같은 틀 — 글자 줄마다 그 줄 높이 칸(text-sm h-5, text-2xl h-8) 안에 막대
export default function SkeletonBasic() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <p className="text-sm text-muted">이번 주 근무</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">18시간 30분</p>
      </Card>
      <Loading>
        <Card>
          <div className="flex h-5 items-center"><Bone className="h-3.5 w-20" /></div>
          <div className="mt-1 flex h-8 items-center"><Bone className="h-6 w-28" /></div>
        </Card>
      </Loading>
    </div>
  );
}
