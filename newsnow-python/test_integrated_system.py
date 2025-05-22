#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
集成测试脚本 - 验证财经信息系统各组件功能
"""

import os
import sys
import json
import time
from datetime import datetime

# 导入集成系统
from integrated_finance_system import FinanceSystem

# 测试辅助函数
def print_separator(title):
    """打印分隔线"""
    print("\n" + "=" * 50)
    print(f" {title} ")
    print("=" * 50)

def print_json(data):
    """美化打印JSON数据"""
    if data:
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        print("无数据")

def test_crawler_functionality(system):
    """测试爬虫功能"""
    print_separator("测试爬虫功能")
    
    # 测试获取最新快讯
    print("\n[1] 获取最新金十快讯:")
    news_list = system.get_latest_news(limit=3)
    if news_list:
        for i, news in enumerate(news_list):
            print(f"{i+1}. [{news.get('pubDate', '')}] {news.get('title', '')}")
    else:
        print("获取快讯失败")
    
    # 测试获取最新文章列表
    print("\n[2] 获取最新金十文章列表:")
    articles = system.get_latest_articles(limit=3)
    article_id = None
    if articles:
        for i, article in enumerate(articles):
            print(f"{i+1}. {article.get('title', '')}")
            # 保存第一篇文章ID用于后续测试
            if i == 0 and 'id' in article:
                article_id = article['id']
    else:
        print("获取文章列表失败")
    
    # 测试获取文章详情
    if article_id:
        print(f"\n[3] 获取文章详情 (ID: {article_id}):")
        article_detail = system.get_article_detail(article_id)
        if article_detail:
            print(f"标题: {article_detail.get('title', '')}")
            print(f"发布时间: {article_detail.get('pubDate', '')}")
            print(f"内容摘要: {article_detail.get('content', '')[:150]}...")
        else:
            print("获取文章详情失败")
    
    return news_list, articles, article_id

def test_content_analysis(system, news_list, article_id):
    """测试内容分析功能"""
    print_separator("测试内容分析功能")
    
    # 测试快讯分析
    if news_list:
        print("\n[1] 分析快讯内容:")
        news = news_list[0]
        analysis = system.analyze_content(news["title"], news["title"], "news")
        if analysis:
            print(f"标题: {news.get('title', '')}")
            print(f"分析结果:")
            print_json(analysis.get("analysis"))
        else:
            print("分析快讯失败")
    
    # 测试文章分析
    if article_id:
        print("\n[2] 分析文章内容:")
        article = system.get_article_detail(article_id)
        if article:
            content = article.get("content")
            title = article.get("title")
            if content:
                analysis = system.analyze_content(content, title, "news")
                if analysis:
                    print(f"标题: {title}")
                    print(f"分析结果:")
                    print_json(analysis.get("analysis"))
                else:
                    print("分析文章失败")
            else:
                print("文章内容为空")
        else:
            print("获取文章详情失败")
    
    # 测试市场综述生成
    print("\n[3] 生成市场综述:")
    summary = system.generate_market_summary(limit=5)
    if summary:
        print(f"市场综述:")
        print(summary.get("summary"))
        print("\n基于以下快讯:")
        for i, title in enumerate(summary.get("based_on", [])):
            print(f"{i+1}. {title}")
    else:
        print("生成市场综述失败")

def test_search_functionality(system, article_id):
    """测试搜索功能"""
    print_separator("测试搜索功能")
    
    # 测试财经信息搜索
    print("\n[1] 搜索财经信息:")
    query = "美联储加息影响"
    print(f"搜索查询: {query}")
    search_result = system.search_finance_info(query, time_range="month", limit=3)
    
    if "error" in search_result:
        print(f"搜索错误: {search_result.get('error')}")
    else:
        print(f"增强后的查询: {search_result.get('enhanced_query')}")
        print(f"找到 {search_result.get('filtered_results')} 条结果（共 {search_result.get('total_results')} 条）")
        
        for i, item in enumerate(search_result.get("results", [])):
            print(f"\n结果 {i+1}:")
            print(f"标题: {item.get('title', '')}")
            print(f"链接: {item.get('url', '')}")
            print(f"摘要: {item.get('content', '')[:100]}...")
            print(f"得分: {item.get('adjusted_score', 0):.2f}")
    
    # 测试相关文章搜索
    if article_id:
        print("\n[2] 搜索相关文章:")
        article = system.get_article_detail(article_id)
        if article:
            related = system.search_service.search_related_news(article, limit=3)
            if related:
                print(f"文章标题: {article.get('title')}")
                print(f"相关文章:")
                for i, item in enumerate(related):
                    print(f"\n相关文章 {i+1}:")
                    print(f"标题: {item.get('title', '')}")
                    print(f"链接: {item.get('url', '')}")
            else:
                print("未找到相关文章")
        else:
            print("获取文章详情失败")

def test_enhanced_article(system, article_id):
    """测试增强文章功能"""
    print_separator("测试增强文章功能")
    
    if not article_id:
        print("无文章ID，跳过测试")
        return
    
    print(f"\n获取增强文章 (ID: {article_id}):")
    enhanced = system.get_enhanced_article(article_id)
    if enhanced:
        print(f"文章标题: {enhanced.get('article', {}).get('title', '')}")
        
        # 显示分析结果
        print("\n分析结果:")
        if enhanced.get("analysis"):
            print_json(enhanced.get("analysis"))
        else:
            print("无分析结果")
        
        # 显示相关文章
        print("\n相关文章:")
        for i, item in enumerate(enhanced.get("related_articles", [])):
            if i < 3:  # 只显示前3条
                print(f"{i+1}. {item.get('title', '')}")
    else:
        print("获取增强文章失败")

def run_all_tests():
    """运行所有测试"""
    # 获取DeepSeek API密钥
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        print("警告: 未设置DEEPSEEK_API_KEY环境变量，内容分析功能将不可用")
    
    # 创建系统配置
    config = {
        "deepseek_api_key": api_key,
        "searxng_url": "http://localhost:8080/search"
    }
    
    # 初始化系统
    start_time = time.time()
    print(f"开始初始化财经信息系统... {datetime.now()}")
    system = FinanceSystem(config)
    print(f"系统初始化完成，耗时: {time.time() - start_time:.2f}秒")
    
    # 运行各功能测试
    try:
        # 测试爬虫功能
        news_list, articles, article_id = test_crawler_functionality(system)
        
        # 测试内容分析功能
        test_content_analysis(system, news_list, article_id)
        
        # 测试搜索功能
        test_search_functionality(system, article_id)
        
        # 测试增强文章功能
        test_enhanced_article(system, article_id)
        
        print_separator("测试完成")
        print(f"所有测试完成，总耗时: {time.time() - start_time:.2f}秒")
    
    except Exception as e:
        print(f"测试过程中发生错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()
