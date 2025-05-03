/**
 * AI新闻服务
 * 整合Jina内容获取和DeepSeek分析功能，提供完整的新闻抓取和分析服务
 */

import { logger } from "../../utils/logger";
import { readArticleContent, searchContent, segmentContent, callWithRetry } from "./jinaService";
import { generateArticleAnalysis } from "./analysisService";
import { ContentAnalysisOptions, ContentFetchOptions, EnhancedNewsArticle, JinaApiResponse, NewsAnalysis, NewsArticle } from "../types";

/**
 * 获取并分析单个新闻文章
 * @param url 文章URL
 * @param fetchOptions 内容获取选项
 * @param analysisOptions 内容分析选项
 * @returns 增强的新闻文章（包含原文和分析）
 */
export async function fetchAndAnalyzeArticle(
  url: string,
  fetchOptions: ContentFetchOptions = {},
  analysisOptions: ContentAnalysisOptions = {}
): Promise<JinaApiResponse<EnhancedNewsArticle>> {
  try {
    // 1. 获取文章内容
    logger.info(`开始获取文章内容: ${url}`);
    const contentResult = await callWithRetry(readArticleContent, [url, fetchOptions]);
    
    if (!contentResult.success || !contentResult.data) {
      return { 
        success: false, 
        error: contentResult.error || '获取内容失败' 
      };
    }
    
    const article = contentResult.data;
    
    // 2. 生成文章分析
    logger.info(`开始分析文章: ${article.title}`);
    const analysisResult = await generateArticleAnalysis(
      article.title, 
      article.content, 
      analysisOptions
    );
    
    if (!analysisResult.success || !analysisResult.data) {
      return {
        success: true,
        data: article as EnhancedNewsArticle,
        error: '文章获取成功，但分析生成失败'
      };
    }
    
    // 3. 整合文章内容和分析结果
    const enhancedArticle: EnhancedNewsArticle = {
      ...article,
      analysis: analysisResult.data
    };
    
    return {
      success: true,
      data: enhancedArticle
    };
  } catch (error: any) {
    logger.error(`文章获取和分析错误: ${error.message}`);
    return { 
      success: false, 
      error: `处理失败: ${error.message}` 
    };
  }
}

/**
 * 搜索并获取多篇相关新闻
 * @param query 搜索查询
 * @param options 搜索选项
 * @returns 搜索结果
 */
export async function searchAndFetchNews(
  query: string,
  options: {
    numResults?: number,
    site?: string,
    fetchFullContent?: boolean,
    analyzeContent?: boolean
  } = {}
): Promise<JinaApiResponse<{
  query: string,
  articles: EnhancedNewsArticle[]
}>> {
  const { 
    numResults = 5, 
    site, 
    fetchFullContent = true,
    analyzeContent = false
  } = options;
  
  try {
    // 1. 搜索相关内容
    logger.info(`开始搜索新闻: ${query}`);
    const searchResult = await searchContent(query, { numResults, site });
    
    if (!searchResult.success || !searchResult.results || searchResult.results.length === 0) {
      return { 
        success: false, 
        error: searchResult.error || '搜索失败或无结果' 
      };
    }
    
    // 2. 处理搜索结果
    const articles: EnhancedNewsArticle[] = [];
    
    // 如果不需要获取完整内容，直接返回搜索结果
    if (!fetchFullContent) {
      for (const result of searchResult.results) {
        articles.push({
          url: result.url,
          title: result.title,
          content: result.snippet || '',
          source: new URL(result.url).hostname
        });
      }
      
      return {
        success: true,
        data: {
          query,
          articles
        }
      };
    }
    
    // 3. 获取每个搜索结果的完整内容
    logger.info(`开始获取搜索结果的完整内容`);
    for (const result of searchResult.results) {
      try {
        if (analyzeContent) {
          // 获取并分析文章
          const articleResult = await fetchAndAnalyzeArticle(result.url);
          if (articleResult.success && articleResult.data) {
            articles.push(articleResult.data);
          }
        } else {
          // 仅获取文章内容
          const contentResult = await readArticleContent(result.url);
          if (contentResult.success && contentResult.data) {
            articles.push(contentResult.data);
          }
        }
      } catch (error: any) {
        logger.error(`处理URL ${result.url} 时出错: ${error.message}`);
        // 继续处理下一个结果
      }
    }
    
    if (articles.length === 0) {
      return {
        success: false,
        error: '无法获取任何文章的完整内容'
      };
    }
    
    return {
      success: true,
      data: {
        query,
        articles
      }
    };
  } catch (error: any) {
    logger.error(`搜索和获取新闻错误: ${error.message}`);
    return { 
      success: false, 
      error: `处理失败: ${error.message}` 
    };
  }
}

/**
 * 批量处理多个URL的文章
 * @param urls 文章URL数组
 * @param analyzeContent 是否分析内容
 * @returns 处理结果
 */
export async function batchProcessArticles(
  urls: string[],
  analyzeContent: boolean = false
): Promise<JinaApiResponse<{
  processed: number,
  failed: number,
  articles: EnhancedNewsArticle[]
}>> {
  try {
    const articles: EnhancedNewsArticle[] = [];
    let failedCount = 0;
    
    // 并行处理多个URL
    const promises = urls.map(async (url) => {
      try {
        if (analyzeContent) {
          const result = await fetchAndAnalyzeArticle(url);
          if (result.success && result.data) {
            return result.data;
          }
        } else {
          const result = await readArticleContent(url);
          if (result.success && result.data) {
            return result.data;
          }
        }
        throw new Error(`处理失败: ${url}`);
      } catch (error) {
        failedCount++;
        logger.error(`处理URL失败: ${url}`);
        return null;
      }
    });
    
    // 等待所有处理完成
    const results = await Promise.all(promises);
    
    // 过滤掉失败的结果
    for (const result of results) {
      if (result) {
        articles.push(result);
      }
    }
    
    return {
      success: true,
      data: {
        processed: urls.length,
        failed: failedCount,
        articles
      }
    };
  } catch (error: any) {
    logger.error(`批量处理文章错误: ${error.message}`);
    return { 
      success: false, 
      error: `批量处理失败: ${error.message}` 
    };
  }
}
