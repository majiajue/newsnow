/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // 关闭严格模式以避免一些开发时的双重渲染
  output: 'standalone',
  // 禁用TypeScript类型检查
  typescript: {
    ignoreBuildErrors: true,
  },
  // 禁用ESLint检查
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 允许使用<img>标签
  images: {
    unoptimized: true,
  },
  // 实验性功能配置
  experimental: {
    // 禁用元数据验证
    typedRoutes: false,
    // 设置代理超时时间
    proxyTimeout: 30000,
    // 禁用严格的元数据验证
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // 禁用客户端组件的服务器端渲染
  serverExternalPackages: [],
  // 禁用严格的元数据验证
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
}

module.exports = nextConfig
