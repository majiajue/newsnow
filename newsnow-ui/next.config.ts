import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*',
      },
    ];
  },
  // 确保查询参数正确传递
  experimental: {
    proxyTimeout: 30000, // 增加超时时间，避免长请求被中断
  },
};

export default nextConfig;
