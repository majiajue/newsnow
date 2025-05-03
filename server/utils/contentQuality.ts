/**
 * 内容质量评估模块
 * 提供自动化的内容质量评估功能，包括专业性、深度、原创性和可读性评估
 */

import { logger } from "./logger"

// 质量评分阈值
export const QUALITY_THRESHOLD = 7.0 // 质量评分阈值，低于此值的内容被视为低质量

// 质量指标权重
const QUALITY_WEIGHTS = {
  originality: 0.3,  // 原创性权重
  depth: 0.3,        // 深度权重
  readability: 0.2,  // 可读性权重
  compliance: 0.2    // 合规性权重
}

/**
 * 评估内容的原创性
 * @param content 内容文本
 * @returns 原创性评分(0-10)
 */
export function assessOriginality(content: string): number {
  if (!content || content.trim() === "") {
    return 0
  }

  // 简单的原创性评估算法
  let score = 5 // 基础分

  // 检查内容长度，较长的内容通常更有可能是原创
  const contentLength = content.length
  if (contentLength > 2000) {
    score += 2
  } else if (contentLength > 1000) {
    score += 1
  } else if (contentLength < 300) {
    score -= 1
  }

  // 检查是否包含引用标记，过多引用可能降低原创性
  const quoteMatches = content.match(/[""][^""]+[""]/g) || []
  const quoteRatio = quoteMatches.reduce((acc, match) => acc + match.length, 0) / contentLength
  if (quoteRatio > 0.3) {
    score -= Math.min(3, Math.floor(quoteRatio * 10))
  }

  // 检查是否包含特定的原创内容标记，如个人观点、分析等
  const originalityMarkers = [
    /我认为/g, /我们分析/g, /根据分析/g, /可以看出/g, /值得注意的是/g,
    /特别之处/g, /独特的是/g, /有趣的是/g, /与众不同的是/g
  ]
  
  const markerMatches = originalityMarkers.reduce((count, marker) => {
    const matches = content.match(marker) || []
    return count + matches.length
  }, 0)
  
  score += Math.min(2, markerMatches * 0.5)

  // 确保分数在0-10范围内
  return Math.max(0, Math.min(10, score))
}

/**
 * 评估内容的深度
 * @param content 内容文本
 * @returns 深度评分(0-10)
 */
export function assessDepth(content: string): number {
  if (!content || content.trim() === "") {
    return 0
  }

  // 简单的深度评估算法
  let score = 5 // 基础分

  // 检查内容长度，较长的内容通常更深入
  const contentLength = content.length
  if (contentLength > 3000) {
    score += 2
  } else if (contentLength > 1500) {
    score += 1
  } else if (contentLength < 500) {
    score -= 1
  }

  // 检查是否包含数据和事实
  const factMarkers = [
    /数据显示/g, /研究表明/g, /根据统计/g, /数字/g, /百分比/g, /增长率/g,
    /\d+%/g, /\d+亿/g, /\d+万/g, /\d+美元/g
  ]
  
  const factMatches = factMarkers.reduce((count, marker) => {
    const matches = content.match(marker) || []
    return count + matches.length
  }, 0)
  
  score += Math.min(2, factMatches * 0.4)

  // 检查是否包含深度分析标记
  const depthMarkers = [
    /深入分析/g, /详细解释/g, /背后原因/g, /核心问题/g, /本质/g, /关键因素/g,
    /影响/g, /意义/g, /前景/g, /趋势/g, /展望/g
  ]
  
  const depthMatches = depthMarkers.reduce((count, marker) => {
    const matches = content.match(marker) || []
    return count + matches.length
  }, 0)
  
  score += Math.min(2, depthMatches * 0.3)

  // 确保分数在0-10范围内
  return Math.max(0, Math.min(10, score))
}

/**
 * 计算内容的可读性评分
 * @param content 内容文本
 * @returns 可读性评分(0-10)
 */
export function calculateReadabilityScore(content: string): number {
  if (!content || content.trim() === "") {
    return 0
  }

  // 简单的可读性评估算法
  let score = 5 // 基础分

  // 分析句子长度
  const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
  const avgSentenceLength = content.length / (sentences.length || 1)
  
  // 过长或过短的句子都会影响可读性
  if (avgSentenceLength > 100) {
    score -= 2
  } else if (avgSentenceLength > 60) {
    score -= 1
  } else if (avgSentenceLength < 10) {
    score -= 1
  } else if (avgSentenceLength >= 15 && avgSentenceLength <= 40) {
    score += 1
  }

  // 分析段落结构
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  if (paragraphs.length > 1) {
    score += 1 // 有清晰的段落划分
  }
  
  // 检查是否有小标题
  const hasTitles = /\n[#\*]+\s+.+|<h\d>|【.+】/.test(content)
  if (hasTitles) {
    score += 1 // 使用小标题提高可读性
  }

  // 检查是否有过多的专业术语或复杂词汇
  const complexTerms = [
    /技术架构/g, /算法/g, /框架/g, /机制/g, /系统/g, /流程/g, /模型/g,
    /参数/g, /指标/g, /标准/g, /规范/g, /协议/g, /接口/g
  ]
  
  const complexMatches = complexTerms.reduce((count, term) => {
    const matches = content.match(term) || []
    return count + matches.length
  }, 0)
  
  // 适量的专业术语是好的，但过多会降低可读性
  const complexRatio = complexMatches / (content.length / 100)
  if (complexRatio > 2) {
    score -= 1
  }

  // 确保分数在0-10范围内
  return Math.max(0, Math.min(10, score))
}

/**
 * 检查内容是否符合AdSense政策
 * @param content 内容文本
 * @returns 合规性评估结果
 */
export function checkAdSenseCompliance(content: string): {
  pass: boolean,
  score: number,
  issues: string[]
} {
  if (!content || content.trim() === "") {
    return { pass: false, score: 0, issues: ["内容为空"] }
  }

  const issues: string[] = []
  let score = 10 // 满分开始，发现问题扣分

  // 检查是否包含敏感内容
  const sensitivePatterns = [
    { pattern: /色情|性爱|做爱|自慰|裸体|情色|成人/g, issue: "可能包含成人/色情内容" },
    { pattern: /赌博|博彩|娱乐城|赌场|押注|下注|投注/g, issue: "可能包含赌博相关内容" },
    { pattern: /毒品|大麻|可卡因|海洛因|吸毒|贩毒/g, issue: "可能包含毒品相关内容" },
    { pattern: /武器|枪支|炸弹|爆炸物|制造炸弹|恐怖袭击/g, issue: "可能包含武器/暴力相关内容" },
    { pattern: /仇恨|歧视|种族|性别歧视|辱骂|侮辱/g, issue: "可能包含仇恨/歧视内容" }
  ]

  for (const { pattern, issue } of sensitivePatterns) {
    const matches = content.match(pattern) || []
    if (matches.length > 0) {
      issues.push(issue)
      score -= 3 // 每类敏感内容扣3分
    }
  }

  // 检查是否包含版权问题
  const copyrightPatterns = [
    { pattern: /转载自|摘自|来源于|引用自|版权归|版权所有/g, issue: "可能存在版权引用，请确保合规引用" }
  ]

  for (const { pattern, issue } of copyrightPatterns) {
    const matches = content.match(pattern) || []
    if (matches.length > 0) {
      issues.push(issue)
      score -= 1 // 版权提示扣1分
    }
  }

  // 确保分数在0-10范围内
  score = Math.max(0, Math.min(10, score))
  
  // 如果分数低于6分，则不通过合规检查
  const pass = score >= 6

  return { pass, score, issues }
}

/**
 * 计算内容的总体质量评分
 * @param metrics 各项质量指标
 * @returns 总体质量评分(0-10)
 */
export function calculateOverallScore(metrics: {
  originality: number,
  depth: number,
  readability: number,
  compliance: { score: number, pass: boolean }
}): number {
  // 计算加权平均分
  const weightedScore = 
    metrics.originality * QUALITY_WEIGHTS.originality +
    metrics.depth * QUALITY_WEIGHTS.depth +
    metrics.readability * QUALITY_WEIGHTS.readability +
    metrics.compliance.score * QUALITY_WEIGHTS.compliance

  // 如果不通过合规检查，总分不超过5分
  if (!metrics.compliance.pass) {
    return Math.min(5, weightedScore)
  }

  return weightedScore
}

/**
 * 生成内容改进建议
 * @param metrics 各项质量指标
 * @returns 改进建议
 */
export function generateImprovementSuggestions(metrics: {
  originality: number,
  depth: number,
  readability: number,
  compliance: { score: number, pass: boolean, issues: string[] }
}): string[] {
  const suggestions: string[] = []

  // 原创性建议
  if (metrics.originality < 6) {
    suggestions.push("提高内容原创性，减少直接引用，增加原创分析和见解")
  }

  // 深度建议
  if (metrics.depth < 6) {
    suggestions.push("增加内容深度，添加更多数据支持、案例分析或专业见解")
  }

  // 可读性建议
  if (metrics.readability < 6) {
    suggestions.push("改善内容可读性，优化段落结构，使用小标题，简化复杂句式")
  }

  // 合规性建议
  if (!metrics.compliance.pass) {
    suggestions.push(...metrics.compliance.issues)
  }

  return suggestions
}

/**
 * 评估内容质量
 * @param content 内容文本
 * @returns 质量评估结果
 */
export function assessContentQuality(content: string) {
  try {
    logger.info("开始评估内容质量")
    
    // 评估各项指标
    const originality = assessOriginality(content)
    const depth = assessDepth(content)
    const readability = calculateReadabilityScore(content)
    const compliance = checkAdSenseCompliance(content)
    
    // 计算总体评分
    const metrics = { originality, depth, readability, compliance }
    const score = calculateOverallScore(metrics)
    
    // 生成改进建议
    const feedback = generateImprovementSuggestions(metrics)
    
    // 判断是否通过质量检查
    const pass = score >= QUALITY_THRESHOLD && compliance.pass
    
    logger.info(`内容质量评估完成，总分: ${score.toFixed(1)}/10，${pass ? '通过' : '未通过'}`)
    
    return {
      success: true,
      score,
      pass,
      metrics: {
        originality,
        depth,
        readability,
        compliance: {
          score: compliance.score,
          pass: compliance.pass
        }
      },
      feedback,
      issues: compliance.issues
    }
  } catch (error: any) {
    logger.error(`内容质量评估出错: ${error.message}`)
    return {
      success: false,
      error: `评估失败: ${error.message}`
    }
  }
}
