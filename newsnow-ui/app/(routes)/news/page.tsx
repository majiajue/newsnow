import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NewsPageContent } from './news-client';

export const metadata: Metadata = {
  title: 'NewsNow - 财经新闻',
  description: '最新财经新闻、股市动态、经济分析和金融资讯',
};

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">加载中...</div>}>
      <NewsPageContent />
    </Suspense>
  );
}
