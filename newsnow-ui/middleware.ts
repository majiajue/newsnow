import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // 检查是否匹配 /news/cn/news-detail/XXXX 格式
  if (pathname.startsWith('/news/cn/news-detail/')) {
    // 不需要重定向，直接使用原始路径作为 ID
    return NextResponse.next()
  }

  return NextResponse.next()
}

// 只对特定路径应用中间件
export const config = {
  matcher: ['/news/cn/news-detail/:path*'],
}
