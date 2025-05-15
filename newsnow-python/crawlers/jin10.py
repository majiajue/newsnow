#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
金十数据爬虫 - 获取金十数据的新闻文章
"""

import re
import json
import time
import random
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from ..config.settings import USER_AGENT, REQUEST_TIMEOUT

class Jin10Crawler:
    """金十数据爬虫类"""
    
    def __init__(self):
        """初始化爬虫"""
        self.headers = {
            "User-Agent": USER_AGENT,
            "Referer": "https://www.jin10.com/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
        }
        self.base_url = "https://www.jin10.com"
        self.flash_api = "https://flash-api.jin10.com/get_flash_list"
        self.article_api = "https://www.jin10.com/details/article/{}"
    
    def get_latest_news(self, limit=20):
        """
        获取最新快讯
        
        Args:
            limit (int): 获取数量
            
        Returns:
            list: 快讯列表
        """
        try:
            params = {
                "channel": "-1",
                "vxiats": int(time.time()),
                "max_time": "",
                "limit": limit
            }
            
            response = requests.get(
                self.flash_api,
                params=params,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取金十快讯失败: HTTP {response.status_code}")
                return []
            
            data = response.json()
            
            # 格式化快讯数据
            news_list = []
            for item in data.get("data", []):
                # 提取必要字段
                news_id = item.get("id", "")
                title = item.get("content", "").strip()
                timestamp = item.get("time", 0)
                pub_date = datetime.fromtimestamp(timestamp).isoformat()
                
                # 构建文章URL
                url = f"{self.base_url}/flash/{news_id}"
                
                # 构建快讯数据
                news = {
                    "id": news_id,
                    "title": title,
                    "url": url,
                    "pubDate": pub_date,
                    "source": "金十数据",
                    "category": "快讯",
                    "summary": title,  # 快讯通常标题即是内容
                }
                
                news_list.append(news)
            
            return news_list
        
        except Exception as e:
            print(f"获取金十快讯异常: {str(e)}")
            return []
    
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
            # 文章列表页URL
            url = f"{self.base_url}/catalogue/index?type=3&page={page}&limit={limit}"
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取金十文章列表失败: HTTP {response.status_code}")
                return []
            
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 格式化文章数据
            articles = []
            for article_div in soup.select("div.jin-article-catalog-item"):
                try:
                    # 提取文章ID和链接
                    article_link = article_div.select_one("a.article-title")
                    if not article_link:
                        continue
                    
                    article_url = article_link.get("href", "")
                    article_id = re.search(r"/(\d+)", article_url)
                    if not article_id:
                        continue
                    article_id = article_id.group(1)
                    
                    # 提取标题
                    title = article_link.text.strip()
                    
                    # 提取发布时间
                    pub_date_elem = article_div.select_one("span.time")
                    pub_date = pub_date_elem.text.strip() if pub_date_elem else ""
                    
                    # 提取摘要
                    summary_elem = article_div.select_one("div.item-content")
                    summary = summary_elem.text.strip() if summary_elem else ""
                    
                    # 构建完整URL
                    full_url = f"{self.base_url}{article_url}" if article_url.startswith("/") else article_url
                    
                    # 构建文章数据
                    article = {
                        "id": article_id,
                        "title": title,
                        "url": full_url,
                        "pubDate": pub_date,
                        "source": "金十数据",
                        "category": "文章",
                        "summary": summary
                    }
                    
                    articles.append(article)
                except Exception as e:
                    print(f"解析金十文章异常: {str(e)}")
                    continue
            
            return articles
        
        except Exception as e:
            print(f"获取金十文章列表异常: {str(e)}")
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
            url = self.article_api.format(article_id)
            
            # 添加随机延迟，避免请求过快
            time.sleep(random.uniform(1, 3))
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取金十文章详情失败: HTTP {response.status_code}")
                return None
            
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 提取文章标题
            title_elem = soup.select_one("h1.article-title")
            title = title_elem.text.strip() if title_elem else ""
            
            # 提取发布时间
            pub_date_elem = soup.select_one("span.publish-time")
            pub_date = pub_date_elem.text.strip() if pub_date_elem else ""
            
            # 提取作者
            author_elem = soup.select_one("span.author")
            author = author_elem.text.strip() if author_elem else "金十数据"
            
            # 提取文章内容
            content_elem = soup.select_one("div.jin-article")
            
            # 如果是快讯类型，可能没有详细内容区域
            if not content_elem:
                # 尝试获取快讯内容
                flash_content = soup.select_one("div.flash-detail-content")
                if flash_content:
                    content = str(flash_content)
                else:
                    # 如果都没找到，使用标题作为内容
                    content = f"<p>{title}</p>"
            else:
                content = str(content_elem)
            
            # 提取图片URL
            img_elem = soup.select_one("div.jin-article img")
            image_url = img_elem.get("src", "") if img_elem else ""
            
            # 提取标签
            tags = []
            tags_elems = soup.select("div.article-tag-list span.tag")
            for tag_elem in tags_elems:
                tag = tag_elem.text.strip()
                if tag:
                    tags.append(tag)
            
            # 构建文章详情
            article_detail = {
                "id": article_id,
                "title": title,
                "pubDate": pub_date,
                "author": author,
                "content": content,
                "imageUrl": image_url,
                "tags": tags,
                "source": "金十数据"
            }
            
            return article_detail
        
        except Exception as e:
            print(f"获取金十文章详情异常: {str(e)}")
            return None
