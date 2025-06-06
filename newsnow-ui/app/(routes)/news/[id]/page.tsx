import { Suspense } from 'react';
import { NewsDetailContent } from './news-detail-client';
import type { Metadata } from 'next';

// 动态生成元数据
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    // 获取新闻详情
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/news/${params.id}`, {
      cache: 'force-cache',
      next: { revalidate: 3600 } // 1小时缓存
    });
    
    if (!response.ok) {
      return {
        title: 'NewsNow - 新闻详情',
        description: '查看完整新闻内容、分析和相关新闻',
      };
    }
    
    const article = await response.json();
    
    const title = article.title ? `${article.title} - NewsNow` : 'NewsNow - 新闻详情';
    const description = article.summary || article.aiAnalysis?.summary || article.content?.substring(0, 160) || '查看完整新闻内容、分析和相关新闻';
    const publishedTime = article.publishedAt || article.pubDate || article.date;
    const keywords = [
      '新闻', '财经新闻', '实时新闻', '新闻分析',
      ...(article.tags || []),
      ...(article.aiAnalysis?.tags || []),
      article.source || '',
      article.category || ''
    ].filter(Boolean);

    return {
      title,
      description,
      keywords: keywords.join(', '),
      authors: [{ name: article.author || article.source || 'NewsNow' }],
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime,
        authors: [article.author || article.source || 'NewsNow'],
        section: article.category || '财经',
        tags: article.tags || [],
        images: article.imageUrl ? [{
          url: article.imageUrl,
          alt: article.title,
        }] : [],
        url: `https://shishixinwen.news/news/${params.id}`,
        siteName: 'NewsNow',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: article.imageUrl ? [article.imageUrl] : [],
      },
      alternates: {
        canonical: `https://shishixinwen.news/news/${params.id}`,
      },
      robots: 'index, follow',
    };
  } catch (error) {
    console.error('生成元数据失败:', error);
    return {
      title: 'NewsNow - 新闻详情',
      description: '查看完整新闻内容、分析和相关新闻',
    };
  }
}

export default function NewsDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3">加载中...</span>
        </div>
      </div>
    }>
      <NewsDetailContent />
    </Suspense>
  );
}
