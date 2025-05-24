#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
爬虫工厂类 - 统一管理和调用不同来源的爬虫
"""

import importlib
from typing import Dict, List, Any, Optional, Type

# 导入所有爬虫类
from .jin10 import Jin10Crawler
from .gelonghui import GelonghuiCrawler
from .wallstreet import WallstreetCrawler  # 注意类名是 WallstreetCrawler 而不是 WallStreetCrawler
from .fastbull import FastbullCrawler  # 注意类名是 FastbullCrawler 而不是 FastBullCrawler
from .cls import CLSCrawler
# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import SOURCES


class CrawlerFactory:
    """爬虫工厂类，负责创建和管理各种爬虫实例"""
    
    def __init__(self):
        """初始化爬虫工厂，创建所有爬虫实例"""
        self._crawlers = {}
        self._initialize_crawlers()
    
    def _initialize_crawlers(self):
        """初始化所有爬虫实例"""
        # 创建各类爬虫实例
        self._crawlers = {
            "jin10": Jin10Crawler(),
            "gelonghui": GelonghuiCrawler(),
            "wallstreet": WallstreetCrawler(),  # 修正类名
            "fastbull": FastbullCrawler(),  # 修正类名
            "cls": CLSCrawler()
        }
    
    def get_crawler(self, source: str) -> Optional[Any]:
        """
        获取指定来源的爬虫实例
        
        Args:
            source (str): 爬虫来源标识，如'jin10', 'gelonghui'等
            
        Returns:
            Any: 爬虫实例，如果找不到则返回None
        """
        return self._crawlers.get(source.lower())
    
    def get_all_sources(self) -> List[str]:
        """
        获取所有支持的爬虫来源
        
        Returns:
            List[str]: 所有支持的爬虫来源列表
        """
        return list(self._crawlers.keys())
    
    def get_source_name(self, source: str) -> str:
        """
        获取来源的中文名称
        
        Args:
            source (str): 爬虫来源标识
            
        Returns:
            str: 来源的中文名称
        """
        return SOURCES.get(source, source)
    
    def get_latest_articles(self, source: str, page: int = 1, limit: int = 20) -> List[Dict]:
        """
        获取指定来源的最新文章
        
        Args:
            source (str): 爬虫来源标识
            page (int): 页码
            limit (int): 每页数量
            
        Returns:
            List[Dict]: 文章列表
        """
        crawler = self.get_crawler(source)
        if not crawler:
            print(f"找不到'{source}'对应的爬虫")
            return []
        
        try:
            return crawler.get_latest_articles(page=page, limit=limit)
        except Exception as e:
            print(f"获取{source}最新文章异常: {str(e)}")
            return []
    
    def get_article_detail(self, source: str, article_id: str) -> Optional[Dict]:
        """
        获取指定来源的文章详情
        
        Args:
            source (str): 爬虫来源标识
            article_id (str): 文章ID
            
        Returns:
            Optional[Dict]: 文章详情，如果获取失败则返回None
        """
        crawler = self.get_crawler(source)
        if not crawler:
            print(f"找不到'{source}'对应的爬虫")
            return None
        
        try:
            return crawler.get_article_detail(article_id)
        except Exception as e:
            print(f"获取{source}文章详情异常: {str(e)}")
            return None
    
    def get_news_flash(self, source: str, limit: int = 20) -> List[Dict]:
        """
        获取指定来源的快讯
        
        Args:
            source (str): 爬虫来源标识
            limit (int): 获取数量
            
        Returns:
            List[Dict]: 快讯列表
        """
        crawler = self.get_crawler(source)
        if not crawler:
            print(f"找不到'{source}'对应的爬虫")
            return []
        
        try:
            # 不同爬虫可能有不同的快讯获取方法
            if source == "jin10":
                return crawler.get_latest_news(limit=limit)
            elif source == "gelonghui":
                return crawler.get_flash_news(limit=limit)
            elif source == "cls":
                return crawler.get_flash_list(limit=limit)
            else:
                print(f"{source}不支持获取快讯")
                return []
        except AttributeError:
            print(f"{source}爬虫不支持获取快讯功能")
            return []
        except Exception as e:
            print(f"获取{source}快讯异常: {str(e)}")
            return []
    
    def get_all_latest_articles(self, limit: int = 10) -> List[Dict]:
        """
        获取所有来源的最新文章，并按发布时间排序
        
        Args:
            limit (int): 每个来源获取的文章数量
            
        Returns:
            List[Dict]: 按发布时间排序的文章列表
        """
        all_articles = []
        
        # 从所有来源获取文章
        for source in self.get_all_sources():
            articles = self.get_latest_articles(source, limit=limit)
            all_articles.extend(articles)
        
        # 按发布时间排序（降序）
        all_articles.sort(key=lambda x: x.get("pubDate", ""), reverse=True)
        
        return all_articles
