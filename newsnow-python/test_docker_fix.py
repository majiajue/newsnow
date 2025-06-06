#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试Docker修复是否成功
"""

import os
import sys

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """测试所有关键模块的导入"""
    print("🧪 测试模块导入...")
    
    try:
        # 测试enhanced_ai_service导入
        print("1. 测试 enhanced_ai_service 导入...")
        from utils.enhanced_ai_service import EnhancedFinanceAnalyzer
        print("   ✅ enhanced_ai_service 导入成功")
        
        # 测试初始化
        print("2. 测试 AI分析器初始化...")
        analyzer = EnhancedFinanceAnalyzer()
        print("   ✅ AI分析器初始化成功")
        
        # 测试Jin10爬虫导入
        print("3. 测试 Jin10爬虫导入...")
        from crawlers.jin10 import Jin10Crawler
        print("   ✅ Jin10爬虫导入成功")
        
        # 测试爬虫初始化
        print("4. 测试爬虫初始化...")
        crawler = Jin10Crawler()
        print("   ✅ 爬虫初始化成功")
        
        # 测试数据库客户端
        print("5. 测试数据库客户端导入...")
        from db.sqlite_client import SQLiteClient
        print("   ✅ 数据库客户端导入成功")
        
        # 测试搜索服务
        print("6. 测试搜索服务导入...")
        from utils.search_service import SearchService
        print("   ✅ 搜索服务导入成功")
        
        print("\n🎉 所有模块导入测试成功！Docker应该可以正常启动了。")
        return True
        
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        return False
    except Exception as e:
        print(f"❌ 其他错误: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_basic_functionality():
    """测试基本功能"""
    print("\n🔧 测试基本功能...")
    
    try:
        from utils.enhanced_ai_service import EnhancedFinanceAnalyzer
        
        # 测试备用分析功能（不需要API密钥）
        analyzer = EnhancedFinanceAnalyzer()
        
        test_title = "测试新闻标题"
        test_content = "测试新闻内容"
        
        # 测试备用分析
        fallback_analysis = analyzer._generate_fallback_analysis(test_title, test_content)
        
        if fallback_analysis and isinstance(fallback_analysis, dict):
            print("   ✅ 备用分析功能正常")
            print(f"   📊 分析标题: {fallback_analysis.get('analysis_title', '无')}")
            print(f"   📈 内容质量分数: {fallback_analysis.get('content_quality_score', '无')}")
            return True
        else:
            print("   ❌ 备用分析功能异常")
            return False
            
    except Exception as e:
        print(f"❌ 功能测试错误: {e}")
        return False

if __name__ == "__main__":
    print("🐳 Docker修复测试开始...")
    
    import_success = test_imports()
    function_success = test_basic_functionality()
    
    if import_success and function_success:
        print("\n✅ Docker修复测试成功！")
        print("现在可以重新启动Docker容器了。")
    else:
        print("\n❌ Docker修复测试失败")
        print("请检查错误信息并修复相关问题。") 