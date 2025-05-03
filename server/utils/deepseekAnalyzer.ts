/**
 * DeepSeek内容分析模块
 * 使用DeepSeek API生成内容摘要和深度分析
 */

import { logger } from "./logger"
import axios from "axios"

// DeepSeek API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

/**
 * DeepSeek分析结果接口
 */
export interface DeepSeekAnalysisResult {
  success: boolean
  error?: string
  keyPoints?: string[]
  summary?: string
  background?: string
  impact?: string
  opinion?: string
  suggestions?: string
  generatedAt?: string
}

/**
 * 使用DeepSeek生成文章分析
 * @param title 文章标题
 * @param content 文章内容
 * @param url 文章URL
 * @returns 分析结果
 */
export async function generateDeepSeekAnalysis(
  title: string, 
  content: string,
  url?: string
): Promise<DeepSeekAnalysisResult> {
  try {
    if (!DEEPSEEK_API_KEY) {
      logger.warn('缺少DEEPSEEK_API_KEY，使用模拟分析数据')
      return generateMockAnalysis(title)
    }
    
    // 准备提示词
    const prompt = `
你是一位专业的财经分析师，请对以下文章进行深度分析：

标题：${title}

内容：${content.substring(0, 2000)}...

${url ? `原文链接：${url}` : ''}

请提供以下分析：
1. 提供5个核心要点（每点30-50字，突出文章价值和专业洞见）
2. 内容摘要（100字以内）
3. 背景分析（分析该新闻的宏观背景）
4. 潜在影响分析（分析该新闻可能产生的短期和长期影响）
5. 专业观点（基于你的专业知识对内容进行评价）
6. 建议与展望（针对投资者或相关方的建议）

请用中文回答，确保分析专业、客观且有深度。
`

    logger.info(`调用DeepSeek API分析文章: ${title}`)
    
    // 调用DeepSeek API
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位专业的财经分析师，擅长对财经新闻进行深度解读和分析。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30秒超时
      }
    )
    
    if (response.data && response.data.choices && response.data.choices[0]) {
      const analysisText = response.data.choices[0].message.content
      
      // 解析分析文本
      const sections = parseAnalysisText(analysisText)
      return {
        success: true,
        ...sections,
        generatedAt: new Date().toISOString()
      }
    }
    
    throw new Error('DeepSeek API返回格式异常')
  } catch (error: any) {
    logger.error(`DeepSeek分析生成错误: ${error.message}`)
    return {
      success: false,
      error: `生成分析失败: ${error.message}`
    }
  }
}

/**
 * 解析分析文本为结构化数据
 * @param text 分析文本
 * @returns 结构化的分析结果
 */
function parseAnalysisText(text: string) {
  // 尝试提取各个部分
  const keyPointsMatch = text.match(/(?:核心要点|要点)[：:]\s*([\s\S]*?)(?=内容摘要|摘要|$)/i)
  const summaryMatch = text.match(/(?:内容摘要|摘要)[：:]\s*([\s\S]*?)(?=背景分析|$)/i)
  const backgroundMatch = text.match(/背景分析[：:]\s*([\s\S]*?)(?=潜在影响分析|影响分析|$)/i)
  const impactMatch = text.match(/(?:潜在影响分析|影响分析)[：:]\s*([\s\S]*?)(?=专业观点|$)/i)
  const opinionMatch = text.match(/专业观点[：:]\s*([\s\S]*?)(?=建议与展望|建议|$)/i)
  const suggestionsMatch = text.match(/(?:建议与展望|建议)[：:]\s*([\s\S]*?)(?=$)/i)
  
  // 处理核心要点，将其转换为数组
  let keyPoints: string[] = []
  if (keyPointsMatch && keyPointsMatch[1]) {
    // 尝试按编号或项目符号分割
    const keyPointsText = keyPointsMatch[1].trim()
    const points = keyPointsText.split(/\d+[\.、)]\s*|\n\s*[-•*]\s*|\n(?=\S)/).filter(p => p.trim().length > 0)
    keyPoints = points.map(p => p.trim())
  }
  
  return {
    keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
    summary: (summaryMatch && summaryMatch[1].trim()) || '无法生成摘要',
    background: (backgroundMatch && backgroundMatch[1].trim()) || '无法生成背景分析',
    impact: (impactMatch && impactMatch[1].trim()) || '无法生成影响分析',
    opinion: (opinionMatch && opinionMatch[1].trim()) || '无法生成专业观点',
    suggestions: (suggestionsMatch && suggestionsMatch[1].trim()) || '无法生成建议'
  }
}

/**
 * 生成模拟分析数据
 * @param title 文章标题
 * @returns 模拟的分析结果
 */
function generateMockAnalysis(title: string): DeepSeekAnalysisResult {
  return {
    success: true,
    keyPoints: [
      `本篇深度报道剖析了${title.substring(0, 15)}背后的市场逻辑与投资机会，为投资决策提供专业视角`,
      `最新发布的市场分析报告，提供了对当前市场环境的及时洞察`,
      `来源于权威财经媒体，数据可靠，分析客观公正`,
      `新思财经独家视角解读，揭示常规报道未能深入分析的市场机制与投资逻辑`,
      `提供了可操作的投资策略建议，帮助投资者在复杂多变的市场环境中把握机会`
    ],
    summary: `这是关于"${title}"的内容摘要。文章主要讨论了相关市场动态和行业发展趋势，对投资者具有参考价值。`,
    background: '该新闻出现在当前经济环境下，对市场可能产生一定影响。从宏观角度看，这一事件与近期的经济政策和市场走势有一定关联性。',
    impact: '从短期来看，此类消息可能会对相关板块产生波动；长期而言，需要结合更多数据进行综合判断。投资者应当保持理性，避免情绪化决策。',
    opinion: '根据历史数据和市场规律，类似事件通常会在短期内引起市场反应，但长期影响需要结合基本面和技术面进行分析。建议投资者关注后续政策动向和市场反应。',
    suggestions: '对投资者而言，建议密切关注相关行业动态，特别是政策变化和龙头企业表现。对企业而言，应当提前做好风险管理，把握可能出现的市场机会。',
    generatedAt: new Date().toISOString()
  }
}
