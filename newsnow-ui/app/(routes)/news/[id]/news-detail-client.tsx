'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArticleDetail } from '@/components/news/article-detail';
import { Button } from '@/components/ui/button';
import { fetchNewsDetail, fetchRelatedNews, NewsDetail } from '@/lib/api';

// 动态导入图标组件
const ArrowLeft = dynamic(() => import('lucide-react').then(mod => mod.ArrowLeft), { ssr: false });

// 使用从 lib/api.ts 导入的 NewsDetail 类型和 NewsItem 类型
import { NewsItem } from '@/lib/api';

export function NewsDetailContent() {
  const router = useRouter();
  const { id } = useParams();
  const [article, setArticle] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);

  // 错误状态
  const [error, setError] = useState<string>('');

  // 获取新闻详情
  const fetchArticle = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 解码 ID，如果已经被编码
      let decodedId = id as string;
      try {
        if (decodedId.includes('%2F') || decodedId.includes('%')) {
          decodedId = decodeURIComponent(decodedId);
        }
      } catch (e) {
        console.warn('解码 ID 失败，使用原始 ID:', decodedId);
      }
      
      console.log('使用的新闻 ID:', decodedId);
      
      // 提取简单ID，去除路径前缀
      const idParts = decodedId.split('/');
      const simpleId = idParts[idParts.length - 1];
      console.log('提取的简单ID:', simpleId);
      
      // 直接发送请求到后端 API
      const response = await fetch(`/api/news/${simpleId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('获取新闻详情失败:', response.status, errorText);
        setError(`获取新闻详情失败: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log('获取到的原始数据:', data);
      
      if (data) {
        // 处理数据字段映射
        const articleData: NewsDetail = {
          id: data.id || simpleId,
          title: data.title || '',
          content: data.content || '',
          source: data.source || '',
          date: data.pubDate || data.publishedAt || new Date().toISOString(),
          publishedAt: data.publishedAt || data.pubDate,
          author: data.author,
          imageUrl: data.imageUrl || '',
          category: data.category || '',
          url: data.url || '',
          tags: data.tags || [],
          summary: data.summary || '',
          metadata: data.metadata || {},
          aiAnalysis: data.aiAnalysis || undefined
        };
        
        console.log('处理后的文章数据:', articleData);
        setArticle(articleData);
        
        // 获取相关新闻
        try {
          const relatedResponse = await fetch(`/api/news/${simpleId}/related`);
          
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            console.log('获取到相关新闻:', relatedData);
            
            if (Array.isArray(relatedData)) {
              // 处理相关新闻数据
              const formattedRelatedNews = relatedData.map(item => ({
                id: item.id || '',
                title: item.title || '',
                source: item.source || '',
                date: item.pub_date || item.pubDate || item.publishedAt || '',
                imageUrl: item.image_url || item.imageUrl || ''
              }));
              
              console.log('格式化后的相关新闻:', formattedRelatedNews);
              setRelatedNews(formattedRelatedNews);
            }
          } else {
            console.warn('获取相关新闻失败:', relatedResponse.status);
          }
        } catch (relatedError) {
          console.error('获取相关新闻失败:', relatedError);
        }
      }
    } catch (error) {
      console.error('获取新闻详情失败:', error);
      setError('获取新闻详情时发生错误，请稍后再试');
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
    // 提取ID的最后部分，去除路径前缀
    const idParts = id.split('/');
    const simpleId = idParts[idParts.length - 1];
    router.push(`/news/${simpleId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error ? (
        <div>
          <Button variant="ghost" size="sm" className="mb-6" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">新闻不存在</h2>
            <p className="text-gray-700 dark:text-gray-300">{error}</p>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">推荐其他热门新闻</h3>
            <Button onClick={() => router.push('/news')} className="mt-2">
              浏览所有新闻
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-8">
            {article ? (
              <ArticleDetail
                article={article}
                loading={loading}
                onBack={handleBack}
              />
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          
          {/* 侧边栏 - 相关新闻 */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              {/* 相关新闻 */}
              {!loading && article && relatedNews.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-bold mb-4">相关新闻</h2>
                  <div className="space-y-4">
                    {relatedNews.map((item) => (
                      <div 
                        key={item.id} 
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleRelatedNewsClick(item.id)}
                      >
                        {item.imageUrl && (
                          <div className="h-32 bg-muted relative">
                            <img 
                              src={item.imageUrl} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-3">
                          <h3 className="font-medium text-sm line-clamp-2 mb-2">{item.title}</h3>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
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
          </div>
        </div>
      )}
    </div>
  );
}
