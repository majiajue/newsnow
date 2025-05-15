/**
 * 数据库到JSON文件导出工具
 * 定期从数据库获取文章并保存到静态JSON文件中
 */
import prisma from '../utils/prismaClient.js';
import fs from 'fs';
import path from 'path';
import { consola } from 'consola';

// 使用预初始化的 prisma 实例;

// 静态文件目录
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

// 确保目录存在
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// 静态文件路径
const ARTICLES_JSON_FILE = path.join(PUBLIC_DIR, 'db-articles.json');

/**
 * 从数据库获取文章并保存到静态JSON文件
 */
export async function exportArticlesToJson() {
  try {
    consola.info('开始从数据库导出文章到JSON文件...');
    
    // 查询文章
    // 使用增强的兼容层调用
    const articles = await prisma.content.findMany({
      where: {
        source: "财联社",
        status: "published",
      },
      orderBy: {
        publishDate: "desc",
      },
      take: 100, // 导出最新的100条文章
    });
    
    // 转换为前端需要的格式
    const formattedArticles = articles.map((article: any) => ({
      id: article.id,
      title: article.title,
      summary: article.summary || article.content,
      url: article.sourceUrl || "",
      pubDate: article.publishDate?.toISOString() || new Date().toISOString(),
      source: article.source || "财联社",
      category: article.categories || "财经",
      author: article.author || "财联社",
    }));
    
    // 创建JSON数据
    const jsonData = {
      code: 0,
      data: formattedArticles,
      pagination: {
        page: 1,
        pageSize: formattedArticles.length,
        total: formattedArticles.length,
      },
      lastUpdated: new Date().toISOString(),
    };
    
    // 写入文件
    fs.writeFileSync(ARTICLES_JSON_FILE, JSON.stringify(jsonData, null, 2), 'utf-8');
    
    consola.success(`成功导出 ${formattedArticles.length} 条文章到JSON文件`);
  } catch (error) {
    consola.error('导出文章到JSON文件失败:', error);
  }
}

// 定时导出间隔（毫秒）
const EXPORT_INTERVAL = 5 * 60 * 1000; // 5分钟

// 定时导出任务
let exportTimer: NodeJS.Timeout | null = null;

/**
 * 启动定时导出
 */
export function startScheduledExport() {
  // 立即导出一次
  exportArticlesToJson().catch(error => {
    consola.error('初始导出失败', error);
  });
  
  // 设置定时导出
  exportTimer = setInterval(async () => {
    try {
      await exportArticlesToJson();
    } catch (error) {
      consola.error('定时导出失败', error);
    }
  }, EXPORT_INTERVAL);
  
  consola.info(`定时导出已启动，间隔: ${EXPORT_INTERVAL / 1000}秒`);
}

/**
 * 停止定时导出
 */
export function stopScheduledExport() {
  if (exportTimer) {
    clearInterval(exportTimer);
    exportTimer = null;
    consola.info('定时导出已停止');
  }
}
