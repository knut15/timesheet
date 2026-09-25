import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// API 는 별도 서버(server/)다. 브라우저에게는 같은 출처로 보이도록 /api 를 넘긴다 — docs/prd/05-auth.md 토폴로지.
// 빌드 시점에 읽히므로 배포 환경변수 API_URL 을 바꾸면 다시 빌드해야 한다.
const API_URL = process.env.API_URL ?? "http://localhost:4200";

const nextConfig: NextConfig = {
  // /guide 의 문서 페이지는 page.mdx 다 — node_modules/next/dist/docs/01-app/02-guides/mdx.md
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

// Turbopack 에서도 동작한다(@next/mdx 가 turbopack.rules 를 붙인다). 플러그인을 넣으려면 이름 문자열로 준다.
const withMDX = createMDX({ extension: /\.(md|mdx)$/ });

export default withMDX(nextConfig);
