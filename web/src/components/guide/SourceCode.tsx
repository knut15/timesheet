// 예시들이 같이 쓰는 데이터 파일의 원본만 보인다 (미리보기 없음). 파일 위치는 ComponentPreview 와 같은 _examples 아래.
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { readExample } from "./ComponentPreview";

export async function SourceCode({ name }: { name: string }) {
  const code = await readExample(name);
  return (
    <div className="my-6 min-w-0">
      <p className="mb-2 font-mono text-xs text-muted">{`_examples/${name}.tsx`}</p>
      <ScrollArea className="overflow-hidden rounded-2xl border border-line bg-surface [&>[data-slot=scroll-area-viewport]]:max-h-[28rem]">
        <pre className="p-4 text-[13px] leading-6">
          <code className="font-mono">{code}</code>
        </pre>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
