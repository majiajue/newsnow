"""
组合式服务器 - 同时提供API和静态文件
避免跨域问题
"""

import json
import logging
import random
import os
import uuid
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, make_response, send_from_directory

# 创建Flask应用
app = Flask(__name__, static_folder='frontend')

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 新闻来源
SOURCES = ['jin10', 'wallstreet', 'gelonghui', 'fastbull']

# 模拟标题
TITLES = [
    "美联储主席鲍威尔：通胀依然高于目标，需要保持谨慎",
    "欧洲央行暗示可能在6月降息，欧元区经济有望复苏",
    "中国央行推出新政策工具，支持实体经济发展",
    "日本央行保持超宽松货币政策不变，日元持续走弱",
    "美股创历史新高，科技股领涨市场",
    "特斯拉季度业绩超预期，电动车销量增长强劲",
    "苹果发布新款M3芯片设备，市场反应积极",
    "比特币突破7万美元，加密货币市场热度回升",
    "国际油价波动，地缘政治因素施压能源市场",
    "全球供应链持续恢复，但通胀压力仍存"
]

# 模拟内容
CONTENTS = [
    "据最新经济数据显示，美国经济增长高于预期，失业率维持在低水平。专家分析认为，这表明经济韧性较强，但通胀压力可能会继续存在。美联储官员近期发表讲话，暗示可能需要保持利率在较高水平更长时间，以确保通胀回落至2%的目标。市场对此反应谨慎，投资者正在调整对未来利率路径的预期。",
    "欧洲央行管理委员会成员近日表示，欧元区通胀压力正在减弱，经济数据显示服务业和制造业活动开始回升。这为欧洲央行在下次政策会议上考虑降息提供了空间。分析师认为，欧元区经济可能已经度过最困难时期，但能源价格波动仍是一个不确定因素。欧洲股市对此消息反应积极，主要指数上涨。",
    "中国人民银行今日宣布推出新的货币政策工具，旨在引导金融机构增加对小微企业和战略性新兴产业的支持。央行表示，将继续实施稳健的货币政策，保持流动性合理充裕，促进经济高质量发展。市场分析认为，这一举措反映了政策层面对实体经济的持续关注，有助于提振市场信心。",
    "日本央行决定维持超宽松货币政策不变，保持负利率和收益率曲线控制政策。央行行长表示，尽管通胀数据有所上升，但仍需要看到更持续的经济增长和工资上涨，才会考虑调整政策立场。受此影响，日元兑美元汇率继续走弱，创下近期新低，这有利于日本出口导向型企业的盈利前景。",
    "美国股市主要指数再创新高，其中科技股表现尤为突出。投资者对人工智能领域的持续热情推动了相关公司股价上涨。经济数据好于预期和企业财报普遍乐观也增强了市场信心。分析师指出，尽管估值已经较高，但强劲的企业盈利和技术创新仍然为股市提供支撑。"
]

# 模拟分析结果
ANALYSIS_TEMPLATES = [
    {
        "summary": "该文章主要讨论了{topic}的最新发展，指出{key_point}。这对{market}市场产生了{impact}影响。",
        "sentiment": ["积极", "中性", "谨慎", "负面"],
        "key_points": [
            "{point1}将对市场产生深远影响",
            "专家认为{point2}是未来趋势的关键指标",
            "{point3}表明经济正在经历结构性变化"
        ],
        "market_impact": [
            "{sector1}行业可能会受益于这一发展",
            "{sector2}面临一定的下行风险",
            "短期内，{asset}价格可能会出现波动",
            "长期来看，这一趋势有利于{market}的稳定增长"
        ],
        "risk_analysis": [
            "主要风险包括{risk1}和{risk2}",
            "投资者应密切关注{indicator}的变化",
            "政策不确定性是一个需要注意的因素"
        ],
        "recommendation": [
            "建议投资者保持{strategy}策略",
            "可适当增加对{sector3}的配置",
            "密切关注{event}带来的市场机会"
        ]
    }
]

# 生成文章函数
def generate_articles(count=10, source=None):
    articles = []
    now = datetime.now()
    
    sources = [source] if source else SOURCES
    
    for i in range(count):
        source_name = random.choice(sources) if not source else source
        
        article = {
            'id': str(uuid.uuid4()),
            'title': random.choice(TITLES),
            'summary': random.choice(CONTENTS)[:150] + "...",
            'content': random.choice(CONTENTS),
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

# 生成快讯函数
def generate_flash_news(count=20, source=None):
    flashes = []
    now = datetime.now()
    
    sources = [source] if source else SOURCES
    
    for i in range(count):
        source_name = random.choice(sources) if not source else source
        
        flash = {
            'id': str(uuid.uuid4()),
            'content': random.choice(TITLES),
            'source': source_name,
            'published_at': (now - timedelta(minutes=random.randint(5, 500))).isoformat(),
            'importance': random.randint(1, 5),
            'category': random.choice(['宏观经济', '股市', '债券', '外汇', '商品'])
        }
        flashes.append(flash)
    
    return flashes

# 生成分析结果
def generate_analysis():
    template = ANALYSIS_TEMPLATES[0]
    
    topics = ['货币政策', '通货膨胀', '经济增长', '市场波动', '全球贸易']
    key_points = ['利率趋势变化', '经济数据超预期', '央行政策转向', '市场情绪改善', '地缘政治影响']
    markets = ['股票', '债券', '外汇', '商品', '加密货币']
    impacts = ['显著', '温和', '有限', '持续', '短期']
    sectors = ['科技', '金融', '能源', '医疗', '消费', '制造', '房地产']
    assets = ['股票指数', '国债收益率', '大宗商品', '加密货币', '新兴市场货币']
    risks = ['政策紧缩', '通胀持续', '增长放缓', '市场泡沫', '流动性枯竭', '地缘冲突']
    indicators = ['通胀数据', '就业报告', 'GDP增长', '企业盈利', '消费者信心']
    strategies = ['多元化', '防御性', '进取性', '价值投资', '增长导向']
    events = ['央行会议', '经济数据发布', '财报季', '政策公告', '国际峰会']
    
    analysis = {
        "summary": template["summary"].format(
            topic=random.choice(topics),
            key_point=random.choice(key_points),
            market=random.choice(markets),
            impact=random.choice(impacts)
        ),
        "sentiment": random.choice(template["sentiment"]),
        "key_points": [
            template["key_points"][0].format(point1=random.choice(key_points)),
            template["key_points"][1].format(point2=random.choice(key_points)),
            template["key_points"][2].format(point3=random.choice(key_points))
        ],
        "market_impact": [
            template["market_impact"][0].format(sector1=random.choice(sectors)),
            template["market_impact"][1].format(sector2=random.choice(sectors)),
            template["market_impact"][2].format(asset=random.choice(assets)),
            template["market_impact"][3].format(market=random.choice(markets))
        ],
        "risk_analysis": [
            template["risk_analysis"][0].format(risk1=random.choice(risks), risk2=random.choice(risks)),
            template["risk_analysis"][1].format(indicator=random.choice(indicators)),
            template["risk_analysis"][2]
        ],
        "recommendation": [
            template["recommendation"][0].format(strategy=random.choice(strategies)),
            template["recommendation"][1].format(sector3=random.choice(sectors)),
            template["recommendation"][2].format(event=random.choice(events))
        ]
    }
    
    return analysis

# 生成搜索结果
def generate_search_results(query, category, max_results):
    return generate_articles(count=max_results)[:max_results]

# 定义API路由

# 健康检查接口
@app.route('/api/health', methods=['GET'])
def health_check():
    resp = jsonify({
        'status': 'ok',
        'server_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })
    return resp

@app.route('/api/articles', methods=['GET'])
def get_articles():
    # 获取查询参数
    limit = int(request.args.get('limit', 10))
    offset = int(request.args.get('offset', 0))
    source = request.args.get('source', None)
    
    # 获取模拟数据
    articles = generate_articles(limit, source)
    
    resp = jsonify({
        'count': len(articles),
        'articles': articles
    })
    return resp

@app.route('/api/articles/<article_id>', methods=['GET'])
def get_article(article_id):
    # 获取模拟文章详情
    source = request.args.get('source', None)
    article = generate_articles(1, source)[0]
    article['id'] = article_id
    
    resp = jsonify(article)
    return resp

@app.route('/api/articles/<article_id>/related', methods=['GET'])
def get_related_articles(article_id):
    # 获取查询参数
    limit = int(request.args.get('limit', 5))
    
    # 获取模拟相关文章
    related = generate_articles(limit)
    
    resp = jsonify({
        'article_id': article_id,
        'count': len(related),
        'articles': related
    })
    return resp

@app.route('/api/articles/<article_id>/analyze', methods=['POST'])
def analyze_article(article_id):
    # 生成模拟分析结果
    analysis = generate_analysis()
    
    resp = jsonify({
        'article_id': article_id,
        'analysis': analysis
    })
    return resp

@app.route('/api/flash', methods=['GET'])
def get_flash_news():
    # 获取查询参数
    limit = int(request.args.get('limit', 20))
    source = request.args.get('source', None)
    
    # 获取模拟快讯数据
    flashes = generate_flash_news(limit, source)
    
    resp = jsonify({
        'count': len(flashes),
        'flashes': flashes
    })
    return resp

@app.route('/api/search', methods=['GET'])
def search():
    # 获取查询参数
    query = request.args.get('q', '')
    category = request.args.get('category', 'finance')
    max_results = int(request.args.get('max_results', 20))
    
    if not query:
        return jsonify({'error': '查询参数不能为空'}), 400
    
    # 生成模拟搜索结果
    results = generate_articles(max_results)
    
    resp = jsonify({
        'query': query,
        'category': category,
        'count': len(results),
        'results': results
    })
    return resp

@app.route('/api/stats', methods=['GET'])
def get_stats():
    # 生成模拟统计数据
    stats = {
        'article_count': random.randint(1000, 5000),
        'source_count': len(SOURCES),
        'today_count': random.randint(50, 200),
        'analyzed_count': random.randint(500, 3000),
        'flash_count': random.randint(3000, 10000),
        'timestamp': datetime.now().isoformat()
    }
    
    resp = jsonify(stats)
    return resp

# 静态文件服务
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    # 检查是否请求的是HTML页面
    if path.endswith('.html') or path == '':
        path = 'index.html' if path == '' else path
    
    # 提供静态文件
    return send_from_directory('frontend', path)

# 主程序入口
if __name__ == '__main__':
    host = 'localhost'
    port = 8081  # 使用前端相同的端口
    logger.info(f"服务器启动在: http://{host}:{port}/")
    app.run(host=host, port=port, debug=True)
