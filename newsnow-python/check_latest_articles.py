#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查最新文章的AI分析数据
"""

import os
import sys
import sqlite3
import json
from datetime import datetime

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_latest_articles():
    """检查最新文章的AI分析数据"""
    print("📰 检查最新文章的AI分析数据...")
    
    try:
        # 连接数据库
        db_path = "data/news.db"
        if not os.path.exists(db_path):
            print(f"❌ 数据库文件不存在: {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 查询最新的5篇文章
        cursor.execute("""
            SELECT id, title, source, processed, created_at, updated_at,
                   CASE WHEN analysis_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_analysis,
                   CASE WHEN analysis_data IS NOT NULL THEN LENGTH(analysis_data) ELSE 0 END as analysis_size
            FROM articles 
            ORDER BY created_at DESC 
            LIMIT 10
        """)
        
        articles = cursor.fetchall()
        
        if not articles:
            print("❌ 数据库中没有文章")
            return False
        
        print(f"\n📊 最新 {len(articles)} 篇文章状态:")
        print("-" * 100)
        print(f"{'ID':<20} {'标题':<40} {'来源':<10} {'已处理':<8} {'AI分析':<8} {'分析大小':<10}")
        print("-" * 100)
        
        for article in articles:
            article_id, title, source, processed, created_at, updated_at, has_analysis, analysis_size = article
            
            # 截断标题显示
            display_title = title[:37] + "..." if len(title) > 40 else title
            
            status_icon = "✅" if has_analysis == "YES" else "❌"
            
            print(f"{article_id:<20} {display_title:<40} {source:<10} {processed:<8} {status_icon:<8} {analysis_size:<10}")
        
        # 查看最新一篇有AI分析的文章详情
        cursor.execute("""
            SELECT id, title, analysis_data
            FROM articles 
            WHERE analysis_data IS NOT NULL
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        
        latest_with_ai = cursor.fetchone()
        if latest_with_ai:
            article_id, title, analysis_data = latest_with_ai
            print(f"\n🔍 最新AI分析文章详情:")
            print(f"ID: {article_id}")
            print(f"标题: {title}")
            
            try:
                analysis = json.loads(analysis_data)
                print(f"\n📊 AI分析数据:")
                print(f"   分析标题: {analysis.get('analysis_title', '无')}")
                print(f"   执行摘要: {analysis.get('executive_summary', '无')[:100]}...")
                print(f"   内容质量分数: {analysis.get('content_quality_score', '无')}")
                print(f"   原创性分数: {analysis.get('originality_score', '无')}")
                print(f"   AI模型: {analysis.get('ai_model', '无')}")
                print(f"   生成时间: {analysis.get('generated_at', '无')}")
                
                # 检查关键字段
                required_fields = ['analysis_title', 'executive_summary', 'market_analysis', 'investment_perspective']
                missing_fields = [field for field in required_fields if field not in analysis]
                
                if missing_fields:
                    print(f"   ⚠️ 缺少字段: {', '.join(missing_fields)}")
                else:
                    print(f"   ✅ 所有关键字段都存在")
                
            except json.JSONDecodeError as e:
                print(f"   ❌ AI分析数据JSON解析失败: {e}")
        else:
            print("\n❌ 没有找到包含AI分析的文章")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 检查过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = check_latest_articles()
    if success:
        print("\n✅ 文章检查完成！")
    else:
        print("\n❌ 文章检查失败") 