/**
 * 统一的API请求函数
 */

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    // 使用环境变量获取API地址
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const url = `${baseUrl}${endpoint}`;
    console.log(`发送请求到: ${url}`);
    
    // 使用 fetch API
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      mode: 'cors', // 显式指定跨域模式
    });
    
    console.log(`响应状态: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`请求失败: ${response.status} ${response.statusText}`);
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('API响应数据:', responseData);
    
    // 检查是否有错误字段
    if (responseData && responseData.error) {
      throw new Error(responseData.error || responseData.message || '请求失败');
    }
    
    // 检查响应格式，如果有data字段，则返回data，否则返回整个响应
    const result = responseData.data !== undefined ? responseData.data : responseData;
    
    return { data: result as T, error: null };
  } catch (error) {
    console.error(`API请求错误 [${endpoint}]:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 获取新闻列表
 */
export interface NewsListParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  source?: string;
  q?: string;
}

export async function fetchNewsList(params: NewsListParams) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.source) searchParams.set('source', params.source);
  if (params.q) searchParams.set('q', params.q);
  
  const queryString = searchParams.toString();
  // 使用正确的API路径
  return fetchApi<{
    data: NewsItem[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>(`/api/news?${queryString}`);
}

/**
 * 获取新闻详情
 */
export async function fetchNewsDetail(id: string) {
  // 首先检查 ID 是否包含路径前缀
  // 提取简单ID，去除路径前缀
  
  // 先解码以确保处理正确
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
  
  console.log('获取新闻详情，使用简单ID:', simpleId);
  
  // 直接使用简单ID获取新闻详情
  return fetchApi<NewsDetail>(`/api/news/${simpleId}`);
}

// 相关新闻函数已经在下面实现

// 类型定义
export interface NewsItem {
  id: string;
  title: string;
  description?: string;
  source: string;
  date: string;
  readTime?: string;
  imageUrl?: string;
  category?: string;
  url?: string;
  publishedAt?: string;
  author?: string;
  tags?: string[];
  summary?: string;
}

export interface NewsDetail extends NewsItem {
  content: string;
  relatedArticles?: Array<{
    id: string;
    title: string;
    source: string;
    date: string;
    imageUrl?: string;
  }>;
  // 添加metadata字段，用于接收后端返回的分析数据
  metadata?: {
    analysisData?: {
      summary?: string;
      keyPoints?: string[];
      background?: string;
      impact?: string;
      opinion?: string;
      comment?: string;
      suggestions?: string[];
      sentiment?: string;
      processingInfo?: any;
      generatedAt?: string;
    }
  };
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

/**
 * 获取新闻来源
 */
export async function fetchNewsSources() {
  return fetchApi<Array<{ id: string; name: string }>>('/api/sources');
}

/**
 * 获取相关新闻
 */
export async function fetchRelatedNews(id: string) {
  // 首先检查 ID 是否包含路径前缀
  // 提取简单ID，去除路径前缀
  
  // 先解码以确保处理正确
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
  
  console.log('获取相关新闻，使用简单ID:', simpleId);
  
  // 直接使用简单ID获取相关新闻
  return fetchApi<NewsItem[]>(`/api/news/${simpleId}/related`);
}
