#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查AI分析状态和配置
"""

import os
import sys
import logging

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_ai_status():
    """检查AI分析状态"""
    print("🔍 检查AI分析状态...")
    
    # 1. 检查环境变量
    print("\n1. 环境变量检查:")
    deepseek_key = os.getenv('DEEPSEEK_API_KEY')
    if deepseek_key:
        print(f"   ✅ DEEPSEEK_API_KEY: 已配置 (长度: {len(deepseek_key)})")
    else:
        print("   ❌ DEEPSEEK_API_KEY: 未配置")
    
    # 2. 检查AI服务初始化
    print("\n2. AI服务初始化检查:")
    try:
        from utils.enhanced_ai_service import EnhancedFinanceAnalyzer
        analyzer = EnhancedFinanceAnalyzer()
        if analyzer.api_key:
            print("   ✅ AI分析器初始化成功")
        else:
            print("   ❌ AI分析器初始化失败：无API密钥")
    except Exception as e:
        print(f"   ❌ AI分析器初始化异常: {e}")
    
    # 3. 检查爬虫配置
    print("\n3. 爬虫配置检查:")
    try:
        from crawlers.jin10 import Jin10Crawler
        crawler = Jin10Crawler()
        if hasattr(crawler, 'finance_analyzer') and crawler.finance_analyzer:
            print("   ✅ Jin10爬虫AI分析器配置正常")
        else:
            print("   ❌ Jin10爬虫AI分析器配置异常")
    except Exception as e:
        print(f"   ❌ Jin10爬虫配置检查异常: {e}")
    
    # 4. 检查数据库中的AI分析数据
    print("\n4. 数据库AI分析数据检查:")
    try:
        from db.sqlite_client import SQLiteClient
        db = SQLiteClient()
        
        # 查询最近的文章
        cursor = db.conn.cursor()
        cursor.execute("""
            SELECT id, title, processed, 
                   CASE WHEN analysis_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_analysis
            FROM articles 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        
        articles = cursor.fetchall()
        if articles:
            print("   最近5篇文章的AI分析状态:")
            for article in articles:
                article_id, title, processed, has_analysis = article
                status = "✅" if has_analysis == "YES" else "❌"
                print(f"   {status} [{article_id}] {title[:50]}... (已处理: {processed}, AI分析: {has_analysis})")
        else:
            print("   ❌ 数据库中没有文章")
            
    except Exception as e:
        print(f"   ❌ 数据库检查异常: {e}")
    
    # 5. 检查日志配置
    print("\n5. 日志配置检查:")
    logger = logging.getLogger('utils.enhanced_ai_service')
    if logger.handlers:
        print(f"   ✅ AI服务日志配置正常 (处理器数量: {len(logger.handlers)})")
    else:
        print("   ⚠️ AI服务日志配置可能需要调整")

if __name__ == "__main__":
    check_ai_status()
    print("\n📋 状态检查完成！")
    print("如果发现问题，请检查:")
    print("1. 服务器上的环境变量配置")
    print("2. API密钥的有效性")
    print("3. 网络连接和API访问权限") 