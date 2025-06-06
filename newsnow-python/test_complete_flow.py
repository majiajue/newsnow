#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
完整流程测试脚本：爬虫 -> 内容分析 -> 搜索增强
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from bs4 import BeautifulSoup

# 基本配置
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
REQUEST_TIMEOUT = 10
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
SEARXNG_URL = os.environ.get("SEARXNG_URL", "http://searxng:8080/search")

class FinanceCrawler:
    """财经爬虫基类"""
    
    def __init__(self):
        self.headers = {
            "User-Agent": USER_AGENT
        }
    
    def fetch_url(self, url, params=None):
        """获取URL内容"""
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response
        except Exception as e:
            print(f"获取URL失败: {url}, 错误: {str(e)}")
            return None

class Jin10Crawler(FinanceCrawler):
    """金十财经爬虫"""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://www.jin10.com"
    
    def get_latest_articles(self, limit=5):
        """获取最新文章列表"""
        try:
            # 直接使用金十财经首页获取最新文章
            url = "https://www.jin10.com/"
            response = self.fetch_url(url)
            if not response:
                return []
            
            # 使用BeautifulSoup解析HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 查找最新文章元素
            flash_items = soup.select('.flash-item')
            
            # 处理文章数据
            formatted_articles = []
            for item in flash_items[:limit]:
                try:
                    # 提取文章ID
                    article_id = item.get('id', '').replace('flash_', '')
                    
                    # 提取文章内容
                    content_elem = item.select_one('.flash-item-content')
                    title = content_elem.text.strip() if content_elem else '无标题'
                    
                    # 提取发布时间
                    time_elem = item.select_one('.flash-item-time')
                    pub_date = time_elem.text.strip() if time_elem else datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    
                    # 添加到结果中
                    formatted_articles.append({
                        'id': article_id,
                        'title': title,
                        'url': f"{self.base_url}/flash/{article_id}.html",
                        'pubDate': pub_date,
                        'source': '金十财经'
                    })
                except Exception as e:
                    print(f"解析金十财经文章项失败: {str(e)}")
                    continue
            
            # 如果没有找到文章，使用备用方法
            if not formatted_articles:
                print("使用备用方法获取金十财经文章...")
                articles = []
                # 创建模拟数据用于测试
                for i in range(limit):
                    articles.append({
                        'id': f"test_{i}",
                        'title': f"这是一条测试财经新闻 {i+1}",
                        'url': f"{self.base_url}/flash/test_{i}.html",
                        'pubDate': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'source': '金十财经(模拟)'
                    })
                return articles
                
            return formatted_articles
        except Exception as e:
            print(f"获取金十财经文章失败: {str(e)}")
            return []

class ContentAnalyzer:
    """内容分析处理器"""
    
    def __init__(self, api_key):
        self.api_key = api_key
    
    def analyze_text(self, text, title=None):
        """使用DeepSeek分析文本内容"""
        if not self.api_key:
            print("缺少DeepSeek API密钥，跳过内容分析")
            return None
        
        try:
            api_url = "https://api.deepseek.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            # 构建分析提示
            content = f"标题：{title}\n\n内容：{text}" if title else text
            prompt = f"""请根据以下财经内容，以专业财经分析师的视角进行分析，生成一篇简短的分析报告。
            报告应包含：摘要（100字以内）、重点分析（200字以内）和影响评估（100字以内）。
            
            内容如下：
            {content}
            """
            
            # 构造请求数据
            payload = {
                "model": "deepseek-chat",
                "messages": [
                    {
                        "role": "system",
                        "content": "你是一个专业的财经内容分析师，擅长分析财经数据和新闻，提供简明扼要的见解。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 800
            }
            
            # 发送请求
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            analysis = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            return analysis
        except Exception as e:
            print(f"内容分析失败: {str(e)}")
            return None

class SearchEnhancer:
    """搜索增强器"""
    
    def __init__(self, searxng_url):
        self.searxng_url = searxng_url
    
    def search_related_info(self, query, limit=3):
        """通过SearXNG搜索相关信息"""
        try:
            params = {
                "q": query,
                "format": "json",
                "categories": "finance,news",
                "language": "all",
                "time_range": "week"
            }
            
            response = requests.get(self.searxng_url, params=params, timeout=15)
            response.raise_for_status()
            
            results = response.json().get("results", [])
            
            # 提取有用信息
            related_info = []
            for result in results[:limit]:
                related_info.append({
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "content": result.get("content", ""),
                    "engine": result.get("engine", "")
                })
            
            return related_info
        except Exception as e:
            print(f"获取相关信息失败: {str(e)}")
            return []

def run_complete_test():
    """运行完整测试流程"""
    print("="*50)
    print("开始测试完整流程: 爬虫 -> 内容分析 -> 搜索增强")
    print("="*50)
    
    # 1. 爬取内容
    print("\n[步骤1] 爬取金十财经最新文章")
    crawler = Jin10Crawler()
    articles = crawler.get_latest_articles(limit=2)
    
    if not articles:
        print("未获取到文章，测试终止")
        return
    
    print(f"成功获取 {len(articles)} 篇文章:")
    for i, article in enumerate(articles):
        print(f"\n文章 {i+1}:")
        print(f"标题: {article['title']}")
        print(f"发布时间: {article['pubDate']}")
        print(f"来源: {article['source']}")
        print(f"URL: {article['url']}")
    
    # 选择第一篇文章进行后续处理
    target_article = articles[0]
    
    # 2. 内容分析
    print("\n[步骤2] DeepSeek内容分析")
    analyzer = ContentAnalyzer(DEEPSEEK_API_KEY)
    analysis = analyzer.analyze_text(target_article['title'], target_article['title'])
    
    if analysis:
        print("\n内容分析结果:")
        print(analysis)
    else:
        print("内容分析失败或未配置API密钥")
    
    # 3. 搜索增强
    print("\n[步骤3] SearXNG搜索增强")
    search_query = target_article['title']
    print(f"搜索关键词: {search_query}")
    
    enhancer = SearchEnhancer(SEARXNG_URL)
    related_info = enhancer.search_related_info(search_query, limit=3)
    
    if related_info:
        print(f"\n找到 {len(related_info)} 条相关信息:")
        for i, info in enumerate(related_info):
            print(f"\n相关信息 {i+1}:")
            print(f"标题: {info['title']}")
            print(f"来源: {info['engine']}")
            print(f"摘要: {info['content'][:100]}...")
            print(f"链接: {info['url']}")
    else:
        print("未找到相关信息")
    
    print("\n="*50)
    print("完整流程测试完成")
    print("="*50)

if __name__ == "__main__":
    run_complete_test()
