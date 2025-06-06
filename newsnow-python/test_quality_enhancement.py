#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
内容质量增强功能测试脚本
"""

import requests
import json
import logging
import time
import uuid

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# API服务器配置
API_BASE_URL = "http://localhost:8088"

def test_article_enhancement():
    """测试文章增强功能"""
    
    print("内容质量增强功能测试")
    print("=" * 50)
    
    # 1. 测试添加一篇测试文章
    test_article = {
        "title": "比特币价格突破新高，市场情绪乐观",
        "content": "比特币价格今日突破65000美元，创下历史新高。分析师认为，机构投资者的持续买入和监管环境的改善是推动价格上涨的主要因素。市场预期比特币将继续上涨。",
        "source": "test_crypto_news",
        "url": "https://example.com/bitcoin-news",
        "published_at": "2025-06-05T22:00:00"
    }
    
    # 2. 先添加文章到数据库（通过直接数据库操作）
    from db.sqlite_client import SQLiteClient
    
    db_client = SQLiteClient()
    
    # 生成唯一的文章ID
    article_id = str(uuid.uuid4())
    test_article["id"] = article_id
    test_article["pubDate"] = test_article["published_at"]
    
    success = db_client.save_article(test_article)
    
    if success:
        logger.info(f"已添加测试文章，ID: {article_id}")
    else:
        logger.error("添加测试文章失败")
        return
    
    # 3. 测试单篇文章增强
    try:
        enhance_data = {
            "article_id": article_id,
            "source": test_article["source"]
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/quality/enhance",
            json=enhance_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                logger.info("✓ 文章增强成功")
                logger.info(f"  - 质量评分: {result['data'].get('quality_score', 'N/A')}")
                logger.info(f"  - 增强标题: {result['data'].get('enhanced_title', 'N/A')}")
                logger.info(f"  - 执行摘要: {result['data'].get('executive_summary', 'N/A')}")
            else:
                logger.warning(f"✗ 文章增强失败: {result.get('message', '未知错误')}")
        else:
            logger.error(f"✗ 文章增强请求失败: {response.status_code}")
            logger.error(f"响应内容: {response.text}")
            
    except Exception as e:
        logger.error(f"✗ 文章增强测试异常: {str(e)}")
    
    # 4. 测试获取增强后的统计信息
    try:
        response = requests.get(f"{API_BASE_URL}/api/quality/statistics", timeout=10)
        if response.status_code == 200:
            stats = response.json()
            logger.info("✓ 质量统计信息:")
            data = stats.get('data', {})
            logger.info(f"  - 总文章数: {data.get('total_articles', 0)}")
            logger.info(f"  - 已增强文章数: {data.get('enhanced_articles', 0)}")
            logger.info(f"  - 平均质量评分: {data.get('average_quality_score', 0)}")
            logger.info(f"  - 增强率: {data.get('enhancement_rate', 0):.2%}")
        else:
            logger.error(f"✗ 获取统计信息失败: {response.status_code}")
    except Exception as e:
        logger.error(f"✗ 统计信息测试异常: {str(e)}")
    
    # 5. 测试获取高质量文章
    try:
        response = requests.get(f"{API_BASE_URL}/api/quality/high-quality?limit=5", timeout=10)
        if response.status_code == 200:
            articles = response.json()
            logger.info(f"✓ 高质量文章: 找到 {len(articles.get('articles', []))} 篇")
            for article in articles.get('articles', [])[:3]:  # 显示前3篇
                logger.info(f"  - {article.get('title', 'N/A')} (评分: {article.get('quality_score', 'N/A')})")
        else:
            logger.error(f"✗ 获取高质量文章失败: {response.status_code}")
    except Exception as e:
        logger.error(f"✗ 高质量文章测试异常: {str(e)}")
    
    # 6. 测试内容策略生成
    try:
        strategy_data = {
            "theme": "加密货币市场分析",
            "days": 7
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/quality/strategy",
            json=strategy_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                logger.info("✓ 内容策略生成成功")
                strategy = result.get('data', {})
                logger.info(f"  - 主题: {strategy.get('theme', 'N/A')}")
                logger.info(f"  - 天数: {strategy.get('days', 'N/A')}")
                logger.info(f"  - 策略ID: {strategy.get('strategy_id', 'N/A')}")
            else:
                logger.warning(f"✗ 内容策略生成失败: {result.get('message', '未知错误')}")
        else:
            logger.error(f"✗ 内容策略请求失败: {response.status_code}")
            
    except Exception as e:
        logger.error(f"✗ 内容策略测试异常: {str(e)}")
    
    print("\n测试完成!")

if __name__ == "__main__":
    test_article_enhancement()
