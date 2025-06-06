#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试AI API响应内容
"""

import os
import sys
import logging
from datetime import datetime

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def debug_ai_response():
    """调试AI API响应"""
    print("🔍 调试AI API响应内容...")
    
    try:
        from utils.enhanced_ai_service import EnhancedFinanceAnalyzer
        
        # 检查API密钥
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            print("❌ 未找到DEEPSEEK_API_KEY环境变量")
            return False
        
        print(f"✅ API密钥已配置 (长度: {len(api_key)})")
        
        # 初始化分析器
        analyzer = EnhancedFinanceAnalyzer(api_key=api_key)
        
        # 测试简单的分析请求
        test_title = "欧洲央行管委森特诺：欧洲央行的利率周期可能已接近结束并开始稳定"
        test_content = "欧洲央行管委森特诺表示，欧洲央行的利率周期可能已接近结束并开始稳定。未来一段时间内，利率将稳定在2%左右。"
        
        print(f"\n📝 测试分析:")
        print(f"标题: {test_title}")
        print(f"内容: {test_content}")
        
        # 直接调用API查看原始响应
        print("\n🔧 直接调用API...")
        
        system_prompt = "你是一位财经分析师，请分析以下新闻并返回JSON格式的分析结果。"
        prompt = f"请分析这条新闻：{test_title}\n内容：{test_content}\n请返回JSON格式的分析。"
        
        result = analyzer._call_api_with_retry(prompt, system_prompt)
        
        if result["success"]:
            print("✅ API调用成功")
            content = result["content"]
            print(f"\n📄 API响应内容 (长度: {len(content)} 字符):")
            print("=" * 50)
            print(content)
            print("=" * 50)
            
            # 尝试解析JSON
            import re
            import json
            
            print("\n🔍 尝试解析JSON...")
            
            # 方式1: 查找 ```json``` 格式
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content)
            if json_match:
                json_content = json_match.group(1).strip()
                print("✅ 找到 ```json``` 格式")
                print(f"JSON内容长度: {len(json_content)} 字符")
                print("JSON内容前200字符:")
                print(json_content[:200] + "..." if len(json_content) > 200 else json_content)
                
                try:
                    parsed = json.loads(json_content)
                    print("✅ JSON解析成功")
                    print(f"解析后的键: {list(parsed.keys()) if isinstance(parsed, dict) else 'Not a dict'}")
                    return True
                except json.JSONDecodeError as e:
                    print(f"❌ JSON解析失败: {e}")
            else:
                print("❌ 未找到 ```json``` 格式")
                
                # 方式2: 查找大括号
                json_match = re.search(r'\{[\s\S]*\}', content)
                if json_match:
                    json_content = json_match.group(0).strip()
                    print("✅ 找到大括号JSON格式")
                    print(f"JSON内容长度: {len(json_content)} 字符")
                    try:
                        parsed = json.loads(json_content)
                        print("✅ 大括号JSON解析成功")
                        return True
                    except json.JSONDecodeError as e:
                        print(f"❌ 大括号JSON解析失败: {e}")
                else:
                    print("❌ 未找到任何JSON格式")
            
            return False
        else:
            print(f"❌ API调用失败: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ 调试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = debug_ai_response()
    if success:
        print("\n🎉 AI响应调试成功！")
    else:
        print("\n❌ AI响应调试失败")
        print("可能的原因:")
        print("1. API密钥无效或过期")
        print("2. API返回格式不是标准JSON")
        print("3. 网络连接问题") 