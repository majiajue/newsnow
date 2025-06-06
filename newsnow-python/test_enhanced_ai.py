#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增强版AI分析功能测试脚本
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 手动加载环境变量
env_file = ".env"
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

from utils.enhanced_ai_service import EnhancedFinanceAnalyzer

def test_ai_analysis():
    """测试AI分析功能"""
    print("🧪 测试增强版AI分析功能...")
    
    analyzer = EnhancedFinanceAnalyzer()
    
    # 测试数据
    test_title = "美联储宣布加息25个基点"
    test_content = """
    美联储在最新的货币政策会议上宣布将联邦基金利率上调25个基点，
    这是今年第三次加息。美联储主席表示，此次加息是为了应对持续的通胀压力，
    并确保经济的长期稳定增长。市场对此反应不一，股市出现波动。
    """
    
    # 模拟搜索结果
    mock_search_results = [
        {
            "title": "全球央行加息趋势分析",
            "content": "全球多个央行都在采取紧缩货币政策来应对通胀..."
        },
        {
            "title": "加息对股市的历史影响",
            "content": "历史数据显示，加息通常会对股市产生短期负面影响..."
        }
    ]
    
    print(f"📝 测试标题: {test_title}")
    print(f"📄 内容长度: {len(test_content)} 字符")
    print(f"🔍 搜索结果: {len(mock_search_results)} 条")
    
    # 执行分析
    print("\n🚀 开始AI分析...")
    result = analyzer.generate_comprehensive_analysis(
        title=test_title,
        content=test_content,
        search_results=mock_search_results
    )
    
    if result:
        print("✅ AI分析测试成功！")
        print("\n📊 分析结果概览:")
        print(f"  分析标题: {result.get('analysis_title', 'N/A')}")
        print(f"  内容质量评分: {result.get('content_quality_score', 'N/A')}")
        print(f"  原创性评分: {result.get('originality_score', 'N/A')}")
        print(f"  生成时间: {result.get('generated_at', 'N/A')}")
        print(f"  AI模型: {result.get('ai_model', 'N/A')}")
        
        # 显示部分分析内容
        if 'executive_summary' in result:
            print(f"\n📋 执行摘要:")
            print(f"  {result['executive_summary']}")
        
        if 'market_analysis' in result:
            market_analysis = result['market_analysis']
            print(f"\n📈 市场分析:")
            if 'immediate_impact' in market_analysis:
                print(f"  即时影响: {market_analysis['immediate_impact'][:100]}...")
            if 'affected_sectors' in market_analysis:
                sectors = market_analysis['affected_sectors']
                print(f"  受影响行业: {len(sectors)} 个")
        
        if 'tags' in result:
            print(f"\n🏷️ 标签: {', '.join(result['tags'])}")
        
        if 'seo_keywords' in result:
            print(f"🔍 SEO关键词: {', '.join(result['seo_keywords'])}")
        
        print(f"\n✨ 这样的AI分析内容应该能够通过AdSense审查！")
        return True
    else:
        print("❌ AI分析测试失败")
        return False

if __name__ == "__main__":
    test_ai_analysis() 