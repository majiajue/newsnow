/**
 * 文章处理定时任务
 * 自动获取财联社文章，使用JinaAI提取内容，用DeepSeek生成摘要和评论，并存储到数据库
 */
import { myFetch } from '../utils/fetch';
import { logger } from '../utils/logger';
import { load } from 'cheerio';
import { PrismaClient } from '@prisma/client';
import { registerTask } from '../utils/taskScheduler';

// 创建Prisma客户端
const prisma = new PrismaClient();

// 任务ID
const TASK_ID = 'article-processor';
// 任务执行间隔（毫秒）
const TASK_INTERVAL = 30 * 60 * 1000; // 30分钟
// 每次处理的文章数量
const BATCH_SIZE = 5;

/**
 * 从财联社API获取最新文章列表
 */
async function fetchLatestArticles(): Promise<any[]> {
  try {
    // API端点列表
    const apiUrls = [
      'https://www.cls.cn/v1/article/list',
      'https://www.cls.cn/v1/telegraph/list',
      'https://www.cls.cn/v1/depth/list'
    ];
    
    // 请求头
    const headers = {
      'Referer': 'https://www.cls.cn/',
      'Origin': 'https://www.cls.cn',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
    };
    
    // 请求参数
    const params = {
      app: 'CailianpressWeb',
      os: 'web',
      sv: '7.7.5',
      page: '1',
      rn: '20'
    };
    
    // 尝试所有API端点
    for (const url of apiUrls) {
      try {
        logger.info(`尝试从API获取文章列表: ${url}`);
        const response = await myFetch(url, { params, headers });
        
        // 尝试提取数据
        let articles: any[] = [];
        
        if (response && typeof response === 'object') {
          // 处理不同的响应格式
          let items: any[] = [];
          
          if (Array.isArray(response.data)) {
            items = response.data;
          } else if (response.data?.roll_data?.list && Array.isArray(response.data.roll_data.list)) {
            items = response.data.roll_data.list;
          } else if (response.data?.roll_data && Array.isArray(response.data.roll_data)) {
            items = response.data.roll_data;
          } else if (response.data?.depth_list && Array.isArray(response.data.depth_list)) {
            items = response.data.depth_list;
          } else if (Array.isArray(response)) {
            items = response;
          }
          
          // 转换数据格式
          if (items.length > 0) {
            articles = items
              .filter(item => !item.is_ad)
              .map(item => ({
                id: item.id || '',
                title: item.title || item.brief || '',
                summary: item.digest || item.brief || '',
                url: item.link || item.shareurl || `https://www.cls.cn/detail/${item.id}`,
                pubDate: item.ctime ? new Date(parseInt(item.ctime) * 1000).toISOString() : new Date().toISOString(),
                source: item.source || '财联社',
                category: item.column_name || '财经'
              }));
            
            logger.info(`成功从API获取文章列表: ${url}`, { count: articles.length });
            return articles;
          }
        }
      } catch (error) {
        logger.warn(`从API获取文章列表失败: ${url}`, { error: error.message });
      }
    }
    
    // 所有API都失败
    logger.error('所有API端点都失败');
    return [];
  } catch (error) {
    logger.error('获取最新文章列表失败', { error: error.message });
    return [];
  }
}

/**
 * 使用JinaAI获取文章详细内容
 */
async function fetchArticleContent(url: string): Promise<any> {
  try {
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

    return {
      title: articleTitle,
      content: articleContent,
      cleanContent,
      pubDate: articleDate,
      author: articleAuthor,
      imageUrl: articleImage
    };
  } catch (error) {
    logger.error(`获取文章内容失败: ${url}`, { error: error.message });
    throw error;
  }
}

/**
 * 使用DeepSeek生成摘要和评论
 */
async function generateSummaryAndComment(title: string, content: string): Promise<{ summary: string; comment: string }> {
  try {
    // 使用DeepSeek API生成摘要和评论
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
            content: `请对以下财经新闻进行分析，提供一个简短的摘要（不超过150字）和一个专业的评论（不超过300字）。新闻标题：${title}，新闻内容：${content.substring(0, 3000)}`
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

    return { summary, comment };
  } catch (error) {
    logger.error(`生成摘要和评论失败: ${title}`, { error: error.message });
    throw error;
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
          imageUrl: content.imageUrl
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
    logger.info(`开始处理文章: ${article.title}`);

    // 1. 获取文章详细内容
    const content = await fetchArticleContent(article.url);
    
    // 2. 生成摘要和评论
    const ai = await generateSummaryAndComment(content.title || article.title, content.cleanContent);
    
    // 3. 保存到数据库
    await saveArticleToDatabase(article, content, ai);
    
    logger.info(`文章处理完成: ${article.title}`);
  } catch (error) {
    logger.error(`处理文章失败: ${article.title}`, { error: error.message });
  }
}

/**
 * 主任务执行函数
 */
async function executeTask(): Promise<void> {
  try {
    // 1. 获取最新文章列表
    const articles = await fetchLatestArticles();
    
    if (articles.length === 0) {
      logger.warn('未获取到文章，跳过本次处理');
      return;
    }
    
    logger.info(`获取到 ${articles.length} 篇文章，将处理前 ${BATCH_SIZE} 篇`);
    
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
      logger.info('所有文章已存在于数据库中，跳过本次处理');
      return;
    }
    
    logger.info(`发现 ${newArticles.length} 篇新文章需要处理`);
    
    // 4. 逐个处理新文章
    for (const article of newArticles) {
      await processArticle(article);
      // 添加延迟，避免API请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    logger.info(`本次任务处理完成，共处理 ${newArticles.length} 篇文章`);
  } catch (error) {
    logger.error('执行文章处理任务失败', { error: error.message });
  }
}

/**
 * 注册文章处理任务
 */
export function registerArticleProcessorTask(): void {
  registerTask({
    id: TASK_ID,
    name: '文章处理器',
    interval: TASK_INTERVAL,
    fn: executeTask
  });
  
  logger.info(`文章处理任务已注册，间隔: ${TASK_INTERVAL / 1000 / 60}分钟`);
}
