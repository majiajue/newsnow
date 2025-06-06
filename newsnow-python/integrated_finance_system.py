#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
财经信息集成系统 - 整合爬虫、内容分析和搜索服务
"""

import os
import json
import time
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

# 导入改进后的组件
from crawlers.improved_jin10 import ImprovedJin10Crawler
from utils.improved_ai_service import FinanceAnalyzer
from utils.improved_search_service import FinanceSearchService

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FinanceSystem:
    """财经信息集成系统"""
    
    def __init__(self, config=None):
        """初始化财经系统"""
        self.config = config or {}
        self._init_components()
        self._init_cache()
        logger.info("财经信息集成系统初始化完成")
    
    def _init_components(self):
        """初始化系统组件"""
        # 初始化爬虫
        self.jin10_crawler = ImprovedJin10Crawler()
        
        # 初始化内容分析器
        api_key = self.config.get("deepseek_api_key") or os.environ.get("DEEPSEEK_API_KEY")
        self.analyzer = FinanceAnalyzer(api_key=api_key)
        
        # 初始化搜索服务
        searxng_url = self.config.get("searxng_url") or os.environ.get("SEARXNG_URL", "http://searxng:8080/search")
        self.search_service = FinanceSearchService(searxng_url=searxng_url)
    
    def _init_cache(self):
        """初始化缓存"""
        self.article_cache = {}
        self.analysis_cache = {}
        self.search_cache = {}
        self.MAX_CACHE_ITEMS = 1000
        self.CACHE_TTL = 3600  # 默认缓存1小时
    
    def _manage_cache(self, cache, key, value):
        """管理缓存项"""
        # 如果缓存过大，移除最早的项
        if len(cache) >= self.MAX_CACHE_ITEMS:
            # 按添加时间排序并移除最早的10%
            sorted_items = sorted(cache.items(), key=lambda x: x[1].get("_cache_time", 0))
            for old_key, _ in sorted_items[:int(self.MAX_CACHE_ITEMS * 0.1)]:
                del cache[old_key]
        
        # 添加缓存时间
        value["_cache_time"] = time.time()
        cache[key] = value
    
    def get_latest_news(self, limit=20, source="jin10"):
        """获取最新财经消息"""
        try:
            logger.info(f"获取最新财经消息，来源: {source}, 数量: {limit}")
            
            if source == "jin10":
                news_list = self.jin10_crawler.get_latest_flash(limit=limit)
            else:
                logger.warning(f"不支持的来源: {source}")
                return []
            
            return news_list
        except Exception as e:
            logger.error(f"获取最新财经消息失败: {str(e)}")
            return []
    
    def get_latest_articles(self, limit=10, source="jin10"):
        """获取最新文章"""
        try:
            logger.info(f"获取最新文章，来源: {source}, 数量: {limit}")
            
            if source == "jin10":
                articles = self.jin10_crawler.get_latest_articles(limit=limit)
            else:
                logger.warning(f"不支持的来源: {source}")
                return []
            
            return articles
        except Exception as e:
            logger.error(f"获取最新文章失败: {str(e)}")
            return []
    
    def get_article_detail(self, article_id, source="jin10"):
        """获取文章详情"""
        try:
            logger.info(f"获取文章详情，来源: {source}, ID: {article_id}")
            cache_key = f"{source}_{article_id}"
            
            # 检查缓存
            if cache_key in self.article_cache:
                cached = self.article_cache[cache_key]
                if time.time() - cached.get("_cache_time", 0) < self.CACHE_TTL:
                    logger.info(f"使用缓存的文章详情: {cache_key}")
                    return cached
            
            # 获取文章详情
            if source == "jin10":
                article = self.jin10_crawler.get_article_detail(article_id)
            else:
                logger.warning(f"不支持的来源: {source}")
                return None
            
            # 缓存结果
            if article:
                self._manage_cache(self.article_cache, cache_key, article)
            
            return article
        except Exception as e:
            logger.error(f"获取文章详情失败: {str(e)}")
            return None
    
    def analyze_content(self, content, title=None, content_type="news"):
        """分析内容"""
        try:
            logger.info(f"分析内容: {title or content[:50]}...")
            cache_key = f"{content_type}_{hash(content)}"
            
            # 检查缓存
            if cache_key in self.analysis_cache:
                cached = self.analysis_cache[cache_key]
                if time.time() - cached.get("_cache_time", 0) < self.CACHE_TTL:
                    logger.info(f"使用缓存的分析结果: {cache_key}")
                    return cached
            
            # 根据内容类型选择不同的分析方法
            result = None
            if content_type == "news":
                result = self.analyzer.analyze_market_news(content, title)
            elif content_type == "economic_data":
                result = self.analyzer.analyze_economic_data(content)
            elif content_type == "company_report":
                result = self.analyzer.analyze_company_report(content, title)
            else:
                logger.warning(f"不支持的内容类型: {content_type}")
                return None
            
            # 缓存结果
            if result:
                analysis_result = {
                    "content_type": content_type,
                    "title": title,
                    "content_hash": hash(content),
                    "analysis": result,
                    "timestamp": datetime.now().isoformat()
                }
                self._manage_cache(self.analysis_cache, cache_key, analysis_result)
            
            return analysis_result
        except Exception as e:
            logger.error(f"内容分析失败: {str(e)}")
            return None
    
    def search_finance_info(self, query, categories=None, time_range=None, limit=10):
        """搜索财经信息"""
        try:
            logger.info(f"搜索财经信息: {query}, 类别: {categories}, 时间范围: {time_range}")
            cache_key = f"search_{query}_{categories}_{time_range}_{limit}"
            
            # 检查缓存（搜索结果使用较短的缓存时间）
            search_ttl = 900  # 15分钟
            if cache_key in self.search_cache:
                cached = self.search_cache[cache_key]
                if time.time() - cached.get("_cache_time", 0) < search_ttl:
                    logger.info(f"使用缓存的搜索结果: {cache_key}")
                    return cached
            
            # 执行搜索
            search_result = self.search_service.search(
                query=query,
                categories=categories,
                time_range=time_range,
                limit=limit
            )
            
            # 缓存结果
            if search_result and "error" not in search_result:
                self._manage_cache(self.search_cache, cache_key, search_result)
            
            return search_result
        except Exception as e:
            logger.error(f"搜索财经信息失败: {str(e)}")
            return {"error": str(e)}
    
    def get_enhanced_article(self, article_id, source="jin10"):
        """获取增强文章（包含分析和相关内容）"""
        try:
            logger.info(f"获取增强文章，来源: {source}, ID: {article_id}")
            
            # 获取文章详情
            article = self.get_article_detail(article_id, source)
            if not article:
                logger.warning(f"未找到文章: {source} {article_id}")
                return None
            
            # 分析文章内容
            content = article.get("content") or article.get("title")
            analysis = self.analyze_content(content, article.get("title"), "news")
            
            # 搜索相关文章
            related_articles = self.search_service.search_related_news(article, limit=5)
            
            # 构建增强文章结果
            enhanced_article = {
                "article": article,
                "analysis": analysis.get("analysis") if analysis else None,
                "related_articles": related_articles,
                "timestamp": datetime.now().isoformat()
            }
            
            return enhanced_article
        except Exception as e:
            logger.error(f"获取增强文章失败: {str(e)}")
            return None
    
    def generate_market_summary(self, limit=10, source="jin10"):
        """生成市场综述"""
        try:
            logger.info(f"生成市场综述，来源: {source}, 使用 {limit} 条最新消息")
            
            # 获取最新财经消息
            news_list = self.get_latest_news(limit=limit, source=source)
            if not news_list:
                logger.warning("没有找到最新消息，无法生成市场综述")
                return None
            
            # 生成市场综述
            summary = self.analyzer.generate_market_summary(news_list, market_type="财经市场")
            
            return {
                "summary": summary,
                "based_on": [news.get("title") for news in news_list],
                "source": source,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"生成市场综述失败: {str(e)}")
            return None

# 用于API集成的函数
def create_finance_system(config=None):
    """创建财经系统实例（用于API集成）"""
    return FinanceSystem(config)

# 测试代码
if __name__ == "__main__":
    # 获取DeepSeek API密钥
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        print("警告: 未设置DEEPSEEK_API_KEY环境变量，内容分析功能将不可用")
    
    # 创建系统配置
    config = {
        "deepseek_api_key": api_key,
        "searxng_url": os.environ.get("SEARXNG_URL", "http://searxng:8080/search")
    }
    
    # 初始化系统
    system = FinanceSystem(config)
    
    # 测试获取最新快讯
    print("\n获取最新快讯:")
    news_list = system.get_latest_news(limit=3)
    for i, news in enumerate(news_list):
        print(f"{i+1}. [{news.get('pubDate', '')}] {news.get('title', '')}")
    
    if news_list:
        # 测试内容分析
        print("\n内容分析示例:")
        analysis = system.analyze_content(news_list[0]["title"], news_list[0]["title"], "news")
        if analysis:
            print(analysis["analysis"])
        
        # 测试搜索相关内容
        print("\n搜索相关内容:")
        search_result = system.search_finance_info(news_list[0]["title"], time_range="month", limit=2)
        if search_result and "error" not in search_result:
            for i, result in enumerate(search_result.get("results", [])):
                print(f"{i+1}. {result.get('title', '')}")
                print(f"   {result.get('url', '')}")
        
        # 测试市场综述
        print("\n生成市场综述:")
        summary = system.generate_market_summary(limit=5)
        if summary:
            print(summary["summary"])
