import type { NextConfig } from "next";

// API 는 별도 서버(server/)다. 브라우저에게는 같은 출처로 보이도록 /api 를 넘긴다 — docs/prd/05-auth.md 토폴로지.
// 빌드 시점에 읽히므로 배포 환경변수 API_URL 을 바꾸면 다시 빌드해야 한다.
const API_URL = process.env.API_URL ?? "http://localhost:4200";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
