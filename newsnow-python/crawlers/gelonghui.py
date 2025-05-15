#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
格隆汇爬虫 - 获取格隆汇的新闻文章
"""

import re
import json
import time
import random
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from ..config.settings import USER_AGENT, REQUEST_TIMEOUT

class GelonghuiCrawler:
    """格隆汇爬虫类"""
    
    def __init__(self):
        """初始化爬虫"""
        self.headers = {
            "User-Agent": USER_AGENT,
            "Referer": "https://www.gelonghui.com/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
        }
        self.base_url = "https://www.gelonghui.com"
        self.api_url = "https://www.gelonghui.com/api/v3"
    
    def get_latest_articles(self, page=1, limit=20):
        """
        获取最新文章
        
        Args:
            page (int): 页码
            limit (int): 每页数量
            
        Returns:
            list: 文章列表
        """
        try:
            # 构建API URL
            url = f"{self.api_url}/post/index?page={page}&size={limit}"
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取格隆汇文章列表失败: HTTP {response.status_code}")
                return []
            
            data = response.json()
            if data.get("code") != 0:
                print(f"获取格隆汇文章列表失败: {data.get('message', '未知错误')}")
                return []
            
            # 提取文章列表
            articles = []
            items = data.get("data", {}).get("items", [])
            
            for item in items:
                try:
                    article_id = str(item.get("id", ""))
                    title = item.get("title", "").strip()
                    summary = item.get("summary", "").strip()
                    pub_timestamp = item.get("timestamp", 0)
                    pub_date = datetime.fromtimestamp(pub_timestamp).isoformat() if pub_timestamp else ""
                    image_url = item.get("cover", {}).get("url", "")
                    author = item.get("author", {}).get("name", "格隆汇")
                    
                    # 构建URL
                    url = f"{self.base_url}/articles/{article_id}"
                    
                    # 构建文章数据
                    article = {
                        "id": article_id,
                        "title": title,
                        "url": url,
                        "pubDate": pub_date,
                        "source": "格隆汇",
                        "category": "文章",
                        "summary": summary,
                        "author": author,
                        "imageUrl": image_url
                    }
                    
                    articles.append(article)
                except Exception as e:
                    print(f"解析格隆汇文章数据异常: {str(e)}")
                    continue
            
            return articles
        
        except Exception as e:
            print(f"获取格隆汇文章列表异常: {str(e)}")
            return []
    
    def get_article_detail(self, article_id):
        """
        获取文章详情
        
        Args:
            article_id (str): 文章ID
            
        Returns:
            dict: 文章详情
        """
        try:
            # 构建API URL
            url = f"{self.api_url}/post/{article_id}"
            
            # 添加随机延迟，避免请求过快
            time.sleep(random.uniform(1, 3))
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取格隆汇文章详情失败: HTTP {response.status_code}")
                return None
            
            data = response.json()
            if data.get("code") != 0:
                print(f"获取格隆汇文章详情失败: {data.get('message', '未知错误')}")
                return None
            
            # 提取文章详情
            post_data = data.get("data", {})
            
            title = post_data.get("title", "").strip()
            content = post_data.get("content", "")
            summary = post_data.get("summary", "").strip()
            pub_timestamp = post_data.get("timestamp", 0)
            pub_date = datetime.fromtimestamp(pub_timestamp).isoformat() if pub_timestamp else ""
            image_url = post_data.get("cover", {}).get("url", "")
            author = post_data.get("author", {}).get("name", "格隆汇")
            
            # 提取标签
            tags = []
            for tag in post_data.get("tags", []):
                tag_name = tag.get("name", "").strip()
                if tag_name:
                    tags.append(tag_name)
            
            # 如果内容为空，使用摘要
            if not content and summary:
                content = f"<p>{summary}</p>"
            
            # 构建文章详情
            article_detail = {
                "id": article_id,
                "title": title,
                "pubDate": pub_date,
                "author": author,
                "content": content,
                "summary": summary,
                "imageUrl": image_url,
                "tags": tags,
                "source": "格隆汇"
            }
            
            return article_detail
        
        except Exception as e:
            print(f"获取格隆汇文章详情异常: {str(e)}")
            return None
    
    def get_flash_news(self, page=1, limit=20):
        """
        获取快讯
        
        Args:
            page (int): 页码
            limit (int): 每页数量
            
        Returns:
            list: 快讯列表
        """
        try:
            # 构建API URL
            url = f"{self.api_url}/telegraph/index?page={page}&size={limit}"
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取格隆汇快讯失败: HTTP {response.status_code}")
                return []
            
            data = response.json()
            if data.get("code") != 0:
                print(f"获取格隆汇快讯失败: {data.get('message', '未知错误')}")
                return []
            
            # 提取快讯列表
            news_list = []
            items = data.get("data", {}).get("items", [])
            
            for item in items:
                try:
                    news_id = str(item.get("id", ""))
                    content = item.get("content", "").strip()
                    pub_timestamp = item.get("timestamp", 0)
                    pub_date = datetime.fromtimestamp(pub_timestamp).isoformat() if pub_timestamp else ""
                    
                    # 构建URL
                    url = f"{self.base_url}/telegraph/{news_id}"
                    
                    # 从内容中提取标题（前30个字符）
                    title = content[:30] + ("..." if len(content) > 30 else "")
                    
                    # 构建快讯数据
                    news = {
                        "id": news_id,
                        "title": title,
                        "url": url,
                        "pubDate": pub_date,
                        "source": "格隆汇",
                        "category": "快讯",
                        "summary": content,
                        "content": f"<p>{content}</p>"
                    }
                    
                    news_list.append(news)
                except Exception as e:
                    print(f"解析格隆汇快讯数据异常: {str(e)}")
                    continue
            
            return news_list
        
        except Exception as e:
            print(f"获取格隆汇快讯异常: {str(e)}")
            return []
