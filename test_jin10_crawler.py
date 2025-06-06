#!/usr/bin/env python3
"""
Jin10爬虫测试脚本
测试完整的爬虫流程，包括AI分析功能
"""

import sys
import os

# 添加项目路径到sys.path
project_path = '/Users/majiajue/Desktop/newsnow/newsnow-python'
sys.path.append(project_path)

# 设置环境变量
os.environ['DEEPSEEK_API_KEY'] = 'sk-111be52140f2444c8db34abd1de6d28e'

def test_jin10_crawler():
    """测试Jin10爬虫完整流程"""
    try:
        from crawlers.jin10 import Jin10Crawler
        
        # 创建Jin10爬虫实例
        crawler = Jin10Crawler()
        print('=== 测试Jin10爬虫完整流程（包含AI分析）===')
        
        # 获取最新文章列表
        print('1. 获取最新文章列表...')
        articles = crawler.get_latest_news(limit=1)
        
        if not articles:
            print('❌ 未获取到Jin10文章列表')
            return False
            
        article = articles[0]
        print(f'✅ 获取到文章: {article.get("title", "无标题")}')
        article_id = article.get('id')
        print(f'文章ID: {article_id}')
        
        # 获取文章详情（包含AI分析）
        print('\n2. 获取文章详情和AI分析...')
        detail = crawler.get_article_detail(article_id)
        
        if not detail:
            print(f'❌ 获取文章详情失败')
            return False
            
        print(f'✅ 成功获取文章详情')
        print(f'详情标题: {detail.get("title", "无标题")}')
        print(f'内容长度: {len(detail.get("content", ""))} 字符')
        print(f'是否包含AI分析: {"analysis_data" in detail}')
        print(f'是否立即处理: {detail.get("processed_immediately", False)}')
        
        # 检查AI分析结果
        if 'analysis_data' in detail and detail['analysis_data']:
            analysis = detail['analysis_data']
            print('\n3. AI分析结果:')
            print(f'AI分析摘要: {analysis.get("summary", "无摘要")[:200]}...')
            print(f'市场影响: {analysis.get("market_impact", "无影响分析")}')
            print(f'重要性评分: {analysis.get("importance_score", "无评分")}')
        else:
            print('\n3. ❌ 未获取到AI分析结果')
            
        print('\n=== 测试完成 ===')
        return True
        
    except ImportError as e:
        print(f'❌ 导入模块失败: {str(e)}')
        print('请检查项目路径和模块结构')
        return False
    except Exception as e:
        print(f'❌ Jin10爬虫测试异常: {str(e)}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_jin10_crawler()
    sys.exit(0 if success else 1)
