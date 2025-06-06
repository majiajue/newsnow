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
import logging
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import USER_AGENT, REQUEST_TIMEOUT
from utils.search_service import SearchService
from utils.enhanced_ai_service import EnhancedFinanceAnalyzer as FinanceAnalyzer
from db.sqlite_client import SQLiteClient

# 配置日志
logger = logging.getLogger(__name__)

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
        
        # 初始化服务
        self.search_service = SearchService()
        self.finance_analyzer = FinanceAnalyzer()
        self.db_client = SQLiteClient()
    
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
            # 使用HTML解析方式获取新闻列表
            url = f"{self.base_url}/news"
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取格隆汇文章列表失败: HTTP {response.status_code}")
                return []
            
            # 使用BeautifulSoup解析HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 提取文章列表
            articles = []
            article_elements = soup.select('.article-content')
            
            print(f"找到 {len(article_elements)} 个格隆汇新闻元素")
            
            for element in article_elements[:limit]:
                try:
                    # 提取文章信息
                    a_tag = element.select_one('.detail-right > a')
                    if not a_tag:
                        continue
                        
                    article_url = a_tag.get('href', '')
                    if not article_url:
                        continue
                        
                    # 提取文章ID
                    article_id = article_url.split('/')[-1] if '/' in article_url else article_url
                    
                    # 提取标题
                    title_tag = a_tag.select_one('h2')
                    title = title_tag.text.strip() if title_tag else ''
                    
                    # 提取时间信息
                    time_tag = element.select_one('.time > span:nth-child(3)')
                    relative_time = time_tag.text.strip() if time_tag else ''
                    
                    # 提取作者信息
                    info_tag = element.select_one('.time > span:nth-child(1)')
                    info = info_tag.text.strip() if info_tag else ''
                    
                    # 解析相对时间
                    pub_date = datetime.now().isoformat()
                    if relative_time:
                        try:
                            if '分钟前' in relative_time:
                                minutes = int(relative_time.replace('分钟前', '').strip())
                                pub_date = (datetime.now() - timedelta(minutes=minutes)).isoformat()
                            elif '小时前' in relative_time:
                                hours = int(relative_time.replace('小时前', '').strip())
                                pub_date = (datetime.now() - timedelta(hours=hours)).isoformat()
                            elif '天前' in relative_time:
                                days = int(relative_time.replace('天前', '').strip())
                                pub_date = (datetime.now() - timedelta(days=days)).isoformat()
                        except Exception as e:
                            print(f"解析格隆汇时间失败: {relative_time}, {str(e)}")
                    
                    # 构建完整URL
                    full_url = f"{self.base_url}{article_url}" if not article_url.startswith('http') else article_url
                    
                    # 构建文章数据
                    article = {
                        "id": article_id,
                        "title": title,
                        "summary": info,  # 使用info作为摘要
                        "url": full_url,  # 使用完整URL
                        "pubDate": pub_date,
                        "source": "Gelonghui",
                        "category": "财经",
                        "author": "格隆汇",
                        "imageUrl": ""  # 暂时没有图片URL
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
        logger.warning(f"!!!!!!!!!! [Gelonghui ENTRYPOINT TEST VIA LOGGER] Entering get_article_detail for ID: {article_id} !!!!!!!!!!!")
        try:
            # 构建文章详情URL - 支持多种格式
            possible_urls = [
                f"{self.base_url}/p/{article_id}",
                f"{self.base_url}/live/{article_id}",
                f"{self.base_url}/news/{article_id}",
                f"{self.base_url}/article/{article_id}"
            ]
            
            response = None
            url = None
            
            # 尝试不同的URL格式
            for test_url in possible_urls:
                try:
                    print(f"[Gelonghui Debug] Article ID: {article_id} - Trying URL: {test_url}")
                    test_response = requests.get(
                        test_url,
                        headers=self.headers,
                        timeout=REQUEST_TIMEOUT,
                        allow_redirects=True
                    )
                    
                    if test_response.status_code == 200:
                        response = test_response
                        url = test_url
                        print(f"[Gelonghui Debug] Article ID: {article_id} - Found working URL: {url}")
                        break
                    else:
                        print(f"[Gelonghui Debug] Article ID: {article_id} - URL failed with status {test_response.status_code}: {test_url}")
                        
                except Exception as e:
                    print(f"[Gelonghui Debug] Article ID: {article_id} - URL request failed: {test_url} - {e}")
                    continue
            
            if not response or response.status_code != 200:
                print(f"[Gelonghui Error] Article ID: {article_id} - All URL attempts failed")
                return None

            print(f"[Gelonghui Debug] Article ID: {article_id} - HTTP Status: {response.status_code}")
            
            # 使用BeautifulSoup解析HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 提取标题
            title_elem = soup.select_one('h1.article-title, .article-title, h1')
            title = title_elem.text.strip() if title_elem else ""
            
            # 提取内容
            content_elem = soup.select_one('.article-content, .content, .post-content')
            if content_elem:
                # 清理内容
                for script in content_elem(["script", "style"]):
                    script.decompose()
                content = content_elem.get_text(strip=True)
                html_content = str(content_elem)
            else:
                content = ""
                html_content = ""
            
            print(f"[Gelonghui Debug] Article ID: {article_id} - Extracted title: {title}")
            print(f"[Gelonghui Debug] Article ID: {article_id} - Content length: {len(content)} characters")
            
            # 提取发布时间
            pub_date = datetime.now()
            time_elem = soup.select_one('.publish-time, .time, time')
            if time_elem:
                time_text = time_elem.text.strip()
                try:
                    # 尝试解析时间
                    if '分钟前' in time_text:
                        minutes = int(time_text.replace('分钟前', '').strip())
                        pub_date = datetime.now() - timedelta(minutes=minutes)
                    elif '小时前' in time_text:
                        hours = int(time_text.replace('小时前', '').strip())
                        pub_date = datetime.now() - timedelta(hours=hours)
                    elif '天前' in time_text:
                        days = int(time_text.replace('天前', '').strip())
                        pub_date = datetime.now() - timedelta(days=days)
                    else:
                        # 尝试解析具体日期格式
                        pub_date = datetime.strptime(time_text, '%Y-%m-%d %H:%M:%S')
                except:
                    pub_date = datetime.now()
            
            print(f"[Gelonghui Debug] Article ID: {article_id} - Publish date: {pub_date.isoformat()}")
            
            # 提取文章中的第一张图片作为封面图
            image_url = ""
            img_elem = soup.select_one('img')
            if img_elem:
                image_url = img_elem.get("src", "")
            
            # 提取文章摘要
            summary = ""
            if content:
                summary = content[:200] + "..." if len(content) > 200 else content
            
            # 构建基础文章详情
            article_detail = {
                "id": article_id,
                "title": title,
                "content": html_content,
                "summary": summary,
                "url": url,
                "pubDate": pub_date.isoformat(),
                "source": "格隆汇",
                "category": "财经",
                "author": "格隆汇",
                "imageUrl": image_url
            }
            
            print(f"[Gelonghui Debug] Article ID: {article_id} - Starting search enhancement...")
            
            # 使用SearxNG进行搜索增强
            try:
                search_results = self.search_service.search_related_news(title)
                if search_results:
                    article_detail["search_results"] = search_results
                    print(f"[Gelonghui Debug] Article ID: {article_id} - Search enhancement completed with {len(search_results)} results.")
                else:
                    print(f"[Gelonghui Warn] Article ID: {article_id} - Search enhancement returned no results.")
            except Exception as e:
                print(f"[Gelonghui Error] Article ID: {article_id} - Search enhancement failed: {str(e)}")
                article_detail["search_results"] = []
            
            print(f"[Gelonghui Debug] Article ID: {article_id} - Starting AI analysis...")
            
            # 使用DeepSeek进行AI分析
            try:
                analysis_result = self.finance_analyzer.generate_comprehensive_analysis(
                    title=title,
                    content=content, 
                    search_results=article_detail.get("search_results", [])
                )
                if analysis_result:
                    article_detail.update(analysis_result)
                    print(f"[Gelonghui Debug] Article ID: {article_id} - AI analysis completed successfully.")
                else:
                    print(f"[Gelonghui Warn] Article ID: {article_id} - AI analysis returned no results.")
            except Exception as e:
                print(f"[Gelonghui Error] Article ID: {article_id} - AI analysis failed: {str(e)}")
            
            print(f"[Gelonghui Debug] Article ID: {article_id} - Starting database save...")
            
            # 保存到数据库
            try:
                save_result = self.db_client.save_article(article_detail)
                if save_result:
                    article_detail["processed_immediately"] = True
                    print(f"[Gelonghui Debug] Article ID: {article_id} - Successfully saved to database with immediate processing flag.")
                else:
                    article_detail["processed_immediately"] = False
                    print(f"[Gelonghui Warn] Article ID: {article_id} - Failed to save to database.")
            except Exception as e:
                print(f"[Gelonghui Error] Article ID: {article_id} - Database save failed: {str(e)}")
                article_detail["processed_immediately"] = False
            
            print(f"[Gelonghui Debug] Article ID: {article_id} - Processing completed successfully.")
            return article_detail
        
        except Exception as e:
            print(f"[Gelonghui Error] 获取格隆汇文章详情异常: {str(e)}")
            logger.error(f"获取格隆汇文章详情异常: {str(e)}")
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
