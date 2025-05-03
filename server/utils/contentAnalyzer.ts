/**
 * 内容分析模块
 * 提供对内容进行全面分析的功能，包括关键词提取、主题识别、情感分析等
 */

import { logger } from "./logger"
import { classifyContent, segmentContent } from "./jinaApi"
import { assessContentQuality } from "./contentQuality"

/**
 * 内容分析结果接口
 */
interface ContentAnalysisResult {
  success: boolean
  error?: string
  title?: string
  content: string
  keywords?: string[]
  topics?: Array<{ topic: string, confidence: number }>
  sentiment?: {
    label: string
    score: number
  }
  quality?: {
    score: number
    pass: boolean
    metrics: any
  }
  readability?: {
    score: number
    level: string
    wordCount: number
    avgSentenceLength: number
  }
  segments?: string[]
  summary?: string
}

/**
 * 提取内容中的关键词
 * @param content 内容文本
 * @param maxKeywords 最大关键词数量
 * @returns 关键词列表
 */
function extractKeywords(content: string, maxKeywords: number = 10): string[] {
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
 * 分析内容的情感
 * @param content 内容文本
 * @returns 情感分析结果
 */
function analyzeSentiment(content: string): { label: string, score: number } {
  if (!content || content.trim() === "") {
    return { label: "中性", score: 0.5 }
  }

  // 简单的情感分析算法
  const positiveWords = ["好", "优秀", "出色", "精彩", "美好", "喜欢", "赞", "支持", "成功", "快乐", "幸福", "希望", "进步", "发展", "提高"]
  const negativeWords = ["差", "糟糕", "失败", "问题", "困难", "挑战", "担忧", "焦虑", "恐惧", "痛苦", "悲伤", "遗憾", "下降", "降低", "减少"]
  
  let positiveCount = 0
  let negativeCount = 0
  
  // 计算正面词和负面词出现次数
  positiveWords.forEach(word => {
    const regex = new RegExp(word, "g")
    const matches = content.match(regex)
    if (matches) {
      positiveCount += matches.length
    }
  })
  
  negativeWords.forEach(word => {
    const regex = new RegExp(word, "g")
    const matches = content.match(regex)
    if (matches) {
      negativeCount += matches.length
    }
  })
  
  // 计算情感得分
  const totalWords = content.length / 2 // 粗略估计中文字符数
  const positiveRatio = positiveCount / totalWords
  const negativeRatio = negativeCount / totalWords
  
  let score = 0.5 + (positiveRatio - negativeRatio) * 5
  score = Math.max(0, Math.min(1, score)) // 确保得分在0-1之间
  
  // 确定情感标签
  let label = "中性"
  if (score > 0.7) {
    label = "积极"
  } else if (score < 0.3) {
    label = "消极"
  }
  
  return { label, score }
}

/**
 * 分析内容的可读性
 * @param content 内容文本
 * @returns 可读性分析结果
 */
function analyzeReadability(content: string): {
  score: number,
  level: string,
  wordCount: number,
  avgSentenceLength: number
} {
  if (!content || content.trim() === "") {
    return {
      score: 0,
      level: "未知",
      wordCount: 0,
      avgSentenceLength: 0
    }
  }

  // 计算字数（粗略估计中文字符数）
  const wordCount = content.replace(/\s+/g, "").length
  
  // 分割句子
  const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length
  
  // 计算平均句子长度
  const avgSentenceLength = wordCount / (sentenceCount || 1)
  
  // 计算可读性得分（简化版）
  let score = 10
  
  // 过长或过短的句子都会降低可读性
  if (avgSentenceLength > 100) {
    score -= 4
  } else if (avgSentenceLength > 60) {
    score -= 2
  } else if (avgSentenceLength > 40) {
    score -= 1
  } else if (avgSentenceLength < 5) {
    score -= 2
  }
  
  // 内容太短或太长也会影响可读性
  if (wordCount < 100) {
    score -= 2
  } else if (wordCount > 5000) {
    score -= 1
  }
  
  // 确保得分在0-10之间
  score = Math.max(0, Math.min(10, score))
  
  // 确定可读性级别
  let level = "中等"
  if (score >= 8) {
    level = "容易"
  } else if (score <= 4) {
    level = "困难"
  }
  
  return {
    score,
    level,
    wordCount,
    avgSentenceLength
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
 * 分析内容
 * @param content 内容文本
 * @param options 分析选项
 * @returns 分析结果
 */
export async function analyzeContent(content: string, options: {
  title?: string,
  extractKeywords?: boolean,
  analyzeSentiment?: boolean,
  analyzeQuality?: boolean,
  analyzeReadability?: boolean,
  extractTopics?: boolean,
  segmentContent?: boolean,
  generateSummary?: boolean,
  topicCategories?: string[]
} = {}): Promise<ContentAnalysisResult> {
  try {
    if (!content || content.trim() === "") {
      return {
        success: false,
        content,
        error: "内容为空，无法分析"
      }
    }

    logger.info(`开始分析内容${options.title ? `: ${options.title}` : ''}`)
    
    const result: ContentAnalysisResult = {
      success: true,
      content,
      title: options.title
    }
    
    // 提取关键词
    if (options.extractKeywords !== false) {
      result.keywords = extractKeywords(content)
      logger.info(`提取到${result.keywords.length}个关键词`)
    }
    
    // 分析情感
    if (options.analyzeSentiment !== false) {
      result.sentiment = analyzeSentiment(content)
      logger.info(`情感分析结果: ${result.sentiment.label} (${result.sentiment.score.toFixed(2)})`)
    }
    
    // 分析质量
    if (options.analyzeQuality !== false) {
      const qualityResult = await assessContentQuality(content)
      if (qualityResult.success) {
        result.quality = {
          score: qualityResult.score,
          pass: qualityResult.pass,
          metrics: qualityResult.metrics
        }
        logger.info(`质量评估结果: ${result.quality.score.toFixed(1)}/10, ${result.quality.pass ? '通过' : '未通过'}`)
      }
    }
    
    // 分析可读性
    if (options.analyzeReadability !== false) {
      result.readability = analyzeReadability(content)
      logger.info(`可读性分析结果: ${result.readability.score.toFixed(1)}/10, 级别: ${result.readability.level}`)
    }
    
    // 提取主题
    if (options.extractTopics !== false) {
      try {
        const categories = options.topicCategories || [
          "技术", "商业", "科学", "政治", "娱乐", "健康", "体育", "教育", 
          "文化", "社会", "经济", "环境", "历史", "艺术", "旅游"
        ]
        
        const classifyResult = await classifyContent(content, categories)
        
        if (classifyResult.success && classifyResult.classifications) {
          result.topics = classifyResult.classifications.map((c: any) => ({
            topic: c.prediction,
            confidence: c.score
          }))
          logger.info(`主题识别结果: ${result.topics.map(t => t.topic).join(', ')}`)
        }
      } catch (error: any) {
        logger.error(`主题识别失败: ${error.message}`)
      }
    }
    
    // 内容分段
    if (options.segmentContent !== false) {
      try {
        const segmentResult = await segmentContent(content)
        
        if (segmentResult.success && segmentResult.chunks) {
          result.segments = segmentResult.chunks
          logger.info(`内容分段结果: ${result.segments.length}个片段`)
        }
      } catch (error: any) {
        logger.error(`内容分段失败: ${error.message}`)
      }
    }
    
    // 生成摘要
    if (options.generateSummary !== false) {
      result.summary = generateSummary(content)
      logger.info(`生成摘要: ${result.summary.length}字符`)
    }
    
    return result
  } catch (error: any) {
    logger.error(`分析内容出错: ${error.message}`)
    return {
      success: false,
      content,
      error: `分析内容失败: ${error.message}`
    }
  }
}
