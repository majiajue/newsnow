#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
紧急修复脚本 - 替换为最简化版本
"""

import os
import shutil

def emergency_fix():
    """紧急修复：使用最简化版本"""
    print("🚨 执行紧急修复...")
    
    try:
        # 备份当前文件
        current_file = "utils/enhanced_ai_service.py"
        backup_file = "utils/enhanced_ai_service.py.backup"
        simple_file = "utils/enhanced_ai_service_simple.py"
        
        if os.path.exists(current_file):
            shutil.copy2(current_file, backup_file)
            print(f"✅ 已备份当前文件到: {backup_file}")
        
        if os.path.exists(simple_file):
            shutil.copy2(simple_file, current_file)
            print(f"✅ 已替换为简化版本: {simple_file} -> {current_file}")
            
            # 测试导入
            import sys
            sys.path.insert(0, '.')
            from utils.enhanced_ai_service import EnhancedFinanceAnalyzer
            
            analyzer = EnhancedFinanceAnalyzer()
            test_result = analyzer._generate_fallback_analysis("测试", "测试内容")
            
            if test_result:
                print("✅ 简化版本测试成功")
                print("🐳 现在可以重新启动Docker容器了")
                return True
            else:
                print("❌ 简化版本测试失败")
                return False
        else:
            print(f"❌ 简化版本文件不存在: {simple_file}")
            return False
            
    except Exception as e:
        print(f"❌ 紧急修复失败: {e}")
        return False

def restore_backup():
    """恢复备份"""
    print("🔄 恢复备份文件...")
    
    try:
        current_file = "utils/enhanced_ai_service.py"
        backup_file = "utils/enhanced_ai_service.py.backup"
        
        if os.path.exists(backup_file):
            shutil.copy2(backup_file, current_file)
            print(f"✅ 已恢复备份: {backup_file} -> {current_file}")
            return True
        else:
            print(f"❌ 备份文件不存在: {backup_file}")
            return False
            
    except Exception as e:
        print(f"❌ 恢复备份失败: {e}")
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "restore":
        restore_backup()
    else:
        print("🚨 紧急修复模式")
        print("这将使用最简化的AI服务版本")
        print("如果需要恢复，请运行: python3 emergency_fix.py restore")
        
        confirm = input("确认执行紧急修复？(y/N): ")
        if confirm.lower() == 'y':
            emergency_fix()
        else:
            print("❌ 取消修复") 