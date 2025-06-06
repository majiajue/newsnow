#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
获取并保存新闻数据脚本
从各个新闻源获取数据并保存到数据库中
增强版：集成SearXNG搜索和DeepSeek内容分析
"""

import os
import sys
import time
import json
from datetime import datetime

# 设置Python路径，确保可以正确导入模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入爬虫和数据库模块
from crawlers.jin10 import Jin10Crawler
from crawlers.gelonghui import GelonghuiCrawler
from crawlers.wallstreet import WallstreetCrawler
from crawlers.fastbull import FastbullCrawler
from db.sqlite_client import SQLiteClient

# 导入搜索服务和AI分析服务
from utils.improved_search_service import FinanceSearchService
from utils.improved_ai_service import FinanceAnalyzer

def fetch_and_save_news(use_searxng=True, use_deepseek=True, limit=10):
    """
    获取并保存新闻数据
    
    Args:
        use_searxng (bool): 是否使用SearXNG获取额外新闻
        use_deepseek (bool): 是否使用DeepSeek进行内容分析
        limit (int): 每个来源获取的新闻数量
    """
    print("开始获取并保存新闻数据...")
    
    # 创建数据库客户端
    db_client = SQLiteClient()
    
    # 创建爬虫实例
    jin10_crawler = Jin10Crawler()
    gelonghui_crawler = GelonghuiCrawler()
    wallstreet_crawler = WallstreetCrawler()
    fastbull_crawler = FastbullCrawler()
    
    # 如果启用SearXNG，创建搜索服务实例
    search_service = None
    if use_searxng:
        searxng_url = os.environ.get("SEARXNG_URL", "http://searxng:8080/search")
        search_service = FinanceSearchService(searxng_url=searxng_url)
    
    # 如果启用DeepSeek，创建AI分析服务实例
    ai_analyzer = None
    if use_deepseek:
        api_key = os.environ.get("DEEPSEEK_API_KEY")
        if api_key:
            ai_analyzer = FinanceAnalyzer(api_key=api_key)
        else:
            print("警告: 未设置DEEPSEEK_API_KEY环境变量，内容分析功能将不可用")
            use_deepseek = False
    
    # 获取并保存金十数据
    print("\n===== 获取金十数据新闻 =====")
    try:
        jin10_articles = jin10_crawler.get_latest_articles(limit=limit)
        print(f"获取到 {len(jin10_articles)} 条金十数据新闻")
        
        for article in jin10_articles:
            # 如果启用DeepSeek，对内容进行增强
            if use_deepseek and ai_analyzer and (article.get("content") or article.get("summary")):
                content = article.get("content") or article.get("summary", "")
                if len(content) > 50:  # 只处理有足够内容的文章
                    try:
                        analysis = ai_analyzer.analyze_market_news(content)
                        if isinstance(analysis, dict) and not analysis.get("error"):
                            article["ai_summary"] = analysis.get("summary", "")
                            article["ai_sentiment"] = analysis.get("sentiment", "")
                            article["ai_keywords"] = analysis.get("keywords", [])
                            article["ai_impact"] = analysis.get("market_impact", "")
                            print(f"已为文章《{article['title']}》生成AI分析")
                    except Exception as e:
                        print(f"AI分析文章失败: {str(e)}")
            
            # 转换为数据库格式
            db_article = {
                "id": article["id"],
                "title": article["title"],
                "content": article.get("summary", ""),
                "url": article["url"],
                "pubDate": article["pubDate"],
                "source": "jin10",
                "category": article.get("category", "财经"),
                "author": article.get("author", "金十数据"),
                "imageUrl": article.get("imageUrl", ""),
                "tags": json.dumps(article.get("tags", []), ensure_ascii=False),
                "ai_summary": article.get("ai_summary", ""),
                "ai_sentiment": article.get("ai_sentiment", ""),
                "ai_keywords": json.dumps(article.get("ai_keywords", []), ensure_ascii=False),
                "ai_impact": article.get("ai_impact", "")
            }
            
            # 保存到数据库
            success = db_client.save_article(db_article)
            if success:
                print(f"保存文章成功: {article['title']}")
            else:
                print(f"保存文章失败: {article['title']}")
    except Exception as e:
        print(f"获取金十数据新闻异常: {str(e)}")
    
    # 获取并保存格隆汇数据
    print("\n===== 获取格隆汇新闻 =====")
    try:
        gelonghui_articles = gelonghui_crawler.get_latest_articles(limit=limit)
        print(f"获取到 {len(gelonghui_articles)} 条格隆汇新闻")
        
        for article in gelonghui_articles:
            # 如果启用DeepSeek，对内容进行增强
            if use_deepseek and ai_analyzer and (article.get("content") or article.get("summary")):
                content = article.get("content") or article.get("summary", "")
                if len(content) > 50:  # 只处理有足够内容的文章
                    try:
                        analysis = ai_analyzer.analyze_market_news(content)
                        if isinstance(analysis, dict) and not analysis.get("error"):
                            article["ai_summary"] = analysis.get("summary", "")
                            article["ai_sentiment"] = analysis.get("sentiment", "")
                            article["ai_keywords"] = analysis.get("keywords", [])
                            article["ai_impact"] = analysis.get("market_impact", "")
                            print(f"已为文章《{article['title']}》生成AI分析")
                    except Exception as e:
                        print(f"AI分析文章失败: {str(e)}")
            
            # 转换为数据库格式
            db_article = {
                "id": article["id"],
                "title": article["title"],
                "content": article.get("summary", ""),
                "url": article["url"],
                "pubDate": article["pubDate"],
                "source": "gelonghui",
                "category": article.get("category", "财经"),
                "author": article.get("author", "格隆汇"),
                "imageUrl": article.get("imageUrl", ""),
                "tags": json.dumps(article.get("tags", []), ensure_ascii=False),
                "ai_summary": article.get("ai_summary", ""),
                "ai_sentiment": article.get("ai_sentiment", ""),
                "ai_keywords": json.dumps(article.get("ai_keywords", []), ensure_ascii=False),
                "ai_impact": article.get("ai_impact", "")
            }
            
            # 保存到数据库
            success = db_client.save_article(db_article)
            if success:
                print(f"保存文章成功: {article['title']}")
            else:
                print(f"保存文章失败: {article['title']}")
    except Exception as e:
        print(f"获取格隆汇新闻异常: {str(e)}")
    
    # 获取并保存华尔街见闻数据
    print("\n===== 获取华尔街见闻新闻 =====")
    try:
        wallstreet_articles = wallstreet_crawler.get_latest_articles(limit=limit)
        print(f"获取到 {len(wallstreet_articles)} 条华尔街见闻新闻")
        
        for article in wallstreet_articles:
            # 如果启用DeepSeek，对内容进行增强
            if use_deepseek and ai_analyzer and (article.get("content") or article.get("summary")):
                content = article.get("content") or article.get("summary", "")
                if len(content) > 50:  # 只处理有足够内容的文章
                    try:
                        analysis = ai_analyzer.analyze_market_news(content)
                        if isinstance(analysis, dict) and not analysis.get("error"):
                            article["ai_summary"] = analysis.get("summary", "")
                            article["ai_sentiment"] = analysis.get("sentiment", "")
                            article["ai_keywords"] = analysis.get("keywords", [])
                            article["ai_impact"] = analysis.get("market_impact", "")
                            print(f"已为文章《{article['title']}》生成AI分析")
                    except Exception as e:
                        print(f"AI分析文章失败: {str(e)}")
            
            # 转换为数据库格式
            db_article = {
                "id": article["id"],
                "title": article["title"],
                "content": article.get("summary", ""),
                "url": article["url"],
                "pubDate": article["pubDate"],
                "source": "wallstreet",
                "category": article.get("category", "财经"),
                "author": article.get("author", "华尔街见闻"),
                "imageUrl": article.get("imageUrl", ""),
                "tags": json.dumps(article.get("tags", []), ensure_ascii=False),
                "ai_summary": article.get("ai_summary", ""),
                "ai_sentiment": article.get("ai_sentiment", ""),
                "ai_keywords": json.dumps(article.get("ai_keywords", []), ensure_ascii=False),
                "ai_impact": article.get("ai_impact", "")
            }
            
            # 保存到数据库
            success = db_client.save_article(db_article)
            if success:
                print(f"保存文章成功: {article['title']}")
            else:
                print(f"保存文章失败: {article['title']}")
    except Exception as e:
        print(f"获取华尔街见闻新闻异常: {str(e)}")
    
    # 获取并保存FastBull数据
    print("\n===== 获取FastBull新闻 =====")
    try:
        fastbull_articles = fastbull_crawler.get_latest_articles(limit=limit)
        print(f"获取到 {len(fastbull_articles)} 条FastBull新闻")
        
        for article in fastbull_articles:
            # 如果启用DeepSeek，对内容进行增强
            if use_deepseek and ai_analyzer and (article.get("content") or article.get("summary")):
                content = article.get("content") or article.get("summary", "")
                if len(content) > 50:  # 只处理有足够内容的文章
                    try:
                        analysis = ai_analyzer.analyze_market_news(content)
                        if isinstance(analysis, dict) and not analysis.get("error"):
                            article["ai_summary"] = analysis.get("summary", "")
                            article["ai_sentiment"] = analysis.get("sentiment", "")
                            article["ai_keywords"] = analysis.get("keywords", [])
                            article["ai_impact"] = analysis.get("market_impact", "")
                            print(f"已为文章《{article['title']}》生成AI分析")
                    except Exception as e:
                        print(f"AI分析文章失败: {str(e)}")
            
            # 转换为数据库格式
            db_article = {
                "id": article["id"],
                "title": article["title"],
                "content": article.get("summary", ""),
                "url": article["url"],
                "pubDate": article["pubDate"],
                "source": "fastbull",
                "category": article.get("category", "财经"),
                "author": article.get("author", "FastBull"),
                "imageUrl": article.get("imageUrl", ""),
                "tags": json.dumps(article.get("tags", []), ensure_ascii=False),
                "ai_summary": article.get("ai_summary", ""),
                "ai_sentiment": article.get("ai_sentiment", ""),
                "ai_keywords": json.dumps(article.get("ai_keywords", []), ensure_ascii=False),
                "ai_impact": article.get("ai_impact", "")
            }
            
            # 保存到数据库
            success = db_client.save_article(db_article)
            if success:
                print(f"保存文章成功: {article['title']}")
            else:
                print(f"保存文章失败: {article['title']}")
    except Exception as e:
        print(f"获取FastBull新闻异常: {str(e)}")
    
    # 如果启用SearXNG，获取额外的财经新闻
    if use_searxng and search_service:
        print("\n===== 使用SearXNG获取额外财经新闻 =====")
        try:
            # 搜索热门财经新闻
            search_queries = ["最新财经新闻", "股市行情", "央行政策", "经济数据", "公司财报"]
            all_search_results = []
            
            for query in search_queries:
                print(f"搜索关键词: {query}")
                # 根据实际的FinanceSearchService.search方法参数进行调用
                search_results = search_service.search(
                    query=query,
                    categories=["news"],  # 使用categories而不是search_type
                    time_range="day",
                    language="zh-CN",
                    limit=5,  # 使用limit而不是max_results
                    enhance_query=True
                )
                
                if search_results and isinstance(search_results, list):
                    all_search_results.extend(search_results)
                    print(f"找到 {len(search_results)} 条相关新闻")
                else:
                    print(f"搜索 '{query}' 未返回结果")
            
            # 去重
            unique_results = {}
            for result in all_search_results:
                if result.get("url") and result.get("title"):
                    unique_results[result["url"]] = result
            
            search_articles = list(unique_results.values())
            print(f"SearXNG总共找到 {len(search_articles)} 条不重复新闻")
            
            # 处理搜索结果
            for article in search_articles[:limit]:  # 限制数量
                # 生成唯一ID
                article_id = f"searxng_{hash(article['url'])}"
                
                # 如果启用DeepSeek，对内容进行增强
                if use_deepseek and ai_analyzer and article.get("content"):
                    content = article.get("content", "")
                    if len(content) > 50:  # 只处理有足够内容的文章
                        try:
                            analysis = ai_analyzer.analyze_market_news(content)
                            if isinstance(analysis, dict) and not analysis.get("error"):
                                article["ai_summary"] = analysis.get("summary", "")
                                article["ai_sentiment"] = analysis.get("sentiment", "")
                                article["ai_keywords"] = analysis.get("keywords", [])
                                article["ai_impact"] = analysis.get("market_impact", "")
                                print(f"已为文章《{article['title']}》生成AI分析")
                        except Exception as e:
                            print(f"AI分析文章失败: {str(e)}")
                
                # 转换为数据库格式
                pub_date = article.get("publishedDate")
                if not pub_date:
                    pub_date = datetime.now().isoformat()
                
                db_article = {
                    "id": article_id,
                    "title": article["title"],
                    "content": article.get("content", ""),
                    "url": article["url"],
                    "pubDate": pub_date,
                    "source": "searxng",
                    "category": "财经",
                    "author": article.get("source", "SearXNG"),
                    "imageUrl": article.get("img_src", ""),
                    "tags": json.dumps([], ensure_ascii=False),
                    "ai_summary": article.get("ai_summary", ""),
                    "ai_sentiment": article.get("ai_sentiment", ""),
                    "ai_keywords": json.dumps(article.get("ai_keywords", []), ensure_ascii=False),
                    "ai_impact": article.get("ai_impact", "")
                }
                
                # 保存到数据库
                success = db_client.save_article(db_article)
                if success:
                    print(f"保存SearXNG文章成功: {article['title']}")
                else:
                    print(f"保存SearXNG文章失败: {article['title']}")
        except Exception as e:
            print(f"SearXNG搜索新闻异常: {str(e)}")
    
    print("\n所有新闻数据获取并保存完成")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="获取并保存新闻数据")
    parser.add_argument("--no-searxng", action="store_true", help="不使用SearXNG获取额外新闻")
    parser.add_argument("--no-deepseek", action="store_true", help="不使用DeepSeek进行内容分析")
    parser.add_argument("--limit", type=int, default=10, help="每个来源获取的新闻数量")
    
    args = parser.parse_args()
    
    fetch_and_save_news(
        use_searxng=not args.no_searxng,
        use_deepseek=not args.no_deepseek,
        limit=args.limit
    )
