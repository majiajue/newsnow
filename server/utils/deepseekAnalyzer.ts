/**
 * DeepSeek内容分析模块
 * 使用DeepSeek API生成内容摘要和深度分析
 */

// 导入必要的模块
import axios from "axios"
import * as dotenv from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '../..')

// 加载环境变量
dotenv.config({ path: join(projectRoot, '.env.server') })

// 添加调试日志
console.log('环境变量路径:', join(projectRoot, '.env.server'))
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '已设置' : '未设置')

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
  // 添加原始分析数据字段，可以包含完整的JSON对象
  analysisData?: any
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
      console.warn('缺少DEEPSEEK_API_KEY，使用模拟分析数据')
      return generateMockAnalysis(title)
    }
    
    // 准备提示词 - 直接要求返回JSON格式
    const prompt = `
你是一位专业的财经分析师，请对以下文章进行深度分析：

标题：${title}

内容：${content.substring(0, 2000)}...

${url ? `原文链接：${url}` : ''}

你需要生成一个包含以下字段的JSON对象（不要添加额外的格式说明，直接返回可解析的JSON对象）：
- "summary"：内容摘要（100字以内）
- "comment"：评论（专业分析评论，100-150字）
- "keyPoints"：关键要点（数组，3-5个要点，每点30-50字）
- "background"：分析背景（分析该新闻的宏观背景，100-150字）
- "impact"：影响评估（分析该新闻可能产生的短期和长期影响，100-150字）
- "opinion"：专业意见（基于专业知识对内容进行评价，100字左右）
- "suggestions"：建议行动（数组，针对投资者或相关方的3-5条具体建议）

请直接以JSON格式返回，不要包含任何前导或后缀文本。确保输出是有效的JSON，可以直接被JSON.parse()解析。
结构示例（你需要填充实际内容）：
{
  "summary": "...",
  "comment": "...",
  "keyPoints": ["...", "...", "..."],
  "background": "...",
  "impact": "...",
  "opinion": "...",
  "suggestions": ["...", "...", "..."]
}

请用中文回答，确保分析专业、客观且有深度。
`

    console.info(`调用DeepSeek API分析文章: ${title}`)
    
    // 调用DeepSeek API
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位专业的财经分析师，擅长对财经新闻进行深度解读和分析。你将只输出有效的JSON格式数据，不会添加任何其他文本说明。' },
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
      console.log('====== DeepSeek API原始响应 ======');
      console.log(analysisText);
      console.log('================================');
      
      try {
        // 尝试直接解析JSON响应
        // 先清理可能存在的额外字符
        const jsonStr = analysisText.trim()
          .replace(/^```json\s*/i, '') // 移除可能的markdown代码块开始标记
          .replace(/\s*```$/i, '')     // 移除可能的markdown代码块结束标记
          .trim()
        
        console.log('====== 清理后准备解析的JSON字符串 ======');
        console.log(jsonStr);
        console.log('================================');
        
        const analysisJson = JSON.parse(jsonStr)
        console.log('====== 成功解析的JSON对象 ======');
        console.log(JSON.stringify(analysisJson, null, 2));
        console.log('================================');
        
        // 确保所有必要的字段都存在
        const result: DeepSeekAnalysisResult = {
          success: true,
          keyPoints: Array.isArray(analysisJson.keyPoints) ? analysisJson.keyPoints : [analysisJson.keyPoints || ''],
          summary: analysisJson.summary || '无法生成摘要',
          background: analysisJson.background || '无法生成背景分析',
          impact: analysisJson.impact || '无法生成影响分析',
          opinion: analysisJson.opinion || '无法生成专业观点',
          suggestions: Array.isArray(analysisJson.suggestions) ? analysisJson.suggestions.join('\n') : (analysisJson.suggestions || '无法生成建议'),
          generatedAt: new Date().toISOString(),
          // 添加原始JSON数据以便前端直接使用
          analysisData: analysisJson
        }
        
        console.log('====== 最终返回的结构化结果 ======');
        console.log(JSON.stringify(result, null, 2));
        console.log('================================');
        
        return result
      } catch (jsonError) {
        console.error(`JSON解析失败，尝试使用文本解析: ${jsonError}`)
        console.log('====== JSON解析错误详情 ======');
        console.log(jsonError);
        console.log('================================');
        
        // 如果JSON解析失败，回退到传统的文本解析方法
        console.log('尝试使用传统文本解析方法...');
        const sections = parseAnalysisText(analysisText)
        
        console.log('====== 文本解析结果 ======');
        console.log(JSON.stringify(sections, null, 2));
        console.log('================================');
        
        return {
          success: true,
          ...sections,
          generatedAt: new Date().toISOString()
        }
      }
    }
    
    throw new Error('DeepSeek API返回格式异常')
  } catch (error: any) {
    console.error(`DeepSeek分析生成错误: ${error.message}`)
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
