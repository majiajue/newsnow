#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试API是否正确返回AI分析数据
"""

import requests
import json
import sys
import os

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.sqlite_client import SQLiteClient

def test_database_analysis_data():
    """测试数据库中的AI分析数据"""
    print("🔍 测试数据库中的AI分析数据...")
    
    db_client = SQLiteClient()
    
    # 获取最新文章
    articles = db_client.get_latest_articles(limit=5)
    
    print(f"📊 获取到 {len(articles)} 篇文章")
    
    for i, article in enumerate(articles, 1):
        print(f"\n📰 文章 {i}:")
        print(f"   标题: {article.get('title', 'N/A')[:50]}...")
        print(f"   来源: {article.get('source', 'N/A')}")
        print(f"   处理状态: {article.get('processed', 'N/A')}")
        
        # 检查是否有AI分析数据
        if 'analysis_data' in article and article['analysis_data']:
            print(f"   ✅ 包含AI分析数据")
            analysis = article['analysis_data']
            if isinstance(analysis, dict):
                print(f"      - 分析字段数: {len(analysis)}")
                for key in list(analysis.keys())[:3]:  # 显示前3个字段
                    value = analysis[key]
                    if isinstance(value, str) and len(value) > 50:
                        value = value[:50] + "..."
                    print(f"      - {key}: {value}")
            else:
                print(f"      - 数据类型: {type(analysis)}")
        else:
            print(f"   ❌ 无AI分析数据")
        
        # 检查原始metadata字段
        if 'metadata' in article and article['metadata']:
            print(f"   📝 原始metadata存在: {len(str(article['metadata']))} 字符")

def test_api_response():
    """测试API响应"""
    print("\n🌐 测试API响应...")
    
    api_url = "http://localhost:5001/api/articles"
    
    try:
        response = requests.get(api_url, params={'limit': 3}, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            articles = data.get('articles', [])
            
            print(f"📊 API返回 {len(articles)} 篇文章")
            
            for i, article in enumerate(articles, 1):
                print(f"\n📰 API文章 {i}:")
                print(f"   标题: {article.get('title', 'N/A')[:50]}...")
                print(f"   来源: {article.get('source', 'N/A')}")
                
                # 检查是否有AI分析数据
                if 'analysis_data' in article and article['analysis_data']:
                    print(f"   ✅ API返回包含AI分析数据")
                    analysis = article['analysis_data']
                    if isinstance(analysis, dict):
                        print(f"      - 分析字段数: {len(analysis)}")
                        for key in list(analysis.keys())[:2]:  # 显示前2个字段
                            value = analysis[key]
                            if isinstance(value, str) and len(value) > 30:
                                value = value[:30] + "..."
                            print(f"      - {key}: {value}")
                else:
                    print(f"   ❌ API返回无AI分析数据")
        else:
            print(f"❌ API请求失败: {response.status_code}")
            print(f"   响应: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到API服务器 (http://localhost:5001)")
        print("   请确保API服务器正在运行")
    except Exception as e:
        print(f"❌ API测试异常: {str(e)}")

def test_specific_article():
    """测试特定文章的详情"""
    print("\n🔍 测试特定文章详情...")
    
    db_client = SQLiteClient()
    
    # 获取一篇有AI分析的文章
    articles = db_client.get_latest_articles(limit=10)
    
    target_article = None
    for article in articles:
        if article.get('processed') == 1 and article.get('metadata'):
            target_article = article
            break
    
    if target_article:
        article_id = target_article['id']
        print(f"📰 测试文章: {target_article.get('title', 'N/A')[:50]}...")
        
        # 测试数据库直接查询
        article_detail = db_client.get_article_by_id(article_id)
        if article_detail and 'metadata' in article_detail and article_detail['metadata']:
            print(f"   ✅ 数据库查询包含metadata")
            try:
                metadata = json.loads(article_detail['metadata']) if isinstance(article_detail['metadata'], str) else article_detail['metadata']
                print(f"      - metadata字段数: {len(metadata) if isinstance(metadata, dict) else 'N/A'}")
            except:
                print(f"      - metadata解析失败")
        
        # 测试API查询
        try:
            api_url = f"http://localhost:5001/api/articles/{article_id}"
            response = requests.get(api_url, timeout=10)
            
            if response.status_code == 200:
                api_article = response.json()
                if 'analysis_data' in api_article and api_article['analysis_data']:
                    print(f"   ✅ API查询包含analysis_data")
                    analysis = api_article['analysis_data']
                    print(f"      - analysis_data字段数: {len(analysis) if isinstance(analysis, dict) else 'N/A'}")
                else:
                    print(f"   ❌ API查询无analysis_data")
            else:
                print(f"   ❌ API查询失败: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("   ❌ 无法连接到API服务器")
        except Exception as e:
            print(f"   ❌ API查询异常: {str(e)}")
    else:
        print("❌ 未找到有AI分析的文章")

def main():
    """主函数"""
    print("🧪 测试AI分析数据在API中的显示")
    print("=" * 50)
    
    # 测试数据库
    test_database_analysis_data()
    
    # 测试API
    test_api_response()
    
    # 测试特定文章
    test_specific_article()
    
    print("\n" + "=" * 50)
    print("✅ 测试完成")

if __name__ == "__main__":
    main() 