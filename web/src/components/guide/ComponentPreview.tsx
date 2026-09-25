// 예시 하나를 "미리보기 / 코드" 탭으로 보인다. 서버 컴포넌트다.
//
// 예시 파일 규칙: web/src/app/guide/_examples/<slug>/<name>.tsx, default export 하나.
// MDX 에서는 <ComponentPreview name="<slug>/<name>" /> 로 쓴다.
// 미리보기는 그 파일을 import 해서 그리고, 코드 탭은 같은 파일을 fs 로 읽은 원본이다 — 둘이 어긋날 수 없다.
// 가이드 페이지는 정적 페이지라 fs 읽기는 빌드 때 한 번 돌고, 원본은 만들어진 HTML 에 들어간다.
//
// 틀 옵션 (docs/design/component-guide.md §1-4·§1-5)
// - width: 컴포넌트가 쓰이는 본문 폭. "max-w-md"(멤버) · "max-w-3xl"(마스터) 등 Tailwind 클래스
// - fixed: fixed·sticky 컴포넌트용. 틀에 transform 과 고정 높이를 줘 틀 안에 붙게 한다
// - surface: 틀 바탕을 bg-surface 로 (기본은 bg-background)
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PreviewTabs } from "./PreviewTabs";

const EXAMPLES_DIR = path.join(process.cwd(), "src/app/guide/_examples");

export async function readExample(name: string) {
  return (await readFile(path.join(EXAMPLES_DIR, `${name}.tsx`), "utf8")).trimEnd();
}

export async function ComponentPreview({ name, width, fixed = false, surface = false }: { name: string; width?: string; fixed?: boolean; surface?: boolean }) {
  const [code, mod] = await Promise.all([
    readExample(name),
    import(`@/app/guide/_examples/${name}.tsx`) as Promise<{ default: React.ComponentType }>,
  ]);
  const Example = mod.default;
  const frame = [
    "rounded-2xl border border-line",
    surface ? "bg-surface" : "bg-background",
    fixed ? "relative h-72 overflow-hidden [transform:translateZ(0)]" : "flex min-h-40 flex-wrap items-center justify-center gap-3 p-3 sm:p-6",
  ].join(" ");
  return (
    <PreviewTabs
      frame={frame}
      preview={width ? <div className={`mx-auto w-full ${width}`}><Example /></div> : <Example />}
      code={code}
    />
  );
}
