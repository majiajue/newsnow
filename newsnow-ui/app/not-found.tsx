'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function NotFoundContent() {
  // 显式使用useSearchParams钩子，即使不需要使用其值
  const searchParams = useSearchParams();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6">页面未找到</h2>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
        抱歉，您请求的页面不存在或已被移动。
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]">加载中...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
