/**
 * 主要新闻API路由
 * 获取新闻列表，从Python后端获取真实新闻数据
 */
import { defineEventHandler, getQuery, setResponseHeader } from 'h3';

// 定义文章接口
interface Article {
  id: string;
  title: string;
  summary: string;
  content?: string;
  url: string;
  pubDate: string;
  source: string;
  category: string;
  author?: string;
  imageUrl?: string;
  aiComment?: string;
  metadata?: any;
  processed?: number;
  tags?: string[];
}

interface NewsResponse {
  data: Article[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
  };
}

interface BackendData {
  data: any[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
  };
}

export default defineEventHandler(async (event) => {
  // 设置响应头
  setResponseHeader(event, 'Content-Type', 'application/json');
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*');
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // 获取查询参数
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 20;
    const source = query.source as string || '';
    const category = query.category as string || '';
    const q = query.q as string || '';

    // 构建Python后端API请求URL
    const backendUrl = new URL('http://localhost:5001/api/news');
    backendUrl.searchParams.set('page', page.toString());
    backendUrl.searchParams.set('pageSize', pageSize.toString());
    if (source) backendUrl.searchParams.set('source', source);
    if (category) backendUrl.searchParams.set('category', category);
    if (q) backendUrl.searchParams.set('q', q);

    console.log('请求Python后端API:', backendUrl.toString());

    // 请求Python后端API
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 设置超时时间
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error('Python后端API请求失败:', response.status, response.statusText);
      throw new Error(`Python后端API请求失败: ${response.status} ${response.statusText}`);
    }

    const backendData = await response.json() as BackendData;
    console.log('从Python后端获取数据成功:', {
      dataCount: backendData.data?.length || 0,
      pagination: backendData.pagination
    });

    // 转换后端数据格式为前端格式
    const articles: Article[] = (backendData.data || []).map((item: any) => ({
      id: item.id,
      title: item.title || '无标题',
      summary: item.summary || '无摘要',
      content: item.content || '',
      url: item.url || '',
      pubDate: item.pubDate || item.created_at || new Date().toISOString(),
      source: item.source || '未知来源',
      category: item.category || '未分类',
      author: item.author || '',
      imageUrl: item.imageUrl || '',
      aiComment: item.metadata ? extractAiComment(item.metadata) : '',
      metadata: item.metadata,
      processed: item.processed,
      tags: item.tags || []
    }));

    const result: NewsResponse = {
      data: articles,
      pagination: {
        page: backendData.pagination?.page || page,
        pageSize: backendData.pagination?.pageSize || pageSize,
        total: backendData.pagination?.total || articles.length,
        totalPages: backendData.pagination?.totalPages || Math.ceil((backendData.pagination?.total || articles.length) / pageSize)
      }
    };

    return result;

  } catch (error) {
    console.error('获取新闻列表失败:', error);

    // 如果Python后端不可用，返回空数据而不是错误
    return {
      data: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
      }
    };
  }
});

// 从metadata中提取AI评论
function extractAiComment(metadata: any): string {
  try {
    if (typeof metadata === 'string') {
      const parsed = JSON.parse(metadata);
      return parsed.analysisData?.comment || parsed.analysisData?.summary || '';
    } else if (typeof metadata === 'object' && metadata !== null) {
      return metadata.analysisData?.comment || metadata.analysisData?.summary || '';
    }
  } catch (error) {
    console.warn('解析metadata失败:', error);
  }
  return '';
}
