#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
搜索服务 - 提供与SearXNG的交互接口
"""

import requests
import logging
import time
import json
from urllib.parse import quote_plus
# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import SEARXNG_URL, SEARXNG_TIMEOUT, SEARCH_CACHE_TTL

logger = logging.getLogger(__name__)

class SearchService:
    """搜索服务类，用于与SearXNG交互获取搜索结果"""
    
    def __init__(self, base_url=None):
        """
        初始化搜索服务
        
        Args:
            base_url (str, optional): SearXNG服务的基础URL，默认使用配置文件中的设置
        """
        self.base_url = base_url or SEARXNG_URL
        self.search_cache = {}  # 简单的内存缓存
        self.cache_ttl = SEARCH_CACHE_TTL  # 缓存过期时间（秒）
        logger.info(f"搜索服务初始化完成，使用服务器: {self.base_url}")
    
    def search(self, query, category="finance", language="zh-CN", time_range=None, max_results=10):
        """
        执行搜索查询
        
        Args:
            query (str): 搜索关键词
            category (str, optional): 搜索类别，默认为"finance"
            language (str, optional): 搜索语言，默认为"zh-CN"
            time_range (str, optional): 时间范围，如"day", "week", "month"
            max_results (int, optional): 最大结果数，默认为10
            
        Returns:
            list: 搜索结果列表
        """
        # 构建缓存键
        cache_key = f"{query}:{category}:{language}:{time_range}:{max_results}"
        
        # 检查缓存
        if cache_key in self.search_cache:
            cache_entry = self.search_cache[cache_key]
            if time.time() - cache_entry["timestamp"] < self.cache_ttl:
                logger.info(f"从缓存获取搜索结果: {query}")
                return cache_entry["results"]
        
        logger.info(f"执行搜索查询: {query}, 类别: {category}")
        
        # 构建请求参数
        params = {
            "q": query,
            "categories": category,
            "language": language,
            "format": "json",
            "engines": "google_finance,baidu_finance,google_news",
            "results": max_results
        }
        
        if time_range:
            params["time_range"] = time_range
        
        try:
            search_url = f"{self.base_url}/search"
            response = requests.get(
                search_url,
                params=params,
                timeout=SEARXNG_TIMEOUT
            )
            
            if response.status_code != 200:
                logger.error(f"搜索请求失败: HTTP {response.status_code}")
                logger.debug(f"响应内容: {response.text[:200]}")
                return []
            
            data = response.json()
            results = self._process_search_results(data)
            
            # 更新缓存
            self.search_cache[cache_key] = {
                "timestamp": time.time(),
                "results": results
            }
            
            logger.info(f"搜索查询成功: {query}, 获取到 {len(results)} 条结果")
            return results
            
        except Exception as e:
            logger.error(f"搜索查询异常: {str(e)}")
            return []
    
    def _process_search_results(self, data):
        """
        处理搜索结果
        
        Args:
            data (dict): 搜索响应数据
            
        Returns:
            list: 处理后的搜索结果列表
        """
        results = []
        
        for item in data.get("results", []):
            result = {
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", ""),
                "source": item.get("engine", ""),
                "category": item.get("category", ""),
                "pubDate": item.get("publishedDate", "")
            }
            
            # 去重（根据URL）
            if result["url"] and not any(r["url"] == result["url"] for r in results):
                results.append(result)
        
        return results
    
    def search_related_news(self, article_title, article_content=None, max_results=5):
        """
        搜索与文章相关的新闻
        
        Args:
            article_title (str): 文章标题
            article_content (str, optional): 文章内容，用于提取关键词
            max_results (int, optional): 最大结果数，默认为5
            
        Returns:
            list: 相关新闻列表
        """
        # 从标题中提取关键词
        query = self._extract_keywords(article_title, article_content)
        
        logger.info(f"搜索相关新闻: {query}")
        
        # 执行搜索
        results = self.search(
            query=query,
            category="news,finance",
            time_range="week",
            max_results=max_results
        )
        
        # 过滤掉可能包含相同标题的结果
        filtered_results = [
            r for r in results 
            if article_title.lower() not in r["title"].lower()
        ]
        
        return filtered_results[:max_results]
    
    def _extract_keywords(self, title, content=None):
        """
        提取关键词
        
        Args:
            title (str): 文章标题
            content (str, optional): 文章内容
            
        Returns:
            str: 关键词查询字符串
        """
        # 简单实现：直接使用标题作为关键词
        # 更复杂的实现可以使用NLP技术提取关键词
        return title
    
    def clear_cache(self):
        """清除搜索缓存"""
        self.search_cache = {}
        logger.info("搜索缓存已清除")
    
    def health_check(self):
        """
        检查搜索服务是否可用
        
        Returns:
            bool: 服务是否可用
        """
        try:
            response = requests.get(
                f"{self.base_url}/healthz",
                timeout=3
            )
            return response.status_code == 200
        except Exception:
            return False
