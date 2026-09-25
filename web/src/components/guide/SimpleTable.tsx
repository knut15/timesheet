// 일반 표. 칸 글자는 Inline 서식(`코드`, **굵게**)을 쓴다. 좁은 화면에서는 표만 가로로 스크롤된다.
import { Inline } from "./Inline";

export function SimpleTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="relative my-6 overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-2.5 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-3 leading-6">
                  <Inline text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
