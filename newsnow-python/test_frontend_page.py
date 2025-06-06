#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试前端页面是否正确显示AI分析数据
"""

import requests
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def test_frontend_page_with_browser():
    """使用浏览器测试前端页面"""
    print("🌐 使用浏览器测试前端页面显示")
    print("=" * 50)
    
    # 配置Chrome选项
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # 无头模式
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    try:
        # 启动浏览器
        driver = webdriver.Chrome(options=chrome_options)
        
        # 访问新闻详情页
        article_id = "20250606221853090800"
        url = f"http://localhost:3002/news/{article_id}"
        
        print(f"📱 访问页面: {url}")
        driver.get(url)
        
        # 等待页面加载
        wait = WebDriverWait(driver, 10)
        
        # 等待标题加载
        try:
            title_element = wait.until(
                EC.presence_of_element_located((By.TAG_NAME, "h1"))
            )
            print(f"✅ 页面标题: {title_element.text[:50]}...")
        except:
            print("❌ 页面标题未找到")
        
        # 检查是否有AI分析部分
        try:
            ai_section = driver.find_element(By.XPATH, "//*[contains(text(), 'AI 分析') or contains(text(), 'AI分析')]")
            print(f"✅ 找到AI分析部分: {ai_section.text}")
            
            # 查找AI分析的具体内容
            ai_content = driver.find_elements(By.XPATH, "//*[contains(@class, 'muted') or contains(@class, 'analysis')]")
            if ai_content:
                print(f"📊 AI分析内容数量: {len(ai_content)}")
                for i, content in enumerate(ai_content[:3], 1):
                    if content.text.strip():
                        print(f"   {i}. {content.text[:80]}...")
            
        except:
            print("❌ 未找到AI分析部分")
        
        # 检查页面源码中是否包含AI分析数据
        page_source = driver.page_source
        if "aiAnalysis" in page_source:
            print("✅ 页面源码包含aiAnalysis数据")
        else:
            print("❌ 页面源码不包含aiAnalysis数据")
        
        # 检查控制台日志
        logs = driver.get_log('browser')
        if logs:
            print(f"\n📝 浏览器控制台日志:")
            for log in logs[-5:]:  # 显示最后5条日志
                print(f"   {log['level']}: {log['message'][:100]}...")
        
        driver.quit()
        
    except Exception as e:
        print(f"❌ 浏览器测试失败: {str(e)}")

def test_api_data_structure():
    """测试API数据结构"""
    print("\n🔍 测试API数据结构")
    print("=" * 50)
    
    article_id = "20250606221853090800"
    api_url = f"http://localhost:3002/api/news/{article_id}"
    
    try:
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ API响应成功")
            print(f"📊 数据字段: {list(data.keys())}")
            
            # 检查AI分析字段
            if 'aiAnalysis' in data and data['aiAnalysis']:
                ai_analysis = data['aiAnalysis']
                print(f"\n🤖 aiAnalysis字段:")
                print(f"   类型: {type(ai_analysis)}")
                print(f"   字段: {list(ai_analysis.keys()) if isinstance(ai_analysis, dict) else 'N/A'}")
                
                if isinstance(ai_analysis, dict):
                    for key, value in ai_analysis.items():
                        if isinstance(value, str):
                            print(f"   {key}: {value[:50]}..." if len(value) > 50 else f"   {key}: {value}")
                        elif isinstance(value, list):
                            print(f"   {key}: 列表，{len(value)}项")
                        else:
                            print(f"   {key}: {type(value)}")
            else:
                print("❌ 无aiAnalysis字段")
            
            # 检查metadata字段
            if 'metadata' in data and data['metadata']:
                metadata = data['metadata']
                print(f"\n📊 metadata字段:")
                print(f"   类型: {type(metadata)}")
                print(f"   字段数量: {len(metadata) if isinstance(metadata, dict) else 'N/A'}")
                
                if isinstance(metadata, dict):
                    key_fields = ['executive_summary', 'content_quality_score', 'originality_score']
                    for key in key_fields:
                        if key in metadata:
                            value = metadata[key]
                            if isinstance(value, str):
                                print(f"   {key}: {value[:50]}..." if len(value) > 50 else f"   {key}: {value}")
                            else:
                                print(f"   {key}: {value}")
            else:
                print("❌ 无metadata字段")
                
        else:
            print(f"❌ API请求失败: {response.status_code}")
            
    except Exception as e:
        print(f"❌ API测试失败: {str(e)}")

def main():
    """主函数"""
    # 首先测试API数据结构
    test_api_data_structure()
    
    # 然后测试前端页面（如果有selenium）
    try:
        test_frontend_page_with_browser()
    except ImportError:
        print("\n💡 提示: 安装selenium可以进行浏览器测试")
        print("   pip install selenium")
    except Exception as e:
        print(f"\n⚠️ 浏览器测试跳过: {str(e)}")
    
    print("\n" + "=" * 50)
    print("✅ 测试完成")
    print("\n💡 如果API返回了正确的aiAnalysis数据，")
    print("   但页面仍然没有显示，请检查前端组件的渲染逻辑")

if __name__ == "__main__":
    main() 