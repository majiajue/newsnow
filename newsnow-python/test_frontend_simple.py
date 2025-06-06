#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
简单测试前端API数据结构
"""

import requests
import json

def test_api_data_structure():
    """测试API数据结构"""
    print("🔍 测试前端API数据结构")
    print("=" * 50)
    
    article_id = "20250606221853090800"
    api_url = f"http://localhost:3002/api/news/{article_id}"
    
    try:
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ API响应成功")
            print(f"📊 数据字段: {list(data.keys())}")
            
            # 检查AI分析字段
            if 'aiAnalysis' in data and data['aiAnalysis']:
                ai_analysis = data['aiAnalysis']
                print(f"\n🤖 aiAnalysis字段:")
                print(f"   类型: {type(ai_analysis)}")
                print(f"   字段: {list(ai_analysis.keys()) if isinstance(ai_analysis, dict) else 'N/A'}")
                
                if isinstance(ai_analysis, dict):
                    print(f"\n📋 AI分析详细内容:")
                    for key, value in ai_analysis.items():
                        if isinstance(value, str):
                            display_value = value[:100] + "..." if len(value) > 100 else value
                            print(f"   {key}: {display_value}")
                        elif isinstance(value, list):
                            print(f"   {key}: 列表，{len(value)}项")
                            for i, item in enumerate(value[:2], 1):  # 显示前2项
                                item_str = str(item)[:80] + "..." if len(str(item)) > 80 else str(item)
                                print(f"     {i}. {item_str}")
                        else:
                            print(f"   {key}: {value}")
                            
                # 验证关键字段
                required_fields = ['summary', 'keyPoints', 'background', 'impact', 'opinion']
                missing_fields = [field for field in required_fields if field not in ai_analysis]
                if missing_fields:
                    print(f"\n⚠️ 缺少字段: {missing_fields}")
                else:
                    print(f"\n✅ 所有关键字段都存在")
                    
            else:
                print("❌ 无aiAnalysis字段或字段为空")
            
            # 检查metadata字段
            if 'metadata' in data and data['metadata']:
                metadata = data['metadata']
                print(f"\n📊 metadata字段:")
                print(f"   类型: {type(metadata)}")
                print(f"   字段数量: {len(metadata) if isinstance(metadata, dict) else 'N/A'}")
                
                if isinstance(metadata, dict):
                    key_fields = ['executive_summary', 'content_quality_score', 'originality_score', 'ai_model']
                    for key in key_fields:
                        if key in metadata:
                            value = metadata[key]
                            if isinstance(value, str):
                                display_value = value[:80] + "..." if len(value) > 80 else value
                                print(f"   {key}: {display_value}")
                            else:
                                print(f"   {key}: {value}")
            else:
                print("❌ 无metadata字段")
                
            # 检查基本文章信息
            print(f"\n📰 基本文章信息:")
            print(f"   标题: {data.get('title', 'N/A')[:80]}...")
            print(f"   来源: {data.get('source', 'N/A')}")
            print(f"   发布时间: {data.get('publishedAt', 'N/A')}")
            print(f"   内容长度: {len(data.get('content', ''))}")
            
        else:
            print(f"❌ API请求失败: {response.status_code}")
            print(f"   响应内容: {response.text[:200]}...")
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到前端服务器")
        print("   请确保前端服务器在 http://localhost:3002 运行")
    except Exception as e:
        print(f"❌ API测试失败: {str(e)}")

def test_backend_comparison():
    """对比后端API"""
    print("\n🔍 对比后端API数据")
    print("=" * 50)
    
    article_id = "20250606221853090800"
    backend_url = f"http://localhost:5001/api/news/{article_id}"
    
    try:
        response = requests.get(backend_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ 后端API响应成功")
            
            # 检查metadata
            if 'metadata' in data and data['metadata']:
                metadata = data['metadata']
                print(f"📊 后端metadata字段数量: {len(metadata)}")
                print(f"   主要字段: {list(metadata.keys())[:8]}")
                
                # 检查关键AI分析字段
                ai_fields = ['executive_summary', 'market_analysis', 'investment_perspective', 'technical_analysis']
                for field in ai_fields:
                    if field in metadata:
                        value = metadata[field]
                        if isinstance(value, str):
                            print(f"   {field}: {value[:60]}...")
                        elif isinstance(value, dict):
                            print(f"   {field}: 字典，{len(value)}个子字段")
                        else:
                            print(f"   {field}: {type(value)}")
            else:
                print("❌ 后端无metadata字段")
                
        else:
            print(f"❌ 后端API请求失败: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 后端API测试失败: {str(e)}")

def main():
    """主函数"""
    test_api_data_structure()
    test_backend_comparison()
    
    print("\n" + "=" * 50)
    print("✅ 测试完成")
    print("\n💡 总结:")
    print("   1. 如果前端API返回了完整的aiAnalysis数据，说明API层正常")
    print("   2. 如果页面仍然没有显示AI分析，问题在前端组件渲染")
    print("   3. 检查浏览器开发者工具的控制台是否有错误")

if __name__ == "__main__":
    main() 