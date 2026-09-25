// "파일 위치" 블록. 컴포넌트가 어느 파일에 있고 어떻게 가져오는지 보인다.
export function FileLocation({ path, importLine }: { path: string; importLine?: string }) {
  return (
    <div className="my-6 rounded-2xl border border-line bg-surface p-4 text-sm">
      <p className="text-xs font-medium text-muted">파일 위치</p>
      <p className="mt-1 break-all font-mono text-[13px]">{path}</p>
      {importLine && (
        <pre className="mt-3 overflow-x-auto rounded-xl bg-background px-3 py-2 text-[13px]">
          <code className="font-mono">{importLine}</code>
        </pre>
      )}
    </div>
  );
}
