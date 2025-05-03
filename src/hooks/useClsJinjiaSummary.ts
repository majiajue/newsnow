import { useState, useCallback } from 'react';
import { myFetch } from '../utils';

interface SummaryPayload {
  id?: string;
  url?: string;
}

interface ArticleData {
  id: string;
  title: string;
  content: string;
  cleanContent: string;
  pubDate: string;
  author: string;
  imageUrl: string;
  url: string;
}

interface AIData {
  summary: string;
  comment: string;
  fullResponse: string;
}

interface SummaryResponse {
  article: ArticleData;
  ai: AIData;
}

export function useClsJinjiaSummary() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (payload: SummaryPayload) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await myFetch('/api/news/cls/jinjia', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      if (response.code === 0 && response.data) {
        setSummary(response.data);
      } else {
        throw new Error(response.message || '获取摘要失败');
      }
    } catch (err) {
      console.error('获取文章摘要出错:', err);
      setError(err instanceof Error ? err.message : '获取摘要时发生未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    summary,
    loading,
    error,
    fetchSummary,
  };
}
