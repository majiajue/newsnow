// server/utils/summarize.ts

import { H3Error } from 'h3';

// 使用 DeepSeek API，需要设置环境变量 DEEPSEEK_API_KEY
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface SummaryResponse {
  choices: Array<{ message: { content: string } }>;
}

/**
 * 使用 DeepSeek API 生成新闻摘要
 * @param text 要摘要的原文
 * @returns 生成的摘要文本
 */
export async function generateSummary(text: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    console.error('DeepSeek API key is not configured.');
    throw new H3Error('AI summary service is unavailable.');
  }

  if (!text || text.trim().length < 50) {
    console.warn('Text is too short for summary, skipping.');
    return ''; // 文本太短，不进行摘要
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // DeepSeek 的模型名称
        messages: [
          { 
            role: 'system', 
            content: '你是一个中文新闻摘要助手，请用100字以内的中文简洁概括新闻内容，保持客观中立。'
          },
          { 
            role: 'user', 
            content: `请概括以下新闻内容：${text}` 
          },
        ],
        max_tokens: 150, // 限制摘要长度
        temperature: 0.3, // 更低的随机性以获得更稳定的摘要
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`DeepSeek API error: ${response.status} ${response.statusText}`, errorBody);
      throw new H3Error(`Failed to generate summary: ${response.statusText}`);
    }

    const data = await response.json() as SummaryResponse;
    const summary = data?.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      console.warn('DeepSeek API returned an empty summary.');
      return '';
    }

    // 基础质量检查
    if (summary.length < 20 || summary.includes('无法概括')) {
        console.warn('Generated summary seems low quality:', summary);
        return ''; // 认为摘要质量不高
    }

    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    return ''; // 发生错误时返回空摘要
  }
}
