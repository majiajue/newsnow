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
import logging
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin
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

class FastbullCrawler:
    """FastBull爬虫类"""
    
    def __init__(self):
        """初始化爬虫"""
        self.headers = {
            "User-Agent": USER_AGENT,
            "Referer": "https://www.fastbull.com/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
        }
        self.base_url = "https://www.fastbull.com"
        self.news_url = "https://www.fastbull.com/cn/news"
        self.express_url = "https://www.fastbull.com/cn/express-news"
        
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
            # 构建URL
            url = self.news_url
            
            print(f"开始获取FastBull新闻列表: {url}")
            
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
            main_elements = soup.select('.trending_type')
            
            print(f"找到 {len(main_elements)} 个FastBull新闻元素")
            
            all_news = []
            
            for element in main_elements:
                try:
                    url_path = element.get('href')
                    title = element.select_one('.title').text.strip() if element.select_one('.title') else ""
                    date_str = element.select_one('[data-date]').get('data-date') if element.select_one('[data-date]') else ""
                    
                    if url_path and title and date_str:
                        # 解析时间戳
                        try:
                            # 如果时间戳是毫秒级别，需要将其转换为秒级别
                            timestamp = int(date_str)
                            if timestamp > 253402300799:  # 时间戳过大，可能是毫秒级别
                                pub_date = datetime.now()  # 使用当前时间作为备选
                            else:
                                pub_date = datetime.fromtimestamp(timestamp)
                        except Exception as e:
                            print(f"时间戳解析错误: {date_str}, {str(e)}")
                            pub_date = datetime.now()  # 使用当前时间作为备选
                        
                        all_news.append({
                            "id": url_path,
                            "title": title,
                            "url": f"{self.base_url}{url_path}",
                            "pubDate": pub_date.isoformat(),
                            "source": "FastBull",
                            "category": "财经",
                            "author": "FastBull"
                        })
                except Exception as e:
                    print(f"解析FastBull文章数据异常: {str(e)}")
                    continue
            
            # 如果没有获取到新闻，尝试获取快讯
            if len(all_news) == 0:
                print("没有获取到FastBull新闻，尝试获取快讯")
                return self.get_express_news(page, limit)
            
            # 分页处理
            start_index = (page - 1) * limit
            end_index = start_index + limit
            paginated_news = all_news[start_index:end_index]
            
            print(f"成功获取到 {len(paginated_news)} 篇FastBull文章")
            
            return paginated_news
        except Exception as e:
            print(f"获取FastBull文章列表异常: {str(e)}")
            return []
    
    def get_express_news(self, page=1, limit=20):
        """
        获取FastBull快讯列表
        
        Args:
            page (int): 页码
            limit (int): 每页数量
            
        Returns:
            list: 快讯列表
        """
        try:
            url = self.express_url
            
            print(f"开始获取FastBull快讯列表: {url}")
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取FastBull快讯列表失败: HTTP {response.status_code}")
                return []
            
            # 解析HTML
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 提取快讯列表
            news_items = soup.select('.news-list')
            
            print(f"找到 {len(news_items)} 个FastBull快讯元素")
            
            all_news = []
            
            for item in news_items:
                try:
                    title_elem = item.select_one('.title_name')
                    url_path = title_elem.get('href') if title_elem else None
                    title_text = title_elem.text.strip() if title_elem else ""
                    
                    # 提取标题中的【】内容，如果没有则使用完整标题
                    title_match = re.search(r'【(.+)】', title_text)
                    title = title_match.group(1) if title_match else title_text
                    
                    date_str = item.get('data-date')
                    
                    if url_path and title and date_str:
                        # 解析时间戳
                        try:
                            # 如果时间戳是毫秒级别，需要将其转换为秒级别
                            timestamp = int(date_str)
                            if timestamp > 253402300799:  # 时间戳过大，可能是毫秒级别
                                pub_date = datetime.now()  # 使用当前时间作为备选
                            else:
                                pub_date = datetime.fromtimestamp(timestamp)
                        except Exception as e:
                            print(f"时间戳解析错误: {date_str}, {str(e)}")
                            pub_date = datetime.now()  # 使用当前时间作为备选
                        
                        all_news.append({
                            "id": url_path,
                            "title": title if len(title) >= 4 else title_text,  # 如果标题太短，使用完整标题
                            "url": f"{self.base_url}{url_path}",
                            "pubDate": pub_date.isoformat(),
                            "source": "FastBull",
                            "category": "财经快讯",
                            "author": "FastBull"
                        })
                except Exception as e:
                    print(f"解析FastBull快讯数据异常: {str(e)}")
                    continue
            
            # 分页处理
            start_index = (page - 1) * limit
            end_index = start_index + limit
            paginated_news = all_news[start_index:end_index]
            
            print(f"成功获取到 {len(paginated_news)} 条FastBull快讯")
            
            return paginated_news
        except Exception as e:
            print(f"获取FastBull快讯列表异常: {str(e)}")
            return []
    
    def get_article_detail(self, article_id_or_url):
        """
        获取文章详情
        
        Args:
            article_id_or_url (str): 文章ID或完整URL
            
        Returns:
            dict: 文章详情
        """
        logger.warning(f"!!!!!!!!!! [FastBull ENTRYPOINT TEST VIA LOGGER] Entering get_article_detail for ID: {article_id_or_url} !!!!!!!!!!!")
        try:
            # 构建URL
            url = article_id_or_url
            if not url.startswith("http"):
                url = f"{self.base_url}{url}"
            
            print(f"[FastBull Debug] Article ID: {article_id_or_url} - Starting to fetch article detail from: {url}")
            
            # 添加随机延迟，避免请求过快
            time.sleep(random.uniform(1, 3))
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            print(f"[FastBull Debug] Article ID: {article_id_or_url} - HTTP Status: {response.status_code}")
            if response.status_code != 200:
                print(f"[FastBull Error] 获取FastBull文章详情失败: HTTP {response.status_code} for URL: {url}")
                return None
            
            print(f"[FastBull Debug] Article ID: {article_id_or_url} - Successfully fetched HTML content.")
            
            # 解析HTML
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 尝试获取新闻详情
            title = soup.select_one('.news-detail-title').text.strip() if soup.select_one('.news-detail-title') else ""
            content = soup.select_one('.news-detail-content').get_text() if soup.select_one('.news-detail-content') else ""
            html_content = str(soup.select_one('.news-detail-content')) if soup.select_one('.news-detail-content') else ""
            pub_date_text = soup.select_one('.news-detail-time').text.strip() if soup.select_one('.news-detail-time') else ""
            author = soup.select_one('.news-detail-source').text.strip() if soup.select_one('.news-detail-source') else "FastBull"
            
            # 如果没有找到新闻详情，尝试获取快讯详情
            if not title:
                print(f"[FastBull Debug] Article ID: {article_id_or_url} - No news detail found, trying express detail...")
                title = soup.select_one('.express-detail-title').text.strip() if soup.select_one('.express-detail-title') else ""
                content = soup.select_one('.express-detail-content').get_text() if soup.select_one('.express-detail-content') else ""
                html_content = str(soup.select_one('.express-detail-content')) if soup.select_one('.express-detail-content') else ""
                pub_date_text = soup.select_one('.express-detail-time').text.strip() if soup.select_one('.express-detail-time') else ""
                author = soup.select_one('.express-detail-source').text.strip() if soup.select_one('.express-detail-source') else "FastBull"
            
            print(f"[FastBull Debug] Article ID: {article_id_or_url} - Extracted title: {title}")
            print(f"[FastBull Debug] Article ID: {article_id_or_url} - Content length: {len(content)} characters")
            
            # 尝试解析发布时间
            pub_date = datetime.now()
            try:
                # 先尝试直接解析
                parsed_date = datetime.fromisoformat(pub_date_text.replace("Z", "+00:00"))
                
                # 检查日期是否有效
                if parsed_date.year > 2000:
                    pub_date = parsed_date
                else:
                    # 如果直接解析失败，尝试其他格式
                    print(f"[FastBull Warn] Article ID: {article_id_or_url} - 直接解析文章时间失败: {pub_date_text}，使用当前时间")
            except Exception as e:
                print(f"[FastBull Warn] Article ID: {article_id_or_url} - 解析文章时间失败: {pub_date_text}，使用当前时间: {str(e)}")
            
            print(f"[FastBull Debug] Article ID: {article_id_or_url} - Publish date: {pub_date.isoformat()}")
            
            # 提取文章中的第一张图片作为封面图
            image_url = ""
            img_elem = soup.select_one('img')
            if img_elem:
                image_url = img_elem.get("src", "")
            
            # 提取文章摘要
            summary = ""
            first_p = soup.select_one('p')
            if first_p:
                summary = first_p.text.strip()
            else:
                summary = content[:200] + "..." if len(content) > 200 else content
            
            # 构建基础文章详情
            article_detail = {
                "id": article_id_or_url,
                "title": title,
                "content": html_content,
                "summary": summary,
                "url": url,
                "pubDate": pub_date.isoformat(),
                "source": "FastBull",
                "category": "财经快讯" if "express" in url else "财经",
                "author": author,
                "imageUrl": image_url
            }
            
            print(f"[FastBull Debug] Article ID: {article_id_or_url} - Starting search enhancement...")
            
            # 使用SearxNG进行搜索增强
            try:
                search_results = self.search_service.search_related_news(title)
                if search_results:
                    article_detail["search_results"] = search_results
                    print(f"[FastBull Debug] Article ID: {article_id_or_url} - Search enhancement completed with {len(search_results)} results.")
                else:
                    print(f"[FastBull Warn] Article ID: {article_id_or_url} - Search enhancement returned no results.")
            except Exception as e:
                print(f"[FastBull Error] Article ID: {article_id_or_url} - Search enhancement failed: {str(e)}")
                article_detail["search_results"] = []
            
            print(f"[FastBull Debug] Article ID: {article_id_or_url} - Starting AI analysis...")
            
            # 使用DeepSeek进行AI分析
            try:
                analysis_result = self.finance_analyzer.analyze_article(article_detail)
                if analysis_result:
                    article_detail.update(analysis_result)
                    print(f"[FastBull Debug] Article ID: {article_id_or_url} - AI analysis completed successfully.")
                else:
                    print(f"[FastBull Warn] Article ID: {article_id_or_url} - AI analysis returned no results.")
            except Exception as e:
                print(f"[FastBull Error] Article ID: {article_id_or_url} - AI analysis failed: {str(e)}")
            
            print(f"[FastBull Debug] Article ID: {article_id_or_url} - Starting database save...")
            
            # 保存到数据库
            try:
                save_result = self.db_client.save_article(article_detail)
                if save_result:
                    article_detail["processed_immediately"] = True
                    print(f"[FastBull Debug] Article ID: {article_id_or_url} - Successfully saved to database with immediate processing flag.")
                else:
                    article_detail["processed_immediately"] = False
                    print(f"[FastBull Warn] Article ID: {article_id_or_url} - Failed to save to database.")
            except Exception as e:
                print(f"[FastBull Error] Article ID: {article_id_or_url} - Database save failed: {str(e)}")
                article_detail["processed_immediately"] = False
            
            print(f"[FastBull Debug] Article ID: {article_id_or_url} - Processing completed successfully.")
            return article_detail
            
        except Exception as e:
            print(f"[FastBull Error] 获取FastBull文章详情异常: {str(e)}")
            logger.error(f"获取FastBull文章详情异常: {str(e)}")
            return None
