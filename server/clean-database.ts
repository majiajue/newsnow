// 清空数据库中的所有文章数据
import { sequelize } from './database/sequelize.js';
import { Article } from './models/Article.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function cleanDatabase() {
  try {
    console.log('开始清空数据库中的所有文章...');
    
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 删除所有文章
    const deletedCount = await Article.destroy({
      where: {},
      truncate: true // 使用 truncate 选项可以更快地删除大量数据
    });
    
    console.log(`成功删除所有文章数据，共删除 ${deletedCount} 条记录`);
    console.log('数据库已清空，新爬取的文章将采用JSON格式存储AI分析内容');
    
    // 关闭数据库连接
    await sequelize.close();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('清空数据库时出错:', error);
    process.exit(1);
  }
}

// 执行清空操作
cleanDatabase().then(() => {
  console.log('数据库清空操作完成');
  process.exit(0);
});
