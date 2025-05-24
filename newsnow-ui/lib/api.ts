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
    // 直接访问后端服务
    const baseUrl = 'http://localhost:5001';
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

    const data: ApiResponse<T> = await response.json();
    
    if (data.error) {
      throw new Error(data.error || data.message || '请求失败');
    }
    
    return { data: data.data || (data as any), error: null };
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
  // 如果是类似 4329730_1 的格式，添加前缀
  // 如果已经是完整路径，保持不变
  
  // 先解码以确保处理正确
  let decodedId = id;
  try {
    if (id.includes('%')) {
      decodedId = decodeURIComponent(id);
    }
  } catch (e) {
    console.warn('解码 ID 失败，使用原始 ID:', id);
  }
  
  // 检查是否已经是完整路径
  const hasPath = decodedId.includes('/cn/news-detail/') || decodedId.startsWith('/cn/news-detail/');
  
  // 如果不是完整路径，添加前缀
  const fullId = hasPath ? decodedId : `/cn/news-detail/${decodedId}`;
  
  console.log('获取新闻详情，使用ID:', fullId);
  
  // 使用正确的路径获取新闻详情
  return fetchApi<NewsDetail>(`/api/news/${encodeURIComponent(fullId)}`);
}

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
  // 如果是类似 4329730_1 的格式，添加前缀
  // 如果已经是完整路径，保持不变
  
  // 先解码以确保处理正确
  let decodedId = id;
  try {
    if (id.includes('%')) {
      decodedId = decodeURIComponent(id);
    }
  } catch (e) {
    console.warn('解码 ID 失败，使用原始 ID:', id);
  }
  
  // 检查是否已经是完整路径
  const hasPath = decodedId.includes('/cn/news-detail/') || decodedId.startsWith('/cn/news-detail/');
  
  // 如果不是完整路径，添加前缀
  const fullId = hasPath ? decodedId : `/cn/news-detail/${decodedId}`;
  
  console.log('获取相关新闻，使用ID:', fullId);
  
  // 使用正确的路径获取相关新闻
  return fetchApi<NewsItem[]>(`/api/news/${encodeURIComponent(fullId)}/related`);
}
