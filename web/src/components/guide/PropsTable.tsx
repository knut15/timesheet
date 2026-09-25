// 컴포넌트 props 표 `Prop · Type · Default · 설명`. 좁은 화면에서는 표만 가로로 스크롤된다.
// required 면 설명 앞에 **필수**, default 가 없으면 "—". 설명 글자는 Inline 서식(`코드`, **굵게**).
import { Inline } from "./Inline";

export type PropRow = { prop: string; type: string; default?: string; required?: boolean; description?: string };

export function PropsTable({ rows, first = "Prop" }: { rows: PropRow[]; first?: string }) {
  return (
    <div className="relative my-6 overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b border-line text-xs text-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">{first}</th>
            <th className="px-4 py-2.5 font-medium">Type</th>
            <th className="px-4 py-2.5 font-medium">Default</th>
            <th className="px-4 py-2.5 font-medium">설명</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.prop} className="align-top">
              <td className="px-4 py-3 font-mono text-[13px] font-medium">{r.prop}</td>
              <td className="px-4 py-3 font-mono text-[13px] text-muted">{r.type}</td>
              <td className="px-4 py-3 font-mono text-[13px] text-muted">{r.default ?? "—"}</td>
              <td className="px-4 py-3 leading-6">
                {r.required && <strong className="mr-1 font-semibold">필수</strong>}
                {r.description && <Inline text={r.description} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
