#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试文本格式化效果
"""

def test_text_formatting():
    """测试文本格式化逻辑"""
    print("🧪 测试文本格式化逻辑")
    print("=" * 60)
    
    # 测试样例文本
    sample_text = "建议采取以下策略：1) 对特斯拉等直接受影响个股设置止损；2) 增加投资组合防御性配置；3) 小仓位参与事件驱动型机会；4) 密切关注白宫政策动向。短线投资者可考虑波动率交易，长线投资者宜等待更明确信号。"
    
    print(f"📝 原始文本:")
    print(f"   {sample_text}")
    print(f"   长度: {len(sample_text)} 字符")
    
    # 模拟JavaScript的formatText函数逻辑
    def format_text_python(text):
        """Python版本的文本格式化函数"""
        if not text:
            return [text]
        
        # 处理数字编号的策略建议
        import re
        numbered_strategies = re.findall(r'\d+\)\s*[^；;]+[；;]', text)
        if numbered_strategies and len(numbered_strategies) > 1:
            parts = re.split(r'(\d+\)\s*[^；;]+[；;])', text)
            result = []
            for part in parts:
                if part.strip():
                    if re.match(r'\d+\)\s*[^；;]+[；;]', part):
                        result.append(part.strip())
                    else:
                        result.append(part.strip())
            return [p for p in result if p.strip()]
        
        # 处理分号分隔的建议
        if '；' in text or ';' in text:
            parts = re.split(r'[；;]', text)
            return [part.strip() for part in parts if part.strip()]
        
        # 处理句号分隔的长句
        if len(text) > 100 and '。' in text:
            parts = text.split('。')
            result = []
            for part in parts:
                if part.strip():
                    if not part.strip().endswith('。'):
                        result.append(part.strip() + '。')
                    else:
                        result.append(part.strip())
            return result
        
        return [text]
    
    # 测试格式化
    formatted_parts = format_text_python(sample_text)
    
    print(f"\n📋 格式化后的文本:")
    print(f"   分割成 {len(formatted_parts)} 部分:")
    for i, part in enumerate(formatted_parts, 1):
        print(f"   {i}. {part}")
    
    # 测试其他样例
    test_cases = [
        "这是一个简单的文本，没有特殊分隔符。",
        "策略一：买入；策略二：持有；策略三：卖出。",
        "1) 短期策略；2) 中期策略；3) 长期策略；4) 风险控制。",
        "这是一个很长的文本，超过了100个字符的限制。它包含多个句子，每个句子都以句号结尾。这样的文本应该被分割成多个部分。每个部分都应该保持完整的语义。"
    ]
    
    print(f"\n🧪 测试其他样例:")
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n   样例 {i}: {test_case[:50]}...")
        formatted = format_text_python(test_case)
        print(f"   分割结果: {len(formatted)} 部分")
        for j, part in enumerate(formatted, 1):
            print(f"     {j}. {part}")

def test_display_effect():
    """测试显示效果"""
    print(f"\n🎨 显示效果预览")
    print("=" * 60)
    
    sample_suggestion = "建议采取以下策略：1) 对特斯拉等直接受影响个股设置止损；2) 增加投资组合防御性配置；3) 小仓位参与事件驱动型机会；4) 密切关注白宫政策动向。短线投资者可考虑波动率交易，长线投资者宜等待更明确信号。"
    
    print("📱 优化前的显示效果:")
    print("   • " + sample_suggestion)
    
    print("\n📱 优化后的显示效果:")
    print("   ┌─ 投资建议 ─────────────────────────────────────┐")
    print("   │                                                │")
    print("   │ 1) 对特斯拉等直接受影响个股设置止损；           │")
    print("   │ 2) 增加投资组合防御性配置；                   │")
    print("   │ 3) 小仓位参与事件驱动型机会；                 │")
    print("   │ 4) 密切关注白宫政策动向。                     │")
    print("   │                                                │")
    print("   │ 短线投资者可考虑波动率交易，长线投资者宜等待   │")
    print("   │ 更明确信号。                                   │")
    print("   │                                                │")
    print("   └────────────────────────────────────────────────┘")
    
    print("\n✨ 优化特性:")
    print("   • 🎯 智能识别数字编号策略")
    print("   • 📝 自动分行显示长文本")
    print("   • 🎨 彩色背景区分不同类型内容")
    print("   • 📱 响应式布局适配移动端")
    print("   • 🔤 优化行间距提高可读性")

def main():
    """主函数"""
    test_text_formatting()
    test_display_effect()
    
    print("\n" + "=" * 60)
    print("✅ 文本格式化测试完成")
    print("\n💡 优化效果:")
    print("   1. 长文本自动换行，提高可读性")
    print("   2. 数字编号策略自动分行显示")
    print("   3. 不同类型内容使用不同背景色")
    print("   4. 优化间距和字体样式")
    print("   5. 支持深色模式")

if __name__ == "__main__":
    main() 