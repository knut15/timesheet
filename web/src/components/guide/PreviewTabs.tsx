"use client";
// ComponentPreview 의 탭 부분. 미리보기(렌더된 예시)와 코드(예시 원본)를 번갈아 보인다.
import { useId, useState } from "react";

const TABS = [
  { key: "preview", label: "미리보기" },
  { key: "code", label: "코드" },
] as const;

export function PreviewTabs({ preview, code, frame }: { preview: React.ReactNode; code: string; frame: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("preview");
  const id = useId();
  return (
    <div className="my-6 min-w-0">
      <div role="tablist" aria-label="예시 보기 방식" className="flex gap-4 border-b border-line">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`${id}-${t.key}-tab`}
              aria-selected={on}
              aria-controls={`${id}-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${on ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {/* 둘 다 그려 두고 숨긴다 — 코드 탭도 HTML 에 들어가 검색·복사가 된다 */}
      <div
        role="tabpanel"
        id={`${id}-preview`}
        aria-labelledby={`${id}-preview-tab`}
        hidden={tab !== "preview"}
        className={`mt-4 ${frame}`}
      >
        {preview}
      </div>
      <div role="tabpanel" id={`${id}-code`} aria-labelledby={`${id}-code-tab`} hidden={tab !== "code"} className="mt-4">
        <pre className="max-h-[28rem] overflow-auto rounded-2xl border border-line bg-surface p-4 text-[13px] leading-6">
          <code className="font-mono">{code}</code>
        </pre>
      </div>
    </div>
  );
}
