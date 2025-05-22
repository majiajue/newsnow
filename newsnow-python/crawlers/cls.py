#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
财联社爬虫 - 获取财联社的新闻文章
"""

import re
import json
import time
import random
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin
# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import USER_AGENT, REQUEST_TIMEOUT

class CLSCrawler:
    """财联社爬虫类"""
    
    def __init__(self):
        """初始化爬虫"""
        self.headers = {
            "User-Agent": USER_AGENT,
            "Referer": "https://www.cls.cn/",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Origin": "https://www.cls.cn"
        }
        self.base_url = "https://www.cls.cn"
        self.telegraph_api = "https://www.cls.cn/nodeapi/telegraphList"
        self.article_api = "https://www.cls.cn/nodeapi/content/detail"
        
    def get_latest_flash(self, limit=20, refresh_type=1, last_time=""):
        """
        获取最新快讯
        
        Args:
            limit (int): 获取数量
            refresh_type (int): 刷新类型，1为最新
            last_time (str): 上次加载的时间戳
            
        Returns:
            list: 快讯列表
        """
        try:
            # 构建请求数据
            payload = {
                "app": "CailianpressWeb",
                "refresh_type": refresh_type,
                "rn": limit,
                "last_time": last_time
            }
            
            response = requests.post(
                self.telegraph_api,
                headers=self.headers,
                json=payload,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取财联社快讯失败: HTTP {response.status_code}")
                return []
            
            data = response.json()
            if data.get("status") != "ok":
                print(f"获取财联社快讯失败: {data.get('message', '未知错误')}")
                return []
            
            # 提取快讯列表
            news_list = []
            items = data.get("data", {}).get("roll_data", [])
            
            for item in items:
                try:
                    news_id = str(item.get("id", ""))
                    content = item.get("content", "").strip()
                    
                    # 移除HTML标签
                    clean_content = re.sub(r'<[^>]+>', '', content)
                    
                    # 提取发布时间
                    pub_timestamp = item.get("ctime", 0)
                    pub_date = datetime.fromtimestamp(pub_timestamp).isoformat() if pub_timestamp else ""
                    
                    # 从内容中提取标题（前30个字符）
                    title = clean_content[:30] + ("..." if len(clean_content) > 30 else "")
                    
                    # 提取分类
                    category = item.get("category_cn", "快讯")
                    
                    # 提取标签
                    tags = []
                    for tag in item.get("tag", []):
                        if tag:
                            tags.append(tag)
                    
                    # 构建URL
                    article_url = f"{self.base_url}/telegraph/detail/{news_id}"
                    
                    # 构建快讯数据
                    news = {
                        "id": news_id,
                        "title": title,
                        "url": article_url,
                        "pubDate": pub_date,
                        "source": "财联社",
                        "category": category,
                        "summary": clean_content,
                        "content": content,
                        "tags": tags
                    }
                    
                    news_list.append(news)
                except Exception as e:
                    print(f"解析财联社快讯数据异常: {str(e)}")
                    continue
            
            return news_list
        
        except Exception as e:
            print(f"获取财联社快讯异常: {str(e)}")
            return []
    
    def get_flash_detail(self, news_id):
        """
        获取快讯详情
        
        Args:
            news_id (str): 快讯ID
            
        Returns:
            dict: 快讯详情
        """
        try:
            # 构建请求数据
            payload = {
                "id": news_id,
                "platform": "2",
                "version": "5.11.25"
            }
            
            # 添加随机延迟，避免请求过快
            time.sleep(random.uniform(1, 3))
            
            response = requests.post(
                self.article_api,
                headers=self.headers,
                json=payload,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取财联社快讯详情失败: HTTP {response.status_code}")
                return None
            
            data = response.json()
            if data.get("status") != "ok":
                print(f"获取财联社快讯详情失败: {data.get('message', '未知错误')}")
                return None
            
            # 提取详情数据
            article_data = data.get("data", {})
            
            # 提取内容
            content = article_data.get("content", "")
            
            # 移除HTML标签获取纯文本
            clean_content = re.sub(r'<[^>]+>', '', content)
            
            # 提取标题
            title = article_data.get("title", "").strip()
            if not title:
                # 快讯通常没有独立标题，用内容前30个字符作为标题
                title = clean_content[:30] + ("..." if len(clean_content) > 30 else "")
            
            # 提取发布时间
            pub_timestamp = article_data.get("publish_time", 0)
            if not pub_timestamp:
                pub_timestamp = article_data.get("ctime", 0)
                
            pub_date = datetime.fromtimestamp(pub_timestamp).isoformat() if pub_timestamp else ""
            
            # 提取分类
            category = article_data.get("category_cn", "快讯")
            
            # 提取标签
            tags = []
            for tag in article_data.get("tag", []):
                if tag:
                    tags.append(tag)
            
            # 构建快讯详情
            flash_detail = {
                "id": news_id,
                "title": title,
                "pubDate": pub_date,
                "source": "财联社",
                "category": category,
                "content": content,
                "summary": clean_content,
                "tags": tags
            }
            
            return flash_detail
        
        except Exception as e:
            print(f"获取财联社快讯详情异常: {str(e)}")
            return None
    
    def get_article_list(self, limit=20, page=1, type_id=1):
        """
        获取文章列表
        
        Args:
            limit (int): 获取数量
            page (int): 页码
            type_id (int): 文章类型，1为财经
            
        Returns:
            list: 文章列表
        """
        try:
            # 构建API URL
            url = f"{self.base_url}/nodeapi/content/list"
            
            # 构建请求数据
            payload = {
                "app": "CailianpressWeb",
                "os": "web",
                "rn": limit,
                "page": page,
                "type_id": type_id
            }
            
            response = requests.post(
                url,
                headers=self.headers,
                json=payload,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取财联社文章列表失败: HTTP {response.status_code}")
                return []
            
            data = response.json()
            if data.get("status") != "ok":
                print(f"获取财联社文章列表失败: {data.get('message', '未知错误')}")
                return []
            
            # 提取文章列表
            articles = []
            items = data.get("data", {}).get("roll_data", [])
            
            for item in items:
                try:
                    article_id = str(item.get("id", ""))
                    title = item.get("title", "").strip()
                    
                    # 提取摘要
                    summary = item.get("brief", "").strip()
                    if not summary:
                        summary = item.get("summary", "").strip()
                    
                    # 提取发布时间
                    pub_timestamp = item.get("publish_time", 0)
                    if not pub_timestamp:
                        pub_timestamp = item.get("ctime", 0)
                        
                    pub_date = datetime.fromtimestamp(pub_timestamp).isoformat() if pub_timestamp else ""
                    
                    # 提取作者
                    author = item.get("author", "")
                    if not author:
                        author = "财联社"
                    
                    # 提取分类
                    category = item.get("category_cn", "文章")
                    
                    # 提取封面图片
                    image_url = ""
                    image_info = item.get("image_info", {})
                    if image_info:
                        images = image_info.get("list", [])
                        if images:
                            image_url = images[0].get("image", "")
                    
                    # 构建URL
                    article_url = f"{self.base_url}/detail/{article_id}"
                    
                    # 构建文章数据
                    article = {
                        "id": article_id,
                        "title": title,
                        "url": article_url,
                        "pubDate": pub_date,
                        "source": "财联社",
                        "category": category,
                        "summary": summary,
                        "author": author,
                        "imageUrl": image_url
                    }
                    
                    articles.append(article)
                except Exception as e:
                    print(f"解析财联社文章数据异常: {str(e)}")
                    continue
            
            return articles
        
        except Exception as e:
            print(f"获取财联社文章列表异常: {str(e)}")
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
            # 构建请求数据
            payload = {
                "id": article_id,
                "platform": "2",
                "version": "5.11.25"
            }
            
            # 添加随机延迟，避免请求过快
            time.sleep(random.uniform(1, 3))
            
            response = requests.post(
                self.article_api,
                headers=self.headers,
                json=payload,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取财联社文章详情失败: HTTP {response.status_code}")
                return None
            
            data = response.json()
            if data.get("status") != "ok":
                print(f"获取财联社文章详情失败: {data.get('message', '未知错误')}")
                return None
            
            # 提取详情数据
            article_data = data.get("data", {})
            
            # 提取标题
            title = article_data.get("title", "").strip()
            
            # 提取内容
            content = article_data.get("content", "")
            
            # 提取摘要
            summary = article_data.get("brief", "").strip()
            if not summary:
                summary = article_data.get("summary", "").strip()
            
            # 如果仍然没有摘要，从内容中提取
            if not summary and content:
                clean_content = re.sub(r'<[^>]+>', '', content)
                summary = clean_content[:200] + ("..." if len(clean_content) > 200 else "")
            
            # 提取发布时间
            pub_timestamp = article_data.get("publish_time", 0)
            if not pub_timestamp:
                pub_timestamp = article_data.get("ctime", 0)
                
            pub_date = datetime.fromtimestamp(pub_timestamp).isoformat() if pub_timestamp else ""
            
            # 提取作者
            author = article_data.get("author", "")
            if not author:
                author = "财联社"
            
            # 提取分类
            category = article_data.get("category_cn", "文章")
            
            # 提取封面图片
            image_url = ""
            image_info = article_data.get("image_info", {})
            if image_info:
                images = image_info.get("list", [])
                if images:
                    image_url = images[0].get("image", "")
            
            # 提取标签
            tags = []
            for tag in article_data.get("tag", []):
                if tag:
                    tags.append(tag)
            
            # 构建文章详情
            article_detail = {
                "id": article_id,
                "title": title,
                "pubDate": pub_date,
                "author": author,
                "content": content,
                "summary": summary,
                "imageUrl": image_url,
                "category": category,
                "tags": tags,
                "source": "财联社"
            }
            
            return article_detail
        
        except Exception as e:
            print(f"获取财联社文章详情异常: {str(e)}")
            return None
