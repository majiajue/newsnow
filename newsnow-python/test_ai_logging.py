#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试AI分析日志输出
"""

import os
import sys
import logging
from datetime import datetime

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f'logs/ai_test-{datetime.now().strftime("%Y%m%d")}.log')
    ]
)

def test_ai_logging():
    """测试AI分析日志输出"""
    print("🧪 测试AI分析日志输出...")
    
    try:
        # 测试Jin10爬虫
        from crawlers.jin10 import Jin10Crawler
        
        crawler = Jin10Crawler()
        print("✅ Jin10爬虫初始化成功")
        
        # 获取最新文章列表
        articles = crawler.get_latest_articles(limit=1)
        if not articles:
            print("❌ 未获取到文章")
            return False
            
        article = articles[0]
        print(f"📰 测试文章: {article['title']}")
        
        # 获取文章详情（包含AI分析）
        detail = crawler.get_article_detail(article['id'])
        
        if detail:
            print("✅ 文章详情获取成功")
            if 'analysis_data' in detail and detail['analysis_data']:
                print("✅ AI分析数据存在")
                analysis = detail['analysis_data']
                print(f"📊 分析标题: {analysis.get('analysis_title', '无')}")
                print(f"📈 内容质量分数: {analysis.get('content_quality_score', '无')}")
                print(f"🎯 原创性分数: {analysis.get('originality_score', '无')}")
                return True
            else:
                print("❌ 无AI分析数据")
                return False
        else:
            print("❌ 文章详情获取失败")
            return False
            
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_ai_logging()
    if success:
        print("\n🎉 AI分析日志测试成功！")
        print("现在应该能在日志中看到AI分析的详细信息了。")
    else:
        print("\n❌ AI分析日志测试失败")
        print("请检查环境变量配置和API密钥。") 