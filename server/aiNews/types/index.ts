/**
 * AI新闻相关类型定义
 */

// 新闻文章基础结构
export interface NewsArticle {
  url: string;
  title: string;
  content: string;
  publishDate?: string;
  source?: string;
  author?: string;
  category?: string;
  tags?: string[];
  images?: NewsImage[];
  links?: NewsLink[];
}

// 新闻图片
export interface NewsImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

// 新闻链接
export interface NewsLink {
  url: string;
  text: string;
  isExternal: boolean;
}

// 新闻分析结果
export interface NewsAnalysis {
  summary: string;
  background: string;
  impact: string;
  opinion: string;
  suggestions: string;
  keywords?: string[];
  sentiment?: string;
  generatedAt: string;
}

// Jina API响应
export interface JinaApiResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

// 内容获取选项
export interface ContentFetchOptions {
  extractLinks?: boolean;
  extractImages?: boolean;
  timeout?: number;
  maxRetries?: number;
}

// 内容分析选项
export interface ContentAnalysisOptions {
  model?: string;
  language?: string;
  maxTokens?: number;
  temperature?: number;
}

// 完整的新闻文章（包含分析）
export interface EnhancedNewsArticle extends NewsArticle {
  analysis?: NewsAnalysis;
}
