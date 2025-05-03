/**
 * 财联社新闻 Hook
 * 用于获取财联社的新闻数据
 */

import { useState, useEffect } from 'react'
import { myFetch } from '~/utils'

// 财联社新闻类型
export interface CLSNewsItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  pubDate: string;
  source: string;
  category?: string;
  tags?: string[];
  author?: string;
  imageUrl?: string;
}

// 分页信息
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

// 新的响应类型
interface CLSNewsResponse {
  code: number;
  data: CLSNewsItem[];
  pagination: Pagination;
  message?: string;
}

// 新的详情响应类型
interface CLSNewsDetailResponse {
  code: number;
  data: CLSNewsItem;
  message?: string;
}

/**
 * 获取财联社快讯
 */
export function useClsFlashNews(initialPage = 1, initialPageSize = 20) {
  const [news, setNews] = useState<CLSNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: initialPage,
    pageSize: initialPageSize,
    total: 0
  });

  const fetchNews = async (page = pagination.page, pageSize = pagination.pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const response = await myFetch(`/api/news/cls/flash?page=${page}&pageSize=${pageSize}`) as CLSNewsResponse;
      
      if (response.code === 0 && response.data) {
        setNews(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.message || '获取财联社快讯失败');
      }
    } catch (err: any) {
      setError(err.message || '获取财联社快讯出错');
      console.error('获取财联社快讯出错:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(initialPage, initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    news,
    loading,
    error,
    pagination,
    fetchNews,
    refresh: () => fetchNews(pagination.page, pagination.pageSize)
  };
}

/**
 * 获取财联社文章
 */
export function useClsArticles(initialPage = 1, initialPageSize = 20) {
  const [articles, setArticles] = useState<CLSNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: initialPage,
    pageSize: initialPageSize,
    total: 0
  });

  const fetchArticles = async (page = pagination.page, pageSize = pagination.pageSize) => {
    setLoading(true);
    setError(null);
    try {
      // 使用原来的API端点
      const response = await myFetch(`/api/news/cls/articles?page=${page}&pageSize=${pageSize}`) as CLSNewsResponse;
      
      if (response.code === 0 && response.data) {
        setArticles(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.message || '获取财联社文章失败');
      }
    } catch (err: any) {
      setError(err.message || '获取财联社文章出错');
      console.error('获取财联社文章出错:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(initialPage, initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    articles,
    loading,
    error,
    pagination,
    fetchArticles,
    refresh: () => fetchArticles(pagination.page, pagination.pageSize)
  };
}

/**
 * 获取财联社文章详情
 */
export function useClsArticleDetail(id: string) {
  const [article, setArticle] = useState<CLSNewsItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = async (articleId: string) => {
    if (!articleId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await myFetch(`/api/news/cls/detail?id=${articleId}`) as CLSNewsDetailResponse;
      
      if (response.code === 0 && response.data) {
        setArticle(response.data);
      } else {
        setError(response.message || '获取财联社文章详情失败');
      }
    } catch (err: any) {
      setError(err.message || '获取财联社文章详情出错');
      console.error('获取财联社文章详情出错:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
  }, [id]);

  return {
    article,
    loading,
    error,
    fetchArticle,
    refresh: () => fetchArticle(id)
  };
}
