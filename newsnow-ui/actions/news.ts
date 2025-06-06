'use server';

import { apiGet } from '../lib/api-client';

interface NewsItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  source: string;
  publishedAt?: string;
  pubDate?: string;
  url: string;
  imageUrl?: string;
  category?: string;
  author?: string;
  tags?: string[];
  summary?: string;
}

interface NewsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  source?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface NewsListResponse {
  items: NewsItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface ApiNewsResponse {
  data: any[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface NewsDetail extends NewsItem {
  content: string;
  relatedArticles?: NewsItem[];
}

// 从后端API获取新闻列表
export async function fetchNewsList(params: NewsListParams): Promise<NewsListResponse> {
  try {
    // 准备API请求参数
    const apiParams: Record<string, any> = {
      page: params.page || 1,
      page_size: params.pageSize || 10,
    };
    
    // 添加可选参数
    if (params.search) apiParams.query = params.search;
    if (params.category) apiParams.category = params.category;
    if (params.source) apiParams.source = params.source;
    
    // 调用后端API
    const response = await apiGet<ApiNewsResponse>('/api/news', apiParams);
    
    // 转换响应数据格式
    const items = response.data.map(item => ({
      id: item.id || '',
      title: item.title || '',
      description: item.description || '',
      content: item.content || '',
      source: item.source || '',
      publishedAt: item.publishedAt || item.pubDate || '',
      pubDate: item.pubDate || item.publishedAt || '',
      url: item.url || '',
      imageUrl: item.imageUrl || item.image_url || '',
      category: item.category || '',
      author: item.author || '',
      tags: item.tags || [],
      summary: item.summary || '',
    }));
    
    return {
      items,
      pagination: response.pagination,
    };
  } catch (error) {
    console.error('获取新闻列表失败:', error);
    
    // 发生错误时返回空数据
    return {
      items: [],
      pagination: {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

// 从后端API获取新闻详情
export async function fetchNewsDetail(id: string): Promise<NewsDetail | null> {
  try {
    // 处理ID，去除路径前缀
    let decodedId = id;
    try {
      if (id.includes('%')) {
        decodedId = decodeURIComponent(id);
      }
    } catch (e) {
      console.warn('解码 ID 失败，使用原始 ID:', id);
    }
    
    // 提取简单ID，去除路径前缀
    const idParts = decodedId.split('/');
    const simpleId = idParts[idParts.length - 1];
    
    // 调用后端API
    const response = await apiGet<NewsDetail>(`/api/news/${simpleId}`, {});
    
    if (!response) {
      return null;
    }
    
    // 获取相关新闻
    const relatedResponse = await apiGet<NewsItem[]>(`/api/news/${simpleId}/related`, {
      limit: 5
    });
    
    // 组合新闻详情和相关新闻
    return {
      ...response,
      relatedArticles: relatedResponse || []
    };
  } catch (error) {
    console.error('获取新闻详情失败:', error);
    return null;
  }
}
