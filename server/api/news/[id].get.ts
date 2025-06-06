/**
 * 新闻详情API路由
 * 从Python后端获取单个新闻的详细信息
 */
import { defineEventHandler, getRouterParam, setResponseHeader } from 'h3';

// 定义后端返回的数据类型
interface BackendArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  url: string;
  pubDate?: string;
  created_at?: string;
  source: string;
  category: string;
  author?: string;
  imageUrl?: string;
  metadata?: any;
  processed?: number;
  tags?: string[];
}

// 定义前端使用的新闻文章类型
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

export default defineEventHandler(async (event) => {
  // 设置响应头
  setResponseHeader(event, 'Content-Type', 'application/json');
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*');
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // 获取路由参数
    const newsId = getRouterParam(event, 'id');
    
    if (!newsId) {
      return {
        error: '缺少新闻ID',
        message: '请提供有效的新闻ID'
      };
    }

    console.log('请求新闻详情，ID:', newsId);

    // 构建Python后端API请求URL
    const backendUrl = `http://localhost:5001/api/news/${newsId}`;
    console.log('请求Python后端API:', backendUrl);

    // 请求Python后端API
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 设置超时时间
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          error: '新闻不存在',
          message: `未找到ID为${newsId}的新闻`
        };
      }
      console.error('Python后端API请求失败:', response.status, response.statusText);
      throw new Error(`Python后端API请求失败: ${response.status} ${response.statusText}`);
    }

    const backendData = await response.json() as BackendArticle;
    console.log('从Python后端获取新闻详情成功:', {
      id: backendData.id,
      title: backendData.title
    });

    // 转换后端数据格式为前端格式
    const article: Article = {
      id: backendData.id,
      title: backendData.title || '无标题',
      summary: backendData.summary || '无摘要',
      content: backendData.content || '',
      url: backendData.url || '',
      pubDate: backendData.pubDate || backendData.created_at || new Date().toISOString(),
      source: backendData.source || '未知来源',
      category: backendData.category || '未分类',
      author: backendData.author || '',
      imageUrl: backendData.imageUrl || '',
      aiComment: backendData.metadata ? extractAiComment(backendData.metadata) : '',
      metadata: backendData.metadata,
      processed: backendData.processed,
      tags: backendData.tags || []
    };

    return article;

  } catch (error) {
    console.error('获取新闻详情失败:', error);
    
    return {
      error: '获取新闻详情失败',
      message: error instanceof Error ? error.message : '未知错误'
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
