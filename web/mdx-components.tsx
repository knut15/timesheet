// MDX 가 만드는 HTML 요소를 기존 색 토큰(globals.css)으로 그린다. App Router 에서 @next/mdx 를 쓰려면 이 파일이 있어야 한다.
// 가이드 전용 블록(ComponentPreview·PropsTable·SimpleTable 등)도 여기 등록해 MDX 에서 import 없이 쓴다.
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { MDXComponents } from "mdx/types";
import { ComponentPreview } from "@/components/guide/ComponentPreview";
import { DocLink } from "@/components/guide/DocLink";
import { FileLocation } from "@/components/guide/FileLocation";
import { ColorTokens, ComponentCards, IconGrid, TokenSummary, TypeScale } from "@/components/guide/Foundations";
import { Heading } from "@/components/guide/Heading";
import { PropsTable } from "@/components/guide/PropsTable";
import { SimpleTable } from "@/components/guide/SimpleTable";
import { SourceCode } from "@/components/guide/SourceCode";

const components = {
  h1: ({ children }) => <h1 className="text-2xl font-bold tracking-tight">{children}</h1>,
  h2: ({ children, id }) => <Heading level={2} id={id}>{children}</Heading>,
  h3: ({ children, id }) => <Heading level={3} id={id}>{children}</Heading>,
  p: ({ children }) => <p className="my-3 leading-7">{children}</p>,
  a: ({ children, href }) => <a href={href} className="text-accent underline underline-offset-2">{children}</a>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5 leading-7 marker:text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5 leading-7 marker:text-muted">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-line pl-4 text-muted">{children}</blockquote>,
  hr: () => <hr className="my-10 border-line" />,
  // 글 속 code 는 옅은 바탕, pre 안의 code 는 바탕 없이 — 하이라이트는 넣지 않는다
  code: ({ children }) => (
    <code className="rounded bg-line/70 px-1 py-0.5 font-mono text-[0.9em] [pre_&]:bg-transparent [pre_&]:p-0 [pre_&]:text-[13px]">{children}</code>
  ),
  pre: ({ children }) => (
    <ScrollArea className="my-4 overflow-hidden rounded-2xl border border-line bg-surface">
      <pre className="p-4 leading-6">{children}</pre>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
  // 마크다운 표 문법(GFM)은 플러그인이 없어 쓰지 않는다. JSX 로 쓴 표에만 걸린다
  table: ({ children }) => (
    <ScrollArea className="my-6 overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full text-left text-sm">{children}</table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
  th: ({ children }) => <th className="border-b border-line px-4 py-2.5 text-xs font-medium text-muted">{children}</th>,
  td: ({ children }) => <td className="border-b border-line px-4 py-3 align-top">{children}</td>,
  ComponentPreview,
  PropsTable,
  FileLocation,
  SimpleTable,
  SourceCode,
  DocLink,
  TokenSummary,
  ColorTokens,
  TypeScale,
  IconGrid,
  ComponentCards,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
