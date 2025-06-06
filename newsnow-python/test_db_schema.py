#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
数据库表结构测试脚本
"""

import os
import sys
import logging
import sqlite3
from datetime import datetime

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.sqlite_client import SQLiteClient

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def test_database_schema():
    """测试数据库表结构"""
    
    logger.info("=== 测试数据库表结构 ===")
    
    try:
        # 初始化数据库客户端（这会创建新的数据库和表）
        db_client = SQLiteClient()
        
        # 检查表结构
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
                            'executive_summary', 'key_insights', 'expert_opinion',
                            'actionable_advice', 'seo_keywords', 'originality_percentage',
                            'enhancement_date', 'meta_description', 'h1_heading',
                            'h2_headings', 'suggested_tags', 'internal_links']
            
            existing_fields = [col[1] for col in columns]
            
            missing_fields = []
            for field in quality_fields:
                if field in existing_fields:
                    logger.info(f"✓ 质量字段 {field} 存在")
                else:
                    logger.warning(f"✗ 质量字段 {field} 不存在")
                    missing_fields.append(field)
            
            if missing_fields:
                logger.error(f"缺少质量字段: {missing_fields}")
                return False
            else:
                logger.info("所有质量增强字段都存在!")
                return True
        
    except Exception as e:
        logger.error(f"数据库表结构检查失败: {str(e)}", exc_info=True)
        return False

def test_database_operations():
    """测试数据库操作"""
    
    logger.info("=== 测试数据库操作 ===")
    
    try:
        db_client = SQLiteClient()
        
        # 1. 测试插入文章
        test_article = {
            'id': 'test_001',
            'title': '测试文章标题',
            'content': '这是一篇测试文章的内容...',
            'url': 'https://example.com/test_001',
            'pub_date': datetime.now().isoformat(),
            'source': 'test_source',
            'category': 'finance',
            'summary': '测试文章摘要',
            'author': '测试作者',
            'tags': ['测试', '金融']
        }
        
        success = db_client.save_article(test_article)
        if success:
            logger.info("✓ 文章保存成功")
        else:
            logger.error("✗ 文章保存失败")
            return False
        
        # 2. 测试获取待增强文章
        articles_to_enhance = db_client.get_articles_for_enhancement(limit=5)
        logger.info(f"✓ 找到 {len(articles_to_enhance)} 篇待增强文章")
        
        # 3. 测试更新文章质量数据
        if articles_to_enhance:
            test_enhanced_article = {
                'id': articles_to_enhance[0]['id'],
                'source': articles_to_enhance[0]['source'],
                'quality_score': 8,
                'enhanced_title': '增强后的文章标题',
                'executive_summary': '这是执行摘要',
                'key_insights': ['关键洞察1', '关键洞察2'],
                'expert_opinion': {'analysis': '专家分析'},
                'actionable_advice': ['建议1', '建议2'],
                'seo_keywords': ['关键词1', '关键词2'],
                'originality_percentage': '85%',
                'enhancement_date': datetime.now().isoformat(),
                'meta_description': 'SEO元描述',
                'h1_heading': 'H1标题',
                'h2_headings': ['H2标题1', 'H2标题2'],
                'suggested_tags': ['标签1', '标签2'],
                'internal_links': ['链接1', '链接2']
            }
            
            success = db_client.update_article_quality(test_enhanced_article)
            if success:
                logger.info("✓ 文章质量数据更新成功")
            else:
                logger.error("✗ 文章质量数据更新失败")
                return False
        
        # 4. 测试获取质量统计
        stats = db_client.get_quality_statistics()
        logger.info(f"✓ 质量统计: {stats}")
        
        # 5. 测试获取高质量文章
        high_quality_articles = db_client.get_high_quality_articles(min_score=5, limit=10)
        logger.info(f"✓ 找到 {len(high_quality_articles)} 篇高质量文章")
        
        logger.info("所有数据库操作测试通过!")
        return True
        
    except Exception as e:
        logger.error(f"数据库操作测试失败: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    print("NewsNow 数据库表结构和操作测试")
    print("=" * 50)
    
    # 测试数据库表结构
    schema_ok = test_database_schema()
    
    print("\n" + "=" * 50)
    
    if schema_ok:
        # 测试数据库操作
        operations_ok = test_database_operations()
        
        if operations_ok:
            print("\n✓ 所有测试通过! 内容质量增强功能的数据库支持已就绪")
        else:
            print("\n✗ 数据库操作测试失败")
    else:
        print("\n✗ 数据库表结构测试失败")
    
    print("\n测试完成!")
