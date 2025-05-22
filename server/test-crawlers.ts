/**
 * 爬虫测试脚本
 * 用于测试各个爬虫的功能，获取新闻数据并保存到数据库
 */

import { fetchJin10News } from './utils/crawlers/jin10';
import { fetchGelonghuiNews } from './utils/crawlers/gelonghui';
import { fetchWallStreetNews } from './utils/crawlers/wallstreet';
import { fetchFastBullNews } from './utils/crawlers/fastbull';
import prisma from './utils/prismaClient.js';

// 测试所有爬虫
async function testAllCrawlers() {
  console.log('开始测试所有爬虫...');
  
  // 测试金十数据爬虫
  await testJin10();
  
  // 测试格隆汇爬虫
  await testGelonghui();
  
  // 测试华尔街见闻爬虫
  await testWallStreet();
  
  // 测试FastBull爬虫
  await testFastBull();
  
  console.log('所有爬虫测试完成');
}

// 测试金十数据爬虫
async function testJin10() {
  try {
    console.log('开始测试金十数据爬虫...');
    
    // 获取金十数据新闻列表
    const newsList = await fetchJin10News(1, 5);
    console.log(`获取到 ${newsList.length} 条金十数据新闻`);
    
    if (newsList.length > 0) {
      // 输出第一条新闻的信息
      console.log(`第一条新闻: ${JSON.stringify(newsList[0], null, 2)}`);
      
      // 保存到数据库
      await saveNewsToDatabase(newsList, 'Jin10');
    }
    
    console.log('金十数据爬虫测试完成');
  } catch (error) {
    console.error(`测试金十数据爬虫出错: ${error}`);
  }
}

// 测试格隆汇爬虫
async function testGelonghui() {
  try {
    console.log('开始测试格隆汇爬虫...');
    
    // 获取格隆汇新闻列表
    const newsList = await fetchGelonghuiNews(1, 5);
    console.log(`获取到 ${newsList.length} 条格隆汇新闻`);
    
    if (newsList.length > 0) {
      // 输出第一条新闻的信息
      console.log(`第一条新闻: ${JSON.stringify(newsList[0], null, 2)}`);
      
      // 保存到数据库
      await saveNewsToDatabase(newsList, 'Gelonghui');
    }
    
    console.log('格隆汇爬虫测试完成');
  } catch (error) {
    console.error(`测试格隆汇爬虫出错: ${error}`);
  }
}

// 测试华尔街见闻爬虫
async function testWallStreet() {
  try {
    console.log('开始测试华尔街见闻爬虫...');
    
    // 获取华尔街见闻新闻列表
    const newsList = await fetchWallStreetNews(1, 5);
    console.log(`获取到 ${newsList.length} 条华尔街见闻新闻`);
    
    if (newsList.length > 0) {
      // 输出第一条新闻的信息
      console.log(`第一条新闻: ${JSON.stringify(newsList[0], null, 2)}`);
      
      // 保存到数据库
      await saveNewsToDatabase(newsList, 'WallStreet');
    }
    
    console.log('华尔街见闻爬虫测试完成');
  } catch (error) {
    console.error(`测试华尔街见闻爬虫出错: ${error}`);
  }
}

// 测试FastBull爬虫
async function testFastBull() {
  try {
    console.log('开始测试FastBull爬虫...');
    
    // 获取FastBull新闻列表
    const newsList = await fetchFastBullNews(1, 5);
    console.log(`获取到 ${newsList.length} 条FastBull新闻`);
    
    if (newsList.length > 0) {
      // 输出第一条新闻的信息
      console.log(`第一条新闻: ${JSON.stringify(newsList[0], null, 2)}`);
      
      // 保存到数据库
      await saveNewsToDatabase(newsList, 'FastBull');
    }
    
    console.log('FastBull爬虫测试完成');
  } catch (error) {
    console.error(`测试FastBull爬虫出错: ${error}`);
  }
}

// 保存新闻到数据库
async function saveNewsToDatabase(newsList: any[], source: string) {
  try {
    console.log(`开始保存 ${source} 新闻到数据库...`);
    
    // 获取已存在的URL列表，避免重复保存
    const existingContents = await prisma.content.findMany({
      where: {
        source: source
      },
      select: {
        sourceUrl: true
      }
    });
    
    const existingUrls = new Set(existingContents.map(content => content.sourceUrl));
    const newArticles = newsList.filter(article => !existingUrls.has(article.url));
    
    if (newArticles.length === 0) {
      console.log(`所有 ${source} 文章已存在于数据库中，跳过保存`);
      return;
    }
    
    console.log(`发现 ${newArticles.length} 篇新 ${source} 文章需要保存`);
    
    // 批量保存新文章
    for (const article of newArticles) {
      await prisma.content.create({
        data: {
          title: article.title,
          content: article.content || article.summary || article.title,
          summary: article.summary || article.title,
          source: source,
          sourceUrl: article.url,
          publishedAt: new Date(article.pubDate),
          author: article.author || source,
          imageUrl: article.imageUrl || null,
          category: article.category || '财经',
          tags: article.tags ? JSON.stringify(article.tags) : '[]',
          metadata: JSON.stringify({
            important: article.important || false,
            processed: false
          })
        }
      });
      
      console.log(`已保存文章: ${article.title}`);
    }
    
    console.log(`成功保存 ${newArticles.length} 篇 ${source} 文章到数据库`);
  } catch (error) {
    console.error(`保存 ${source} 新闻到数据库出错: ${error}`);
  }
}

// 运行测试
testAllCrawlers().catch(error => {
  console.error(`测试爬虫出错: ${error}`);
});
