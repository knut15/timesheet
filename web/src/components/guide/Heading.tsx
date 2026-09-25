// 가이드 절 제목. 글자에서 id 를 만들고 옆에 "#" 링크를 붙인다 — 주소로 절을 바로 가리킬 수 있다.
import type { ReactNode } from "react";

/** children 안의 글자만 이어 붙인다. `code` 같은 요소가 섞여도 글자는 남는다. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

/** 한글·영문·숫자는 두고 나머지는 "-" 로. "미리보기 / 코드" → "미리보기-코드" */
export function slugify(text: string) {
  return text.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}

const STYLE = {
  2: "mt-12 mb-3 text-xl font-semibold tracking-tight",
  3: "mt-8 mb-2 text-base font-semibold",
} as const;

export function Heading({ level, id, children }: { level: 2 | 3; id?: string; children: ReactNode }) {
  const anchor = id ?? slugify(textOf(children));
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag id={anchor} className={`group scroll-mt-20 ${STYLE[level]}`}>
      {children}
      <a href={`#${anchor}`} className="ml-2 text-muted opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100" aria-label="이 절 주소">
        #
      </a>
    </Tag>
  );
}
