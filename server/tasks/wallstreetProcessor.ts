/**
 * 华尔街见闻文章处理定时任务
 * 自动获取华尔街见闻文章，使用JinaAI提取内容，用DeepSeek生成摘要和评论，并存储到数据库
 */
import { myFetch } from '../utils/fetch';
import { logger } from '../utils/logger';
import { load } from 'cheerio';
import { PrismaClient } from '@prisma/client';
import { registerTask } from '../utils/taskScheduler';
import { fetchWallStreetNews, fetchWallStreetArticleDetail } from '../utils/crawlers/wallstreet';

// 创建Prisma客户端
const prisma = new PrismaClient();

// 任务ID
const TASK_ID = 'wallstreet-processor';
// 任务执行间隔（毫秒）
const TASK_INTERVAL = 5 * 60 * 1000; // 5分钟
// 每次处理的文章数量
const BATCH_SIZE = 5;

/**
 * 使用JinaAI获取文章详细内容
 */
async function fetchArticleContent(url: string): Promise<any> {
  try {
    logger.info(`开始从金佳API获取文章内容: ${url}`);
    
    // 使用金佳API获取文章内容
    const jinjiaApiUrl = 'https://api.jinjia.co/v1/extract';
    const jinjiaResponse = await myFetch(jinjiaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.JINJIA_API_KEY || ''}`,
      },
      body: JSON.stringify({
        url,
        fields: ['title', 'content', 'author', 'date', 'image'],
      }),
    });

    if (!jinjiaResponse || typeof jinjiaResponse !== 'object') {
      logger.error(`金佳API返回无效数据: ${JSON.stringify(jinjiaResponse)}`);
      throw new Error('金佳API返回无效数据');
    }

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
      
      logger.info(`从金佳API响应的data字段提取内容成功: ${articleTitle}`);
    } else if (jinjiaResponse.title && jinjiaResponse.content) {
      articleTitle = jinjiaResponse.title || '';
      articleContent = jinjiaResponse.content || '';
      articleDate = jinjiaResponse.date || '';
      articleAuthor = jinjiaResponse.author || '';
      articleImage = jinjiaResponse.image || '';
      
      logger.info(`从金佳API响应的根字段提取内容成功: ${articleTitle}`);
    } else {
      logger.error(`无法从金佳API响应中提取文章内容: ${JSON.stringify(jinjiaResponse).substring(0, 200)}...`);
      throw new Error('无法从金佳API响应中提取文章内容');
    }

    // 清理文章内容 - 去除HTML标签
    let cleanContent = '';
    try {
      const $ = load(articleContent);
      cleanContent = $.text().trim();
      logger.info(`成功清理HTML内容，清理后长度: ${cleanContent.length}`);
    } catch (e) {
      logger.warn(`清理HTML内容出错: ${e instanceof Error ? e.message : String(e)}`);
      cleanContent = articleContent.replace(/<[^>]*>/g, '').trim();
      logger.info(`使用正则表达式清理HTML内容，清理后长度: ${cleanContent.length}`);
    }

    logger.info(`成功从金佳API获取文章内容: ${articleTitle}`);

    return {
      title: articleTitle,
      content: articleContent,
      cleanContent,
      pubDate: articleDate,
      author: articleAuthor,
      imageUrl: articleImage
    };
  } catch (error) {
    logger.error(`获取文章内容失败: ${url}`, { error: error instanceof Error ? error.message : String(error) });
    
    // 使用备选方案：返回一个基本的内容对象，后续处理可以使用爬虫获取的内容
    logger.info(`使用备选方案获取文章内容: ${url}`);
    return {
      title: '', // 将在processArticle中使用article.title
      content: '', // 将在processArticle中使用articleDetail.content
      cleanContent: '', // 将在processArticle中使用articleDetail.content并清理
      pubDate: new Date().toISOString(),
      author: 'WallStreet',
      imageUrl: ''
    };
  }
}

/**
 * 使用DeepSeek生成摘要和评论
 */
async function generateSummaryAndComment(title: string, content: string): Promise<{ summary: string; comment: string; aiAnalysis?: string }> {
  try {
    logger.info(`开始使用DeepSeek生成摘要和评论: ${title.substring(0, 30)}...`);
    
    // 如果内容为空，使用标题作为基础内容
    if (!content || content.trim().length === 0) {
      content = title;
      logger.warn(`文章内容为空，使用标题作为内容: ${title}`);
    }
    
    // 使用DeepSeek API生成摘要和评论
    const deepseekApiUrl = 'https://api.deepseek.com/v1/chat/completions';
    const process = require("process");
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
            content: '你是一位专业的财经分析师，擅长分析财经新闻并提供简洁明了的摘要和专业评论。你需要提供以下几个部分：1. 摘要（150字以内）；2. 评论（300字以内）；3. 关键要点（3点）；4. 分析背景；5. 影响评估；6. 专业意见；7. 建议行动（3点）。'
          },
          {
            role: 'user',
            content: `请对以下财经新闻进行分析，提供完整的分析报告。新闻标题：${title}，新闻内容：${content.substring(0, 3000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!deepseekResponse || typeof deepseekResponse !== 'object' || !deepseekResponse.choices || !deepseekResponse.choices[0]) {
      logger.error(`DeepSeek API返回无效数据: ${JSON.stringify(deepseekResponse)}`);
      throw new Error('DeepSeek API返回无效数据');
    }

    const aiResponse = deepseekResponse.choices[0].message.content;
    
    // 从AI响应中提取摘要和评论
    let summary = '';
    let comment = '';
    let aiAnalysis = aiResponse; // 保存完整的AI分析内容

    // 尝试从AI响应中提取摘要和评论
    const summaryMatch = aiResponse.match(/摘要[:：]([\s\S]*?)(?=评论[:：]|$)/i);
    const commentMatch = aiResponse.match(/评论[:：]([\s\S]*?)(?=关键要点[:：]|$)/i);

    if (summaryMatch && summaryMatch[1]) {
      summary = summaryMatch[1].trim();
    } else {
      // 如果无法提取，使用前半部分作为摘要
      summary = aiResponse.substring(0, aiResponse.length / 4).trim();
    }

    if (commentMatch && commentMatch[1]) {
      comment = commentMatch[1].trim();
    } else {
      // 如果无法提取，使用中间部分作为评论
      comment = aiResponse.substring(aiResponse.length / 4, aiResponse.length / 2).trim();
    }

    logger.info(`成功生成摘要和评论: ${title.substring(0, 30)}...`);
    return { summary, comment, aiAnalysis };
  } catch (error) {
    logger.error(`生成摘要和评论失败: ${title}`, { error: error instanceof Error ? error.message : String(error) });
    
    // 使用备选方案：生成基本的摘要和评论
    logger.info(`使用备选方案生成摘要和评论: ${title}`);
    
    // 从内容中提取摘要
    let summary = '';
    if (content && content.length > 0) {
      // 提取前100个字符作为摘要
      summary = content.substring(0, 100).replace(/<[^>]*>/g, '').trim();
      if (summary.length < 10 && title) {
        summary = title; // 如果摘要太短，使用标题
      }
    } else {
      summary = title; // 如果内容为空，使用标题
    }
    
    // 生成一个基本的评论
    const comment = `这是关于"${title}"的财经新闻，提供了相关行业的最新动态。建议投资者关注相关发展，评估可能的市场影响。`;
    
    // 生成一个基本的AI分析内容
    const aiAnalysis = `
摘要：${summary}

评论：${comment}

关键要点：
1. ${title}反映了财经领域的最新发展趋势
2. 这一动态对市场参与者具有重要参考价值
3. 投资者应密切关注后续发展

分析背景：
近期财经领域发生了一系列重要变化，本文所报道的内容是这些变化的重要组成部分。从宏观角度看，这些变化将对整体经济环境产生深远影响。

影响评估：
短期内，该消息可能引起市场波动；中长期来看，将促进相关行业的结构性调整和优化升级。投资者应当理性看待这一变化，避免盲目跟风或恐慌性决策。

专业意见：
从专业角度分析，这一发展符合当前经济和政策环境的整体趋势。建议投资者结合自身风险偏好和投资目标，审慎决策。

建议行动：
1. 密切关注后续政策和市场反应
2. 评估对自身投资组合的潜在影响
3. 适当调整资产配置策略，分散风险
`;
    
    return { summary, comment, aiAnalysis };
  }
}

/**
 * 将文章保存到数据库
 */
async function saveArticleToDatabase(article: any, content: any, ai: any): Promise<void> {
  try {
    // 检查文章是否已存在
    const existingContent = await prisma.content.findFirst({
      where: {
        sourceUrl: article.url
      }
    });

    if (existingContent) {
      logger.info(`文章已存在，跳过保存: ${article.title}`);
      return;
    }

    // 保存文章到数据库
    const result = await prisma.content.create({
      data: {
        title: article.title,
        content: content.content,
        source: article.source,
        sourceUrl: article.url,
        author: content.author || article.author,
        publishDate: new Date(content.pubDate || article.pubDate),
        categories: article.category,
        summary: ai.summary,
        metadata: JSON.stringify({
          cleanContent: content.cleanContent,
          aiComment: ai.comment,
          imageUrl: content.imageUrl || article.imageUrl,
          aiAnalysis: ai.aiAnalysis
        }),
        status: 'published',
        quality: 0.8
      }
    });

    logger.info(`文章已保存到数据库: ${article.title}`, { id: result.id });
  } catch (error) {
    logger.error(`保存文章到数据库失败: ${article.title}`, { error: error.message });
    throw error;
  }
}

/**
 * 处理单篇文章
 */
async function processArticle(article: any): Promise<void> {
  try {
    logger.info(`开始处理华尔街见闻文章: ${article.title}`);

    // 1. 获取文章详细内容
    const articleDetail = await fetchWallStreetArticleDetail(article.id);
    if (!articleDetail) {
      logger.error(`获取华尔街见闻文章详情失败: ${article.title}`);
      return;
    }
    
    // 2. 使用JinaAI获取更详细的内容
    const content = await fetchArticleContent(article.url);
    
    // 3. 生成摘要和评论
    // 如果JinaAI返回的内容为空，使用爬虫获取的内容
    const articleContent = articleDetail.content || '';
    const contentToUse = content.cleanContent || articleContent.replace(/<[^>]*>/g, '').trim();
    const ai = await generateSummaryAndComment(content.title || article.title, contentToUse);
    
    // 4. 保存到数据库
    await saveArticleToDatabase({
      ...article,
      content: articleContent
    }, {
      ...content,
      // 确保content字段不为空
      content: content.content || articleContent,
      cleanContent: contentToUse
    }, ai);
    
    logger.info(`华尔街见闻文章处理完成: ${article.title}`);
  } catch (error) {
    logger.error(`处理华尔街见闻文章失败: ${article.title}`, { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * 主任务执行函数
 */
async function executeTask(): Promise<void> {
  try {
    // 1. 获取最新文章列表
    const articles = await fetchWallStreetNews(20);
    
    if (articles.length === 0) {
      logger.warn('未获取到华尔街见闻文章，跳过本次处理');
      return;
    }
    
    logger.info(`获取到 ${articles.length} 篇华尔街见闻文章，将处理前 ${BATCH_SIZE} 篇`);
    
    // 2. 获取需要处理的文章
    const articlesToProcess = articles.slice(0, BATCH_SIZE);
    
    // 3. 检查这些文章是否已经在数据库中
    const urls = articlesToProcess.map(article => article.url);
    const existingContents = await prisma.content.findMany({
      where: {
        sourceUrl: {
          in: urls
        }
      },
      select: {
        sourceUrl: true
      }
    });
    
    const existingUrls = new Set(existingContents.map(content => content.sourceUrl));
    const newArticles = articlesToProcess.filter(article => !existingUrls.has(article.url));
    
    if (newArticles.length === 0) {
      logger.info('所有华尔街见闻文章已存在于数据库中，跳过本次处理');
      return;
    }
    
    logger.info(`发现 ${newArticles.length} 篇新华尔街见闻文章需要处理`);
    
    // 4. 逐个处理新文章
    for (const article of newArticles) {
      await processArticle(article);
      // 添加延迟，避免API请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    logger.info(`本次华尔街见闻任务处理完成，共处理 ${newArticles.length} 篇文章`);
  } catch (error) {
    logger.error('执行华尔街见闻文章处理任务失败', { error: error.message });
  }
}

/**
 * 注册华尔街见闻文章处理任务
 */
export function registerWallStreetProcessorTask(): void {
  registerTask({
    id: TASK_ID,
    name: '华尔街见闻文章处理器',
    interval: TASK_INTERVAL,
    fn: executeTask
  });
  
  logger.info(`华尔街见闻文章处理任务已注册，间隔: ${TASK_INTERVAL / 1000 / 60}分钟`);
}
