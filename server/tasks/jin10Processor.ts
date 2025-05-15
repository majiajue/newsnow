/**
 * 金十数据文章处理定时任务
 * 自动获取金十数据文章，使用JinaAI提取内容，用DeepSeek生成摘要和评论，并存储到数据库
 */
import { myFetch } from '../utils/fetch';
// 使用console替代logger
import { load } from 'cheerio';
import prisma from '../utils/prismaClient.js';
import { registerTask } from '../utils/taskScheduler';
import { fetchJin10News, fetchJin10ArticleDetail } from '../utils/crawlers/jin10';
const process = require("process");

// 创建Prisma客户端
// 使用预初始化的 prisma 实例;

// 任务ID
const TASK_ID = 'jin10-processor';
// 任务执行间隔（毫秒）
const TASK_INTERVAL = 5 * 60 * 1000; // 5分钟
// 每次处理的文章数量
const BATCH_SIZE = 5;

/**
 * 使用JinaAI获取文章详细内容
 */
async function fetchArticleContent(url: string): Promise<any> {
  try {
    console.log(`开始从金佳API获取文章内容: ${url}`);
    
    // 使用Jina AI API获取文章内容
    // 将目标URL直接拼接到API地址中
    const encodedUrl = encodeURIComponent(url);
    const jinaApiUrl = `https://r.jina.ai/${encodedUrl}`;
    
    const jinaResponse = await myFetch(jinaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.JINA_API_KEY || ''}`,
      },
      body: JSON.stringify({
        respondWith: 'content',
        withGeneratedAlt: true,
        retainImages: 'all',
        withImagesSummary: true,
        noCache: true
      }),
    });

    if (!jinaResponse || typeof jinaResponse !== 'object') {
      console.error(`Jina AI API返回无效数据: ${JSON.stringify(jinaResponse)}`);
      throw new Error('Jina AI API返回无效数据');
    }

    // 提取文章内容 - Jina API返回格式与之前假设的不同
    let articleContent = '';
    let articleTitle = '';
    let articleDate = '';
    let articleAuthor = '';
    let articleImage = '';

    // 针对Jina API的正确返回格式处理
    if (jinaResponse.code === 200 && jinaResponse.data) {
      // 从响应的data字段获取内容
      articleContent = jinaResponse.data || '';
      
      // 尝试从内容中提取标题 - 通常第一个h1标签
      const titleMatch = articleContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (titleMatch && titleMatch[1]) {
        articleTitle = titleMatch[1].trim();
      }
      
      // 尝试从meta信息中提取作者和日期
      if (jinaResponse.meta) {
        articleAuthor = jinaResponse.meta.author || '';
        articleDate = jinaResponse.meta.date || '';
      }
      
      // 尝试获取第一张图片作为封面
      const imageMatch = articleContent.match(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/i);
      if (imageMatch && imageMatch[1]) {
        articleImage = imageMatch[1];
      }
      
      console.log(`从Jina AI响应提取内容成功: ${articleTitle || '无标题'}`);
    } else {
      console.error(`无法从Jina AI响应中提取文章内容: ${JSON.stringify(jinaResponse).substring(0, 200)}...`);
      throw new Error('无法从Jina AI响应中提取文章内容');
    }

    // 清理文章内容 - 去除HTML标签
    let cleanContent = '';
    try {
      const $ = load(articleContent);
      cleanContent = $.text().trim();
      console.log(`成功清理HTML内容，清理后长度: ${cleanContent.length}`);
    } catch (e) {
      console.warn(`清理HTML内容出错: ${e instanceof Error ? e.message : String(e)}`);
      cleanContent = articleContent.replace(/<[^>]*>/g, '').trim();
      console.log(`使用正则表达式清理HTML内容，清理后长度: ${cleanContent.length}`);
    }

    console.log(`成功从金佳API获取文章内容: ${articleTitle}`);

    return {
      title: articleTitle,
      content: articleContent,
      cleanContent,
      pubDate: articleDate,
      author: articleAuthor,
      imageUrl: articleImage
    };
  } catch (error) {
    console.error(`获取文章内容失败: ${url}`, { error: error instanceof Error ? error.message : String(error) });
    
    // 使用备选方案：返回一个基本的内容对象，后续处理可以使用爬虫获取的内容
    console.log(`使用备选方案获取文章内容: ${url}`);
    return {
      title: '', // 将在processArticle中使用article.title
      content: '', // 将在processArticle中使用articleDetail.content
      cleanContent: '', // 将在processArticle中使用articleDetail.content并清理
      pubDate: new Date().toISOString(),
      author: '金十数据',
      imageUrl: ''
    };
  }
}

/**
 * 使用DeepSeek生成摘要和评论
 */
async function generateSummaryAndComment(title: string, content: string): Promise<{ summary: string; comment: string; aiAnalysis?: string; analysisData?: any }> {
  try {
    console.log(`开始使用DeepSeek生成摘要和评论: ${title.substring(0, 30)}...`);
    
    // 如果内容为空，使用标题作为基础内容
    if (!content || content.trim().length === 0) {
      content = title;
      console.warn(`文章内容为空，使用标题作为内容: ${title}`);
    }
    
    // 使用改进的deepseekAnalyzer生成JSON格式的分析内容
    // 导入generateDeepSeekAnalysis函数
    const { generateDeepSeekAnalysis } = await import('../utils/deepseekAnalyzer.js');
    
    // 调用改进后的DeepSeek分析器
    const analysisResult = await generateDeepSeekAnalysis(
      title,
      content
    );

    // 检查分析结果
    if (!analysisResult.success) {
      console.error(`DeepSeek分析器返回错误: ${analysisResult.error}`);
      throw new Error(analysisResult.error || 'DeepSeek分析失败');
    }

    // 从分析结果中提取摘要和评论
    // 注意：处理可能的类型问题
    const summary = analysisResult.summary || title;
    // 由于DeepSeekAnalysisResult接口中可能没有comment字段，使用类型断言
    const commentData = (analysisResult as any).analysisData?.comment || '';
    const comment = commentData || `关于"${title}"的财经新闻分析`;
    
    // 直接使用DeepSeek返回的原始JSON数据
    const aiAnalysis = JSON.stringify(analysisResult.analysisData || {}); // 将analysisData转为JSON字符串

    console.log(`成功生成摘要和评论: ${title.substring(0, 30)}...`);
    return { 
      summary, 
      comment, 
      aiAnalysis,
      // 保存原始JSON分析数据，便于前端直接使用
      analysisData: {
        summary: analysisResult.summary,
        comment: commentData,
        keyPoints: Array.isArray(analysisResult.keyPoints) ? analysisResult.keyPoints : [],
        background: analysisResult.background || '',
        impact: analysisResult.impact || '',
        opinion: analysisResult.opinion || '',
        suggestions: Array.isArray(analysisResult.suggestions) ? analysisResult.suggestions : [],
        generatedAt: analysisResult.generatedAt || new Date().toISOString()
      }
    };
  } catch (error: unknown) {
    // 安全地处理错误对象
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`生成摘要和评论失败: ${title}`, { error: errorMessage });
    
    // 使用备选方案：生成基本的摘要和评论
    console.log(`使用备选方案生成摘要和评论: ${title}`);
    
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
    
    // 生成预填充的analysisData对象
    const keyPoints = [
      `${title}反映了财经领域的最新发展趋势`,
      `这一动态对市场参与者具有重要参考价值`,
      `投资者应密切关注后续发展`
    ];
    
    const background = `近期财经领域发生了一系列重要变化，本文所报道的内容是这些变化的重要组成部分。从宏观角度看，这些变化将对整体经济环境产生深远影响。`;
    
    const impact = `短期内，该消息可能引起市场波动；中长期来看，将促进相关行业的结构性调整和优化升级。投资者应当理性看待这一变化，避免盲目跟风或恐慌性决策。`;
    
    const opinion = `从专业角度分析，这一发展符合当前经济和政策环境的整体趋势。建议投资者结合自身风险偏好和投资目标，审慎决策。`;
    
    const suggestions = [
      `密切关注后续政策和市场反应`,
      `评估对自身投资组合的潜在影响`,
      `适当调整资产配置策略，分散风险`
    ];
    
    // 构建分析数据对象
    const analysisData = {
      summary: summary,
      comment: comment,
      keyPoints: keyPoints,
      background: background,
      impact: impact,
      opinion: opinion,
      suggestions: suggestions,
      generatedAt: new Date().toISOString()
    };
    
    // 生成AI分析内容（JSON字符串）
    const aiAnalysis = JSON.stringify(analysisData);
    
    return { summary, comment, aiAnalysis, analysisData };
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
      console.log(`文章已存在，跳过保存: ${article.title}`);
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
          aiAnalysis: ai.aiAnalysis,
          imageUrl: content.imageUrl || article.imageUrl
        }),
        status: 'published',
        quality: 0.8
      }
    });

    console.log(`文章已保存到数据库: ${article.title}`, { id: result.id });
  } catch (error) {
    console.error(`保存文章到数据库失败: ${article.title}`, { error: error.message });
    throw error;
  }
}

/**
 * 处理单篇文章
 */
async function processArticle(article: any): Promise<void> {
  try {
    console.log(`开始处理金十数据文章: ${article.title}`);

    // 1. 获取文章详细内容（使用爬虫）
    console.log(`使用爬虫获取金十数据文章详情: ${article.id}`);
    const articleDetail = await fetchJin10ArticleDetail(article.id);
    if (!articleDetail) {
      console.error(`获取金十数据文章详情失败: ${article.title}`);
      return;
    }
    
    // 提取和清理爬虫获取的内容
    let articleContent = articleDetail.content || '';
    
    // 特别处理：如果内容为空（金十快讯特点），将标题作为内容
    if (!articleContent || articleContent.trim().length === 0) {
      console.warn(`金十数据快讯内容为空，使用标题作为内容: ${article.title}`);
      articleContent = `<p>${article.title}</p>`;
      if (article.summary && article.summary !== article.title) {
        articleContent += `<p>${article.summary}</p>`;
      }
    }
    
    let cleanContent = articleContent.replace(/<[^>]*>/g, '').trim();
    
    // 如果清理后内容仍为空，直接使用标题
    if (!cleanContent || cleanContent.length === 0) {
      cleanContent = article.title;
    }
    
    // 定制处理金十数据的快讯和正文文章
    let contentType = '正文文章';
    if (cleanContent.length < 50) {
      contentType = '快讯';
      console.warn(`检测到金十数据${contentType}，内容简短: ${cleanContent}`);
    }
    
    console.log(`成功获取文章内容，原始内容长度: ${articleContent.length}，清理后长度: ${cleanContent.length}`);
    
    // 封装爬虫获取的内容，不再调用Jina AI
    const content = {
      title: articleDetail.title || article.title,
      content: articleContent,  // 确保内容不为空
      cleanContent: cleanContent,  // 确保清理内容不为空
      pubDate: articleDetail.pubDate || article.pubDate,
      author: articleDetail.author || '金十数据',
      imageUrl: articleDetail.imageUrl || ''
    };
    
    // 生成摘要和评论，适用于快讯和正文文章
    let contentToUse = '';
    if (contentType === '快讯') {
      // 快讯类型：使用标题和摘要生成内容
      contentToUse = article.title;
      if (article.summary && article.title !== article.summary) {
        contentToUse += '. ' + article.summary;
      }
      console.log(`金十数据快讯处理，使用标题和摘要生成内容: ${contentToUse}`);
    } else {
      // 正文文章类型：使用清理后的内容
      contentToUse = cleanContent.length > 100 ? cleanContent : article.title + (article.summary ? '. ' + article.summary : '');
      console.log(`金十数据正文文章处理，使用清理后内容生成摘要和评论`);
    }
    
    console.log(`使用内容生成摘要和评论，内容长度: ${contentToUse.length}`);
    const ai = await generateSummaryAndComment(content.title, contentToUse);
    
    // 保存到数据库，确保内容不为空
    await saveArticleToDatabase({
      ...article,
      content: articleContent // 使用处理后的内容，让article也有内容
    }, content, ai);
    
    console.log(`金十数据文章处理完成: ${article.title}`);
  } catch (error) {
    console.error(`处理金十数据文章失败: ${article.title}`, { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * 主任务执行函数
 */
async function executeTask(): Promise<void> {
  try {
    // 1. 获取最新文章列表
    const articles = await fetchJin10News(1, 20);
    
    if (articles.length === 0) {
      console.warn('未获取到金十数据文章，跳过本次处理');
      return;
    }
    
    console.log(`获取到 ${articles.length} 篇金十数据文章，将处理前 ${BATCH_SIZE} 篇`);
    
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
      console.log('所有金十数据文章已存在于数据库中，跳过本次处理');
      return;
    }
    
    console.log(`发现 ${newArticles.length} 篇新金十数据文章需要处理`);
    
    // 4. 逐个处理新文章
    for (const article of newArticles) {
      await processArticle(article);
      // 添加延迟，避免API请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log(`本次金十数据任务处理完成，共处理 ${newArticles.length} 篇文章`);
  } catch (error) {
    console.error('执行金十数据文章处理任务失败', { error: error.message });
  }
}

/**
 * 注册金十数据文章处理任务
 */
export function registerJin10ProcessorTask(): void {
  registerTask({
    id: TASK_ID,
    name: '金十数据文章处理器',
    interval: TASK_INTERVAL,
    fn: executeTask
  });
  
  logger.info(`金十数据文章处理任务已注册，间隔: ${TASK_INTERVAL / 1000 / 60}分钟`);
}
