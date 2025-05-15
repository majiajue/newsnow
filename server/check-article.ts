/**
 * 检查文章ID 168是否存在
 * 使用方法: npx tsx server/check-article.ts
 */

import db from './utils/sequelizeClient.js';

async function main() {
  try {
    console.log('检查数据库中的文章ID格式...');
    
    // 打印prisma客户端可用的方法
    console.log('可用的API方法:');
    console.log(Object.keys(db));
    console.log('content模型的方法:');
    console.log(Object.keys(db.content));
    
    // 尝试直接运行SQL查询
    console.log('\n尝试直接运行SQL查询...');
    const [results] = await db.sequelize.query('SELECT id, title, source FROM content ORDER BY id DESC LIMIT 10');
    
    console.log(`查询结果 (${results.length} 条记录):`);
    results.forEach((row, index) => {
      console.log(`[${index+1}] ID: ${row.id}, 标题: "${row.title}", 来源: "${row.source}"`);
    });
    
    // 尝试查找ID为168的文章
    console.log('\n尝试查找ID为168的文章...');
    const [article168] = await db.sequelize.query('SELECT id, title, source FROM content WHERE id = ?', {
      replacements: [168]
    });
    
    if (article168 && article168.length > 0) {
      console.log(`找到ID为168的文章: "${article168[0].title}"`);
    } else {
      console.log('未找到ID为168的文章');
      
      // 尝试查找文章ID的格式
      const [idSamples] = await db.sequelize.query('SELECT id FROM content LIMIT 5');
      console.log('\nID示例:');
      idSamples.forEach(row => {
        console.log(`ID: ${row.id} (类型: ${typeof row.id})`);
      });
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    try {
      await db.sequelize.close();
      console.log('数据库连接已关闭');
    } catch (e) {
      console.error('关闭连接失败:', e);
    }
  }
}

main();
