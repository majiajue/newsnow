#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
内容质量增强功能测试脚本
"""

import os
import sys
import logging
from datetime import datetime

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from processors.content_quality_enhancer import ContentQualityEnhancer
from db.sqlite_client import SQLiteClient

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('test_content_quality.log', encoding='utf-8')
    ]
)

logger = logging.getLogger(__name__)

def test_content_quality_enhancement():
    """测试内容质量增强功能"""
    
    logger.info("开始测试内容质量增强功能")
    
    try:
        # 初始化组件
        db_client = SQLiteClient()
        enhancer = ContentQualityEnhancer()
        
        # 1. 获取数据库统计信息
        logger.info("=== 1. 获取数据库统计信息 ===")
        stats = db_client.get_quality_statistics()
        logger.info(f"数据库统计: {stats}")
        
        # 2. 获取需要增强的文章
        logger.info("=== 2. 获取需要增强的文章 ===")
        articles_to_enhance = db_client.get_articles_for_enhancement(limit=5)
        logger.info(f"找到 {len(articles_to_enhance)} 篇待增强文章")
        
        if not articles_to_enhance:
            logger.warning("没有找到待增强的文章，请先运行爬虫获取一些文章")
            return
        
        # 3. 增强第一篇文章
        logger.info("=== 3. 增强第一篇文章 ===")
        test_article = articles_to_enhance[0]
        logger.info(f"测试文章: {test_article.get('title', 'Unknown')}")
        
        enhanced_article = enhancer.enhance_article(test_article['id'], test_article['source'])
        
        if enhanced_article:
            logger.info("文章增强成功!")
            logger.info(f"质量评分: {enhanced_article.get('quality_score', 'N/A')}")
            logger.info(f"增强标题: {enhanced_article.get('enhanced_title', 'N/A')}")
            logger.info(f"执行摘要: {enhanced_article.get('executive_summary', 'N/A')[:100]}...")
        else:
            logger.error("文章增强失败")
            return
        
        # 4. 批量增强测试
        logger.info("=== 4. 批量增强测试 ===")
        if len(articles_to_enhance) > 1:
            article_ids = [(article['id'], article['source']) for article in articles_to_enhance[1:3]]
            batch_results = enhancer.batch_enhance_articles(article_ids)
            logger.info(f"批量增强结果: 成功 {batch_results['successful']}, 失败 {batch_results['failed']}")
        
        # 5. 获取内容表现分析
        logger.info("=== 5. 获取内容表现分析 ===")
        performance = enhancer.analyze_content_performance()
        logger.info(f"内容表现分析: {performance}")
        
        # 6. 生成内容策略
        logger.info("=== 6. 生成内容策略 ===")
        strategy = enhancer.generate_content_strategy("金融科技发展趋势")
        if strategy:
            logger.info(f"内容策略主题: {strategy.get('theme', 'N/A')}")
            logger.info(f"建议文章数量: {len(strategy.get('article_suggestions', []))}")
        
        # 7. 获取高质量文章
        logger.info("=== 7. 获取高质量文章 ===")
        high_quality_articles = db_client.get_high_quality_articles(min_score=7, limit=5)
        logger.info(f"找到 {len(high_quality_articles)} 篇高质量文章")
        
        for article in high_quality_articles:
            logger.info(f"- {article.get('title', 'Unknown')} (评分: {article.get('quality_score', 'N/A')})")
        
        # 8. 更新后的统计信息
        logger.info("=== 8. 更新后的统计信息 ===")
        updated_stats = db_client.get_quality_statistics()
        logger.info(f"更新后统计: {updated_stats}")
        
        logger.info("内容质量增强功能测试完成!")
        
    except Exception as e:
        logger.error(f"测试过程中发生错误: {str(e)}", exc_info=True)

def test_database_schema():
    """测试数据库表结构"""
    
    logger.info("=== 测试数据库表结构 ===")
    
    try:
        db_client = SQLiteClient()
        
        # 检查表结构
        import sqlite3
        with sqlite3.connect(db_client.db_path) as conn:
            cursor = conn.cursor()
            
            # 获取articles表结构
            cursor.execute("PRAGMA table_info(articles)")
            columns = cursor.fetchall()
            
            logger.info("Articles表字段:")
            for column in columns:
                logger.info(f"  - {column[1]} ({column[2]})")
            
            # 检查是否有质量增强相关字段
            quality_fields = ['quality_enhanced', 'quality_score', 'enhanced_title', 
                            'executive_summary', 'key_insights', 'expert_opinion']
            
            existing_fields = [col[1] for col in columns]
            
            for field in quality_fields:
                if field in existing_fields:
                    logger.info(f"✓ 质量字段 {field} 存在")
                else:
                    logger.warning(f"✗ 质量字段 {field} 不存在")
        
        logger.info("数据库表结构检查完成")
        
    except Exception as e:
        logger.error(f"数据库表结构检查失败: {str(e)}", exc_info=True)

if __name__ == "__main__":
    print("NewsNow 内容质量增强功能测试")
    print("=" * 50)
    
    # 检查环境变量
    if not os.getenv('DEEPSEEK_API_KEY'):
        print("警告: 未设置 DEEPSEEK_API_KEY 环境变量")
        print("请设置该变量以启用AI功能")
    
    # 测试数据库表结构
    test_database_schema()
    
    print("\n" + "=" * 50)
    
    # 测试内容质量增强功能
    test_content_quality_enhancement()
    
    print("\n测试完成! 请查看日志文件 test_content_quality.log 获取详细信息")
