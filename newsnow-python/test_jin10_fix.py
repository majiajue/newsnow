#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试金十数据爬虫修复
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from crawlers.jin10 import Jin10Crawler

def test_jin10_article_detail():
    """测试金十数据文章详情获取"""
    crawler = Jin10Crawler()
    
    # 测试失败的文章ID
    test_ids = [
        "20250605214431591800",
        "20250605214359912800"
    ]
    
    for article_id in test_ids:
        print(f"\n{'='*60}")
        print(f"测试文章ID: {article_id}")
        print(f"{'='*60}")
        
        try:
            result = crawler.get_article_detail(article_id)
            if result:
                print(f"✅ 成功获取文章详情:")
                print(f"   标题: {result.get('title', 'N/A')}")
                print(f"   内容长度: {len(result.get('content', ''))}")
                print(f"   发布时间: {result.get('pubDate', 'N/A')}")
                print(f"   图片URL: {result.get('imageUrl', 'N/A')}")
                print(f"   即时处理标志: {result.get('processed_immediately', False)}")
            else:
                print(f"❌ 获取文章详情失败，返回 None")
        except Exception as e:
            print(f"❌ 测试过程中发生异常: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_jin10_article_detail()
