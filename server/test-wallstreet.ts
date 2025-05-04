/**
 * 测试华尔街见闻爬虫
 */
import { fetchWallStreetNews, fetchWallStreetArticles, fetchWallStreetArticleDetail } from './utils/crawlers/wallstreet';

async function testWallStreetCrawler() {
  try {
    console.log('开始测试华尔街见闻爬虫...');
    
    // 测试获取快讯列表
    console.log('测试获取快讯列表...');
    const newsList = await fetchWallStreetNews(1, 5);
    console.log(`获取到 ${newsList.length} 条华尔街见闻快讯`);
    
    if (newsList.length > 0) {
      // 输出第一条快讯的信息
      console.log(`第一条快讯: ${JSON.stringify(newsList[0], null, 2)}`);
    }
    
    // 测试获取文章列表
    console.log('\n测试获取文章列表...');
    const articlesList = await fetchWallStreetArticles(1, 5);
    console.log(`获取到 ${articlesList.length} 篇华尔街见闻文章`);
    
    if (articlesList.length > 0) {
      // 输出第一篇文章的信息
      console.log(`第一篇文章: ${JSON.stringify(articlesList[0], null, 2)}`);
      
      // 测试获取文章详情
      const articleId = articlesList[0].id;
      console.log(`\n开始获取文章详情: ${articleId}`);
      
      const articleDetail = await fetchWallStreetArticleDetail(articleId);
      if (articleDetail) {
        console.log(`成功获取文章详情: ${articleDetail.title}`);
        console.log(`文章内容: ${articleDetail.content?.substring(0, 100)}...`);
      } else {
        console.error('获取文章详情失败');
      }
    }
    
    console.log('\n华尔街见闻爬虫测试完成');
  } catch (error) {
    console.error(`测试过程中出错: ${error}`);
  }
}

// 执行测试
testWallStreetCrawler();
