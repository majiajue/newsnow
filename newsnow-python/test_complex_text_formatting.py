#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试复杂文本格式化效果
"""

import re

def format_text_python(text):
    """Python版本的增强文本格式化函数"""
    if not text:
        return [text]
    
    # 处理数字编号的策略建议（更宽松的匹配）
    numbered_strategies = re.findall(r'\d+\)\s*[^；;。]+[；;。]', text)
    if numbered_strategies and len(numbered_strategies) > 1:
        parts = re.split(r'(\d+\)\s*[^；;。]+[；;。])', text)
        result = []
        for part in parts:
            if part.strip():
                if re.match(r'\d+\)\s*[^；;。]+[；;。]', part):
                    result.append(part.strip())
                else:
                    result.append(part.strip())
        return [p for p in result if p.strip()]
    
    # 处理分号分隔的建议
    if '；' in text or ';' in text:
        parts = re.split(r'[；;]', text)
        return [part.strip() for part in parts if part.strip()]
    
    # 处理复杂的长句（包含多个层面的分析）
    if len(text) > 120:
        # 先尝试按照"另一方面"、"若...则"等逻辑连接词分割
        logical_connectors = ['另一方面', '若矛盾持续', '若...则', '此外', '同时', '然而', '但是', '不过']
        for connector in logical_connectors:
            if connector in text:
                parts = text.split(connector)
                if len(parts) > 1:
                    result = []
                    for i, part in enumerate(parts):
                        if i == 0:
                            result.append(part.strip())
                        else:
                            result.append(connector + part.strip())
                    return [p for p in result if p.strip()]
        
        # 如果没有逻辑连接词，按句号分割长句
        if '。' in text:
            sentences = text.split('。')
            sentences = [s.strip() for s in sentences if s.strip()]
            if len(sentences) > 2:
                return [s + '。' for s in sentences]
    
    return [text]

def test_complex_text():
    """测试复杂文本格式化"""
    print("🧪 测试复杂文本格式化")
    print("=" * 80)
    
    # 您提到的观点解读文本
    opinion_text = "长期影响可能体现在三个层面：1) 美国新能源政策走向，特斯拉可能失去部分政府补贴；2) SpaceX的星链项目和NASA合同面临重新评估；3) 科技巨头与政府关系模式重构。若矛盾持续，马斯克旗下企业可能面临更严格的监管审查。另一方面，传统汽车制造商和航天企业可能获得发展窗口期。"
    
    print("📝 原始观点解读文本:")
    print(f"   {opinion_text}")
    print(f"   长度: {len(opinion_text)} 字符")
    
    # 测试格式化
    formatted_parts = format_text_python(opinion_text)
    
    print(f"\n📋 格式化后的文本:")
    print(f"   分割成 {len(formatted_parts)} 部分:")
    for i, part in enumerate(formatted_parts, 1):
        print(f"   {i}. {part}")
    
    # 测试其他复杂文本样例
    test_cases = [
        {
            "name": "投资建议",
            "text": "建议采取以下策略：1) 对特斯拉等直接受影响个股设置止损；2) 增加投资组合防御性配置；3) 小仓位参与事件驱动型机会；4) 密切关注白宫政策动向。短线投资者可考虑波动率交易，长线投资者宜等待更明确信号。"
        },
        {
            "name": "市场分析",
            "text": "市场反应分为三个阶段：1) 即时冲击阶段，相关股票大幅波动；2) 消化阶段，投资者重新评估基本面；3) 重构阶段，新的平衡点形成。然而，政策不确定性仍将持续影响市场情绪。"
        },
        {
            "name": "风险评估", 
            "text": "主要风险包括政策风险、市场风险和流动性风险。此外，地缘政治因素也不容忽视。但是，长期来看，技术创新仍是推动行业发展的核心动力。"
        }
    ]
    
    print(f"\n🧪 测试其他复杂文本样例:")
    for i, case in enumerate(test_cases, 1):
        print(f"\n   样例 {i} - {case['name']}:")
        print(f"   原文: {case['text'][:60]}...")
        formatted = format_text_python(case['text'])
        print(f"   分割结果: {len(formatted)} 部分")
        for j, part in enumerate(formatted, 1):
            print(f"     {j}. {part}")

def test_display_preview():
    """显示效果预览"""
    print(f"\n🎨 显示效果预览")
    print("=" * 80)
    
    opinion_text = "长期影响可能体现在三个层面：1) 美国新能源政策走向，特斯拉可能失去部分政府补贴；2) SpaceX的星链项目和NASA合同面临重新评估；3) 科技巨头与政府关系模式重构。若矛盾持续，马斯克旗下企业可能面临更严格的监管审查。另一方面，传统汽车制造商和航天企业可能获得发展窗口期。"
    
    print("📱 优化前的显示效果:")
    print("   " + opinion_text)
    
    print("\n📱 优化后的显示效果:")
    print("   ┌─ 观点解读 ─────────────────────────────────────┐")
    print("   │                                                │")
    
    formatted_parts = format_text_python(opinion_text)
    for part in formatted_parts:
        # 模拟换行显示
        lines = []
        current_line = ""
        words = part.split()
        
        for word in words:
            if len(current_line + word) <= 45:  # 假设每行45个字符
                current_line += word
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
        
        for line in lines:
            print(f"   │ {line:<46} │")
        print("   │                                                │")
    
    print("   └────────────────────────────────────────────────┘")
    
    print("\n✨ 优化特性:")
    print("   • 🎯 智能识别数字编号内容")
    print("   • 🔗 识别逻辑连接词（另一方面、若矛盾持续等）")
    print("   • 📝 自动分段显示复杂分析")
    print("   • 🎨 每段独立显示，提高可读性")
    print("   • 📱 适配移动端阅读体验")

def main():
    """主函数"""
    test_complex_text()
    test_display_preview()
    
    print("\n" + "=" * 80)
    print("✅ 复杂文本格式化测试完成")
    print("\n💡 优化效果:")
    print("   1. 智能识别数字编号的多层面分析")
    print("   2. 自动识别逻辑连接词进行分段")
    print("   3. 长文本自动分段，提高可读性")
    print("   4. 每个段落独立显示，层次清晰")
    print("   5. 支持复杂的观点解读和影响分析")

if __name__ == "__main__":
    main() 