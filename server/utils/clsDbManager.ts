import { PrismaClient } from "@prisma/client";
import { myFetch } from "./fetch";
import { consola } from "consola";

const prisma = new PrismaClient();

// 财联社文章类型定义
export interface CLSArticle {
  id: string;
  title: string;
  summary?: string;
  url: string;
  pubDate: string;
  source: string;
  category?: string;
  author?: string;
}

// 财联社API响应类型
export interface CLSApiResponse {
  code: number;
  message?: string;
  data: CLSArticle[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// 财联社API参数
const params = {
  appName: "CailianpressWeb",
  os: "web",
  sv: "7.7.5",
};

// 财联社API接口定义
interface CLSItem {
  id: number;
  title?: string;
  brief: string;
  shareurl: string;
  ctime: number;
  is_ad: number;
}

interface TelegraphRes {
  data: {
    roll_data: CLSItem[];
  };
}

/**
 * 从财联社API获取文章数据并保存到数据库
 */
export async function fetchAndSaveClsArticles() {
  try {
    consola.info("开始从财联社API获取文章数据...");
    
    // 使用telegraph API获取数据
    const apiUrl = `https://www.cls.cn/nodeapi/updateTelegraphList`;
    const searchParams = new URLSearchParams({ ...params });
    
    const response = await myFetch(apiUrl, {
      params: Object.fromEntries(searchParams),
      headers: {
        'Referer': 'https://www.cls.cn/',
        'Origin': 'https://www.cls.cn',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
      }
    });
    
    if (!response || !response.data || !response.data.roll_data) {
      consola.error("财联社API返回数据格式错误", response);
      return [];
    }
    
    // 处理API返回的数据
    const articles = response.data.roll_data
      .filter((item: CLSItem) => !item.is_ad)
      .map((item: CLSItem) => ({
        id: item.id.toString(),
        title: item.title || item.brief,
        summary: item.brief,
        url: `https://www.cls.cn/detail/${item.id}`,
        pubDate: new Date(item.ctime * 1000).toISOString(),
        source: "财联社",
        category: "财经",
        author: "财联社"
      }));
    
    // 保存到数据库
    await saveArticlesToDb(articles);
    
    consola.success(`成功获取并保存了 ${articles.length} 条财联社文章`);
    return articles;
  } catch (error) {
    consola.error("获取财联社文章失败:", error);
    return [];
  }
}

/**
 * 将文章保存到数据库
 */
async function saveArticlesToDb(articles: CLSArticle[]) {
  for (const article of articles) {
    try {
      // 检查文章是否已存在
      const existingArticle = await prisma.content.findFirst({
        where: {
          sourceUrl: article.url,
        },
      });
      
      if (existingArticle) {
        // 如果文章已存在，更新内容
        await prisma.content.update({
          where: {
            id: existingArticle.id,
          },
          data: {
            title: article.title,
            summary: article.summary,
            updatedAt: new Date(),
          },
        });
      } else {
        // 如果文章不存在，创建新文章
        await prisma.content.create({
          data: {
            title: article.title,
            content: article.summary,
            summary: article.summary,
            source: article.source,
            sourceUrl: article.url,
            author: article.author,
            publishDate: new Date(article.pubDate),
            categories: article.category,
            status: "published",
          },
        });
      }
    } catch (error) {
      consola.error(`保存文章 ${article.id} 失败:`, error);
    }
  }
}

/**
 * 从数据库获取财联社文章
 */
export async function getClsArticlesFromDb(page: number = 1, pageSize: number = 20) {
  try {
    // 查询总数
    const total = await prisma.content.count({
      where: {
        source: "财联社",
        status: "published",
      },
    });
    
    // 查询文章
    const articles = await prisma.content.findMany({
      where: {
        source: "财联社",
        status: "published",
      },
      orderBy: {
        publishDate: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    
    // 转换为前端需要的格式
    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      summary: article.summary || article.content,
      url: article.sourceUrl || "",
      pubDate: article.publishDate?.toISOString() || new Date().toISOString(),
      source: article.source || "财联社",
      category: article.categories || "财经",
      author: article.author || "财联社",
    }));
    
    return {
      code: 0,
      data: formattedArticles,
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  } catch (error) {
    consola.error("从数据库获取财联社文章失败:", error);
    return {
      code: -1,
      message: "获取文章失败",
      data: [],
      pagination: {
        page,
        pageSize,
        total: 0,
      },
    };
  }
}

// 初始化：启动时获取一次数据
export async function initClsArticles() {
  const articles = await fetchAndSaveClsArticles();
  
  // 设置定时任务，每5分钟获取一次数据
  setInterval(fetchAndSaveClsArticles, 5 * 60 * 1000);
  
  return articles;
}
