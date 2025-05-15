#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
华尔街见闻爬虫 - 获取华尔街见闻的新闻文章
"""

import re
import json
import time
import random
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urlencode
from ..config.settings import USER_AGENT, REQUEST_TIMEOUT

class WallstreetCrawler:
    """华尔街见闻爬虫类"""
    
    def __init__(self):
        """初始化爬虫"""
        self.headers = {
            "User-Agent": USER_AGENT,
            "Referer": "https://wallstreetcn.com/",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Origin": "https://wallstreetcn.com"
        }
        self.base_url = "https://wallstreetcn.com"
        self.api_url = "https://api-one.wallstcn.com"
        self.article_api = "https://api-one.wallstcn.com/apiv1/content/articles"
        self.flash_api = "https://api-one.wallstcn.com/apiv1/content/lives"
    
    def get_latest_articles(self, limit=20, channel_id="global"):
        """
        获取最新文章
        
        Args:
            limit (int): 获取数量
            channel_id (str): 频道ID，默认为global(全球)
            
        Returns:
            list: 文章列表
        """
        try:
            # 构建API URL
            params = {
                "limit": limit,
                "channel": channel_id,
                "cursor": "",
                "only_unlock": "false"
            }
            url = f"{self.article_api}?{urlencode(params)}"
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取华尔街见闻文章列表失败: HTTP {response.status_code}")
                return []
            
            data = response.json()
            if data.get("code") != 20000:
                print(f"获取华尔街见闻文章列表失败: {data.get('message', '未知错误')}")
                return []
            
            # 提取文章列表
            articles = []
            items = data.get("data", {}).get("items", [])
            
            for item in items:
                try:
                    article_id = str(item.get("id", ""))
                    title = item.get("title", "").strip()
                    summary = item.get("content_short", "").strip() or item.get("summary", "").strip()
                    
                    # 提取发布时间
                    pub_timestamp = item.get("display_time", 0)
                    if not pub_timestamp:
                        pub_timestamp = item.get("published_at", 0)
                    
                    pub_date = datetime.fromtimestamp(pub_timestamp/1000).isoformat() if pub_timestamp else ""
                    
                    # 提取图片
                    image_url = ""
                    resource = item.get("resource", {})
                    if resource:
                        image_url = resource.get("image", "")
                        
                    # 提取作者
                    author_info = item.get("author", {})
                    author = author_info.get("display_name", "") if author_info else ""
                    if not author:
                        source_info = item.get("source_info", {})
                        author = source_info.get("name", "") if source_info else ""
                    
                    if not author:
                        author = "华尔街见闻"
                    
                    # 提取标签
                    tags = []
                    for tag in item.get("asset_tags", []):
                        tag_name = tag.get("name", "").strip()
                        if tag_name:
                            tags.append(tag_name)
                    
                    # 构建URL
                    uri = item.get("uri", "")
                    url = f"{self.base_url}/articles/{article_id}" if not uri else f"{self.base_url}{uri}"
                    
                    # 构建文章数据
                    article = {
                        "id": article_id,
                        "title": title,
                        "url": url,
                        "pubDate": pub_date,
                        "source": "华尔街见闻",
                        "category": "文章",
                        "summary": summary,
                        "author": author,
                        "imageUrl": image_url,
                        "tags": tags
                    }
                    
                    articles.append(article)
                except Exception as e:
                    print(f"解析华尔街见闻文章数据异常: {str(e)}")
                    continue
            
            return articles
        
        except Exception as e:
            print(f"获取华尔街见闻文章列表异常: {str(e)}")
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
            url = f"{self.article_api}/{article_id}"
            
            # 添加随机延迟，避免请求过快
            time.sleep(random.uniform(1, 3))
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取华尔街见闻文章详情失败: HTTP {response.status_code}")
                return None
            
            data = response.json()
            if data.get("code") != 20000:
                print(f"获取华尔街见闻文章详情失败: {data.get('message', '未知错误')}")
                return None
            
            # 提取文章详情
            article_data = data.get("data", {})
            
            title = article_data.get("title", "").strip()
            content = article_data.get("content", "")
            summary = article_data.get("content_short", "").strip() or article_data.get("summary", "").strip()
            
            # 提取发布时间
            pub_timestamp = article_data.get("display_time", 0)
            if not pub_timestamp:
                pub_timestamp = article_data.get("published_at", 0)
            
            pub_date = datetime.fromtimestamp(pub_timestamp/1000).isoformat() if pub_timestamp else ""
            
            # 提取图片
            image_url = ""
            resource = article_data.get("resource", {})
            if resource:
                image_url = resource.get("image", "")
                
            # 提取作者
            author_info = article_data.get("author", {})
            author = author_info.get("display_name", "") if author_info else ""
            if not author:
                source_info = article_data.get("source_info", {})
                author = source_info.get("name", "") if source_info else ""
            
            if not author:
                author = "华尔街见闻"
            
            # 提取标签
            tags = []
            for tag in article_data.get("asset_tags", []):
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
                "source": "华尔街见闻"
            }
            
            return article_detail
        
        except Exception as e:
            print(f"获取华尔街见闻文章详情异常: {str(e)}")
            return None
    
    def get_flash_news(self, limit=20):
        """
        获取快讯
        
        Args:
            limit (int): 获取数量
            
        Returns:
            list: 快讯列表
        """
        try:
            # 构建API URL
            params = {
                "limit": limit,
                "channel": "global-channel,a-stock-channel",
                "cursor": "",
            }
            url = f"{self.flash_api}?{urlencode(params)}"
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取华尔街见闻快讯失败: HTTP {response.status_code}")
                return []
            
            data = response.json()
            if data.get("code") != 20000:
                print(f"获取华尔街见闻快讯失败: {data.get('message', '未知错误')}")
                return []
            
            # 提取快讯列表
            news_list = []
            items = data.get("data", {}).get("items", [])
            
            for item in items:
                try:
                    news_id = str(item.get("id", ""))
                    content = item.get("content_text", "").strip()
                    if not content:
                        content = BeautifulSoup(item.get("content", ""), "html.parser").get_text().strip()
                    
                    # 提取发布时间
                    pub_timestamp = item.get("display_time", 0)
                    if not pub_timestamp:
                        pub_timestamp = item.get("published_at", 0)
                    
                    pub_date = datetime.fromtimestamp(pub_timestamp/1000).isoformat() if pub_timestamp else ""
                    
                    # 从内容中提取标题（前30个字符）
                    title = content[:30] + ("..." if len(content) > 30 else "")
                    
                    # 构建URL
                    url = f"{self.base_url}/live/{news_id}"
                    
                    # 构建快讯数据
                    news = {
                        "id": news_id,
                        "title": title,
                        "url": url,
                        "pubDate": pub_date,
                        "source": "华尔街见闻",
                        "category": "快讯",
                        "summary": content,
                        "content": item.get("content", f"<p>{content}</p>")
                    }
                    
                    news_list.append(news)
                except Exception as e:
                    print(f"解析华尔街见闻快讯数据异常: {str(e)}")
                    continue
            
            return news_list
        
        except Exception as e:
            print(f"获取华尔街见闻快讯异常: {str(e)}")
            return []
