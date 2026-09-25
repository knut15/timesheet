// 표 칸 글자용 작은 서식. `코드` 와 **굵게** 만 알아본다.
// MDX 의 마크다운 표(GFM)는 플러그인이 없어 쓸 수 없으므로, 표는 문자열 배열로 넘기고 여기서 서식을 입힌다.
import { Fragment } from "react";

export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") && p.length > 1 ? (
          <code key={i} className="rounded bg-line/70 px-1 py-0.5 font-mono text-[0.9em]">{p.slice(1, -1)}</code>
        ) : p.startsWith("**") && p.endsWith("**") && p.length > 3 ? (
          <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
