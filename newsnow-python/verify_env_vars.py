#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
环境变量验证脚本 - 检查所有硬编码的localhost是否已修复
"""

import os
import sys
import importlib.util

def check_env_vars():
    """检查关键环境变量"""
    print("🔍 检查环境变量配置...")
    
    # 检查SEARXNG_URL
    searxng_url = os.environ.get("SEARXNG_URL")
    if searxng_url:
        print(f"✅ SEARXNG_URL: {searxng_url}")
        if "localhost" in searxng_url:
            print("⚠️  警告: SEARXNG_URL 仍包含 localhost，在Docker环境中可能无法工作")
        else:
            print("✅ SEARXNG_URL 配置正确，使用服务名")
    else:
        print("❌ SEARXNG_URL 未设置")
    
    # 检查DEEPSEEK_API_KEY
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if api_key:
        print(f"✅ DEEPSEEK_API_KEY: {api_key[:10]}...")
    else:
        print("❌ DEEPSEEK_API_KEY 未设置")

def check_config_files():
    """检查配置文件"""
    print("\n🔍 检查配置文件...")
    
    try:
        # 检查settings.py
        from config.settings import SEARXNG_URL
        print(f"✅ config/settings.py SEARXNG_URL: {SEARXNG_URL}")
        
        if "localhost" in SEARXNG_URL and "SEARXNG_URL" not in os.environ:
            print("⚠️  警告: settings.py 中的默认值仍为 localhost")
        
    except Exception as e:
        print(f"❌ 无法导入配置: {e}")

def check_service_files():
    """检查服务文件"""
    print("\n🔍 检查服务文件...")
    
    files_to_check = [
        "utils/improved_search_service.py",
        "utils/search_service.py",
        "integrated_finance_system.py",
        "fetch_and_save_news.py"
    ]
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if "localhost:8080" in content:
                    print(f"❌ {file_path} 仍包含硬编码的 localhost:8080")
                else:
                    print(f"✅ {file_path} 已修复")
        else:
            print(f"⚠️  {file_path} 文件不存在")

def test_search_service():
    """测试搜索服务初始化"""
    print("\n🔍 测试搜索服务初始化...")
    
    try:
        from utils.search_service import SearchService
        service = SearchService()
        print(f"✅ 搜索服务初始化成功，URL: {service.base_url}")
        
        if "localhost" in service.base_url:
            print("⚠️  警告: 搜索服务仍使用 localhost")
        
    except Exception as e:
        print(f"❌ 搜索服务初始化失败: {e}")

def main():
    """主函数"""
    print("🔧 NewsNow 环境变量验证")
    print("=" * 50)
    
    # 加载.env文件（如果存在）
    if os.path.exists('.env'):
        print("📋 加载 .env 文件...")
        with open('.env', 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
        print("✅ .env 文件加载完成")
    else:
        print("⚠️  .env 文件不存在")
    
    check_env_vars()
    check_config_files()
    check_service_files()
    test_search_service()
    
    print("\n" + "=" * 50)
    print("🎉 验证完成！")
    
    # 检查是否有问题
    searxng_url = os.environ.get("SEARXNG_URL", "")
    if "localhost" in searxng_url:
        print("\n⚠️  建议: 将 SEARXNG_URL 设置为 http://searxng:8080 以在Docker环境中正常工作")
        return 1
    else:
        print("\n✅ 所有配置看起来都正确！")
        return 0

if __name__ == "__main__":
    sys.exit(main()) 