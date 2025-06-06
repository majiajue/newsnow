#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试前端API是否正确返回AI分析数据
"""

import requests
import json

def test_frontend_api():
    """测试前端API"""
    print("🧪 测试前端API返回AI分析数据")
    print("=" * 50)
    
    # 测试文章ID
    article_id = "20250606221853090800"
    frontend_url = f"http://localhost:3002/api/news/{article_id}"
    
    try:
        response = requests.get(frontend_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ 前端API响应成功")
            print(f"📰 文章标题: {data.get('title', 'N/A')[:50]}...")
            print(f"📅 发布时间: {data.get('publishedAt', 'N/A')}")
            print(f"📝 来源: {data.get('source', 'N/A')}")
            
            # 检查AI分析数据
            if 'aiAnalysis' in data and data['aiAnalysis']:
                ai_analysis = data['aiAnalysis']
                print(f"\n🤖 AI分析数据:")
                print(f"   摘要: {ai_analysis.get('summary', 'N/A')[:100]}...")
                print(f"   关键点数量: {len(ai_analysis.get('keyPoints', []))}")
                print(f"   背景信息: {ai_analysis.get('background', 'N/A')[:100]}...")
                print(f"   影响分析: {ai_analysis.get('impact', 'N/A')[:100]}...")
                print(f"   投资观点: {ai_analysis.get('opinion', 'N/A')[:100]}...")
                print(f"   建议数量: {len(ai_analysis.get('suggestions', []))}")
                print(f"   情感倾向: {ai_analysis.get('sentiment', 'N/A')}")
                print(f"   标签数量: {len(ai_analysis.get('tags', []))}")
                
                # 显示关键点
                if ai_analysis.get('keyPoints'):
                    print(f"\n📋 关键点:")
                    for i, point in enumerate(ai_analysis['keyPoints'][:3], 1):
                        print(f"   {i}. {point[:80]}...")
                
                # 显示标签
                if ai_analysis.get('tags'):
                    print(f"\n🏷️ 标签: {', '.join(ai_analysis['tags'])}")
                
            else:
                print(f"\n❌ 无AI分析数据")
            
            # 检查原始metadata
            if 'metadata' in data and data['metadata']:
                metadata = data['metadata']
                print(f"\n📊 原始metadata:")
                print(f"   质量评分: {metadata.get('content_quality_score', 'N/A')}")
                print(f"   原创性评分: {metadata.get('originality_score', 'N/A')}")
                print(f"   AI模型: {metadata.get('ai_model', 'N/A')}")
                print(f"   分析版本: {metadata.get('analysis_version', 'N/A')}")
                print(f"   生成时间: {metadata.get('generated_at', 'N/A')}")
            else:
                print(f"\n❌ 无metadata数据")
                
        else:
            print(f"❌ 前端API请求失败: {response.status_code}")
            print(f"   响应: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到前端API服务器 (http://localhost:3002)")
        print("   请确保前端服务器正在运行")
    except Exception as e:
        print(f"❌ 前端API测试异常: {str(e)}")

def test_backend_api():
    """对比测试后端API"""
    print("\n🔍 对比测试后端API")
    print("=" * 50)
    
    # 测试文章ID
    article_id = "20250606221853090800"
    backend_url = f"http://localhost:5001/api/news/{article_id}"
    
    try:
        response = requests.get(backend_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ 后端API响应成功")
            print(f"📰 文章标题: {data.get('title', 'N/A')[:50]}...")
            
            # 检查metadata
            if 'metadata' in data and data['metadata']:
                metadata = data['metadata']
                print(f"\n📊 后端metadata字段:")
                print(f"   字段数量: {len(metadata)}")
                print(f"   主要字段: {list(metadata.keys())[:5]}")
                print(f"   执行摘要: {metadata.get('executive_summary', 'N/A')[:100]}...")
            else:
                print(f"\n❌ 后端无metadata数据")
                
        else:
            print(f"❌ 后端API请求失败: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 后端API测试异常: {str(e)}")

def main():
    """主函数"""
    test_frontend_api()
    test_backend_api()
    
    print("\n" + "=" * 50)
    print("✅ 测试完成")
    print("\n💡 如果前端API返回了AI分析数据，但页面没有显示，")
    print("   请检查前端组件是否正确渲染aiAnalysis字段")

if __name__ == "__main__":
    main() 