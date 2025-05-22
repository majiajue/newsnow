#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
简化版API服务器 - 提供基本API模拟数据
"""

import json
import logging
import random
import os
import uuid
import time
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

# 创建Flask应用
app = Flask(__name__)

# 正确配置Flask-CORS
# 这里使用最简单直接的方式，允许所有来源，解决跨域问题
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 示例数据
SOURCES = ['jin10', 'wallstreet', 'gelonghui', 'fastbull', 'cls']
CATEGORIES = ['finance', 'stock', 'forex', 'commodity', 'crypto']
SENTIMENTS = ['积极', '中性', '消极']

# 模拟数据生成
def generate_articles(count=20, source=None):
    """生成模拟文章数据"""
    articles = []
    
    now = datetime.now()
    
    for i in range(count):
        pub_date = now - timedelta(hours=random.randint(0, 48))
        
        article = {
            'id': f'article_{i+1}',
            'title': f'这是一篇示例财经文章 #{i+1}',
            'summary': '这是文章摘要，描述了文章的主要内容和观点。' * 2,
            'content': '这是文章的详细内容，包含了更多的分析和数据。' * 10,
            'source': source or random.choice(SOURCES),
            'category': random.choice(CATEGORIES),
            'pubDate': pub_date.isoformat(),
            'url': f'https://example.com/articles/{i+1}',
            'author': '示例作者',
            'tags': ['财经', '市场', '分析']
        }
        
        articles.append(article)
    
    return articles

def generate_flash_news(count=20, source=None):
    """生成模拟快讯数据"""
    news_list = []
    
    now = datetime.now()
    
    for i in range(count):
        pub_date = now - timedelta(minutes=random.randint(0, 240))
        
        news = {
            'id': f'flash_{i+1}',
            'title': f'这是一条示例财经快讯 #{i+1}',
            'content': '这是快讯的详细内容，描述了最新的市场动态。',
            'source': source or random.choice(SOURCES),
            'pubDate': pub_date.isoformat(),
            'importance': random.choice(['normal', 'high'])
        }
        
        news_list.append(news)
    
    return news_list

def generate_analysis():
    """生成模拟分析数据"""
    analysis = {
        'market_summary': '本文讨论了市场最新发展趋势，重点关注了通胀数据和央行政策对股市的影响。',
        'impact_analysis': '通胀数据高于预期可能导致央行采取更加鹰派的政策立场，对股市构成压力。',
        'sentiment': random.choice(SENTIMENTS),
        'affected_industries': [
            {
                'industry': '金融服务',
                'impact_level': random.choice(['高', '中', '低']),
                'impact_details': '银行股可能受到利率变化的直接影响',
                'companies': ['工商银行', '建设银行', '招商银行']
            },
            {
                'industry': '科技',
                'impact_level': random.choice(['高', '中', '低']),
                'impact_details': '科技股对经济增长预期变化较为敏感',
                'companies': ['腾讯', '阿里巴巴', '百度']
            }
        ],
        'investment_advice': '在当前环境下，投资者可能需要更加关注防御性板块，并对高估值成长股保持谨慎。'
    }
    
    return analysis

# API路由
@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查API"""
    return jsonify({
        'status': 'ok',
        'server_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })

@app.route('/api/articles', methods=['GET'])
def get_articles():
    """获取文章列表API"""
    limit = int(request.args.get('limit', 10))
    offset = int(request.args.get('offset', 0))
    source = request.args.get('source')
    
    articles = generate_articles(limit, source)
    
    return jsonify({
        'count': len(articles),
        'articles': articles
    })

@app.route('/api/articles/<article_id>', methods=['GET'])
def get_article(article_id):
    """获取单篇文章API"""
    source = request.args.get('source')
    article = generate_articles(1, source)[0]
    article['id'] = article_id
    
    return jsonify(article)

@app.route('/api/articles/<article_id>/related', methods=['GET'])
def get_related_articles(article_id):
    """获取相关文章API"""
    limit = int(request.args.get('limit', 5))
    
    related = generate_articles(limit)
    
    return jsonify({
        'article_id': article_id,
        'count': len(related),
        'articles': related
    })

@app.route('/api/articles/<article_id>/analyze', methods=['POST'])
def analyze_article(article_id):
    """分析文章API"""
    analysis = generate_analysis()
    
    return jsonify({
        'article_id': article_id,
        'analysis': analysis
    })

@app.route('/api/flash', methods=['GET'])
def get_flash_news():
    """获取快讯列表"""
    limit = int(request.args.get('limit', 20))
    source = request.args.get('source', None)
    
    flash_news = generate_flash_news(limit, source)
    
    return jsonify({
        'count': len(flash_news),
        'flashes': flash_news
    })

@app.route('/api/search', methods=['GET'])
def search():
    """搜索API"""
    query = request.args.get('q', '')
    category = request.args.get('category', 'finance')
    max_results = int(request.args.get('max_results', 20))
    
    if not query:
        return jsonify({'error': '查询参数不能为空'}), 400
    
    results = generate_articles(max_results)
    
    return jsonify({
        'query': query,
        'category': category,
        'count': len(results),
        'results': results
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """获取统计信息"""
    # 生成模拟统计数据
    stats = {
        'article_count': random.randint(1000, 5000),
        'source_count': len(SOURCES),
        'today_count': random.randint(50, 200),
        'analyzed_count': random.randint(500, 3000),
        'flash_count': random.randint(3000, 10000),
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify(stats)

if __name__ == '__main__':
    host = 'localhost'
    port = 5000
    logger.info(f"API服务器启动在: http://{host}:{port}/")
    app.run(host=host, port=port, debug=True)
