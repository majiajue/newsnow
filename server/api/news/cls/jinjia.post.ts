/**
 * 财联社金佳 API - 获取文章详情并生成摘要和总结
 */
import { defineEventHandler, readBody } from 'h3';
import { myFetch } from '#/utils/fetch';
import { logger } from '#/utils/logger';
import { load } from 'cheerio';

export default defineEventHandler(async (event) => {
  try {
    // 获取请求体
    const body = await readBody(event);
    const { id, url } = body;

    if (!id && !url) {
      throw new Error('缺少必要的文章ID或URL参数');
    }

    // 确定要访问的URL
    const targetUrl = url || `https://www.cls.cn/detail/${id}`;
    logger.info(`尝试使用金佳API获取文章: ${targetUrl}`);

    // 步骤1: 使用金佳API获取文章内容
    const jinjiaApiUrl = 'https://api.jinjia.co/v1/extract';
    const jinjiaResponse = await myFetch(jinjiaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.JINJIA_API_KEY || ''}`,
      },
      body: JSON.stringify({
        url: targetUrl,
        fields: ['title', 'content', 'author', 'date', 'image'],
      }),
    });

    if (!jinjiaResponse || typeof jinjiaResponse !== 'object') {
      throw new Error('金佳API返回无效数据');
    }

    logger.info(`金佳API响应: ${JSON.stringify(jinjiaResponse).substring(0, 500)}...`);

    // 提取文章内容
    let articleContent = '';
    let articleTitle = '';
    let articleDate = '';
    let articleAuthor = '';
    let articleImage = '';

    if (jinjiaResponse.data) {
      articleTitle = jinjiaResponse.data.title || '';
      articleContent = jinjiaResponse.data.content || '';
      articleDate = jinjiaResponse.data.date || '';
      articleAuthor = jinjiaResponse.data.author || '';
      articleImage = jinjiaResponse.data.image || '';
    } else if (jinjiaResponse.title && jinjiaResponse.content) {
      articleTitle = jinjiaResponse.title || '';
      articleContent = jinjiaResponse.content || '';
      articleDate = jinjiaResponse.date || '';
      articleAuthor = jinjiaResponse.author || '';
      articleImage = jinjiaResponse.image || '';
    } else {
      throw new Error('无法从金佳API响应中提取文章内容');
    }

    // 清理文章内容 - 去除HTML标签
    let cleanContent = '';
    try {
      const $ = load(articleContent);
      cleanContent = $.text().trim();
    } catch (e) {
      logger.warn(`清理HTML内容出错: ${e}`);
      cleanContent = articleContent.replace(/<[^>]*>/g, '').trim();
    }

    // 步骤2: 使用DeepSeek API生成摘要和评论
    const deepseekApiUrl = 'https://api.deepseek.com/v1/chat/completions';
    const deepseekResponse = await myFetch(deepseekApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的财经分析师，擅长分析财经新闻并提供简洁明了的摘要和专业评论。'
          },
          {
            role: 'user',
            content: `请对以下财经新闻进行分析，提供一个简短的摘要（不超过150字）和一个专业的评论（不超过300字）。新闻标题：${articleTitle}，新闻内容：${cleanContent.substring(0, 3000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!deepseekResponse || typeof deepseekResponse !== 'object' || !deepseekResponse.choices || !deepseekResponse.choices[0]) {
      throw new Error('DeepSeek API返回无效数据');
    }

    const aiResponse = deepseekResponse.choices[0].message.content;
    
    // 从AI响应中提取摘要和评论
    let summary = '';
    let comment = '';

    // 尝试从AI响应中提取摘要和评论
    const summaryMatch = aiResponse.match(/摘要[:：]([\s\S]*?)(?=评论[:：]|$)/i);
    const commentMatch = aiResponse.match(/评论[:：]([\s\S]*?)$/i);

    if (summaryMatch && summaryMatch[1]) {
      summary = summaryMatch[1].trim();
    } else {
      // 如果无法提取，使用前半部分作为摘要
      summary = aiResponse.substring(0, aiResponse.length / 2).trim();
    }

    if (commentMatch && commentMatch[1]) {
      comment = commentMatch[1].trim();
    } else {
      // 如果无法提取，使用后半部分作为评论
      comment = aiResponse.substring(aiResponse.length / 2).trim();
    }

    // 返回结果
    return {
      code: 0,
      data: {
        article: {
          id: id || '',
          title: articleTitle,
          content: articleContent,
          cleanContent,
          pubDate: articleDate,
          author: articleAuthor,
          imageUrl: articleImage,
          url: targetUrl
        },
        ai: {
          summary,
          comment,
          fullResponse: aiResponse
        }
      }
    };
  } catch (error) {
    logger.error(`财联社金佳 API 错误: ${error}`);
    return {
      code: 500,
      message: `获取文章详情并生成摘要失败: ${error}`,
      data: null
    };
  }
});
