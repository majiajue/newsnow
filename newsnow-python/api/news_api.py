#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
新闻相关API
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from flask import request, jsonify
# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.sqlite_client import SQLiteClient

logger = logging.getLogger(__name__)

class NewsAPI:
    """新闻API处理类"""
    
    def __init__(self, db_client: SQLiteClient):
        """
        初始化NewsAPI
        
        Args:
            db_client: SQLite数据库客户端
        """
        self.db = db_client
    
    def get_news_list(self, page: int = 1, page_size: int = 10, source: str = None, 
                      category: str = None, query: str = None) -> Dict[str, Any]:
        """
        获取新闻列表
        
        Args:
            page: 页码，从1开始
            page_size: 每页数量
            source: 来源筛选
            category: 分类筛选
            query: 搜索关键词
            
        Returns:
            Dict: 包含新闻列表和分页信息
        """
        try:
            # 直接使用 SQLiteClient 的 get_latest_articles 方法
            limit = page_size
            offset = (page - 1) * page_size
            
            # 如果有搜索关键词，使用 search_articles 方法
            if query:
                news_list = self.db.search_articles(query, limit=limit, source=source)
            else:
                # 使用 get_latest_articles 方法
                news_list = self.db.get_latest_articles(limit=limit, source=source)
            
            # 如果有分类筛选，手动过滤
            if category and news_list:
                news_list = [news for news in news_list if news.get('category') == category]
            
            # 计算总数（简化处理，实际应该从数据库获取总数）
            total = len(news_list) * 3  # 模拟总数，实际应从数据库查询
            
            # 计算分页信息
            total_pages = max(1, (total + page_size - 1) // page_size)
            
            return {
                'data': news_list,
                'pagination': {
                    'page': page,
                    'pageSize': page_size,
                    'total': total,
                    'totalPages': total_pages
                }
            }
                
        except Exception as e:
            logger.error(f"获取新闻列表失败: {str(e)}")
            return {
                'data': [],
                'pagination': {
                    'page': page,
                    'pageSize': page_size,
                    'total': 0,
                    'totalPages': 0
                }
            }
    
    def get_news_detail(self, news_id: str) -> Optional[Dict[str, Any]]:
        """
        获取新闻详情
        
        Args:
            news_id: 新闻 ID
            
        Returns:
            Optional[Dict]: 新闻详情，如果不存在则返回 None
        """
        try:
            # 直接使用 SQLiteClient 的 get_article_by_id 方法
            news = self.db.get_article_by_id(news_id)
            if not news:
                return None
                
            # 处理字段名称（如果需要）
            if 'pub_date' in news and 'pubDate' not in news:
                news['pubDate'] = news.pop('pub_date')
            if 'image_url' in news and 'imageUrl' not in news:
                news['imageUrl'] = news.pop('image_url')
            
            return news
                
        except Exception as e:
            logger.error(f"获取新闻详情失败: {str(e)}")
            return None
    
    def get_related_news(self, news_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        获取相关新闻
        
        Args:
            news_id: 当前新闻 ID
            limit: 返回数量限制
            
        Returns:
            List[Dict]: 相关新闻列表
        """
        try:
            # 首先获取当前新闻的详情
            current_news = self.db.get_article_by_id(news_id)
            if not current_news:
                return []
                
            # 获取分类
            category = current_news.get('category')
            
            # 获取最新文章
            related_articles = self.db.get_latest_articles(limit=limit*2)  # 获取更多文章，以便过滤
            
            # 过滤当前文章和按分类过滤
            filtered_articles = []
            for article in related_articles:
                # 跳过当前文章
                if article.get('id') == news_id:
                    continue
                    
                # 如果有分类，优先选择相同分类的文章
                if category and article.get('category') == category:
                    filtered_articles.append(article)
                else:
                    # 如果没有足够的相同分类文章，也添加其他文章
                    if len(filtered_articles) < limit:
                        filtered_articles.append(article)
                        
                # 如果已经有足够的文章，则停止
                if len(filtered_articles) >= limit:
                    break
            
            # 格式化返回结果
            related_news = []
            for article in filtered_articles[:limit]:  # 确保只返回 limit 个文章
                related_news.append({
                    'id': article['id'],
                    'title': article['title'],
                    'source': article['source'],
                    'pub_date': article.get('pubDate') or article.get('pub_date', ''),
                    'image_url': article.get('imageUrl') or article.get('image_url', '')
                })
            
            return related_news
                
        except Exception as e:
            logger.error(f"获取相关新闻失败: {str(e)}")
            return []
    
    def get_news_sources(self) -> List[Dict[str, str]]:
        """
        获取新闻来源列表
        
        Returns:
            List[Dict]: 来源列表，包含id和name
        """
        try:
            # 由于没有直接获取来源列表的方法，我们返回预定义的来源列表
            sources = [
                {'id': 'jin10', 'name': '金十数据'},
                {'id': 'wallstreet', 'name': '华尔街见闻'},
                {'id': 'gelonghui', 'name': '格隆汇'},
                {'id': 'fastbull', 'name': 'FastBull'},
                {'id': 'cls', 'name': '中国证券网'}
            ]
            return sources
                
        except Exception as e:
            logger.error(f"获取新闻来源失败: {str(e)}")
            return []


def register_news_routes(app, db_client):
    """
    注册新闻相关路由
    
    Args:
        app: Flask应用实例
        db_client: 数据库客户端
    """
    news_api = NewsAPI(db_client)
    
    @app.route('/api/news', methods=['GET'])
    def get_news_list():
        """获取新闻列表"""
        try:
            page = int(request.args.get('page', 1))
            page_size = min(int(request.args.get('pageSize', 10)), 50)  # 限制每页最大50条
            source = request.args.get('source')
            category = request.args.get('category')
            query = request.args.get('q')
            
            result = news_api.get_news_list(
                page=page,
                page_size=page_size,
                source=source,
                category=category,
                query=query
            )
            
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"处理新闻列表请求失败: {str(e)}")
            return jsonify({
                'error': '获取新闻列表失败',
                'message': str(e)
            }), 500
    
    @app.route('/api/news/<news_id>', methods=['GET'])
    def get_news_detail(news_id):
        """获取新闻详情"""
        try:
            news = news_api.get_news_detail(news_id)
            if not news:
                return jsonify({
                    'error': '新闻不存在',
                    'message': f'未找到ID为{news_id}的新闻'
                }), 404
                
            return jsonify(news)
            
        except Exception as e:
            logger.error(f"处理新闻详情请求失败: {str(e)}")
            return jsonify({
                'error': '获取新闻详情失败',
                'message': str(e)
            }), 500
    
    @app.route('/api/news/<news_id>/related', methods=['GET'])
    def get_related_news(news_id):
        """获取相关新闻"""
        try:
            limit = min(int(request.args.get('limit', 5)), 20)  # 限制最大返回20条
            related_news = news_api.get_related_news(news_id, limit=limit)
            return jsonify(related_news)
            
        except Exception as e:
            logger.error(f"处理相关新闻请求失败: {str(e)}")
            return jsonify({
                'error': '获取相关新闻失败',
                'message': str(e)
            }), 500
    
    @app.route('/api/sources', methods=['GET'])
    def get_sources():
        """获取新闻来源"""
        try:
            sources = news_api.get_news_sources()
            return jsonify(sources)
            
        except Exception as e:
            logger.error(f"处理新闻来源请求失败: {str(e)}")
            return jsonify({
                'error': '获取新闻来源失败',
                'message': str(e)
            }), 500
