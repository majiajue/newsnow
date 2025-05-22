#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
改进版金十财经爬虫 - 使用API方式获取数据
"""

import json
import time
import random
import requests
from datetime import datetime
from urllib.parse import urlencode

class ImprovedJin10Crawler:
    """改进版金十财经爬虫"""
    
    def __init__(self):
        self.base_url = "https://www.jin10.com"
        self.flash_api = "https://flash-api.jin10.com/get_flash_list"
        self.article_api = "https://api.jin10.com/v1/articleList"
        self.detail_api = "https://api.jin10.com/v1/articleDetail"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Referer": "https://www.jin10.com/",
            "Origin": "https://www.jin10.com",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
        }
        # 添加一个简单的缓存机制
        self._cache = {}
        self._cache_time = {}
        self._cache_ttl = 300  # 缓存有效期5分钟
    
    def _get_with_cache(self, cache_key, fetch_func):
        """带缓存的获取数据"""
        current_time = time.time()
        if cache_key in self._cache and current_time - self._cache_time.get(cache_key, 0) < self._cache_ttl:
            return self._cache[cache_key]
        
        data = fetch_func()
        if data:
            self._cache[cache_key] = data
            self._cache_time[cache_key] = current_time
        return data
    
    def _fetch_api(self, url, params=None, headers=None):
        """请求API"""
        try:
            _headers = self.headers.copy()
            if headers:
                _headers.update(headers)
            
            response = requests.get(url, params=params, headers=_headers, timeout=10)
            if response.status_code != 200:
                print(f"API请求失败: {url}, 状态码: {response.status_code}")
                return None
            
            return response.json()
        except Exception as e:
            print(f"API请求异常: {url}, 错误: {str(e)}")
            return None
    
    def get_latest_flash(self, limit=20, channel_id="jin10"):
        """获取最新快讯"""
        def _fetch():
            params = {
                "max_id": 0,
                "channel_id": channel_id,
                "vip": 0,
                "count": limit,
                "timestamp": int(time.time())
            }
            data = self._fetch_api(self.flash_api, params)
            if not data or data.get("code") != 0:
                print(f"获取金十快讯失败: {data.get('message') if data else '未知错误'}")
                return []
            
            flash_list = data.get("data", {}).get("data", [])
            
            # 格式化结果
            results = []
            for item in flash_list:
                results.append({
                    "id": item.get("id", ""),
                    "title": item.get("content", "").strip(),
                    "content": item.get("content", "").strip(),
                    "url": f"{self.base_url}/flash/{item.get('id')}.html",
                    "pubDate": datetime.fromtimestamp(item.get("time", 0)).strftime("%Y-%m-%d %H:%M:%S"),
                    "timestamp": item.get("time", 0),
                    "important": item.get("important", 0) == 1,
                    "source": "金十财经"
                })
            return results
        
        cache_key = f"jin10_flash_{limit}_{channel_id}"
        return self._get_with_cache(cache_key, _fetch)
    
    def get_latest_articles(self, limit=20, page=1, cate="0"):
        """获取最新文章"""
        def _fetch():
            params = {
                "page": page,
                "cate": cate,
                "limit": limit,
                "timestamp": int(time.time())
            }
            data = self._fetch_api(self.article_api, params)
            if not data or data.get("code") != 0:
                print(f"获取金十文章列表失败: {data.get('message') if data else '未知错误'}")
                return []
            
            article_list = data.get("data", {}).get("list", [])
            
            # 格式化结果
            results = []
            for item in article_list:
                results.append({
                    "id": item.get("id", ""),
                    "title": item.get("title", "").strip(),
                    "summary": item.get("summary", "").strip(),
                    "url": f"{self.base_url}/news/{item.get('id')}.html",
                    "pubDate": item.get("display_time", ""),
                    "author": item.get("author", ""),
                    "image": item.get("image", ""),
                    "source": "金十财经"
                })
            return results
        
        cache_key = f"jin10_articles_{limit}_{page}_{cate}"
        return self._get_with_cache(cache_key, _fetch)
    
    def get_article_detail(self, article_id):
        """获取文章详情"""
        def _fetch():
            params = {
                "id": article_id,
                "timestamp": int(time.time())
            }
            data = self._fetch_api(self.detail_api, params)
            if not data or data.get("code") != 0:
                print(f"获取金十文章详情失败: {data.get('message') if data else '未知错误'}")
                return None
            
            article = data.get("data", {})
            if not article:
                return None
            
            # 格式化结果
            return {
                "id": article.get("id", ""),
                "title": article.get("title", "").strip(),
                "content": article.get("content", "").strip(),
                "html": article.get("html", ""),
                "pubDate": article.get("display_time", ""),
                "author": article.get("author", ""),
                "source": "金十财经",
                "url": f"{self.base_url}/news/{article_id}.html",
                "image": article.get("image", ""),
                "tags": article.get("tags", [])
            }
        
        cache_key = f"jin10_detail_{article_id}"
        return self._get_with_cache(cache_key, _fetch)

# 测试代码
if __name__ == "__main__":
    crawler = ImprovedJin10Crawler()
    
    # 测试获取快讯
    print("获取最新快讯:")
    flash_news = crawler.get_latest_flash(limit=5)
    for i, news in enumerate(flash_news):
        print(f"{i+1}. [{news['pubDate']}] {news['title']}")
    
    print("\n获取最新文章:")
    articles = crawler.get_latest_articles(limit=5)
    for i, article in enumerate(articles):
        print(f"{i+1}. [{article['pubDate']}] {article['title']}")
    
    if articles:
        print("\n获取文章详情:")
        article_id = articles[0]["id"]
        detail = crawler.get_article_detail(article_id)
        if detail:
            print(f"标题: {detail['title']}")
            print(f"作者: {detail['author']}")
            print(f"发布时间: {detail['pubDate']}")
            print(f"摘要: {detail.get('content', '')[:100]}...")
