#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
简化版爬虫测试脚本 - 避免复杂的导入路径问题
"""

import os
import sys
import json
import requests
import time
import re
from datetime import datetime

# 设置基本参数
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
REQUEST_TIMEOUT = 10
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")

# 简化版金十爬虫测试
def test_jin10(limit=2):
    print(f"测试金十财经爬虫，获取{limit}条最新文章...")
    
    # 获取金十财经最新文章列表
    url = "https://m.jin10.com/flash"
    headers = {
        "User-Agent": USER_AGENT,
        "Referer": "https://m.jin10.com/",
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        if response.status_code != 200:
            print(f"请求金十财经失败，状态码：{response.status_code}")
            return []
            
        # 解析JSON数据
        # 这里仅为示例，实际上需要根据金十财经网站的实际响应格式进行解析
        data = response.json()
        articles = data.get("data", [])[:limit]
        
        print(json.dumps(articles, ensure_ascii=False, indent=2))
        return articles
    except Exception as e:
        print(f"获取金十财经文章异常: {str(e)}")
        return []

# 简化版DeepSeek内容处理测试
def test_deepseek(text="测试内容分析"):
    """测试DeepSeek AI 内容处理功能"""
    print("测试DeepSeek AI内容处理...")
    
    if not DEEPSEEK_API_KEY:
        print("缺少DEEPSEEK_API_KEY环境变量，无法测试")
        return None
    
    try:
        api_url = "https://api.deepseek.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
        }
        
        # 构造请求数据
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": "你是一个专业的财经内容分析助手。请对提供的内容进行简短分析，生成摘要和评论。"
                },
                {
                    "role": "user",
                    "content": text
                }
            ],
            "max_tokens": 500
        }
        
        # 发送请求
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            analysis = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(analysis)
            return analysis
        else:
            print(f"DeepSeek API请求失败，状态码：{response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"DeepSeek API请求异常: {str(e)}")
        return None

# 测试SearXNG搜索服务
def test_searxng(query="财经新闻"):
    """测试SearXNG搜索服务"""
    print(f"测试SearXNG搜索服务，搜索关键词：{query}")
    
    try:
        # 设置SearXNG搜索参数
        search_url = f"http://localhost:8080/search"
        params = {
            "q": query,
            "format": "json",
            "categories": "finance,news",
            "language": "all",
            "time_range": "month"
        }
        
        # 发送请求
        response = requests.get(search_url, params=params, timeout=10)
        
        if response.status_code == 200:
            results = response.json()
            # 只返回前5条结果
            if "results" in results and len(results["results"]) > 5:
                print(json.dumps(results["results"][:5], ensure_ascii=False, indent=2))
            else:
                print(json.dumps(results, ensure_ascii=False, indent=2))
            return results
        else:
            print(f"SearXNG搜索请求失败，状态码：{response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"SearXNG搜索请求异常: {str(e)}")
        return None

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='简化版爬虫和API测试脚本')
    parser.add_argument('--type', type=str, choices=['crawler', 'deepseek', 'searxng'], required=True, 
                        help='测试类型：crawler (爬虫), deepseek (内容分析), searxng (搜索服务)')
    parser.add_argument('--query', type=str, default='财经新闻', help='搜索关键词（用于searxng测试）')
    parser.add_argument('--text', type=str, default='美联储宣布维持利率不变，符合市场预期。', help='分析文本内容（用于deepseek测试）')
    parser.add_argument('--limit', type=int, default=2, help='爬虫获取数量（用于crawler测试）')
    
    args = parser.parse_args()
    
    if args.type == 'crawler':
        test_jin10(args.limit)
    elif args.type == 'deepseek':
        test_deepseek(args.text)
    elif args.type == 'searxng':
        test_searxng(args.query)
