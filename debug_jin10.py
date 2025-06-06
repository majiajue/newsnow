#!/usr/bin/env python3
"""
Jin10爬虫调试脚本 - 分步测试
"""

import sys
import os
import time

# 添加项目路径到sys.path
project_path = '/Users/majiajue/Desktop/newsnow/newsnow-python'
sys.path.append(project_path)

# 设置环境变量
os.environ['DEEPSEEK_API_KEY'] = 'sk-111be52140f2444c8db34abd1de6d28e'

def test_basic_import():
    """测试基本导入"""
    try:
        from crawlers.jin10 import Jin10Crawler
        print("✅ 成功导入Jin10Crawler")
        return True
    except Exception as e:
        print(f"❌ 导入失败: {e}")
        return False

def test_crawler_init():
    """测试爬虫初始化"""
    try:
        from crawlers.jin10 import Jin10Crawler
        crawler = Jin10Crawler()
        print("✅ 成功初始化Jin10Crawler")
        return crawler
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        return None

def test_get_latest_news(crawler):
    """测试获取最新新闻"""
    try:
        articles = crawler.get_latest_news(limit=1)
        if articles:
            print(f"✅ 成功获取文章列表，数量: {len(articles)}")
            article = articles[0]
            print(f"文章标题: {article.get('title', '无标题')}")
            print(f"文章ID: {article.get('id', '无ID')}")
            return article
        else:
            print("❌ 未获取到文章")
            return None
    except Exception as e:
        print(f"❌ 获取文章列表失败: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_get_article_detail_step_by_step(crawler, article_id):
    """分步测试获取文章详情"""
    try:
        import requests
        from bs4 import BeautifulSoup
        from config.settings import REQUEST_TIMEOUT
        
        # 步骤1: 构造URL
        url = f"{crawler.flash_url}/detail/{article_id}"
        print(f"1. 构造URL: {url}")
        
        # 步骤2: 发送请求
        print("2. 发送HTTP请求...")
        response = requests.get(
            url,
            headers=crawler.headers,
            timeout=REQUEST_TIMEOUT
        )
        print(f"   HTTP状态码: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ HTTP请求失败: {response.status_code}")
            return None
            
        # 步骤3: 解析HTML
        print("3. 解析HTML...")
        soup = BeautifulSoup(response.text, "html.parser")
        
        # 步骤4: 提取标题
        print("4. 提取标题...")
        title_elem = soup.select_one(".content-title")
        if title_elem:
            title = title_elem.get_text(strip=True)
            print(f"   标题: {title}")
        else:
            print("   ❌ 未找到标题元素")
            # 尝试其他选择器
            print("   尝试其他标题选择器...")
            for selector in [".flash-detail-title", "h1", ".title"]:
                elem = soup.select_one(selector)
                if elem:
                    title = elem.get_text(strip=True)
                    print(f"   找到标题 ({selector}): {title}")
                    break
            else:
                print("   ❌ 所有标题选择器都失败")
                return None
        
        # 步骤5: 提取内容
        print("5. 提取内容...")
        content_elem = soup.select_one(".content-pic")
        if content_elem:
            content = content_elem.get_text(separator='\n', strip=True)
            print(f"   内容长度: {len(content)} 字符")
            print(f"   内容预览: {content[:100]}...")
        else:
            print("   ❌ 未找到内容元素，尝试其他选择器...")
            for selector in [".flash-detail-content", ".detail-content", ".content"]:
                elem = soup.select_one(selector)
                if elem:
                    content = elem.get_text(separator='\n', strip=True)
                    print(f"   找到内容 ({selector}): {len(content)} 字符")
                    break
            else:
                print("   ❌ 所有内容选择器都失败，使用标题作为内容")
                content = title
        
        print("✅ 基本信息提取成功")
        return {
            "title": title,
            "content": content,
            "url": url
        }
        
    except Exception as e:
        print(f"❌ 分步测试失败: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    print("=== Jin10爬虫调试测试 ===")
    
    # 测试1: 基本导入
    print("\n1. 测试基本导入...")
    if not test_basic_import():
        return
    
    # 测试2: 爬虫初始化
    print("\n2. 测试爬虫初始化...")
    crawler = test_crawler_init()
    if not crawler:
        return
    
    # 测试3: 获取最新新闻
    print("\n3. 测试获取最新新闻...")
    article = test_get_latest_news(crawler)
    if not article:
        return
    
    article_id = article.get('id')
    if not article_id:
        print("❌ 文章ID为空")
        return
    
    # 测试4: 分步测试获取文章详情
    print(f"\n4. 分步测试获取文章详情 (ID: {article_id})...")
    detail = test_get_article_detail_step_by_step(crawler, article_id)
    if detail:
        print("✅ 分步测试成功")
    else:
        print("❌ 分步测试失败")
    
    print("\n=== 调试测试完成 ===")

if __name__ == '__main__':
    main()
