#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
API服务器 - 提供HTTP接口供前端调用
"""

import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from waitress import serve

# 导入配置
from config.settings import MAX_SEARCH_RESULTS, API_HOST, API_PORT

# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.sqlite_client import SQLiteClient
from utils.search_service import SearchService
from processors.search_analyzer import SearchAnalyzer
from processors.content_quality_enhancer import ContentQualityEnhancer
from api.news_api import register_news_routes

# 创建日志记录器
logger = logging.getLogger(__name__)

class APIServer:
    """API服务器类，提供REST API接口"""
    
    def __init__(self, host='0.0.0.0', port=5001, db_path=None, search_url=None):
        """
        初始化API服务器
        
        Args:
            host (str): 主机地址
            port (int): 端口号
            db_path (str, optional): 数据库路径
            search_url (str, optional): 搜索服务URL
        """
        self.host = host
        self.port = port
        
        # 创建Flask应用
        self.app = Flask(__name__)
        
        # 增强CORS配置，允许所有来源的请求
        CORS(self.app, resources={r"/*": {"origins": "*"}})  # 启用CORS支持，允许所有来源
        
        # 初始化数据库客户端
        self.db_client = SQLiteClient(db_path)
        
        # 初始化搜索服务
        self.search_service = SearchService(search_url)
        
        # 初始化搜索分析器
        self.search_analyzer = SearchAnalyzer(db_path, search_url)
        
        # 初始化内容质量增强器
        self.content_enhancer = ContentQualityEnhancer()
        
        # 注册路由
        self._register_routes()
        
        # 注册新闻API路由
        register_news_routes(self.app, self.db_client)
        
        logger.info(f"API服务器初始化完成，监听地址: {host}:{port}")
    
    def _register_routes(self):
        """注册API路由"""
        
        # 健康检查路由
        @self.app.route('/api/health', methods=['GET'])
        def health_check():
            db_status = self._check_db_status()
            search_status = self.search_service.health_check()
            
            status = {
                'status': 'ok' if db_status and search_status else 'error',
                'db': 'ok' if db_status else 'error',
                'search': 'ok' if search_status else 'error',
                'timestamp': datetime.now().isoformat()
            }
            
            return jsonify(status)
        
        # 搜索路由
        @self.app.route('/api/search', methods=['GET'])
        def search():
            query = request.args.get('q', '')
            category = request.args.get('category', 'finance')
            language = request.args.get('language', 'zh-CN')
            time_range = request.args.get('time_range', None)
            max_results = int(request.args.get('max_results', MAX_SEARCH_RESULTS))
            
            if not query:
                return jsonify({'error': '查询参数不能为空'}), 400
            
            results = self.search_service.search(
                query=query,
                category=category,
                language=language,
                time_range=time_range,
                max_results=max_results
            )
            
            return jsonify({
                'query': query,
                'category': category,
                'results_count': len(results),
                'results': results
            })
        
        # 获取文章路由
        @self.app.route('/api/articles', methods=['GET'])
        def get_articles():
            limit = int(request.args.get('limit', 20))
            source = request.args.get('source', None)
            
            articles = self.db_client.get_latest_articles(limit, source)
            
            return jsonify({
                'count': len(articles),
                'articles': articles
            })
        
        # 获取单篇文章路由
        @self.app.route('/api/articles/<article_id>', methods=['GET'])
        def get_article(article_id):
            source = request.args.get('source', None)
            
            article = self.db_client.get_article_by_id(article_id, source)
            
            if not article:
                return jsonify({'error': '文章不存在'}), 404
            
            return jsonify(article)
        
        # 获取相关文章路由
        @self.app.route('/api/articles/<article_id>/related', methods=['GET'])
        def get_related_articles(article_id):
            max_results = int(request.args.get('limit', 5))
            
            related = self.search_analyzer.search_related_articles(article_id, max_results)
            
            return jsonify({
                'article_id': article_id,
                'count': len(related),
                'related': related
            })
        
        # 分析文章路由
        @self.app.route('/api/articles/<article_id>/analyze', methods=['POST'])
        def analyze_article(article_id):
            source = request.args.get('source', None)
            
            # 检查文章是否存在
            article = self.db_client.get_article_by_id(article_id, source)
            
            if not article:
                return jsonify({'error': '文章不存在'}), 404
            
            # 分析文章
            result = self.search_analyzer.analyze_article(article_id, source)
            
            if not result:
                return jsonify({'error': '分析失败'}), 500
            
            return jsonify({
                'article_id': article_id,
                'analysis': result
            })
        
        # 获取快讯路由
        @self.app.route('/api/flash', methods=['GET'])
        def get_flash_news():
            limit = int(request.args.get('limit', 20))
            source = request.args.get('source', None)
            
            news_list = self.db_client.get_latest_flash(limit, source)
            
            return jsonify({
                'count': len(news_list),
                'flash_news': news_list
            })
        
        # 统计信息路由
        @self.app.route('/api/stats', methods=['GET'])
        def get_stats():
            stats = {
                'articles': {
                    'total': self.db_client.get_article_count(),
                    'processed': self.db_client.get_article_count(processed=True),
                    'unprocessed': self.db_client.get_article_count(processed=False),
                    'by_source': {}
                },
                'flash_news': {
                    'total': self.db_client.get_flash_count(),
                    'by_source': {}
                },
                'timestamp': datetime.now().isoformat()
            }
            
            # 按来源统计
            for source in ['jin10', 'gelonghui', 'wallstreet', 'fastbull', 'cls']:
                stats['articles']['by_source'][source] = self.db_client.get_article_count(source)
                stats['flash_news']['by_source'][source] = self.db_client.get_flash_count(source)
            
            return jsonify(stats)
        
        # 内容质量增强相关路由
        @self.app.route('/api/quality/enhance', methods=['POST'])
        def enhance_article():
            """增强单篇文章质量"""
            try:
                data = request.get_json()
                if not data:
                    return jsonify({'error': '请求数据不能为空'}), 400
                
                article_id = data.get('article_id')
                source = data.get('source')
                
                if not article_id or not source:
                    return jsonify({'error': '缺少必要参数: article_id 和 source'}), 400
                
                enhanced_article = self.content_enhancer.enhance_article_quality(article_id, source)
                
                if enhanced_article:
                    return jsonify({
                        'success': True,
                        'message': '文章质量增强成功',
                        'data': {
                            'article_id': article_id,
                            'quality_score': enhanced_article.get('quality_score'),
                            'enhanced_title': enhanced_article.get('enhanced_title'),
                            'executive_summary': enhanced_article.get('executive_summary'),
                            'enhancement_date': enhanced_article.get('enhancement_date')
                        }
                    })
                else:
                    return jsonify({'error': '文章质量增强失败'}), 500
                    
            except Exception as e:
                logger.error(f"增强文章质量异常: {str(e)}")
                return jsonify({'error': f'服务器内部错误: {str(e)}'}), 500
        
        @self.app.route('/api/quality/batch-enhance', methods=['POST'])
        def batch_enhance_articles():
            """批量增强文章质量"""
            try:
                data = request.get_json()
                if not data:
                    return jsonify({'error': '请求数据不能为空'}), 400
                
                articles = data.get('articles', [])
                if not articles:
                    return jsonify({'error': '文章列表不能为空'}), 400
                
                # 转换为(article_id, source)元组列表
                article_ids = [(article.get('article_id'), article.get('source')) 
                              for article in articles 
                              if article.get('article_id') and article.get('source')]
                
                if not article_ids:
                    return jsonify({'error': '没有有效的文章ID和来源'}), 400
                
                results = self.content_enhancer.batch_enhance_articles(article_ids)
                
                return jsonify({
                    'success': True,
                    'message': '批量增强完成',
                    'data': results
                })
                
            except Exception as e:
                logger.error(f"批量增强文章质量异常: {str(e)}")
                return jsonify({'error': f'服务器内部错误: {str(e)}'}), 500
        
        @self.app.route('/api/quality/statistics', methods=['GET'])
        def get_quality_statistics():
            """获取内容质量统计信息"""
            try:
                stats = self.db_client.get_quality_statistics()
                return jsonify({
                    'success': True,
                    'data': stats,
                    'timestamp': datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"获取质量统计异常: {str(e)}")
                return jsonify({'error': f'服务器内部错误: {str(e)}'}), 500
        
        @self.app.route('/api/quality/performance', methods=['GET'])
        def get_content_performance():
            """获取内容表现分析"""
            try:
                performance = self.content_enhancer.analyze_content_performance()
                return jsonify({
                    'success': True,
                    'data': performance,
                    'timestamp': datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"获取内容表现分析异常: {str(e)}")
                return jsonify({'error': f'服务器内部错误: {str(e)}'}), 500
        
        @self.app.route('/api/quality/high-quality', methods=['GET'])
        def get_high_quality_articles():
            """获取高质量文章"""
            try:
                min_score = int(request.args.get('min_score', 8))
                limit = int(request.args.get('limit', 20))
                
                articles = self.db_client.get_high_quality_articles(min_score, limit)
                
                return jsonify({
                    'success': True,
                    'data': articles,
                    'count': len(articles),
                    'timestamp': datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"获取高质量文章异常: {str(e)}")
                return jsonify({'error': f'服务器内部错误: {str(e)}'}), 500
        
        @self.app.route('/api/quality/strategy', methods=['POST'])
        def generate_content_strategy():
            """生成内容策略"""
            try:
                data = request.get_json()
                if not data:
                    return jsonify({'error': '请求数据不能为空'}), 400
                
                topic = data.get('topic') or data.get('theme')
                days = data.get('days', 7)
                
                if not topic:
                    return jsonify({'error': '缺少主题参数 (topic 或 theme)'}), 400
                
                strategy = self.content_enhancer.generate_content_strategy(topic, days)
                
                if strategy:
                    return jsonify({
                        'success': True,
                        'data': strategy,
                        'timestamp': datetime.now().isoformat()
                    })
                else:
                    return jsonify({'error': '内容策略生成失败'}), 500
                    
            except Exception as e:
                logger.error(f"生成内容策略异常: {str(e)}")
                return jsonify({'error': f'服务器内部错误: {str(e)}'}), 500
        
        @self.app.route('/api/quality/articles-to-enhance', methods=['GET'])
        def get_articles_to_enhance():
            """获取待增强的文章"""
            try:
                limit = int(request.args.get('limit', 10))
                source = request.args.get('source')
                
                articles = self.db_client.get_articles_for_enhancement(limit, source)
                
                return jsonify({
                    'success': True,
                    'data': articles,
                    'count': len(articles),
                    'timestamp': datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"获取待增强文章异常: {str(e)}")
                return jsonify({'error': f'服务器内部错误: {str(e)}'}), 500
    
    def _check_db_status(self):
        """检查数据库状态"""
        try:
            # 简单查询测试数据库连接
            count = self.db_client.get_article_count()
            return True
        except Exception:
            return False
    
    def run(self):
        """启动API服务器"""
        logger.info(f"API服务器正在启动，监听地址: {self.host}:{self.port}")
        serve(self.app, host=self.host, port=self.port)
        
    def run_debug(self):
        """以调试模式启动API服务器"""
        logger.info(f"API服务器以调试模式启动，监听地址: {self.host}:{self.port}")
        self.app.run(host=self.host, port=self.port, debug=True)


def create_api_server(host='0.0.0.0', port=5001, db_path=None, search_url=None):
    """
    创建API服务器
    
    Args:
        host (str): 主机地址
        port (int): 端口号
        db_path (str, optional): 数据库路径
        search_url (str, optional): 搜索服务URL
        
    Returns:
        APIServer: API服务器实例
    """
    return APIServer(host, port, db_path, search_url)


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    api_server = create_api_server(host=API_HOST, port=API_PORT)
    api_server.run()
