/**
 * Jina内容获取和DeepSeek分析API
 * 用于获取文章内容并生成AI摘要和总结
 */

import { defineEventHandler, readBody } from 'h3';
import { readArticleContent } from '../utils/jinaApi';
import axios from 'axios';
import { logger } from '../utils/logger';

// DeepSeek API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * 获取文章内容并生成AI分析
 * POST /api/jinaContent
 */
export default defineEventHandler(async (event) => {
  try {
    const { url } = await readBody(event);
    
    if (!url) {
      return {
        success: false, 
        error: '缺少URL参数'
      };
    }
    
    // 使用Jina Reader API获取文章内容
    const contentResult = await readArticleContent(url, { 
      extractLinks: true, 
      extractImages: true 
    });
    
    if (!contentResult.success) {
      return { 
        success: false, 
        error: contentResult.error || '获取内容失败' 
      };
    }
    
    // 提取文章内容
    const { title, content } = contentResult;
    
    // 生成摘要和分析
    const analysis = await generateAnalysis(title, content);
    
    return {
      success: true,
      title,
      content: content.substring(0, 500) + '...', // 只返回部分内容
      originalUrl: url,
      analysis
    };
  } catch (error: any) {
    logger.error(`Jina内容处理错误: ${error.message}`);
    return { 
      success: false, 
      error: `内容处理失败: ${error.message}` 
    };
  }
});

/**
 * 使用DeepSeek生成文章分析
 */
async function generateAnalysis(title: string, content: string) {
  try {
    if (!DEEPSEEK_API_KEY) {
      logger.warn('缺少DEEPSEEK_API_KEY，使用模拟分析数据');
      return generateMockAnalysis(title);
    }
    
    // 准备提示词
    const prompt = `
你是一位专业的财经分析师，请对以下文章进行深度分析：

标题：${title}

内容：${content.substring(0, 2000)}...

请提供以下分析：
1. 内容摘要（100字以内）
2. 背景分析（分析该新闻的宏观背景）
3. 潜在影响分析（分析该新闻可能产生的短期和长期影响）
4. 专业观点（基于你的专业知识对内容进行评价）
5. 建议与展望（针对投资者或相关方的建议）

请用中文回答，确保分析专业、客观且有深度。
`;

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
        }
      }
    );
    
    if (response.data && response.data.choices && response.data.choices[0]) {
      const analysisText = response.data.choices[0].message.content;
      
      // 解析分析文本
      const sections = parseAnalysisText(analysisText);
      return {
        ...sections,
        generatedAt: new Date().toISOString()
      };
    }
    
    throw new Error('DeepSeek API返回格式异常');
  } catch (error: any) {
    logger.error(`DeepSeek分析生成错误: ${error.message}`);
    return generateMockAnalysis(title);
  }
}

/**
 * 解析分析文本为结构化数据
 */
function parseAnalysisText(text: string) {
  // 尝试提取各个部分
  const summaryMatch = text.match(/内容摘要[：:]\s*([\s\S]*?)(?=背景分析|$)/i);
  const backgroundMatch = text.match(/背景分析[：:]\s*([\s\S]*?)(?=潜在影响分析|$)/i);
  const impactMatch = text.match(/潜在影响分析[：:]\s*([\s\S]*?)(?=专业观点|$)/i);
  const opinionMatch = text.match(/专业观点[：:]\s*([\s\S]*?)(?=建议与展望|$)/i);
  const suggestionsMatch = text.match(/建议与展望[：:]\s*([\s\S]*?)(?=$)/i);
  
  return {
    summary: (summaryMatch && summaryMatch[1].trim()) || '无法生成摘要',
    background: (backgroundMatch && backgroundMatch[1].trim()) || '无法生成背景分析',
    impact: (impactMatch && impactMatch[1].trim()) || '无法生成影响分析',
    opinion: (opinionMatch && opinionMatch[1].trim()) || '无法生成专业观点',
    suggestions: (suggestionsMatch && suggestionsMatch[1].trim()) || '无法生成建议'
  };
}

/**
 * 生成模拟分析数据
 */
function generateMockAnalysis(title: string) {
  return {
    summary: `这是关于"${title}"的内容摘要。文章主要讨论了相关市场动态和行业发展趋势，对投资者具有参考价值。`,
    background: '该新闻出现在当前经济环境下，对市场可能产生一定影响。从宏观角度看，这一事件与近期的经济政策和市场走势有一定关联性。',
    impact: '从短期来看，此类消息可能会对相关板块产生波动；长期而言，需要结合更多数据进行综合判断。投资者应当保持理性，避免情绪化决策。',
    opinion: '根据历史数据和市场规律，类似事件通常会在短期内引起市场反应，但长期影响需要结合基本面和技术面进行分析。建议投资者关注后续政策动向和市场反应。',
    suggestions: '对投资者而言，建议密切关注相关行业动态，特别是政策变化和龙头企业表现。对企业而言，应当提前做好风险管理，把握可能出现的市场机会。',
    generatedAt: new Date().toISOString()
  };
}
