#!/usr/bin/env python3
"""
Jin10爬虫完整测试脚本 - 包含超时控制和详细调试
"""

import sys
import os
import time
import signal
from contextlib import contextmanager

# 添加项目路径到sys.path
project_path = '/Users/majiajue/Desktop/newsnow/newsnow-python'
sys.path.append(project_path)

# 设置环境变量
os.environ['DEEPSEEK_API_KEY'] = 'sk-111be52140f2444c8db34abd1de6d28e'

@contextmanager
def timeout(duration):
    """超时上下文管理器"""
    def timeout_handler(signum, frame):
        raise TimeoutError(f"操作超时 ({duration}秒)")
    
    # 设置信号处理器
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(duration)
    try:
        yield
    finally:
        signal.alarm(0)

def test_complete_flow():
    """测试完整流程，包含超时控制"""
    try:
        from crawlers.jin10 import Jin10Crawler
        
        # 创建Jin10爬虫实例
        crawler = Jin10Crawler()
        print('=== 测试Jin10爬虫完整流程（包含AI分析）===')
        
        # 步骤1: 获取最新文章列表
        print('\n1. 获取最新文章列表...')
        with timeout(30):  # 30秒超时
            articles = crawler.get_latest_news(limit=1)
        
        if not articles:
            print('❌ 未获取到Jin10文章列表')
            return False
            
        article = articles[0]
        print(f'✅ 获取到文章: {article.get("title", "无标题")}')
        article_id = article.get('id')
        print(f'文章ID: {article_id}')
        
        # 步骤2: 测试基本详情获取（不包含AI分析）
        print('\n2. 测试基本详情获取（无AI分析）...')
        try:
            import requests
            from bs4 import BeautifulSoup
            from config.settings import REQUEST_TIMEOUT
            
            url = f"{crawler.flash_url}/detail/{article_id}"
            response = requests.get(url, headers=crawler.headers, timeout=REQUEST_TIMEOUT)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                title_elem = soup.select_one(".content-title")
                title = title_elem.get_text(strip=True) if title_elem else "无标题"
                print(f'✅ 基本详情获取成功: {title}')
            else:
                print(f'❌ HTTP请求失败: {response.status_code}')
                return False
        except Exception as e:
            print(f'❌ 基本详情获取失败: {e}')
            return False
        
        # 步骤3: 测试搜索服务
        print('\n3. 测试搜索服务...')
        try:
            with timeout(60):  # 60秒超时
                searxng_results = crawler.search_service.search(query=title, max_results=3)
            if searxng_results:
                print(f'✅ 搜索服务成功，获得 {len(searxng_results)} 个结果')
            else:
                print('⚠️ 搜索服务无结果，但不影响继续测试')
        except TimeoutError:
            print('⚠️ 搜索服务超时，跳过此步骤')
            searxng_results = []
        except Exception as e:
            print(f'⚠️ 搜索服务失败: {e}，跳过此步骤')
            searxng_results = []
        
        # 步骤4: 测试AI分析（有超时控制）
        print('\n4. 测试AI分析...')
        try:
            with timeout(120):  # 120秒超时
                analysis_data = crawler.finance_analyzer.analyze_market_news(
                    text=title,  # 使用标题作为内容
                    title=title, 
                    searxng_results=searxng_results
                )
            
            if analysis_data and "error" not in analysis_data:
                print('✅ AI分析成功')
                print(f'摘要: {analysis_data.get("summary", "无摘要")[:100]}...')
            else:
                print(f'❌ AI分析失败: {analysis_data}')
                return False
                
        except TimeoutError:
            print('❌ AI分析超时')
            return False
        except Exception as e:
            print(f'❌ AI分析异常: {e}')
            import traceback
            traceback.print_exc()
            return False
        
        # 步骤5: 测试数据库保存
        print('\n5. 测试数据库保存...')
        try:
            article_data = {
                "id": article_id,
                "title": title,
                "content": title,  # 使用标题作为内容
                "url": url,
                "pubDate": "2025-06-06T00:00:00",
                "source": "Jin10",
                "category": "财经",
                "author": "金十数据",
                "imageUrl": "",
                "tags": []
            }
            
            with timeout(30):  # 30秒超时
                save_success = crawler.db_client.save_article(article_data, analysis_data)
            
            if save_success:
                print('✅ 数据库保存成功')
            else:
                print('❌ 数据库保存失败')
                return False
                
        except TimeoutError:
            print('❌ 数据库保存超时')
            return False
        except Exception as e:
            print(f'❌ 数据库保存异常: {e}')
            import traceback
            traceback.print_exc()
            return False
        
        print('\n=== 完整流程测试成功 ===')
        return True
        
    except ImportError as e:
        print(f'❌ 导入模块失败: {str(e)}')
        return False
    except Exception as e:
        print(f'❌ 测试异常: {str(e)}')
        import traceback
        traceback.print_exc()
        return False

def test_original_method():
    """测试原始的get_article_detail方法（有超时控制）"""
    try:
        from crawlers.jin10 import Jin10Crawler
        
        crawler = Jin10Crawler()
        print('\n=== 测试原始get_article_detail方法 ===')
        
        # 获取文章ID
        articles = crawler.get_latest_news(limit=1)
        if not articles:
            print('❌ 无法获取文章列表')
            return False
            
        article_id = articles[0].get('id')
        print(f'测试文章ID: {article_id}')
        
        # 测试原始方法（有超时控制）
        print('开始调用get_article_detail方法...')
        with timeout(300):  # 5分钟超时
            detail = crawler.get_article_detail(article_id)
        
        if detail:
            print('✅ 原始方法调用成功')
            print(f'标题: {detail.get("title", "无标题")}')
            print(f'是否包含AI分析: {"analysis_data" in detail}')
            print(f'是否立即处理: {detail.get("processed_immediately", False)}')
            return True
        else:
            print('❌ 原始方法返回None')
            return False
            
    except TimeoutError:
        print('❌ 原始方法调用超时（5分钟）')
        return False
    except Exception as e:
        print(f'❌ 原始方法调用异常: {e}')
        import traceback
        traceback.print_exc()
        return False

def main():
    print("选择测试模式:")
    print("1. 分步测试完整流程")
    print("2. 测试原始get_article_detail方法")
    print("3. 两种测试都运行")
    
    choice = input("请输入选择 (1/2/3): ").strip()
    
    if choice in ['1', '3']:
        print("\n" + "="*50)
        print("开始分步测试...")
        success1 = test_complete_flow()
        print(f"分步测试结果: {'成功' if success1 else '失败'}")
    
    if choice in ['2', '3']:
        print("\n" + "="*50)
        print("开始原始方法测试...")
        success2 = test_original_method()
        print(f"原始方法测试结果: {'成功' if success2 else '失败'}")

if __name__ == '__main__':
    main()
