'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArticleDetail } from '@/components/news/article-detail';
import { Button } from '@/components/ui/button';

export default function NewsDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState([]);

  // 获取新闻详情
  const fetchArticle = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // 获取新闻详情
      const response = await fetch(`/api/news/${id}`);
      const data = await response.json();
      setArticle(data);
      
      // 获取相关新闻
      const relatedResponse = await fetch(`/api/news/${id}/related`);
      const relatedData = await relatedResponse.json();
      setRelatedNews(relatedData || []);
    } catch (error) {
      console.error('获取新闻详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    fetchArticle();
  }, [id]);

  // 处理返回
  const handleBack = () => {
    router.back();
  };

  // 处理相关新闻点击
  const handleRelatedNewsClick = (id: string) => {
    router.push(`/news/${id}`);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <ArticleDetail
        article={article}
        loading={loading}
        onBack={handleBack}
      />
      
      {/* 相关新闻 */}
      {!loading && relatedNews.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">相关新闻</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedNews.map((item) => (
              <div 
                key={item.id} 
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleRelatedNewsClick(item.id)}
              >
                {item.imageUrl && (
                  <div className="h-40 bg-muted relative">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-medium line-clamp-2 mb-2">{item.title}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{item.source}</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
