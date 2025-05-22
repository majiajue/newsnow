"""
最基本的Flask API服务器
使用最简单的方式解决跨域问题
"""

from flask import Flask, jsonify, request, make_response, abort
from flask_cors import CORS
import json
import logging
import random
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)
CORS(app)  # 启用CORS，允许所有来源

# 模拟数据源
SOURCES = ['jin10', 'wallstreet', 'gelonghui', 'fastbull']

# 内存中的文章存储，模拟数据库
articles_db: Dict[str, Dict] = {}
flash_news_db: List[Dict] = []

# 初始化一些测试数据
def init_sample_data():
    now = datetime.now()
    
    # 生成测试文章
    for i in range(1, 101):  # 生成100篇测试文章
        source = random.choice(SOURCES)
        article_id = f"article_{source}_{i}"
        
        # 根据来源生成不同的文章内容
        if source == 'jin10':
            title = f"金十数据：美联储政策解读与市场影响分析 {i}"
            category = '外汇'
            author = '金十研究院'
            extract = f"美联储最新政策决议对全球外汇市场产生深远影响，美元指数波动加剧...{i}"
        elif source == 'wallstreet':
            title = f"华尔街见闻：科技股财报季展望 {i}"
            category = '股市'
            author = '华尔街分析师'
            extract = f"随着科技巨头即将发布财报，市场关注盈利预期和未来指引...{i}"
        elif source == 'gelonghui':
            title = f"格隆汇：中国宏观经济数据点评 {i}"
            category = '宏观经济'
            author = '格隆汇研究团队'
            extract = f"最新公布的经济数据显示中国经济复苏势头良好...{i}"
        else:  # fastbull
            title = f"FastBull：加密货币市场周报 {i}"
            category = '加密货币'
            author = 'FastBull量化团队'
            extract = f"比特币价格在近期出现大幅波动，市场情绪分化...{i}"
        
        article = {
            'id': article_id,
            'title': title,
            'summary': extract,
            'content': f"这是{source}的一篇详细文章，描述了当前的经济形势和市场动态。" * 10,
            'source': source,
            'url': f"https://example.com/{source}/article/{i}",
            'published_at': (now - timedelta(hours=random.randint(1, 48))).isoformat(),
            'author': author,
            'category': category,
            'tags': random.sample(['美联储', '欧央行', '中国央行', '日本央行', '通胀', '利率', '股市', '债券', '外汇'], 3),
            'read_count': random.randint(100, 5000),
            'has_analysis': random.choice([True, False]),
            'images': [
                f"https://picsum.photos/800/400?random={i}"
            ]
        }
        articles_db[article_id] = article
        
        # 生成快讯
        if i % 5 == 0:  # 每5篇文章生成一条快讯
            flash = {
                'id': f"flash_{source}_{i}",
                'content': f"{title} - {extract[:50]}...",
                'source': source,
                'published_at': (now - timedelta(minutes=random.randint(5, 500))).isoformat(),
                'importance': random.randint(1, 5),
                'category': category
            }
            flash_news_db.append(flash)

# 添加CORS头部的装饰器
def add_cors_headers(f):
    def wrapped(*args, **kwargs):
        if request.method == 'OPTIONS':
            response = make_response()
        else:
            response = make_response(f(*args, **kwargs))
        
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE, PATCH'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
        return response
    
    wrapped.__name__ = f.__name__  # 保留原始函数名
    return wrapped

# 初始化测试数据
init_sample_data()

# 健康检查接口
@app.route('/api/health', methods=['GET', 'OPTIONS'])
@add_cors_headers
def health_check():
    if request.method == 'OPTIONS':
        return make_response()
    return jsonify({
        'status': 'ok',
        'server_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'server_name': 'NewNow API Server',
        'version': '1.0.0'
    })

# 获取快讯
@app.route('/api/flash', methods=['GET', 'OPTIONS'])
@add_cors_headers
def get_flash_news():
    if request.method == 'OPTIONS':
        return make_response()
    
    limit = min(int(request.args.get('limit', 20)), 100)  # 限制最大100条
    source = request.args.get('source')
    
    # 过滤快讯
    filtered_flashes = flash_news_db
    if source and source in SOURCES:
        filtered_flashes = [f for f in filtered_flashes if f['source'] == source]
    
    # 排序：按发布时间倒序
    sorted_flashes = sorted(
        filtered_flashes, 
        key=lambda x: x['published_at'], 
        reverse=True
    )
    
    # 分页
    paginated_flashes = sorted_flashes[:limit]
    
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': {
            'count': len(paginated_flashes),
            'flashes': paginated_flashes
        }
    })

# 获取文章列表
@app.route('/api/articles', methods=['GET', 'OPTIONS'])
@add_cors_headers
def get_articles():
    if request.method == 'OPTIONS':
        return make_response()
    
    page = max(1, int(request.args.get('page', 1)))
    page_size = min(int(request.args.get('page_size', 10)), 50)  # 限制每页最大50条
    source = request.args.get('source')
    category = request.args.get('category')
    
    # 过滤文章
    filtered_articles = list(articles_db.values())
    
    if source and source in SOURCES:
        filtered_articles = [a for a in filtered_articles if a['source'] == source]
    
    if category:
        filtered_articles = [a for a in filtered_articles if a['category'] == category]
    
    # 排序：按发布时间倒序
    sorted_articles = sorted(
        filtered_articles,
        key=lambda x: x['published_at'],
        reverse=True
    )
    
    # 分页
    total = len(sorted_articles)
    total_pages = (total + page_size - 1) // page_size
    start = (page - 1) * page_size
    end = start + page_size
    paginated_articles = sorted_articles[start:end]
    
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': {
            'articles': paginated_articles,
            'pagination': {
                'current_page': page,
                'page_size': page_size,
                'total': total,
                'total_pages': total_pages
            }
        }
    })

# 获取单篇文章
@app.route('/api/articles/<article_id>', methods=['GET', 'OPTIONS'])
@add_cors_headers
def get_article(article_id):
    if request.method == 'OPTIONS':
        return make_response()
    
    article = articles_db.get(article_id)
    if not article:
        return jsonify({
            'code': 404,
            'message': 'Article not found',
            'data': None
        }), 404
    
    # 增加阅读量
    article['read_count'] += 1
    
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': article
    })

# 获取相关文章
@app.route('/api/articles/<article_id>/related', methods=['GET', 'OPTIONS'])
@add_cors_headers
def get_related_articles(article_id):
    if request.method == 'OPTIONS':
        return make_response()
    
    limit = min(int(request.args.get('limit', 5)), 20)  # 限制最大20篇相关文章
    
    # 获取当前文章
    article = articles_db.get(article_id)
    if not article:
        return jsonify({
            'code': 404,
            'message': 'Article not found',
            'data': None
        }), 404
    
    # 查找同类别或同来源的文章
    related = []
    for a in articles_db.values():
        if a['id'] != article_id and (a['category'] == article['category'] or a['source'] == article['source']):
            related.append(a)
    
    # 随机选择几篇相关文章
    related = random.sample(related, min(len(related), limit))
    
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': {
            'count': len(related),
            'articles': related
        }
    })

# 分析文章
@app.route('/api/articles/<article_id>/analyze', methods=['GET', 'OPTIONS'])
@add_cors_headers
def analyze_article(article_id):
    if request.method == 'OPTIONS':
        return make_response()
    
    # 模拟分析结果
    analysis = {
        'id': f'analysis_{article_id}',
        'article_id': article_id,
        'sentiment': random.choice(['positive', 'neutral', 'negative']),
        'sentiment_score': round(random.uniform(-1, 1), 2),
        'keywords': random.sample(['美联储', '利率', '通胀', '经济', '市场', '政策', '增长', '风险', '投资'], 3),
        'summary': '这是一段自动生成的文章分析摘要，包含文章的主要观点和情感倾向。',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': analysis
    })

# 搜索文章和快讯
@app.route('/api/search', methods=['GET', 'OPTIONS'])
@add_cors_headers
def search_content():
    if request.method == 'OPTIONS':
        return make_response()
    
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({
            'code': 400,
            'message': 'Search query is required',
            'data': None
        }), 400
    
    limit = min(int(request.args.get('limit', 10)), 50)
    source = request.args.get('source')
    
    # 搜索文章
    matched_articles = []
    for article in articles_db.values():
        if (query.lower() in article['title'].lower() or 
            query.lower() in article['summary'].lower() or
            query.lower() in ' '.join(article['tags']).lower()):
            if not source or article['source'] == source:
                matched_articles.append(article)
    
    # 搜索快讯
    matched_flashes = []
    for flash in flash_news_db:
        if query.lower() in flash['content'].lower():
            if not source or flash['source'] == source:
                matched_flashes.append(flash)
    
    # 排序：按相关度（这里简单按时间倒序）
    matched_articles = sorted(matched_articles, key=lambda x: x['published_at'], reverse=True)[:limit]
    matched_flashes = sorted(matched_flashes, key=lambda x: x['published_at'], reverse=True)[:limit]
    
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': {
            'query': query,
            'articles': {
                'count': len(matched_articles),
                'results': matched_articles
            },
            'flashes': {
                'count': len(matched_flashes),
                'results': matched_flashes
            },
            'total': len(matched_articles) + len(matched_flashes)
        }
    })

# 获取统计信息
@app.route('/api/stats', methods=['GET', 'OPTIONS'])
@add_cors_headers
def get_stats():
    if request.method == 'OPTIONS':
        return make_response()
    
    # 统计各来源文章数
    source_stats = {s: 0 for s in SOURCES}
    category_stats = {}
    
    for article in articles_db.values():
        source_stats[article['source']] += 1
        category = article['category']
        category_stats[category] = category_stats.get(category, 0) + 1
    
    stats = {
        'total_articles': len(articles_db),
        'total_flashes': len(flash_news_db),
        'sources': source_stats,
        'categories': category_stats,
        'last_updated': datetime.now().isoformat()
    }
    
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': stats
    })

# 启动服务器

# 主程序入口
if __name__ == '__main__':
    host = '0.0.0.0'  # 监听所有IP
    port = 5001  # 使用不同的端口
    logger.info(f"API服务器启动在: http://{host}:{port}/")
    app.run(host=host, port=port, debug=True)
