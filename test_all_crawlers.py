#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试所有爬虫的完整流程
包括文章获取、搜索增强、AI分析和数据库保存
"""

import sys
import os
import signal
import time
from contextlib import contextmanager

# 添加项目路径
project_path = '/Users/majiajue/Desktop/newsnow/newsnow-python'
if project_path not in sys.path:
    sys.path.insert(0, project_path)

# 设置环境变量
os.environ['DEEPSEEK_API_KEY'] = 'sk-a4b8e8b6e8a04e5b8e8e8e8e8e8e8e8e'

@contextmanager
def timeout(duration):
    """超时控制上下文管理器"""
    def timeout_handler(signum, frame):
        raise TimeoutError(f"操作超时 ({duration}秒)")
    
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(duration)
    try:
        yield
    finally:
        signal.alarm(0)

def test_crawler(crawler_class, crawler_name, source_name):
    """测试单个爬虫"""
    print(f"\n{'='*60}")
    print(f"测试 {crawler_name} ({source_name})")
    print(f"{'='*60}")
    
    try:
        # 1. 初始化爬虫
        print("1. 初始化爬虫...")
        with timeout(30):
            crawler = crawler_class()
        print(f"✅ {crawler_name} 初始化成功")
        
        # 2. 获取最新文章列表
        print("2. 获取最新文章列表...")
        with timeout(30):
            # 根据爬虫类型选择合适的方法
            if hasattr(crawler, 'get_latest_news'):
                articles = crawler.get_latest_news()
            elif hasattr(crawler, 'get_latest_articles'):
                articles = crawler.get_latest_articles()
            else:
                print(f"⚠️ {crawler_name} 没有获取文章列表的方法")
                return False
        
        if not articles:
            print(f"⚠️ {crawler_name} 未获取到文章")
            return False
            
        print(f"✅ 获取到 {len(articles)} 条文章")
        
        # 显示第一篇文章信息
        first_article = articles[0]
        if isinstance(first_article, dict):
            article_id = first_article.get('id', 'Unknown')
            title = first_article.get('title', 'No title')[:50] + '...' if len(first_article.get('title', '')) > 50 else first_article.get('title', 'No title')
        else:
            article_id = str(first_article)
            title = "Unknown"
        
        print(f"测试文章ID: {article_id}")
        print(f"文章标题: {title}")
        
        # 3. 测试文章详情获取
        print("3. 测试文章详情获取...")
        with timeout(60):
            if hasattr(crawler, 'get_article_detail'):
                result = crawler.get_article_detail(article_id)
                if result:
                    print(f"✅ {crawler_name} 文章详情获取成功")
                    if isinstance(result, dict):
                        print(f"   标题: {result.get('title', 'No title')[:50]}...")
                        print(f"   是否包含AI分析: {bool(result.get('analysis'))}")
                        print(f"   是否立即处理: {result.get('processed_immediately', False)}")
                    return True
                else:
                    print(f"❌ {crawler_name} 文章详情获取失败")
                    return False
            else:
                print(f"⚠️ {crawler_name} 没有 get_article_detail 方法")
                return False
                
    except TimeoutError as e:
        print(f"❌ {crawler_name} 测试超时: {e}")
        return False
    except Exception as e:
        print(f"❌ {crawler_name} 测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("=== 测试所有爬虫的完整流程 ===")
    
    # 爬虫配置
    crawlers_config = [
        {
            'module': 'crawlers.jin10',
            'class': 'Jin10Crawler',
            'name': 'Jin10爬虫',
            'source': '金十数据'
        },
        {
            'module': 'crawlers.gelonghui',
            'class': 'GelonghuiCrawler',
            'name': 'Gelonghui爬虫',
            'source': '格隆汇'
        },
        {
            'module': 'crawlers.fastbull',
            'class': 'FastbullCrawler',  # 注意这里是小写b
            'name': 'FastBull爬虫',
            'source': 'FastBull'
        },
        {
            'module': 'crawlers.wallstreet',
            'class': 'WallstreetCrawler',
            'name': 'Wallstreet爬虫',
            'source': '华尔街见闻'
        }
    ]
    
    results = {}
    
    for config in crawlers_config:
        try:
            # 动态导入爬虫类
            module = __import__(config['module'], fromlist=[config['class']])
            crawler_class = getattr(module, config['class'])
            
            # 测试爬虫
            success = test_crawler(crawler_class, config['name'], config['source'])
            results[config['name']] = success
            
        except ImportError as e:
            print(f"❌ 无法导入 {config['name']}: {e}")
            results[config['name']] = False
        except Exception as e:
            print(f"❌ {config['name']} 测试异常: {e}")
            results[config['name']] = False
    
    # 显示总结
    print(f"\n{'='*60}")
    print("测试结果总结")
    print(f"{'='*60}")
    
    success_count = 0
    for crawler_name, success in results.items():
        status = "✅ 成功" if success else "❌ 失败"
        print(f"{crawler_name}: {status}")
        if success:
            success_count += 1
    
    print(f"\n总计: {success_count}/{len(results)} 个爬虫测试成功")
    
    if success_count == len(results):
        print("🎉 所有爬虫都正常工作！")
    else:
        print("⚠️ 部分爬虫需要修复")

if __name__ == "__main__":
    main()
