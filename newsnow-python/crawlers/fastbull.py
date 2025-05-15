#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
FastBull爬虫 - 获取FastBull的新闻文章
"""

import re
import json
import time
import random
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin
from ..config.settings import USER_AGENT, REQUEST_TIMEOUT

class FastbullCrawler:
    """FastBull爬虫类"""
    
    def __init__(self):
        """初始化爬虫"""
        self.headers = {
            "User-Agent": USER_AGENT,
            "Referer": "https://bull.news/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
        }
        self.base_url = "https://bull.news"
        self.news_url = "https://bull.news/news"
        self.tag_url = "https://bull.news/tag"
    
    def get_latest_articles(self, page=1, limit=20):
        """
        获取最新文章
        
        Args:
            page (int): 页码
            limit (int): 每页数量（实际上网站可能不支持自定义）
            
        Returns:
            list: 文章列表
        """
        try:
            # 构建URL
            url = f"{self.news_url}"
            if page > 1:
                url = f"{url}/page/{page}"
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取FastBull文章列表失败: HTTP {response.status_code}")
                return []
            
            # 解析HTML
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 提取文章列表
            articles = []
            article_items = soup.select("div.post-list article.post-item")
            
            for item in article_items[:limit]:  # 限制数量
                try:
                    # 获取链接和ID
                    link_elem = item.select_one("h2.post-title a")
                    if not link_elem:
                        continue
                    
                    article_url = link_elem.get("href", "")
                    title = link_elem.text.strip()
                    
                    # 从URL中提取ID
                    article_id = None
                    match = re.search(r"/(\d+)\.html$", article_url)
                    if match:
                        article_id = match.group(1)
                    else:
                        # 如果没有提取到ID，使用URL的一部分作为ID
                        article_id = article_url.split("/")[-1].replace(".html", "")
                    
                    # 获取摘要
                    summary_elem = item.select_one("div.post-excerpt")
                    summary = summary_elem.text.strip() if summary_elem else ""
                    
                    # 获取发布时间
                    date_elem = item.select_one("span.item-post-time")
                    pub_date = date_elem.text.strip() if date_elem else ""
                    
                    # 获取作者
                    author_elem = item.select_one("span.item-post-author")
                    author = author_elem.text.strip() if author_elem else "FastBull"
                    
                    # 获取封面图片
                    img_elem = item.select_one("div.item-thumb img")
                    image_url = img_elem.get("src", "") if img_elem else ""
                    
                    # 确保URL是完整的
                    if article_url and not article_url.startswith("http"):
                        article_url = urljoin(self.base_url, article_url)
                    
                    if image_url and not image_url.startswith("http"):
                        image_url = urljoin(self.base_url, image_url)
                    
                    # 构建文章数据
                    article = {
                        "id": article_id,
                        "title": title,
                        "url": article_url,
                        "pubDate": pub_date,
                        "source": "FastBull",
                        "category": "文章",
                        "summary": summary,
                        "author": author,
                        "imageUrl": image_url
                    }
                    
                    articles.append(article)
                except Exception as e:
                    print(f"解析FastBull文章数据异常: {str(e)}")
                    continue
            
            return articles
        
        except Exception as e:
            print(f"获取FastBull文章列表异常: {str(e)}")
            return []
    
    def get_article_detail(self, article_id_or_url):
        """
        获取文章详情
        
        Args:
            article_id_or_url (str): 文章ID或完整URL
            
        Returns:
            dict: 文章详情
        """
        try:
            # 构建URL
            url = article_id_or_url
            if not url.startswith("http"):
                # 如果是ID，构建URL
                if url.isdigit():
                    url = f"{self.base_url}/{url}.html"
                else:
                    url = f"{self.base_url}/{url}"
            
            # 添加随机延迟，避免请求过快
            time.sleep(random.uniform(1, 3))
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取FastBull文章详情失败: HTTP {response.status_code}")
                return None
            
            # 解析HTML
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 提取文章ID
            article_id = article_id_or_url
            if article_id.startswith("http"):
                # 从URL中提取ID
                match = re.search(r"/(\d+)\.html$", article_id)
                if match:
                    article_id = match.group(1)
                else:
                    # 使用URL的一部分作为ID
                    article_id = article_id.split("/")[-1].replace(".html", "")
            
            # 提取标题
            title_elem = soup.select_one("div.post-head h1.post-title")
            title = title_elem.text.strip() if title_elem else ""
            
            # 提取发布时间
            date_elem = soup.select_one("div.post-head span.item-post-time")
            pub_date = date_elem.text.strip() if date_elem else ""
            
            # 提取作者
            author_elem = soup.select_one("div.post-head span.item-post-author")
            author = author_elem.text.strip() if author_elem else "FastBull"
            
            # 提取内容
            content_elem = soup.select_one("div.post-content")
            if content_elem:
                # 移除不需要的元素
                for unwanted in content_elem.select("div.wp-block-buttons, div.sharedaddy, div#jp-post-flair"):
                    unwanted.decompose()
                
                content = str(content_elem)
            else:
                content = ""
            
            # 提取摘要
            summary_elem = soup.select_one("div.post-excerpt")
            summary = summary_elem.text.strip() if summary_elem else ""
            
            # 如果没有摘要，从内容中提取
            if not summary and content:
                clean_content = BeautifulSoup(content, "html.parser").get_text()
                summary = clean_content[:200] + ("..." if len(clean_content) > 200 else "")
            
            # 提取封面图片
            image_url = ""
            img_elem = soup.select_one("div.single-header-cover img")
            if img_elem:
                image_url = img_elem.get("src", "")
            
            if not image_url:
                # 尝试从内容的第一张图片获取
                content_img = soup.select_one("div.post-content img")
                if content_img:
                    image_url = content_img.get("src", "")
            
            # 提取标签
            tags = []
            tag_elems = soup.select("div.post-tags a")
            for tag_elem in tag_elems:
                tag = tag_elem.text.strip()
                if tag:
                    tags.append(tag)
            
            # 确保封面图URL是完整的
            if image_url and not image_url.startswith("http"):
                image_url = urljoin(self.base_url, image_url)
            
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
                "source": "FastBull"
            }
            
            return article_detail
        
        except Exception as e:
            print(f"获取FastBull文章详情异常: {str(e)}")
            return None
    
    def get_articles_by_tag(self, tag, page=1, limit=20):
        """
        按标签获取文章
        
        Args:
            tag (str): 标签名称
            page (int): 页码
            limit (int): 每页数量
            
        Returns:
            list: 文章列表
        """
        try:
            # 构建URL
            url = f"{self.tag_url}/{tag}"
            if page > 1:
                url = f"{url}/page/{page}"
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取FastBull标签文章失败: HTTP {response.status_code}")
                return []
            
            # 解析HTML
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 提取文章列表
            articles = []
            article_items = soup.select("div.post-list article.post-item")
            
            for item in article_items[:limit]:  # 限制数量
                try:
                    # 获取链接和ID
                    link_elem = item.select_one("h2.post-title a")
                    if not link_elem:
                        continue
                    
                    article_url = link_elem.get("href", "")
                    title = link_elem.text.strip()
                    
                    # 从URL中提取ID
                    article_id = None
                    match = re.search(r"/(\d+)\.html$", article_url)
                    if match:
                        article_id = match.group(1)
                    else:
                        # 如果没有提取到ID，使用URL的一部分作为ID
                        article_id = article_url.split("/")[-1].replace(".html", "")
                    
                    # 获取摘要
                    summary_elem = item.select_one("div.post-excerpt")
                    summary = summary_elem.text.strip() if summary_elem else ""
                    
                    # 获取发布时间
                    date_elem = item.select_one("span.item-post-time")
                    pub_date = date_elem.text.strip() if date_elem else ""
                    
                    # 获取作者
                    author_elem = item.select_one("span.item-post-author")
                    author = author_elem.text.strip() if author_elem else "FastBull"
                    
                    # 获取封面图片
                    img_elem = item.select_one("div.item-thumb img")
                    image_url = img_elem.get("src", "") if img_elem else ""
                    
                    # 确保URL是完整的
                    if article_url and not article_url.startswith("http"):
                        article_url = urljoin(self.base_url, article_url)
                    
                    if image_url and not image_url.startswith("http"):
                        image_url = urljoin(self.base_url, image_url)
                    
                    # 构建文章数据
                    article = {
                        "id": article_id,
                        "title": title,
                        "url": article_url,
                        "pubDate": pub_date,
                        "source": "FastBull",
                        "category": "文章",
                        "summary": summary,
                        "author": author,
                        "imageUrl": image_url,
                        "tags": [tag]  # 添加当前标签
                    }
                    
                    articles.append(article)
                except Exception as e:
                    print(f"解析FastBull标签文章数据异常: {str(e)}")
                    continue
            
            return articles
        
        except Exception as e:
            print(f"获取FastBull标签文章异常: {str(e)}")
            return []
