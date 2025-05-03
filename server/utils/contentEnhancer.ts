/**
 * 内容增强模块
 * 提供基于Jina AI API的内容丰富和优化功能
 */

import { logger } from "./logger"
import { readArticleContent, searchContent, segmentContent } from "./jinaApi"
import { translateParallel } from "./translateParallel"

/**
 * 提取内容中的关键词
 * @param content 内容文本
 * @param maxKeywords 最大关键词数量
 * @returns 关键词列表
 */
function extractKeywords(content: string, maxKeywords: number = 5): string[] {
  if (!content || content.trim() === "") {
    return []
  }

  // 简单的关键词提取算法
  // 1. 移除停用词和标点符号
  const stopWords = ["的", "了", "是", "在", "我", "有", "和", "就", "不", "人", "都", "一", "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好", "自己", "这"]
  let cleanContent = content
  
  // 移除标点符号
  cleanContent = cleanContent.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, " ")
  
  // 分词（简单按空格分割）
  const words = cleanContent.split(/\s+/).filter(word => word.length > 1)
  
  // 过滤停用词
  const filteredWords = words.filter(word => !stopWords.includes(word))
  
  // 统计词频
  const wordFreq: Record<string, number> = {}
  filteredWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })
  
  // 按词频排序
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
  
  // 返回前N个关键词
  return sortedWords.slice(0, maxKeywords)
}

/**
 * 基于关键词搜索相关内容
 * @param keywords 关键词列表
 * @param maxResults 最大结果数量
 * @returns 搜索结果
 */
async function searchRelatedContent(keywords: string[], maxResults: number = 3): Promise<any[]> {
  if (!keywords || keywords.length === 0) {
    return []
  }

  try {
    // 构建搜索查询
    const query = keywords.join(" ")
    logger.info(`使用关键词搜索相关内容: ${query}`)
    
    // 调用Jina Search API
    const searchResult = await searchContent(query, { numResults: maxResults })
    
    if (!searchResult.success || !searchResult.results || searchResult.results.length === 0) {
      logger.warn(`未找到与关键词相关的内容: ${query}`)
      return []
    }
    
    return searchResult.results
  } catch (error: any) {
    logger.error(`搜索相关内容出错: ${error.message}`)
    return []
  }
}

/**
 * 从搜索结果中提取补充信息
 * @param searchResults 搜索结果
 * @param originalContent 原始内容
 * @returns 补充信息
 */
async function extractSupplementaryInfo(searchResults: any[], originalContent: string): Promise<string[]> {
  if (!searchResults || searchResults.length === 0) {
    return []
  }

  const supplementaryInfo: string[] = []
  
  try {
    // 为每个搜索结果获取详细内容
    for (const result of searchResults) {
      if (result.url) {
        logger.info(`获取URL的详细内容: ${result.url}`)
        const detailResult = await readArticleContent(result.url)
        
        if (detailResult.success && detailResult.content) {
          // 分段处理内容
          const segmentResult = await segmentContent(detailResult.content)
          
          if (segmentResult.success && segmentResult.chunks && segmentResult.chunks.length > 0) {
            // 选择最相关的段落（这里简单实现，实际可能需要更复杂的相关性算法）
            const relevantChunks = segmentResult.chunks
              .filter((chunk: string) => {
                // 简单过滤：排除与原始内容高度重复的段落
                return !originalContent.includes(chunk)
              })
              .slice(0, 2) // 最多取2个段落
            
            supplementaryInfo.push(...relevantChunks)
          } else {
            // 如果分段失败，使用摘要
            const summary = detailResult.content.substring(0, 200) + "..."
            if (!originalContent.includes(summary)) {
              supplementaryInfo.push(summary)
            }
          }
        }
      }
    }
    
    // 去重
    return [...new Set(supplementaryInfo)]
  } catch (error: any) {
    logger.error(`提取补充信息出错: ${error.message}`)
    return []
  }
}

/**
 * 生成内容摘要
 * @param content 内容文本
 * @param maxLength 最大摘要长度
 * @returns 内容摘要
 */
function generateSummary(content: string, maxLength: number = 200): string {
  if (!content || content.trim() === "") {
    return ""
  }

  // 简单的摘要生成算法
  // 1. 分割成句子
  const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
  
  // 2. 选择前几个句子作为摘要
  let summary = ""
  for (const sentence of sentences) {
    if ((summary + sentence).length <= maxLength) {
      summary += sentence + "。"
    } else {
      break
    }
  }
  
  return summary
}

/**
 * 增强内容
 * @param content 原始内容
 * @param options 增强选项
 * @returns 增强后的内容
 */
export async function enhanceContent(content: string, options: {
  title?: string,
  addSummary?: boolean,
  addRelatedInfo?: boolean,
  translateTo?: string
} = {}): Promise<{
  success: boolean,
  originalContent: string,
  enhancedContent?: string,
  summary?: string,
  supplementaryInfo?: string[],
  translatedContent?: string,
  error?: string
}> {
  try {
    if (!content || content.trim() === "") {
      return {
        success: false,
        originalContent: content,
        error: "内容为空，无法增强"
      }
    }

    logger.info(`开始增强内容${options.title ? `: ${options.title}` : ''}`)
    
    let enhancedContent = content
    const result: any = {
      success: true,
      originalContent: content
    }
    
    // 生成摘要
    if (options.addSummary) {
      const summary = generateSummary(content)
      result.summary = summary
      
      // 在内容前添加摘要
      if (summary) {
        enhancedContent = `【摘要】${summary}\n\n${enhancedContent}`
      }
    }
    
    // 添加相关信息
    if (options.addRelatedInfo) {
      // 提取关键词
      const keywords = extractKeywords(content)
      
      if (keywords.length > 0) {
        // 搜索相关内容
        const searchResults = await searchRelatedContent(keywords)
        
        // 提取补充信息
        const supplementaryInfo = await extractSupplementaryInfo(searchResults, content)
        result.supplementaryInfo = supplementaryInfo
        
        // 在内容后添加补充信息
        if (supplementaryInfo.length > 0) {
          enhancedContent += "\n\n【相关信息】\n"
          supplementaryInfo.forEach((info, index) => {
            enhancedContent += `${index + 1}. ${info}\n\n`
          })
        }
      }
    }
    
    // 翻译内容
    if (options.translateTo && options.translateTo !== "zh") {
      try {
        logger.info(`翻译内容到${options.translateTo}`)
        const translatedContent = await translateParallel(enhancedContent, "zh", options.translateTo) as string
        result.translatedContent = translatedContent
      } catch (translateError: any) {
        logger.error(`翻译内容出错: ${translateError.message}`)
      }
    }
    
    result.enhancedContent = enhancedContent
    return result
  } catch (error: any) {
    logger.error(`增强内容出错: ${error.message}`)
    return {
      success: false,
      originalContent: content,
      error: `增强内容失败: ${error.message}`
    }
  }
}
