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
# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import USER_AGENT, REQUEST_TIMEOUT

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
        try:
            url = f"{self.flash_url}/detail/{article_id}"
            
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
            
            # 提取文章信息
            title = soup.select_one(".flash-detail-title").text.strip()
            content = soup.select_one(".flash-detail-content").get_text() if soup.select_one(".flash-detail-content") else ""
            html_content = str(soup.select_one(".flash-detail-content")) if soup.select_one(".flash-detail-content") else f"<p>{title}</p>"
            pub_date_text = soup.select_one(".flash-detail-time").text.strip() if soup.select_one(".flash-detail-time") else ""
            
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
                    print(f"直接解析金十数据文章时间失败: {pub_date_text}，使用当前时间")
            except Exception as e:
                print(f"解析金十数据文章时间失败: {pub_date_text}，使用当前时间: {str(e)}")
            
            # 提取文章中的第一张图片作为封面图
            image_url = ""
            img_elem = soup.select_one(".flash-detail-content img")
            if img_elem:
                image_url = img_elem.get("src", "")
            
            # 提取文章摘要
            summary = ""
            first_p = soup.select_one(".flash-detail-content p")
            if first_p:
                summary = first_p.text.strip()
            else:
                summary = content[:200] + "..." if len(content) > 200 else content
            
            # 构建文章详情
            article_detail = {
                "id": article_id,
                "title": title,
                "content": html_content,
                "summary": summary,
                "url": url,
                "pubDate": pub_date.isoformat(),
                "source": "Jin10",
                "category": "财经",
                "author": "金十数据",
                "imageUrl": image_url
            }
            
            print(f"成功获取到金十数据文章详情: {title}")
            return article_detail
        
        except Exception as e:
            print(f"获取金十文章详情异常: {str(e)}")
            return None
