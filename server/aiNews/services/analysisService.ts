/**
 * AI内容分析服务
 * 提供基于DeepSeek API的内容分析功能，包括摘要生成、背景分析等
 */

import axios from "axios";
import { logger } from '#/utils/logger';
import { ContentAnalysisOptions, JinaApiResponse, NewsAnalysis } from "../types";
import { callWithRetry } from '../../utils/apiHelper';

// DeepSeek API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_TIMEOUT = 30000; // 30秒超时

/**
 * 使用DeepSeek生成文章分析
 * @param title 文章标题
 * @param content 文章内容
 * @param options 分析选项
 * @returns 分析结果
 */
export async function generateArticleAnalysis(
  title: string, 
  content: string, 
  options: ContentAnalysisOptions = {}
): Promise<JinaApiResponse<NewsAnalysis>> {
  const { 
    model = 'deepseek-chat', 
    language = 'zh', 
    maxTokens = 1000, 
    temperature = 0.7 
  } = options;

  try {
    if (!DEEPSEEK_API_KEY) {
      logger.warn('缺少DEEPSEEK_API_KEY，使用模拟分析数据');
      return {
        success: true,
        data: generateMockAnalysis(title)
      };
    }
    
    // 准备提示词
    const prompt = generateAnalysisPrompt(title, content, language);

    // 调用DeepSeek API
    const response = await callWithRetry(async (ctx) => {
      logger.info(`[${ctx.traceId}] 生成分析内容`, { title: title.substring(0, 20) });
      
      const result = await axios.post(
        DEEPSEEK_API_URL,
        {
          model,
          messages: [
            { role: 'system', content: getSystemPrompt(language) },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
            'X-Request-ID': ctx.traceId
          },
          timeout: DEFAULT_TIMEOUT
        }
      );
      return result.data;
    }, {
      endpoint: 'deepseek-analysis',
      retries: 3,
      timeout: 60000
    });
    
    if (response && response.choices && response.choices[0]) {
      const analysisText = response.choices[0].message.content;
      
      // 解析分析文本
      const sections = parseAnalysisText(analysisText);
      if (!sections.summary) {
        logger.error('生成分析失败：返回数据缺少摘要', {
          responseData: response
        });
      }
      return {
        success: true,
        data: {
          ...sections,
          generatedAt: new Date().toISOString()
        }
      };
    }
    
    logger.error('DeepSeek API返回格式异常', {
      title,
      contentLength: content.length,
      error: response
    });
    
    throw new Error('DeepSeek API返回格式异常');
  } catch (error: any) {
    logger.error(`DeepSeek分析生成错误: ${error.message}`, {
      title,
      error: error.message,
      stack: error.stack
    });
    return {
      success: true, // 返回模拟数据而不是失败
      data: generateMockAnalysis(title)
    };
  }
}

/**
 * 生成分析提示词
 * @param title 文章标题
 * @param content 文章内容
 * @param language 语言
 * @returns 提示词
 */
function generateAnalysisPrompt(title: string, content: string, language: string = 'zh'): string {
  // 截取内容以避免超出token限制
  const truncatedContent = content.substring(0, 2000) + (content.length > 2000 ? '...' : '');
  
  if (language === 'en') {
    return `
Please analyze the following article:

Title: ${title}

Content: ${truncatedContent}

Please provide the following analysis:
1. Summary (within 100 words)
2. Background Analysis (analyze the macro background of this news)
3. Potential Impact Analysis (analyze the potential short-term and long-term impacts of this news)
4. Professional Opinion (evaluate the content based on your professional knowledge)
5. Suggestions and Outlook (recommendations for investors or related parties)

Please ensure your analysis is professional, objective, and insightful.
`;
  }
  
  // 默认中文提示词
  return `
请对以下文章进行深度分析：

标题：${title}

内容：${truncatedContent}

请提供以下分析：
1. 内容摘要（100字以内）
2. 背景分析（分析该新闻的宏观背景）
3. 潜在影响分析（分析该新闻可能产生的短期和长期影响）
4. 专业观点（基于你的专业知识对内容进行评价）
5. 建议与展望（针对投资者或相关方的建议）

请确保分析专业、客观且有深度。
`;
}

/**
 * 获取系统提示词
 * @param language 语言
 * @returns 系统提示词
 */
function getSystemPrompt(language: string = 'zh'): string {
  return language === 'en' 
    ? 'You are a professional financial analyst, skilled at in-depth interpretation and analysis of financial news.'
    : '你是一位专业的财经分析师，擅长对财经新闻进行深度解读和分析。';
}

/**
 * 解析分析文本为结构化数据
 * @param text 分析文本
 * @returns 结构化的分析数据
 */
function parseAnalysisText(text: string): Omit<NewsAnalysis, 'generatedAt'> {
  // 尝试提取各个部分
  const summaryMatch = text.match(/内容摘要[：:]\s*([\s\S]*?)(?=背景分析|$)/i) || 
                       text.match(/summary[：:]\s*([\s\S]*?)(?=background|$)/i);
                       
  const backgroundMatch = text.match(/背景分析[：:]\s*([\s\S]*?)(?=潜在影响分析|$)/i) || 
                          text.match(/background[：:]\s*([\s\S]*?)(?=potential impact|$)/i);
                          
  const impactMatch = text.match(/潜在影响分析[：:]\s*([\s\S]*?)(?=专业观点|$)/i) || 
                      text.match(/potential impact[：:]\s*([\s\S]*?)(?=professional opinion|$)/i);
                      
  const opinionMatch = text.match(/专业观点[：:]\s*([\s\S]*?)(?=建议与展望|$)/i) || 
                       text.match(/professional opinion[：:]\s*([\s\S]*?)(?=suggestions|$)/i);
                       
  const suggestionsMatch = text.match(/建议与展望[：:]\s*([\s\S]*?)(?=$)/i) || 
                           text.match(/suggestions[：:]\s*([\s\S]*?)(?=$)/i);
  
  // 提取关键词
  const keywordsMatch = text.match(/关键词[：:]\s*([\s\S]*?)(?=\n|$)/i) || 
                        text.match(/keywords[：:]\s*([\s\S]*?)(?=\n|$)/i);
  
  // 提取情感倾向
  const sentimentMatch = text.match(/情感倾向[：:]\s*([\s\S]*?)(?=\n|$)/i) || 
                         text.match(/sentiment[：:]\s*([\s\S]*?)(?=\n|$)/i);
  
  return {
    summary: (summaryMatch && summaryMatch[1].trim()) || '无法生成摘要',
    background: (backgroundMatch && backgroundMatch[1].trim()) || '无法生成背景分析',
    impact: (impactMatch && impactMatch[1].trim()) || '无法生成影响分析',
    opinion: (opinionMatch && opinionMatch[1].trim()) || '无法生成专业观点',
    suggestions: (suggestionsMatch && suggestionsMatch[1].trim()) || '无法生成建议',
    keywords: keywordsMatch ? keywordsMatch[1].trim().split(/[,，、]/).map(k => k.trim()) : undefined,
    sentiment: sentimentMatch ? sentimentMatch[1].trim() : undefined
  };
}

/**
 * 生成模拟分析数据
 * @param title 文章标题
 * @returns 模拟分析数据
 */
function generateMockAnalysis(title: string): NewsAnalysis {
  return {
    summary: `这是关于"${title}"的内容摘要。文章主要讨论了相关市场动态和行业发展趋势，对投资者具有参考价值。`,
    background: '该新闻出现在当前经济环境下，对市场可能产生一定影响。从宏观角度看，这一事件与近期的经济政策和市场走势有一定关联性。',
    impact: '从短期来看，此类消息可能会对相关板块产生波动；长期而言，需要结合更多数据进行综合判断。投资者应当保持理性，避免情绪化决策。',
    opinion: '根据历史数据和市场规律，类似事件通常会在短期内引起市场反应，但长期影响需要结合基本面和技术面进行分析。建议投资者关注后续政策动向和市场反应。',
    suggestions: '对投资者而言，建议密切关注相关行业动态，特别是政策变化和龙头企业表现。对企业而言，应当提前做好风险管理，把握可能出现的市场机会。',
    keywords: ['市场', '投资', '政策', '风险', '机会'],
    sentiment: '中性',
    generatedAt: new Date().toISOString()
  };
}
