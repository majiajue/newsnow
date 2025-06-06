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
import traceback # Added for detailed exception logging
import logging
logger = logging.getLogger(__name__)
# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import USER_AGENT, REQUEST_TIMEOUT, MAX_SEARCH_RESULTS
from utils.search_service import SearchService
from utils.enhanced_ai_service import EnhancedFinanceAnalyzer as FinanceAnalyzer
from db.sqlite_client import SQLiteClient

class Jin10Crawler:
    """金十数据爬虫类"""
    
    def __init__(self):
        """初始化爬虫"""
        self.headers = {
            "User-Agent": USER_AGENT,
            "Referer": "https://www.jin10.com/",
            "Accept": "*/*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
        }
        self.base_url = "https://www.jin10.com"
        self.flash_url = "https://flash.jin10.com"
        self.js_api = "https://www.jin10.com/flash_newest.js"
        self.search_service = SearchService()
        self.finance_analyzer = FinanceAnalyzer(api_key=os.getenv('DEEPSEEK_API_KEY'))
        self.db_client = SQLiteClient()
        self.supports_immediate_processing = True
    
    def get_latest_news(self, page=1, limit=20):
        """
        获取最新快讯
        
        Args:
            limit (int): 获取数量
            
        Returns:
            list: 快讯列表
        """
        try:
            # 使用时间戳确保获取最新数据
            timestamp = int(time.time() * 1000)
            url = f"{self.js_api}?t={timestamp}"
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"获取金十快讯失败: HTTP {response.status_code}")
                return []
            
            # 处理JS文件内容，提取JSON数据
            raw_data = response.text
            json_str = raw_data.replace("var newest = ", "").replace(";", "").strip()
            
            # 解析JSON数据
            data = json.loads(json_str)
            
            # 格式化快讯数据
            news_list = []
            for item in data:
                # 检查是否有标题或内容
                title_content = item.get("data", {}).get("title") or item.get("data", {}).get("content")
                if not title_content:
                    continue
                
                # 检查是否属于频道5（可能是广告或其他不需要的内容）
                channels = item.get("channel", [])
                if 5 in channels:
                    continue
                
                # 提取必要字段
                news_id = item.get("id", "")
                text = title_content.replace("<b>", "").replace("</b>", "")
                
                # 尝试提取【】中的标题
                title_match = re.match(r"^【([^】]*)】(.*)$", text)
                if title_match:
                    title = title_match.group(1)
                    summary = title_match.group(2)
                else:
                    title = text
                    summary = text
                
                # 解析时间
                pub_date = datetime.now()
                try:
                    pub_date = datetime.fromisoformat(item.get("time").replace("Z", "+00:00"))
                except Exception as e:
                    print(f"解析金十数据时间失败: {item.get('time')}, {str(e)}")
                
                # 构建文章URL
                url = f"{self.flash_url}/detail/{news_id}"
                
                # 构建快讯数据
                news = {
                    "id": news_id,
                    "title": title,
                    "summary": summary,
                    "url": url,
                    "pubDate": pub_date.isoformat(),
                    "source": "Jin10",
                    "category": "财经",
                    "author": "金十数据",
                    "imageUrl": item.get("data", {}).get("pic", ""),
                    "tags": item.get("tags", []),
                    "important": bool(item.get("important", 0))
                }
                
                news_list.append(news)
            
            # 分页处理
            start_index = (page - 1) * limit
            end_index = start_index + limit
            paginated_news = news_list[start_index:end_index]
            
            print(f"成功获取到 {len(paginated_news)} 条金十数据新闻")
            
            return paginated_news
        
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
        # 金十数据的新实现使用JS文件获取数据，直接调用get_latest_news方法
        return self.get_latest_news(limit=limit)
    
    def get_article_detail(self, article_id):
        """
        获取文章详情
        
        Args:
            article_id (str): 文章ID
            
        Returns:
            dict: 文章详情
        """
        logger.warning("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        logger.warning(f"!!!!!!!!!! [Jin10 ENTRYPOINT TEST VIA LOGGER] Entering get_article_detail for ID: {article_id} !!!!!!!!!!!")
        logger.warning("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        try:
            url = f"{self.flash_url}/detail/{article_id}"
            
            # 添加随机延迟，避免请求过快
            time.sleep(random.uniform(1, 3))
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            print(f"[Jin10 Debug] Article ID: {article_id} - HTTP Status: {response.status_code}")
            if response.status_code != 200:
                print(f"[Jin10 Error] 获取金十文章详情失败: HTTP {response.status_code} for URL: {url}")
                # print(f"[Jin10 Debug] Response content: {response.text[:500]}") # Uncomment for more detail if needed
                return None
            
            print(f"[Jin10 Debug] Article ID: {article_id} - Successfully fetched HTML content.")
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 提取文章信息
            title_elem = soup.select_one(".content-title")
            if not title_elem:
                print(f"[Jin10 Error] Article ID: {article_id} - Failed to find title element (.content-title).")
                return None
            title = title_elem.get_text(strip=True)
            print(f"[Jin10 Debug] Article ID: {article_id} - Extracted title: {title}")

            # 提取内容 - 金十数据的详情页主要是图片内容
            content_elem = soup.select_one(".content-pic")
            if not content_elem:
                print(f"[Jin10 Warn] Article ID: {article_id} - Failed to find content element (.content-pic). Trying alternative selectors.")
                # 尝试其他可能的内容选择器
                content_elem = soup.select_one(".detail-content")
            
            if content_elem:
                content = content_elem.get_text(separator='\n', strip=True)
                html_content = str(content_elem)
            else:
                print(f"[Jin10 Warn] Article ID: {article_id} - No content found. Using title as content.")
                content = title
                html_content = f"<p>{title}</p>"
        
            print(f"[Jin10 Debug] Article ID: {article_id} - Extracted content (first 50 chars): {content[:50]}")

            # 提取发布时间
            pub_date_elem = soup.select_one(".content-time")
            if not pub_date_elem:
                print(f"[Jin10 Warn] Article ID: {article_id} - Failed to find pub_date element (.content-time). Date will be current time.")
                pub_date_text = ""
            else:
                pub_date_text = pub_date_elem.get_text(strip=True)
            print(f"[Jin10 Debug] Article ID: {article_id} - Extracted pub_date_text: {pub_date_text}")
            
            # 尝试解析发布时间
            pub_date = datetime.now()
            try:
                if pub_date_text:
                    # 金十数据的时间格式: "2025-06-05 周四 21:44:31"
                    # 移除星期几部分，只保留日期和时间
                    cleaned_time = re.sub(r'\s+周[一二三四五六日]\s+', ' ', pub_date_text)
                    parsed_date = datetime.strptime(cleaned_time, "%Y-%m-%d %H:%M:%S")
                    
                    # 检查日期是否有效
                    if parsed_date.year > 2000:
                        pub_date = parsed_date
                    else:
                        print(f"解析的金十数据文章时间年份无效: {parsed_date.year}，使用当前时间")
                else:
                    print(f"金十数据文章时间为空，使用当前时间")
            except Exception as e:
                print(f"解析金十数据文章时间失败: {pub_date_text}，使用当前时间: {str(e)}")
                # 尝试其他可能的格式
                try:
                    # 尝试直接解析ISO格式
                    parsed_date = datetime.fromisoformat(pub_date_text.replace("Z", "+00:00"))
                    if parsed_date.year > 2000:
                        pub_date = parsed_date
                except Exception:
                    pass  # 使用默认的当前时间
            
            # 提取文章中的第一张图片作为封面图
            image_url = ""
            img_elem = soup.select_one(".content-pic img")
            if img_elem:
                image_url = img_elem.get("src", "")
                if not image_url.startswith("http"):
                    image_url = f"{self.base_url}{image_url}"
            
            article_data_raw = {
                "id": article_id,
                "title": title,
                "content": content, # Plain text content for AI analysis
                "htmlContent": html_content, # HTML content for display or other purposes
                "url": url,
                "pubDate": pub_date.isoformat(),
                "source": "Jin10",
                "category": "财经",
                "author": "金十数据",
                "imageUrl": image_url,
                "tags": [] # 金十详情页似乎没有明确标签
            }

            print(f"[Jin10 Debug] Article ID: {article_id} - Successfully extracted article data.")

            # 2. Perform SearxNG search
            logger.info(f"[Jin10] 开始为文章进行搜索增强: {title}")
            searxng_results = self.search_service.search(query=title, max_results=MAX_SEARCH_RESULTS if MAX_SEARCH_RESULTS else 3)
            if searxng_results:
                logger.info(f"[Jin10] 搜索增强成功，获取到 {len(searxng_results)} 条相关信息")
            else:
                logger.warning(f"[Jin10] 搜索增强失败，将使用原始内容进行AI分析")

            # 3. Perform AI analysis with enriched context
            logger.info(f"[Jin10] 开始AI分析: {title}")
            analysis_data = self.finance_analyzer.generate_comprehensive_analysis(
                title=article_data_raw['title'],
                content=article_data_raw['content'], 
                search_results=searxng_results
            )

            if not analysis_data or "error" in analysis_data:
                ai_error_msg = analysis_data.get("error", "Unknown AI analysis error") if isinstance(analysis_data, dict) else "AI returned None or invalid data"
                logger.error(f"[Jin10] AI分析失败: {title} - {ai_error_msg}")
                
                # Attempt to save the article without analysis data, but still mark as processed=0 (default for save_article if no analysis_data)
                logger.info(f"[Jin10] 尝试保存文章（无AI分析）: {title}")
                raw_article_to_save = article_data_raw.copy()
                raw_article_to_save['processed'] = 0 # Explicitly set for clarity if save_article doesn't infer this
                save_success_no_ai = self.db_client.save_article(raw_article_to_save, analysis_data=None) # Pass None for analysis_data
                
                if save_success_no_ai:
                    logger.info(f"[Jin10] 文章已保存（无AI分析），可由批处理器处理: {title}")
                    # Return the raw data, but indicate it was NOT processed immediately with full analysis.
                    # ArticleCrawler will see no 'processed_immediately' flag and might log it as failure for immediate processing.
                    # SearchAnalyzer will later pick it up if it's marked as processed=0.
                    article_data_raw['processed_immediately_ai_failed'] = True # Custom flag
                    article_data_raw['analysis_data'] = None # Ensure no stale/error analysis data
                    return article_data_raw # Return raw data
                else:
                    logger.error(f"[Jin10] 保存文章失败: {title}")
                    return None
            
            logger.info(f"[Jin10] AI分析成功: {title}")

            # 4. Save article with analysis data (this will mark it as processed=1 by save_article)
            logger.info(f"[Jin10] 保存文章和AI分析数据: {title}")
            save_success_with_ai = self.db_client.save_article(article_data_raw, analysis_data)
            if save_success_with_ai:
                logger.info(f"[Jin10] 文章已保存并标记为已处理: {title}")
                article_data_raw['analysis_data'] = analysis_data # Ensure analysis_data is part of the returned dict
                article_data_raw['processed_immediately'] = True
                return article_data_raw
            else:
                logger.error(f"[Jin10] 保存文章和AI分析失败，尝试仅保存文章: {title}")
                # Attempt to save raw article without analysis if the combined save failed, mark as processed=0
                logger.info(f"[Jin10] 尝试保存原始文章（备用方案）: {title}")
                raw_article_to_save_fallback = article_data_raw.copy()
                raw_article_to_save_fallback['processed'] = 0
                save_fallback_success = self.db_client.save_article(raw_article_to_save_fallback, analysis_data=None)
                if save_fallback_success:
                    logger.info(f"[Jin10] 原始文章已保存（备用方案）: {title}")
                    article_data_raw['processed_immediately_final_save_failed'] = True # Custom flag
                    article_data_raw['analysis_data'] = None
                    return article_data_raw # Return raw data
                else:
                    logger.error(f"[Jin10] 备用保存方案也失败: {title}")
                    return None

        except Exception as e:
            print(f"获取并处理金十文章详情异常: {str(e)}")
            # Log detailed error to DB if possible
            try:
                self.db_client.add_article_log(article_id, 'error', f'Jin10Crawler.get_article_detail: {str(e)}')
            except Exception as log_e:
                print(f"记录错误日志到数据库失败: {str(log_e)}")
            return None
