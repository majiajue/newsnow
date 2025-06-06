#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复爬虫AI分析方法调用问题
"""

import os
import re

def fix_crawler_ai_calls():
    """修复所有爬虫的AI分析方法调用"""
    print("🔧 修复爬虫AI分析方法调用...")
    
    crawlers = [
        "newsnow-python/crawlers/jin10.py",
        "newsnow-python/crawlers/wallstreet.py", 
        "newsnow-python/crawlers/fastbull.py",
        "newsnow-python/crawlers/gelonghui.py"
    ]
    
    for crawler_file in crawlers:
        if not os.path.exists(crawler_file):
            print(f"⚠️ 文件不存在: {crawler_file}")
            continue
            
        try:
            with open(crawler_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # 修复方法调用
            fixes = [
                # 修复 generate_comprehensive_analysis 参数
                (
                    r'self\.finance_analyzer\.generate_comprehensive_analysis\(\s*text=([^,]+),\s*title=([^,]+),\s*searxng_results=([^)]+)\)',
                    r'self.finance_analyzer.generate_comprehensive_analysis(title=\2, content=\1, search_results=\3)'
                ),
                # 修复 analyze_market_news 参数
                (
                    r'self\.finance_analyzer\.analyze_market_news\(\s*text=([^,]+),\s*title=([^,]+),\s*searxng_results=([^)]+)\)',
                    r'self.finance_analyzer.generate_comprehensive_analysis(title=\2, content=\1, search_results=\3)'
                ),
                # 修复 analyze_article 调用
                (
                    r'self\.finance_analyzer\.analyze_article\([^)]+\)',
                    r'self.finance_analyzer.generate_comprehensive_analysis(title=title, content=content, search_results=article_detail.get("search_results", []))'
                ),
                # 修复其他可能的调用
                (
                    r'analysis_result = self\.finance_analyzer\.analyze_market_news\(',
                    r'analysis_result = self.finance_analyzer.generate_comprehensive_analysis('
                )
            ]
            
            for old_pattern, new_pattern in fixes:
                if re.search(old_pattern, content):
                    content = re.sub(old_pattern, new_pattern, content)
                    print(f"✅ 修复了方法调用: {crawler_file}")
            
            # 如果内容有变化，写回文件
            if content != original_content:
                with open(crawler_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ 已更新: {crawler_file}")
            else:
                print(f"ℹ️ 无需修复: {crawler_file}")
                
        except Exception as e:
            print(f"❌ 修复失败: {crawler_file} - {e}")

def add_missing_methods():
    """为增强版AI服务添加缺失的兼容方法"""
    print("\n🔧 为AI服务添加兼容方法...")
    
    service_file = "newsnow-python/utils/enhanced_ai_service.py"
    
    try:
        with open(service_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 添加兼容方法
        additional_methods = '''
    
    def analyze_article(self, article_data):
        """兼容旧接口的文章分析方法"""
        title = article_data.get('title', '')
        content = article_data.get('content', '')
        search_results = article_data.get('search_results', [])
        
        return self.generate_comprehensive_analysis(
            title=title,
            content=content,
            search_results=search_results
        )
'''
        
        # 在类的最后添加兼容方法
        if 'def analyze_article(self, article_data):' not in content:
            # 找到类的结尾，在最后一个方法后添加
            class_end_pattern = r'(\s+def analyze_market_news\(self, text, title=None, searxng_results=None\):.*?return self\.generate_comprehensive_analysis\(title or "市场新闻", text, searxng_results\))'
            
            if re.search(class_end_pattern, content, re.DOTALL):
                content = re.sub(
                    class_end_pattern,
                    r'\1' + additional_methods,
                    content,
                    flags=re.DOTALL
                )
                
                with open(service_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                print(f"✅ 已添加兼容方法到: {service_file}")
            else:
                print(f"⚠️ 无法找到插入点: {service_file}")
        else:
            print(f"ℹ️ 兼容方法已存在: {service_file}")
            
    except Exception as e:
        print(f"❌ 添加兼容方法失败: {e}")

def main():
    """主函数"""
    print("🔧 修复爬虫AI分析调用问题...")
    print("=" * 50)
    
    # 1. 修复爬虫AI方法调用
    fix_crawler_ai_calls()
    
    # 2. 添加缺失的兼容方法
    add_missing_methods()
    
    print("\n" + "=" * 50)
    print("🎉 修复完成！")
    print("💡 建议重新测试爬虫: python3 test_all_crawlers.py")

if __name__ == "__main__":
    main() 