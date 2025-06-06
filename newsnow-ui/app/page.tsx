import { Suspense } from 'react';
import { HomeContent } from './home-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NewsNow - 财经新闻',
  description: '最新财经新闻、股市动态、经济分析和金融资讯',
};

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">财经新闻</h1>
          <p className="text-muted-foreground mb-4">加载中...</p>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
