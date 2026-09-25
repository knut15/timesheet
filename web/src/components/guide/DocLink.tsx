// 저장소 문서(스킬·명세·PRD) 링크. 규칙 본문은 복제하지 않고 원본 절을 가리킨다.
// 앱 안에는 문서가 없으므로 GitHub main 의 원본으로 보낸다.
const REPO = "https://github.com/knut15/timesheet/blob/main";

export function DocLink({ path, hash, children }: { path: string; hash?: string; children: React.ReactNode }) {
  return (
    <a href={`${REPO}/${path}${hash ? `#${hash}` : ""}`} className="text-accent underline underline-offset-2">
      {children}
    </a>
  );
}
