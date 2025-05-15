/**
 * 测试脚本 - 为指定文章生成AI分析
 * 
 * 使用方法:
 * npx tsx server/test-generate-analysis.ts <文章ID>
 */

import prisma from './utils/prismaClient.js';
import { generateDeepSeekAnalysis } from './utils/deepseekAnalyzer.js';
import { updateContent } from './utils/contentManager.js';

// 主函数
async function main() {
  try {
    // 获取文章ID参数
    const articleId = process.argv[2];
    
    if (!articleId) {
      console.error('请提供文章ID作为参数');
      console.error('使用方法: npx tsx server/test-generate-analysis.ts <文章ID>');
      process.exit(1);
    }
    
    console.log(`开始为文章ID ${articleId} 生成AI分析...`);
    
    // 查询文章数据
    const article = await prisma.content.findUnique({
      where: {
        id: articleId
      }
    });
    
    if (!article) {
      console.error(`找不到ID为 ${articleId} 的文章`);
      process.exit(1);
    }
    
    console.log('找到文章:', {
      id: article.id,
      title: article.title,
      source: article.source,
      contentLength: article.content?.length || 0,
      summary: article.summary
    });
    
    // 生成AI分析
    const analysis = await generateDeepSeekAnalysis(
      article.title,
      article.content || article.summary || '',
      article.sourceUrl
    );
    
    console.log('AI分析生成结果:', analysis);
    
    if (analysis.success) {
      // 解析现有元数据
      let metadata = {};
      try {
        if (article.metadata) {
          metadata = JSON.parse(article.metadata);
        }
      } catch (e) {
        console.error('解析现有元数据失败:', e);
      }
      
      // 将AI分析内容添加到元数据
      metadata = {
        ...metadata,
        aiComment: analysis.analysisData || analysis
      };
      
      // 使用contentManager更新文章数据
      console.log('准备更新文章元数据:', { id: article.id });
      await updateContent(article.id, { 
        metadata: metadata
      });
      
      console.log('元数据已成功更新');
      
      // 打印更新后的元数据
      const updatedArticle = await prisma.content.findUnique({
        where: { id: article.id }
      });
      
      if (updatedArticle?.metadata) {
        try {
          const updatedMetadata = JSON.parse(updatedArticle.metadata);
          console.log('更新后的元数据:', updatedMetadata);
        } catch (e) {
          console.error('解析更新后的元数据失败:', e);
        }
      }
      
      console.log(`✅ 成功更新文章ID ${articleId} 的AI分析内容`);
    } else {
      console.error(`❌ AI分析生成失败:`, analysis.error);
    }
    
  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    await prisma.$disconnect();
    console.log('连接已断开');
  }
}

main();
