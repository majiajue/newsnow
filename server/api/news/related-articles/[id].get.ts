/**
 * 相关文章API（未使用）
 * 
 * 注意：此API依赖MongoDB，但项目中没有使用MongoDB，
 * 因此此文件已被注释掉以避免启动错误。
 * 如果将来需要此功能，请先安装MongoDB依赖并配置相应的连接。
 */

/*
import { defineEventHandler, getRouterParam } from 'h3';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      return {
        code: 400,
        message: '缺少文章ID参数'
      };
    }
    
    // 连接到数据库
    const { db } = await connectToDatabase();
    
    // 首先获取当前文章，以便了解其来源和分类
    const currentArticle = await db.collection('articles').findOne(
      { _id: new ObjectId(id) }
    );
    
    if (!currentArticle) {
      return {
        code: 404,
        message: '未找到指定文章'
      };
    }
    
    // 查询相关文章 - 基于相同来源和分类，但排除当前文章
    const relatedArticles = await db.collection('articles')
      .find({
        _id: { $ne: new ObjectId(id) },
        $or: [
          { source: currentArticle.source },
          { category: currentArticle.category }
        ]
      })
      .sort({ pubDate: -1 })
      .limit(4)
      .toArray();
    
    // 将MongoDB的_id转换为字符串id
    const formattedArticles = relatedArticles.map(article => ({
      id: article._id.toString(),
      title: article.title,
      summary: article.summary,
      content: article.content,
      url: article.url,
      pubDate: article.pubDate,
      source: article.source,
      category: article.category,
      author: article.author || '',
      imageUrl: article.imageUrl || '',
      aiComment: article.aiComment || ''
    }));
    
    return {
      code: 200,
      data: formattedArticles
    };
  } catch (error) {
    console.error('获取相关文章失败:', error);
    return {
      code: 500,
      message: `获取相关文章失败: ${error.message}`
    };
  }
});
*/

// 提供一个简单的替代实现，返回空数组
import { defineEventHandler } from 'h3';

export default defineEventHandler(() => {
  return {
    code: 200,
    data: []
  };
});
