/**
 * 测试金十数据爬虫
 */
import { fetchJin10News, fetchJin10ArticleDetail } from './utils/crawlers/jin10';

async function testJin10Crawler() {
  try {
    console.log('开始测试金十数据爬虫...');
    
    // 测试获取新闻列表
    const newsList = await fetchJin10News(1, 5);
    console.log(`获取到 ${newsList.length} 条金十数据新闻`);
    
    if (newsList.length > 0) {
      // 输出第一条新闻的信息
      console.log(`第一条新闻: ${JSON.stringify(newsList[0], null, 2)}`);
      
      // 测试获取文章详情
      const articleId = newsList[0].id;
      console.log(`开始获取文章详情: ${articleId}`);
      
      const articleDetail = await fetchJin10ArticleDetail(articleId);
      if (articleDetail) {
        console.log(`成功获取文章详情: ${articleDetail.title}`);
        console.log(`文章内容: ${articleDetail.content?.substring(0, 100)}...`);
      } else {
        console.error('获取文章详情失败');
      }
    }
    
    console.log('金十数据爬虫测试完成');
  } catch (error) {
    console.error(`测试过程中出错: ${error}`);
  }
}

// 执行测试
testJin10Crawler();
