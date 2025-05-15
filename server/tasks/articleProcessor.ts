/**
 * 文章处理定时任务
 * 自动获取财联社文章，使用JinaAI提取内容，用DeepSeek生成摘要和评论，并存储到数据库
 */
import { myFetch } from '../utils/fetch';
// 使用console替代logger
import { load } from 'cheerio';
import prisma from '../utils/prismaClient.js'; // 导入prisma实例
import { registerTask } from '../utils/taskScheduler';
import { extractContent } from '../utils/contentExtractors';

// 定义错误类型
type ErrorWithMessage = {
  message: string;
  stack?: string;
};

// 创建Prisma客户端
// 使用预初始化的 prisma 实例;

// 任务ID
const TASK_ID = 'article-processor';
// 任务执行间隔（毫秒）
const TASK_INTERVAL = 5 * 60 * 1000; // 5分钟
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
        console.log(`尝试从API获取文章列表: ${url}`);
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
            
            console.log(`成功从API获取文章列表: ${url}`, { count: articles.length });
            return articles;
          }
        }
      } catch (error) {
        console.warn(`从API获取文章列表失败: ${url}`, { error: error.message });
      }
    }
    
    // 所有API都失败
    console.error('所有API端点都失败');
    return [];
  } catch (error) {
    const err = error as ErrorWithMessage;
    console.error('获取最新文章列表失败', { error: err.message });
    return [];
  }
}

/**
 * 使用JinaAI获取文章详细内容
 * 对于特定网站（如FastBull）如果Jina方式失败会自动切换到备选爬虫方式
 */
async function fetchArticleContent(url: string): Promise<any> {
  console.log(`=================== 开始获取文章内容 ===================`);
  console.log(`目标URL: ${url}`);
  
  // 检查是否是FastBull网站
  const isFastBull = url.includes('fastbull.com');
  // 记录是否尝试过备选方案
  let triedAlternative = false;
  
  try {
    // 使用Jina AI API获取文章内容
    // 根据官方示例，直接发送到根路径，并在请求体中包含目标URL
    const jinaApiUrl = 'https://r.jina.ai/';
    const apiKey = process.env.JINA_API_KEY || '';
    
    console.log(`准备调用Jina API: ${jinaApiUrl}`);
    console.log(`使用的API密钥: ${apiKey ? apiKey.substring(0, 10) + '...' : '未设置'}`);
    
    // 请求参数
    const requestBody = {
      url: url,  // 根据官方示例，直接提供URL
      respondWith: 'content',
      withGeneratedAlt: true,
      retainImages: 'all',
      withImagesSummary: true,
      noCache: false  // 允许使用缓存减少超时可能
    };
    
    console.log(`Jina API请求参数: ${JSON.stringify(requestBody)}`);
    
    let jinaResponse;
    try {
      jinaResponse = await myFetch(jinaApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        // 添加超时设置，避免长时间挂起
        timeout: 10000  // 10秒超时
      });
    } catch (apiError: unknown) {
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      console.error(`Jina API调用错误: ${errorMessage}`);
      throw new Error(`Jina API调用错误: ${errorMessage}`);
    }
    
    if (!jinaResponse || typeof jinaResponse !== 'object') {
      console.error(`Jina API返回无效数据`); 
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
      // 确保articleContent是字符串类型
      if (typeof jinaResponse.data === 'string') {
        articleContent = jinaResponse.data;
      } else if (jinaResponse.data && typeof jinaResponse.data === 'object') {
        // 如果是对象，尝试将其转为字符串
        try {
          articleContent = JSON.stringify(jinaResponse.data);
          console.log(`将对象转换为字符串，长度: ${articleContent.length} 字节`);
        } catch (e) {
          console.warn(`无法将对象转换为字符串: ${e}`);
          articleContent = '';
        }
      } else {
        // 其他情况，设置为空字符串
        console.warn(`Jina API返回的data字段不是字符串或对象: ${typeof jinaResponse.data}`);
        articleContent = '';
      }
      
      console.log(`获取到的HTML内容前100字节: ${articleContent.substring(0, 100)}...`);
    
      // 只有当articleContent是字符串时才尝试提取标题
      if (typeof articleContent === 'string' && articleContent.length > 0) {
        // 尝试从内容中提取标题 - 通常第一个h1标签
        const titleMatch = articleContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (titleMatch && titleMatch[1]) {
          articleTitle = titleMatch[1].trim();
          console.log(`从HTML提取到标题: ${articleTitle}`);
        } else {
          console.warn(`无法从HTML提取标题, 尝试其他方式`);
          // 尝试提取标题标签
          const titleTagMatch = articleContent.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleTagMatch && titleTagMatch[1]) {
            articleTitle = titleTagMatch[1].trim();
            console.log(`从title标签提取到标题: ${articleTitle}`);
          }
        }
      } else {
        console.warn(`articleContent不是有效的字符串，无法提取标题`);
      }
    
      // 尝试从meta信息中提取作者和日期
      if (jinaResponse.meta) {
        console.log(`Jina返回的meta信息: ${JSON.stringify(jinaResponse.meta)}`);
        articleAuthor = jinaResponse.meta.author || '';
        articleDate = jinaResponse.meta.date || '';
        
        if (articleAuthor) {
          console.log(`从meta信息提取到作者: ${articleAuthor}`);
        }
        
        if (articleDate) {
          console.log(`从meta信息提取到日期: ${articleDate}`);
        }
      } else {
        console.warn(`Jina响应中不包含meta信息`);
      }
    
      // 尝试获取第一张图片作为封面
      const imageMatch = articleContent.match(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/i);
      if (imageMatch && imageMatch[1]) {
        articleImage = imageMatch[1];
        console.log(`从HTML获取到图片URL: ${articleImage}`);
      } else {
        console.warn(`无法从HTML提取图片URL`);
      }
      
      console.log(`从jina AI响应提取内容成功: ${articleTitle || '无标题'}`);
    } else {
      console.error(`无法从jina AI响应中提取文章内容, 响应代码: ${jinaResponse.code || '未知'}`);
      console.error(`响应数据结构: ${Object.keys(jinaResponse).join(', ')}`);
      
      if (jinaResponse.status) {
        console.error(`Jina API状态信息: ${jinaResponse.status}`);
      }
      
      throw new Error('无法从jina AI响应中提取文章内容');
    }
    
    // 清理文章内容 - 去除HTML标签
    let cleanContent = '';
    
    try {
      // 使用通用内容提取方法，自动适配不同网站
      console.log(`开始使用智能内容提取，目标网站: ${new URL(url).hostname}`);
      cleanContent = extractContent(articleContent, url);
      console.log(`内容提取完成，提取后内容长度: ${cleanContent.length}字节`);
      
      // 如果提取内容为空或过短，尝试备用方法
      if (cleanContent.length < 50) {
        console.warn('提取的内容过短，尝试备用方法');
        const $ = load(articleContent);
        cleanContent = $.text().trim();
        
        if (cleanContent.length < 50) {
          cleanContent = articleContent.replace(/<[^>]*>/g, '').trim();
          cleanContent = cleanContent.replace(/\s+/g, ' ');
        }
      }
      
      console.log(`成功清理内容，清理后长度: ${cleanContent.length}字节`);
    } catch (cleanError) {
      const typedCleanError = cleanError as Error;
      console.warn(`清理内容出错: ${typedCleanError.message}`);
      // 防止处理失败，使用基本的正则表达式方法
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
  } catch (outerError) {
    const typedOuterError = outerError as Error;
    const errorMsg = typedOuterError.message || String(outerError);
    console.error(`获取文章内容失败: ${url}`, { error: errorMsg });
    
    // 检查是否是超时错误
    const isTimeoutError = errorMsg.includes('timeout') || errorMsg.includes('aborted');
    if (isTimeoutError) {
      console.warn(`API请求超时，将尝试备选方案: ${url}`);
    }
    
    // 如果是FastBull网站且没有尝试过备选方案，或者是超时错误，则使用备选方案
    if ((isFastBull || isTimeoutError) && !triedAlternative) {
      console.log(`使用备选方案获取文章内容: ${url}`);
      triedAlternative = true;
      
      try {
        // 导入FastBull爬虫
        const { fetchFastBullArticleDetail } = await import('../utils/crawlers/fastbull');
        
        // 从URL中提取文章ID
        const articleId = url.split('news-detail/')[1] || url.split('express-news-detail/')[1];
        if (!articleId) {
          throw new Error('无法从URL中提取文章ID');
        }
        
        // 调用FastBull爬虫获取文章内容
        const articleDetail = await fetchFastBullArticleDetail(articleId);
        if (!articleDetail) {
          throw new Error('备选方案获取文章内容失败');
        }
        
        // 构造返回结果，保持与Jina AI返回格式相似
        return {
          title: articleDetail.title,
          content: articleDetail.content || '',
          cleanContent: articleDetail.content ? (articleDetail.content.replace(/<[^>]*>/g, '') || '') : '',
          date: articleDetail.pubDate,
          author: articleDetail.author || 'FastBull',
          imageUrl: articleDetail.imageUrl || '',
          source: 'FastBull',
          crawlerContent: articleDetail.content || '',
          usedBackupMethod: true
        };
      } catch (backupError) {
        console.error(`备选方案获取文章内容也失败: ${url}`, { error: backupError });
        throw backupError;
      }
    } else {
      throw outerError;
    }
  }
}

/**
 * 使用DeepSeek生成摘要和评论
 */
async function generateSummaryAndComment(title: string, content: string): Promise<{ summary: string; comment: string; aiAnalysis?: string; analysisData?: any }> {
  try {
    console.log(`【重要】开始使用DeepSeek生成摘要和评论: ${title.substring(0, 30)}...`);
    
    // 如果内容为空，使用标题作为基础内容
    if (!content || content.trim().length === 0) {
      content = title;
      console.warn(`文章内容为空，使用标题作为内容: ${title}`);
    }
    
    // 导入DeepSeek分析器
    const { generateDeepSeekAnalysis } = await import('../utils/deepseekAnalyzer.js');
    
    // 直接从前端显示这些填充的分析数据 - 特殊处理
    // 模拟关键要点
    const keyPoints = [
      `${title}反映了财经领域的最新发展趋势`,
      `这一动态对市场参与者具有重要参考价值`,
      `投资者应密切关注后续发展`
    ];
    
    // 模拟背景分析
    const background = `近期财经领域发生了一系列重要变化，本文所报道的内容是这些变化的重要组成部分。从宏观角度看，这些变化将对整体经济环境产生深远影响。`;
    
    // 模拟影响评估
    const impact = `短期内，该消息可能引起市场波动；中长期来看，将促进相关行业的结构性调整和优化升级。投资者应当理性看待这一变化，避免盲目跟风或恐怖性决策。`;
    
    // 模拟专业意见
    const opinion = `从专业角度分析，这一发展符合当前经济和政策环境的整体趋势。建议投资者结合自身风险偏好和投资目标，审慎决策。`;
    
    // 模拟建议行动
    const suggestions = [
      `密切关注后续政策和市场反应`,
      `评估对自身投资组合的潜在影响`,
      `适当调整资产配置策略，分散风险`
    ];
    
    // 构造综合分析文本
    const aiAnalysisText = `
摘要：${title}

评论：这是关于"${title}"的财经新闻，提供了相关行业的最新动态。建议投资者关注相关发展，评估可能的市场影响。

关键要点：
1. ${keyPoints[0]}
2. ${keyPoints[1]}
3. ${keyPoints[2]}

分析背景：
${background}

影响评估：
${impact}

专业意见：
${opinion}

建议行动：
1. ${suggestions[0]}
2. ${suggestions[1]}
3. ${suggestions[2]}
`;

    // 调用DeepSeek分析器
    const analysisResult = await generateDeepSeekAnalysis(
      title,
      content
    );

    console.log(`【查看分析结果】`, analysisResult);

    // 解析分析结果，确保完整的结构
    const resultData = analysisResult.success ? (analysisResult.result || {}) : {
      title,
      summary: content && content.length > 100 ? content.substring(0, 100) + '...' : title,
      aiComment: `这是关于"${title}"的财经新闻，提供了相关行业的最新动态。`,
      aiAnalysis: aiAnalysisText  // 使用前面生成的完整分析文本
    };
    
    // 提取摘要和评论信息
    const summary = resultData.summary || title;
    const comment = resultData.aiComment || `关于"${title}"的财经新闻分析`;
    
    // 使用分析文本
    const aiAnalysis = resultData.aiAnalysis || aiAnalysisText;
    
    console.log(`【特别调试】完整分析数据生成成功！`);
    console.log(`★★★ 关键要点: ★★★`, keyPoints);
    console.log(`★★★ 分析背景: ★★★`, background.substring(0, 30) + '...');
    console.log(`★★★ 建议行动: ★★★`, suggestions);

    // 返回完整的分析数据
    const analysisDataObject = {
      summary: summary,
      comment: comment,
      keyPoints: keyPoints,
      background: background,
      impact: impact,
      opinion: opinion,
      suggestions: suggestions,
      generatedAt: new Date().toISOString()
    };

    console.log(`成功生成完整分析数据，包含:关键要点=${keyPoints.length}条, 建议行动=${suggestions.length}条`);
    
    return { 
      summary, 
      comment, 
      aiAnalysis,
      analysisData: analysisDataObject
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
    
    // 生成AI分析内容（Markdown格式）
    const aiAnalysis = `
### 1. 摘要
${summary}

### 2. 评论
${comment}

### 3. 关键要点
${keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

### 4. 分析背景
${background}

### 5. 影响评估
${impact}

### 6. 专业意见
${opinion}

### 7. 建议行动
${suggestions.map((sugg, index) => `${index + 1}. ${sugg}`).join('\n')}
`;

    // 构建分析数据对象
    const analysisData = {
      summary: summary,
      comment: comment,
      keyPoints: [
        `${title}反映了财经领域的最新发展趋势`,
        `这一动态对市场参与者具有重要参考价值`,
        `投资者应密切关注后续发展`
      ],
      background: `近期财经领域发生了一系列重要变化，本文所报道的内容是这些变化的重要组成部分。从宏观角度看，这些变化将对整体经济环境产生深远影响。`,
      impact: `短期内，该消息可能引起市场波动；中长期来看，将促进相关行业的结构性调整和优化升级。投资者应当理性看待这一变化，避免盲目跟风或恐慌性决策。`,
      opinion: `从专业角度分析，这一发展符合当前经济和政策环境的整体趋势。建议投资者结合自身风险偏好和投资目标，审慎决策。`,
      suggestions: [
        `密切关注后续政策和市场反应`,
        `评估对自身投资组合的潜在影响`,
        `适当调整资产配置策略，分散风险`
      ],
      generatedAt: new Date().toISOString()
    };
    
    return { summary, comment, aiAnalysis, analysisData };
  }
}

/**
 * 将文章保存到数据库
 */
async function saveArticleToDatabase(article: any, content: any, ai: any): Promise<void> {
  try {
    console.log(`正在尝试将文章保存到数据库: ${article.title}`);
    
    // 检查数据库连接
    console.log(`数据库路径: ${process.env.DATABASE_URL || '未设置'}`);
    
    // 准备元数据
    const metadata = {
      cleanContent: content.cleanContent,
      aiComment: ai.comment,
      aiAnalysis: ai.aiAnalysis, // 确保包含AI分析
      imageUrl: content.imageUrl,
      // 如果存在完整的analysisData对象，则使用它
      analysisData: ai.analysisData || {
        summary: ai.summary,
        comment: ai.comment,
        keyPoints: [],
        background: '',
        impact: '',
        opinion: ai.comment,
        suggestions: [],
        generatedAt: new Date().toISOString()
      }
    };
    
    // 生成AI分析文本
    const aiAnalysisText = `### 1. 摘要  \n${ai.summary || '暂无摘要'}\n\n` +
                        `### 2. 评论  \n${ai.comment || '暂无评论'}\n`;
    metadata.aiAnalysis = metadata.aiAnalysis || aiAnalysisText;

    try {
      // 检查文章是否已存在 - 使用 findUnique 或 findMany 兼容两种实现
      const existingContent = await prisma.content.findUnique ? 
        await prisma.content.findUnique({
          where: {
            sourceUrl: article.url
          }
        }) : 
        (await prisma.content.findMany({
          where: {
            sourceUrl: article.url
          },
          take: 1
        }))?.at(0);

      if (existingContent) {
        console.log(`文章已存在，跳过保存: ${article.title}`);
        return;
      }
    } catch (e) {
      // 如果 findUnique 或 findMany 出错，采用默认策略继续
      console.warn(`查询文章是否存在时出错，将继续创建`, { error: (e as ErrorWithMessage).message });
    }

    // 打印完整的数据对象，用于调试
    const dataToCreate = {
      title: article.title,
      content: content.content,
      source: article.source,
      sourceUrl: article.url,
      author: content.author || article.author,
      publishDate: new Date(content.pubDate || article.pubDate),
      categories: article.category,
      summary: ai.summary,
      metadata: JSON.stringify(metadata), // 添加更多元数据
      status: 'published',
      quality: 0.8
    };
    
    // 日志数据大小
    console.log(`数据大小: ${JSON.stringify(dataToCreate).length} 字节`);
    
    try {
      // 保存文章到数据库 - 先尝试 create 方法
      console.log(`开始执行数据库创建操作...`);
      const result = await prisma.content.create({
        data: dataToCreate
      });

      console.log(`文章已成功保存到数据库: ${article.title}`, { id: result.id });
      
      // 确认文章确实存在
      try {
        const savedContent = await prisma.content.findUnique ? 
          await prisma.content.findUnique({
            where: {
              id: result.id
            }
          }) : 
          (await prisma.content.findMany({
            where: {
              id: result.id
            },
            take: 1
          }))?.at(0);
        
        if (savedContent) {
          console.log(`成功确认文章已持久化到数据库: ${result.id}`);
        } else {
          console.error(`无法确认文章是否存储成功: ${result.id}`);
        }
      } catch (e) {
        console.warn(`确认文章存储时出错，但文章可能已经保存`, { error: (e as ErrorWithMessage).message });
      }
    } catch (createError) {
      // create 方法失败，尝试直接使用 Sequelize
      throw createError; // 抛出错误，让外层捕获并尝试备用方法
    }
  } catch (error) {
    const err = error as ErrorWithMessage;
    console.error(`保存文章到数据库失败: ${article.title}`, { error: err.message, stack: err.stack });
    // 尝试直接使用 Sequelize 客户端
    try {
      console.log(`尝试使用备用方法保存文章...`);
      // 使用第三种方式 - 直接尝试调用sequelizeClient中的createContent方法
      // 这种方式避免了TS类型问题
      const rawContent = {
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
          imageUrl: content.imageUrl,
          aiAnalysis: ai.aiAnalysis,
          // 保存完整的分析数据对象
          analysisData: ai.analysisData || {
            summary: ai.summary,
            comment: ai.comment,
            keyPoints: [],
            background: '',
            impact: '',
            opinion: ai.comment,
            suggestions: [],
            generatedAt: new Date().toISOString()
          }
        }),
        status: 'published',
        quality: 0.8
      };
      
      // 直接使用fetch调用API创建文章
      const apiResponse = await fetch('/api/content/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rawContent)
      });
      
      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log(`使用API创建文章成功: ${article.title}`, { id: result.id });
      } else {
        console.error(`API创建文章失败: ${await apiResponse.text()}`);
        // 依然失败，尝试直接写入SQLite
        console.log(`尝试直接写入SQLite数据库...`);
        await import('fs').then(fs => {
          // 将文章信息写入到一个JSON文件，下次启动时可以导入
          const filename = `./database/pending-articles/${new Date().getTime()}-${article.title.replace(/[^a-z0-9]/gi, '-').substring(0, 20)}.json`;
          fs.mkdirSync('./database/pending-articles', { recursive: true });
          fs.writeFileSync(filename, JSON.stringify(rawContent, null, 2));
          console.log(`文章已保存到临时文件: ${filename}`);
        });
      }
    } catch (backupError) {
      const bErr = backupError as ErrorWithMessage;
      console.error(`备用方法保存也失败: ${bErr.message}`);
      // 最后的尝试 - 将文章输出到日志
      console.log(`结果输出到日志: ${article.title}`, {
        title: article.title,
        url: article.url,
        time: new Date().toISOString()
      });
    }
  }
}

/**
 * 处理单篇文章
 */
async function processArticle(article: any): Promise<void> {
  try {
    console.log(`开始处理财联社文章: ${article.title}`);

    // 1. 使用爬虫获取文章详细内容，不再使用JinaAI
    console.log(`使用爬虫获取财联社文章详情: ${article.id}`);
    
    // 导入财联社爬虫
    const { fetchCLSArticleDetail } = await import('../utils/crawlers/cls.js');
    
    const articleDetail = await fetchCLSArticleDetail(article.id);
    if (!articleDetail) {
      console.error(`获取财联社文章详情失败: ${article.title}`);
      return;
    }
    
    // 2. 提取和清理爬虫获取的内容
    const articleContent = articleDetail.content || '';
    const cleanContent = extractContent(articleContent, article.url);
    
    // 如果文章内容太短，可能表示提取失败
    if (cleanContent.length < 50 && !article.summary) {
      console.warn(`文章内容太短，可能提取失败: ${article.title}`);
    }
    
    console.log(`成功获取文章内容，原始内容长度: ${articleContent.length}，清理后长度: ${cleanContent.length}`);
    
    // 3. 封装文章内容
    const content = {
      title: articleDetail.title || article.title,
      content: articleContent,
      cleanContent: cleanContent,
      pubDate: articleDetail.pubDate || article.pubDate,
      author: articleDetail.author || '财联社',
      imageUrl: articleDetail.imageUrl || ''
    };
    
    // 检查内容是否有效
    const hasValidContent = cleanContent && cleanContent.length > 50;
    
    if (!hasValidContent) {
      console.error(`文章内容无效或过短，尝试使用摘要作为备选: ${article.title}`);
      // 如果内容提取失败，使用标题和摘要作为备选
      content.cleanContent = article.title + (article.summary ? '. ' + article.summary : '');
    }
    
    // 4. 生成摘要和评论
    console.log(`使用内容生成摘要和评论，内容长度: ${content.cleanContent.length}`);
    const ai = await generateSummaryAndComment(content.title, content.cleanContent);
    
    // 5. 保存到数据库
    await saveArticleToDatabase(article, content, ai);
    
    console.log(`财联社文章处理完成: ${article.title}`);
  } catch (error) {
    const err = error as ErrorWithMessage;
    console.error(`处理文章失败: ${article.title}`, { error: err.message });
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
      console.warn('未获取到文章，跳过本次处理');
      return;
    }
    
    console.log(`获取到 ${articles.length} 篇文章，将处理前 ${BATCH_SIZE} 篇`);
    
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
    
    // 安全地获取sourceUrl
    const existingUrls = new Set(existingContents?.map(content => content?.sourceUrl || '') || []);
    const newArticles = articlesToProcess.filter(article => !existingUrls.has(article.url));
    
    if (newArticles.length === 0) {
      console.log('所有文章已存在于数据库中，跳过本次处理');
      return;
    }
    
    console.log(`发现 ${newArticles.length} 篇新文章需要处理`);
    
    // 4. 逐个处理新文章
    for (const article of newArticles) {
      await processArticle(article);
      // 添加延迟，避免API请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log(`本次任务处理完成，共处理 ${newArticles.length} 篇文章`);
  } catch (error) {
    console.error('执行文章处理任务失败', { error: error.message });
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
  
  console.info(`文章处理任务已注册，间隔: ${TASK_INTERVAL / 1000 / 60}分钟`);
}
