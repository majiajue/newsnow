/**
 * 财联社文章摘要和评论生成 API
 */
import { defineEventHandler, readBody } from 'h3';
import { myFetch } from '#/utils/fetch';
import { getSearchParams } from '#/sources/cls/utils';
import { logger } from '#/utils/logger';
import { load } from 'cheerio';

// 财联社文章详情接口响应类型
interface CLSArticleDetailResponse {
  code: number;
  data: {
    content: string;
    title: string;
    ctime: string;
    source: string;
    author?: string;
    tags?: string[];
    category?: string;
  };
}

// DeepSeek API 响应类型
interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export default defineEventHandler(async (event) => {
  try {
    // 获取请求体
    const body = await readBody(event);
    const { id, url } = body;

    if (!id && !url) {
      throw new Error('文章ID或URL不能为空');
    }

    // 根据ID或URL获取文章详情
    let articleId = id;
    if (!articleId && url) {
      // 从URL中提取ID
      const match = url.match(/\/detail\/(\d+)/);
      if (match && match[1]) {
        articleId = match[1];
      } else {
        throw new Error('无法从URL中提取文章ID');
      }
    }

    // 使用财联社 API 获取文章详情
    const apiUrl = `https://www.cls.cn/api/article/${articleId}`;
    const params = await getSearchParams();
    
    const response = await myFetch(apiUrl, {
      params: Object.fromEntries(params),
    }) as CLSArticleDetailResponse;

    if (response.code !== 0 || !response.data) {
      throw new Error(`获取财联社文章详情失败: ${JSON.stringify(response)}`);
    }

    // 提取文章内容
    const $ = load(response.data.content);
    // 移除不必要的元素
    $('script, style, iframe').remove();
    // 获取纯文本内容
    const textContent = $.text().trim();

    // 使用 DeepSeek API 生成摘要和评论
    const deepSeekPrompt = `
请根据以下财经文章内容，生成一个简短的摘要（不超过100字）和一个专业的评论（不超过200字）。

文章标题：${response.data.title}
文章内容：${textContent.substring(0, 2000)}...

请按照以下格式回复：
摘要：[摘要内容]
评论：[评论内容]
`;

    // 调用 DeepSeek API
    const deepSeekResponse = await myFetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: deepSeekPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    }) as DeepSeekResponse;

    // 解析 DeepSeek 响应
    const aiContent = deepSeekResponse.choices[0]?.message.content || '';
    
    // 提取摘要和评论
    const summaryMatch = aiContent.match(/摘要：([\s\S]*?)(?=评论：|$)/);
    const commentMatch = aiContent.match(/评论：([\s\S]*?)$/);
    
    const summary = summaryMatch ? summaryMatch[1].trim() : '无法生成摘要';
    const comment = commentMatch ? commentMatch[1].trim() : '无法生成评论';

    // 构建文章详情对象
    const article = {
      id: articleId,
      title: response.data.title,
      content: response.data.content,
      textContent: textContent,
      url: `https://www.cls.cn/detail/${articleId}`,
      pubDate: new Date(parseInt(response.data.ctime) * 1000).toISOString(),
      source: response.data.source || '财联社',
      author: response.data.author,
      tags: response.data.tags,
      category: response.data.category,
      summary,
      comment
    };

    // 返回数据
    return {
      code: 0,
      data: article
    };
  } catch (error) {
    logger.error(`财联社文章摘要生成 API 错误: ${error}`);
    return {
      code: 500,
      message: `生成文章摘要和评论失败: ${error}`,
      data: null
    };
  }
});
