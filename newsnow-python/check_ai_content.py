#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
检查数据库中文章的AI处理状态
"""

from db.sqlite_client import SQLiteClient
import json

def check_ai_content():
    db = SQLiteClient()
    
    # 获取最新文章
    articles = db.get_latest_articles(limit=20)
    print(f"数据库中最新20篇文章:")
    print("=" * 80)
    
    processed_count = 0
    unprocessed_count = 0
    ai_content_count = 0
    
    for i, article in enumerate(articles):
        title = article.get('title', '无标题')[:50]
        processed = article.get('processed', 0)
        
        print(f"{i+1}. {title}...")
        print(f"   处理状态: {'已处理' if processed else '未处理'}")
        
        if processed:
            processed_count += 1
            # 检查AI内容
            metadata = article.get('metadata')
            if metadata:
                try:
                    metadata_obj = json.loads(metadata)
                    analysis_data = metadata_obj.get('analysisData', {})
                    
                    if analysis_data:
                        ai_content_count += 1
                        print(f"   ✅ AI分析标题: {analysis_data.get('analysis_title', '无')[:60]}...")
                        print(f"   📝 执行摘要: {analysis_data.get('executive_summary', '无')[:80]}...")
                        print(f"   🏷️ AI标签: {analysis_data.get('tags', '无')}")
                        print(f"   📊 质量评分: {analysis_data.get('content_quality_score', '无')}")
                        print(f"   🎯 原创性评分: {analysis_data.get('originality_score', '无')}")
                        print(f"   🤖 AI模型: {analysis_data.get('ai_model', '无')}")
                    else:
                        print(f"   ❌ 无AI分析数据")
                except Exception as e:
                    print(f"   ❌ AI数据解析失败: {e}")
            else:
                print(f"   ❌ 无AI元数据")
        else:
            unprocessed_count += 1
            
        print()
    
    print("=" * 80)
    print(f"统计结果:")
    print(f"已处理文章: {processed_count}")
    print(f"有AI内容文章: {ai_content_count}")
    print(f"未处理文章: {unprocessed_count}")
    print(f"处理率: {processed_count/(processed_count+unprocessed_count)*100:.1f}%")
    print(f"AI内容覆盖率: {ai_content_count/(processed_count+unprocessed_count)*100:.1f}%")
    
    # 检查未处理文章
    unprocessed = db.get_unprocessed_articles(limit=50)
    print(f"\n未处理文章总数: {len(unprocessed)}")

if __name__ == "__main__":
    check_ai_content() 