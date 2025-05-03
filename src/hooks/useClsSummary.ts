/**
 * 财联社文章摘要和评论 Hook
 */
import { useState } from 'react';
import { myFetch } from '~/utils';

// 财联社文章详情类型（包含摘要和评论）
export interface CLSArticleWithSummary {
  id: string;
  title: string;
  content: string;
  textContent: string;
  url: string;
  pubDate: string;
  source: string;
  author?: string;
  tags?: string[];
  category?: string;
  summary: string;
  comment: string;
}

// 响应类型
interface CLSSummaryResponse {
  code: number;
  data: CLSArticleWithSummary;
  message?: string;
}

/**
 * 获取财联社文章摘要和评论
 */
export function useClsSummary() {
  const [article, setArticle] = useState<CLSArticleWithSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async (idOrUrl: string) => {
    if (!idOrUrl) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 判断是ID还是URL
      const isUrl = idOrUrl.includes('cls.cn') || idOrUrl.includes('http');
      const payload = isUrl ? { url: idOrUrl } : { id: idOrUrl };
      
      const response = await myFetch('/api/news/cls/summary', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      }) as CLSSummaryResponse;
      
      if (response.code === 0 && response.data) {
        setArticle(response.data);
      } else {
        setError(response.message || '获取文章摘要和评论失败');
      }
    } catch (err: any) {
      setError(err.message || '获取文章摘要和评论出错');
      console.error('获取文章摘要和评论出错:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    article,
    loading,
    error,
    generateSummary
  };
}
