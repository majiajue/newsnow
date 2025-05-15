import { defineEventHandler, getRouterParam } from "h3"
import prisma from '../../../utils/prismaClient.js'
// 使用console替代logger

// 创建Prisma客户端
// 使用预初始化的 prisma 实例

// 文章元数据接口
interface ArticleMetadata {
  cleanContent?: string;
  aiComment?: string;
  imageUrl?: string;
  [key: string]: any;
}

// 硬编码文章接口
interface HardcodedArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  pubDate: string;
  source: string;
  category: string;
  author: string;
  content?: string;
  aiComment?: string;
  imageUrl?: string;
}

// 硬编码文章API响应接口
interface HardcodedArticlesResponse {
  code: number;
  data: HardcodedArticle[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// 为硬编码文章生成默认的AI分析内容
function generateDefaultAiComment(title: string, category: string): string {
  const categories: Record<string, string> = {
    '财经': '财经领域',
    '科技': '科技领域',
    '政策': '政策领域',
    '市场': '市场动态',
    '公司': '公司动态',
    '国际': '国际形势'
  };
  
  const categoryText = categories[category] || '财经领域';
  
  return `【AI分析】
  
关键要点：
1. ${title}反映了${categoryText}的最新发展趋势
2. 这一动态对市场参与者具有重要参考价值
3. 投资者应密切关注后续发展

分析背景：
近期${categoryText}发生了一系列重要变化，本文所报道的内容是这些变化的重要组成部分。从宏观角度看，这些变化将对整体经济环境产生深远影响。

影响评估：
短期内，该消息可能引起市场波动；中长期来看，将促进相关行业的结构性调整和优化升级。投资者应当理性看待这一变化，避免盲目跟风或恐慌性决策。

专业意见：
从专业角度分析，这一发展符合当前经济和政策环境的整体趋势。建议投资者结合自身风险偏好和投资目标，审慎决策。

建议行动：
1. 密切关注后续政策和市场反应
2. 评估对自身投资组合的潜在影响
3. 适当调整资产配置策略，分散风险
`;
}

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id")

    if (!id) {
      return {
        code: 400,
        message: "文章ID不能为空",
      }
    }

    console.info(`获取文章详情`, { id })

    // 首先尝试从 content 表查询
    const content = await prisma.content.findUnique({
      where: {
        id,
      },
    })

    if (content) {
      // 解析元数据
      let metadata: ArticleMetadata = {}
      try {
        metadata = JSON.parse(content.metadata || '{}') as ArticleMetadata
      } catch (error) {
        console.warn(`解析文章元数据失败: ${content.id}`, { error: (error as Error).message })
      }

      // 将 content 转换为统一的文章格式
      const article = {
        id: content.id,
        title: content.title,
        summary: content.summary || '',
        content: content.content,
        url: content.sourceUrl || '',
        pubDate: content.publishDate?.toISOString() || new Date().toISOString(),
        source: content.source || '财联社',
        category: content.categories || '财经',
        author: content.author || '财联社',
        imageUrl: metadata.imageUrl || '',
        aiComment: metadata.aiComment || '',
        metadata: content.metadata, // 保持原始字符串格式，不要解析
        aiAnalysis: metadata.aiAnalysis // 添加AI分析内容
      }

      return {
        code: 200,
        data: article,
      }
    }
    
    // 处理硬编码的文章ID
    if (id.startsWith('hardcoded-')) {
      try {
        // 获取硬编码文章数据
        const response = await fetch(`http://localhost:3000/api/news/cls/hardcoded-articles?page=1&pageSize=20`);
        const data = await response.json() as HardcodedArticlesResponse;
        
        if (data && data.data && Array.isArray(data.data)) {
          const hardcodedArticle = data.data.find(article => article.id === id);
          
          if (hardcodedArticle) {
            // 为硬编码文章添加AI分析内容
            const aiComment = generateDefaultAiComment(hardcodedArticle.title, hardcodedArticle.category);
            
            return {
              code: 200,
              data: {
                ...hardcodedArticle,
                content: `<p>${hardcodedArticle.summary}</p><p>这是一篇硬编码的示例文章，用于演示系统功能。</p>`,
                aiComment
              }
            };
          }
        }
      } catch (error) {
        console.error(`获取硬编码文章失败: ${id}`, { error: (error as Error).message });
      }
    }

    // 如果在 content 表中找不到，返回 404
    return {
      code: 404,
      message: "未找到指定文章",
    }
  } catch (error) {
    console.error(`获取文章详情失败`, { error: (error as Error).message })
    return {
      code: 500,
      message: `获取文章详情失败: ${(error as Error).message}`,
    }
  }
})
