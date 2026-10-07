// autofix 감지 설정. 설계: ~/Workspace/autofix/docs/design.md 4절
export default {
  baseBranch: "release",
  // 밤 작업 worktree 준비: 무시된 .env 는 복사만 하고, 의존성 설치와 Prisma 클라이언트 생성을 한다
  worktree: { copy: ["server/.env"], setup: "pnpm install --frozen-lockfile && pnpm --filter timesheet-server generate" },
  rules: ["CLAUDE.md", "web/AGENTS.md", "docs/team/roles.md"],
  services: [
    { name: "db", start: "pnpm --filter timesheet-server db:up", once: true },
    { name: "api", start: "pnpm dev:server", ready: "http://localhost:4200/health" },
    { name: "web", start: "API_URL=http://localhost:4200 pnpm dev:web", ready: "http://localhost:3200" },
  ],
  checks: [
    { name: "typecheck", run: "pnpm typecheck", parser: "tsc" },
    { name: "unit", run: "pnpm --filter timesheet-web test", parser: "node-test" },
    { name: "e2e", run: "pnpm --filter timesheet-server test:e2e", parser: "node-test", needs: ["api"] },
    { name: "lint", run: "pnpm --filter timesheet-web lint", parser: "eslint" },
    { name: "build", run: "pnpm --filter timesheet-web build" },
  ],
  crawl: {
    baseUrl: "http://localhost:3200",
    seed: "node scripts/autofix-seed.mjs", // 계정별 Playwright storageState 파일을 만든다
    accounts: ["guest", "master", "member"],
    // 동적 라우트 /admin/members/[userId] 는 P1 에서 뺀다
    routes: [
      "/", "/login", "/signup", "/onboarding", "/join",
      "/admin", "/admin/calendar", "/admin/invites", "/admin/members", "/admin/requests", "/admin/store",
      "/guide", "/guide/foundations",
      "/guide/components/app-header",
      "/guide/components/avatar",
      "/guide/components/avatar-stack",
      "/guide/components/bottom-nav",
      "/guide/components/calendar-legend",
      "/guide/components/card",
      "/guide/components/error-text",
      "/guide/components/field",
      "/guide/components/icon-button",
      "/guide/components/month-grid",
      "/guide/components/month-picker",
      "/guide/components/pay-view",
      "/guide/components/spinner",
      "/guide/components/status-pill",
      "/guide/components/view-toggle",
    ],
  },
  logs: [
    { service: "api", pattern: '"level":(50|60)' },
    { service: "web", pattern: "⨯|Error:" },
  ],
  allowlist: "docs/autofix/allowlist.json",
  notes: "docs/bugs",
  reports: "docs/autofix/reports",
  cards: { glob: "docs/team/tasks/*.md", status: /^- 상태: (\w+)/m, ready: "ready", review: "review", blocked: "blocked" },
  sensitive: ["server/src/auth/**", "server/src/contract.ts", "server/prisma/**", "web/src/lib/pay.ts", "web/src/auth/**"],
  forbid: ["Bash(vercel*)", "Bash(prisma migrate reset*)", "Bash(*neon.tech*)"],
  limits: { tasks: 10, until: "07:00", stepMinutes: 20, attempts: 3 },
  models: { cheap: "haiku", mid: "sonnet", top: "opus" },
};
