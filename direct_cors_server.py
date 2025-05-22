"""
最简单直接的Flask API服务器
手动添加CORS头部，解决跨域问题
"""

import json
import logging
import random
import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, make_response

# 创建Flask应用
app = Flask(__name__)

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 新闻来源
SOURCES = ['jin10', 'wallstreet', 'gelonghui', 'fastbull']

# 定义所有处理器之前的钩子，为所有响应添加CORS头部
@app.after_request
def after_request(response):
    # 允许所有来源访问
    response.headers.add('Access-Control-Allow-Origin', '*')
    # 允许的请求方法
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    # 允许的请求头
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
    # 对预检请求的结果缓存时间
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

# 专门处理OPTIONS请求
@app.route('/', methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path=''):
    return jsonify({'status': 'ok'})

# 辅助函数：生成文章
def generate_articles(count=10, source=None):
    articles = []
    now = datetime.now()
    
    sources = [source] if source else SOURCES
    
    for i in range(count):
        source_name = random.choice(sources) if not source else source
        
        article = {
            'id': f"article_{i}_{random.randint(1000, 9999)}",
            'title': f"财经新闻标题 {i+1}",
            'summary': f"这是第 {i+1} 条财经新闻的摘要，包含了重要的经济信息...",
            'content': f"这是第 {i+1} 条财经新闻的详细内容，描述了当前的经济形势和市场动态...",
            'source': source_name,
            'url': f"https://example.com/{source_name}/article/{i}",
            'published_at': (now - timedelta(hours=random.randint(1, 48))).isoformat(),
            'author': f"财经分析师{random.randint(1, 10)}",
            'category': random.choice(['宏观经济', '股市', '债券', '外汇', '商品']),
            'tags': random.sample(['美联储', '欧央行', '中国央行', '日本央行', '通胀', '利率', '股市', '债券', '外汇'], 3),
            'read_count': random.randint(100, 5000),
            'has_analysis': random.choice([True, False])
        }
        articles.append(article)
    
    return articles

# 生成快讯
def generate_flash_news(count=20, source=None):
    flashes = []
    now = datetime.now()
    
    sources = [source] if source else SOURCES
    
    for i in range(count):
        source_name = random.choice(sources) if not source else source
        
        flash = {
            'id': f"flash_{i}_{random.randint(1000, 9999)}",
            'content': f"快讯 {i+1}: 市场重要动态更新...",
            'source': source_name,
            'published_at': (now - timedelta(minutes=random.randint(5, 500))).isoformat(),
            'importance': random.randint(1, 5),
            'category': random.choice(['宏观经济', '股市', '债券', '外汇', '商品'])
        }
        flashes.append(flash)
    
    return flashes

# 生成分析结果
def generate_analysis():
    analysis = {
        'summary': "本文分析了当前经济形势，指出了关键风险点和机会。",
        'sentiment': random.choice(["积极", "中性", "谨慎", "负面"]),
        'key_points': [
            "美联储政策变化可能影响市场走向",
            "通胀压力仍然存在，但有所缓解",
            "经济数据显示复苏步伐稳定"
        ],
        'market_impact': [
            "科技行业可能受益于这一趋势",
            "金融板块面临一定的下行风险",
            "短期内，市场波动性可能增加",
            "长期来看，这一趋势有利于市场稳定增长"
        ],
        'risk_analysis': [
            "主要风险包括政策紧缩和通胀持续",
            "投资者应密切关注就业数据的变化",
            "政策不确定性是一个需要注意的因素"
        ],
        'recommendation': [
            "建议投资者保持多元化策略",
            "可适当增加对优质成长股的配置",
            "密切关注央行会议带来的市场机会"
        ]
    }
    
    return analysis

# API路由

# 健康检查接口
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'server_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })

# 获取文章列表
@app.route('/api/articles', methods=['GET'])
def get_articles():
    limit = int(request.args.get('limit', 10))
    offset = int(request.args.get('offset', 0))
    source = request.args.get('source')
    
    articles = generate_articles(limit, source)
    
    return jsonify({
        'count': len(articles),
        'articles': articles
    })

# 获取单篇文章
@app.route('/api/articles/<article_id>', methods=['GET'])
def get_article(article_id):
    source = request.args.get('source')
    article = generate_articles(1, source)[0]
    article['id'] = article_id
    
    return jsonify(article)

# 获取相关文章
@app.route('/api/articles/<article_id>/related', methods=['GET'])
def get_related_articles(article_id):
    limit = int(request.args.get('limit', 5))
    
    related = generate_articles(limit)
    
    return jsonify({
        'article_id': article_id,
        'count': len(related),
        'articles': related
    })

# 分析文章
@app.route('/api/articles/<article_id>/analyze', methods=['POST'])
def analyze_article(article_id):
    analysis = generate_analysis()
    
    return jsonify({
        'article_id': article_id,
        'analysis': analysis
    })

# 获取快讯
@app.route('/api/flash', methods=['GET'])
def get_flash_news():
    limit = int(request.args.get('limit', 20))
    source = request.args.get('source')
    
    flashes = generate_flash_news(limit, source)
    
    return jsonify({
        'count': len(flashes),
        'flashes': flashes
    })

# 搜索
@app.route('/api/search', methods=['GET'])
def search():
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

# 获取统计信息
@app.route('/api/stats', methods=['GET'])
def get_stats():
    stats = {
        'article_count': random.randint(1000, 5000),
        'source_count': len(SOURCES),
        'today_count': random.randint(50, 200),
        'analyzed_count': random.randint(500, 3000),
        'flash_count': random.randint(3000, 10000),
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify(stats)

# 主程序入口
if __name__ == '__main__':
    host = 'localhost'
    port = 5000
    logger.info(f"API服务器启动在: http://{host}:{port}/")
    app.run(host=host, port=port, debug=True)
