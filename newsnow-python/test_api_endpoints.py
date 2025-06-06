#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
API端点测试脚本
"""

import os
import sys
import json
import time
import requests
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# API服务器配置
API_BASE_URL = "http://localhost:8088"

def test_api_endpoints():
    """测试API端点"""
    
    logger.info("=== 测试API端点 ===")
    
    # 测试健康检查
    try:
        response = requests.get(f"{API_BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            logger.info("✓ 健康检查端点正常")
        else:
            logger.error(f"✗ 健康检查端点异常: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"✗ 无法连接到API服务器: {str(e)}")
        return False
    
    # 测试质量统计端点
    try:
        response = requests.get(f"{API_BASE_URL}/api/quality/statistics", timeout=10)
        if response.status_code == 200:
            data = response.json()
            logger.info(f"✓ 质量统计端点正常: {data}")
        else:
            logger.error(f"✗ 质量统计端点异常: {response.status_code}")
    except Exception as e:
        logger.error(f"✗ 质量统计端点测试失败: {str(e)}")
    
    # 测试待增强文章端点
    try:
        response = requests.get(f"{API_BASE_URL}/api/quality/articles-to-enhance", timeout=10)
        if response.status_code == 200:
            data = response.json()
            logger.info(f"✓ 待增强文章端点正常: 找到 {len(data.get('articles', []))} 篇文章")
        else:
            logger.error(f"✗ 待增强文章端点异常: {response.status_code}")
    except Exception as e:
        logger.error(f"✗ 待增强文章端点测试失败: {str(e)}")
    
    # 测试高质量文章端点
    try:
        response = requests.get(f"{API_BASE_URL}/api/quality/high-quality", timeout=10)
        if response.status_code == 200:
            data = response.json()
            logger.info(f"✓ 高质量文章端点正常: 找到 {len(data.get('articles', []))} 篇文章")
        else:
            logger.error(f"✗ 高质量文章端点异常: {response.status_code}")
    except Exception as e:
        logger.error(f"✗ 高质量文章端点测试失败: {str(e)}")
    
    # 测试内容表现分析端点
    try:
        response = requests.get(f"{API_BASE_URL}/api/quality/performance", timeout=10)
        if response.status_code == 200:
            data = response.json()
            logger.info(f"✓ 内容表现分析端点正常: {data}")
        else:
            logger.error(f"✗ 内容表现分析端点异常: {response.status_code}")
    except Exception as e:
        logger.error(f"✗ 内容表现分析端点测试失败: {str(e)}")
    
    return True

def start_api_server():
    """启动API服务器"""
    logger.info("正在启动API服务器...")
    
    # 这里我们不实际启动服务器，而是提示用户手动启动
    print("\n请在另一个终端窗口中运行以下命令启动API服务器:")
    print("cd /Users/majiajue/Desktop/newsnow/newsnow-python")
    print("python -m api.api_server")
    print("\n然后按回车键继续测试...")
    input()

if __name__ == "__main__":
    print("NewsNow API端点测试")
    print("=" * 50)
    
    # 提示启动服务器
    start_api_server()
    
    # 测试API端点
    success = test_api_endpoints()
    
    if success:
        print("\n✓ API端点测试完成!")
    else:
        print("\n✗ API端点测试失败!")
    
    print("\n测试完成!")
