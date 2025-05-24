'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArticleDetail } from '@/components/news/article-detail';
import { Button } from '@/components/ui/button';
import { fetchNewsDetail, fetchRelatedNews } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

// 定义新闻详情类型
interface NewsDetail {
  id: string;
  title: string;
  content: string;
  source: string;
  author?: string;
  date: string;
  pubDate?: string;
  publishedAt?: string;
  readTime?: string;
  imageUrl?: string;
  category?: string;
  url?: string;
  tags?: string[];
  summary?: string;
  aiAnalysis?: {
    summary?: string;
    keyPoints?: string[];
    sentiment?: string;
    tags?: string[];
    background?: string;
    impact?: string;
    opinion?: string;
    suggestions?: string[];
  };
}

// 定义相关新闻类型
interface RelatedNews {
  id: string;
  title: string;
  source: string;
  date: string;
  imageUrl?: string;
}

export default function NewsDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [article, setArticle] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<RelatedNews[]>([]);

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
        if (decodedId.includes('%2F')) {
          decodedId = decodeURIComponent(decodedId);
        }
      } catch (e) {
        console.warn('解码 ID 失败，使用原始 ID:', decodedId);
      }
      
      console.log('使用的新闻 ID:', decodedId);
      
      // 使用 fetchNewsDetail 函数获取新闻详情
      const { data, error: apiError } = await fetchNewsDetail(decodedId);
      
      if (apiError) {
        console.error('获取新闻详情失败:', apiError);
        setError(apiError);
        return;
      }
      
      if (data) {
        setArticle(data);
        
        // 使用 fetchRelatedNews 函数获取相关新闻
        try {
          const { data: relatedData, error: relatedError } = await fetchRelatedNews(decodedId);
          if (relatedError) {
            console.warn('获取相关新闻失败:', relatedError);
            return;
          }
          console.log('获取到相关新闻:', relatedData);
          setRelatedNews(relatedData || []);
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 显示错误信息 */}
      {error ? (
        <div className="text-center py-10">
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
        <>
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
        </>
      )}
    </div>
  );
}
