#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试爬虫功能
"""

import os
import sys
import json

# 添加项目根目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
sys.path.insert(0, os.path.dirname(current_dir))  # 添加上一级目录

# 直接导入模块，不使用相对导入
sys.path.insert(0, os.path.join(current_dir, 'crawlers'))
sys.path.insert(0, os.path.join(current_dir, 'config'))

# 导入爬虫工厂
from crawlers.jin10 import Jin10Crawler
from crawlers.gelonghui import GelonghuiCrawler
from crawlers.wallstreet import WallstreetCrawler
from crawlers.fastbull import FastbullCrawler
from crawlers.cls import CLSCrawler

def test_crawler(source='jin10', limit=2):
    print(f"测试{source}爬虫，获取{limit}条最新文章...")
    
    # 根据source选择不同的爬虫
    crawler = None
    if source == 'jin10':
        crawler = Jin10Crawler()
    elif source == 'gelonghui':
        crawler = GelonghuiCrawler()
    elif source == 'wallstreet':
        crawler = WallstreetCrawler()
    elif source == 'fastbull':
        crawler = FastbullCrawler()
    elif source == 'cls':
        crawler = CLSCrawler()
    else:
        print(f"不支持的爬虫来源: {source}")
        return []
    
    try:
        articles = crawler.get_latest_articles(limit=limit)
        print(json.dumps(articles, ensure_ascii=False, indent=2))
        return articles
    except Exception as e:
        print(f"爬取{source}文章异常: {str(e)}")
        return []

def test_flash(source='jin10', limit=2):
    print(f"测试{source}爬虫，获取{limit}条快讯...")
    
    crawler = None
    if source == 'jin10':
        crawler = Jin10Crawler()
    elif source == 'gelonghui':
        crawler = GelonghuiCrawler()
    elif source == 'cls':
        crawler = CLSCrawler()
    else:
        print(f"{source}不支持获取快讯")
        return []
        
    try:
        # 不同爬虫可能有不同的快讯获取方法
        flash_news = []
        if source == "jin10":
            flash_news = crawler.get_latest_news(limit=limit)
        elif source == "gelonghui":
            flash_news = crawler.get_flash_news(limit=limit)
        elif source == "cls":
            flash_news = crawler.get_flash_list(limit=limit)
            
        print(json.dumps(flash_news, ensure_ascii=False, indent=2))
        return flash_news
    except Exception as e:
        print(f"获取{source}快讯异常: {str(e)}")
        return []

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='测试爬虫功能')
    parser.add_argument('--source', type=str, default='jin10', help='爬虫来源：jin10, gelonghui, wallstreet, fastbull, cls')
    parser.add_argument('--limit', type=int, default=2, help='获取数量')
    parser.add_argument('--flash', action='store_true', help='获取快讯而非文章')
    
    args = parser.parse_args()
    
    if args.flash:
        test_flash(args.source, args.limit)
    else:
        test_crawler(args.source, args.limit)
