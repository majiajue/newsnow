#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI分析功能测试脚本
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.enhanced_ai_service import EnhancedFinanceAnalyzer

def test_ai_analysis():
    """测试AI分析功能"""
    print("🧪 测试AI分析功能...")
    
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
    
    # 执行分析
    result = analyzer.generate_comprehensive_analysis(
        title=test_title,
        content=test_content,
        search_results=mock_search_results
    )
    
    if result:
        print("✅ AI分析测试成功！")
        print(f"分析标题: {result.get('analysis_title', 'N/A')}")
        print(f"内容质量评分: {result.get('content_quality_score', 'N/A')}")
        print(f"原创性评分: {result.get('originality_score', 'N/A')}")
        print(f"生成时间: {result.get('generated_at', 'N/A')}")
        
        # 显示部分分析内容
        if 'executive_summary' in result:
            print(f"\n执行摘要: {result['executive_summary']}")
        
        return True
    else:
        print("❌ AI分析测试失败")
        return False

if __name__ == "__main__":
    test_ai_analysis()
