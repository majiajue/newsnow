#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'newsnow-python'))

from crawlers.gelonghui import GelonghuiCrawler

def debug_gelonghui_urls():
    print("=== 调试Gelonghui URL格式 ===")
    
    # 初始化爬虫
    crawler = GelonghuiCrawler()
    
    # 获取文章列表
    articles = crawler.get_latest_articles(limit=3)
    
    if articles:
        print(f"获取到 {len(articles)} 条文章")
        for i, article in enumerate(articles):
            print(f"\n文章 {i+1}:")
            print(f"  ID: {article.get('id')}")
            print(f"  标题: {article.get('title')}")
            print(f"  URL: {article.get('url', 'N/A')}")
            
            # 尝试不同的URL格式
            article_id = article.get('id')
            if article_id:
                print(f"  测试URL格式:")
                print(f"    格式1: https://www.gelonghui.com/p/{article_id}")
                print(f"    格式2: https://www.gelonghui.com/live/{article_id}")
                print(f"    格式3: https://www.gelonghui.com/post/{article_id}")
                
                # 如果有原始URL，使用它
                original_url = article.get('url')
                if original_url:
                    print(f"    原始URL: {original_url}")
    else:
        print("未获取到文章")

if __name__ == "__main__":
    debug_gelonghui_urls()
