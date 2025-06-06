#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
诊断服务器定时任务问题
"""

import os
import sys
import subprocess
import importlib.util
import traceback
from pathlib import Path

def check_environment():
    """检查环境配置"""
    print("🔍 检查环境配置")
    print("=" * 60)
    
    # 检查Python版本
    print(f"Python版本: {sys.version}")
    print(f"Python路径: {sys.executable}")
    
    # 检查当前工作目录
    print(f"当前工作目录: {os.getcwd()}")
    
    # 检查环境变量
    env_vars = ['PYTHONPATH', 'PATH', 'HOME', 'USER']
    print(f"\n环境变量:")
    for var in env_vars:
        value = os.environ.get(var, 'N/A')
        print(f"  {var}: {value[:100]}..." if len(value) > 100 else f"  {var}: {value}")

def check_dependencies():
    """检查依赖包"""
    print(f"\n📦 检查依赖包")
    print("=" * 60)
    
    required_packages = [
        'schedule',
        'requests', 
        'beautifulsoup4',
        'lxml',
        'sqlite3',
        'json',
        'datetime',
        'threading',
        'logging'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'sqlite3':
                import sqlite3
                print(f"✅ {package}: {sqlite3.version}")
            elif package == 'beautifulsoup4':
                import bs4
                print(f"✅ {package}: {bs4.__version__}")
            else:
                module = importlib.import_module(package)
                version = getattr(module, '__version__', 'unknown')
                print(f"✅ {package}: {version}")
        except ImportError as e:
            print(f"❌ {package}: 未安装 - {str(e)}")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️ 缺少依赖包: {', '.join(missing_packages)}")
        print(f"安装命令: pip install {' '.join(missing_packages)}")
    else:
        print(f"\n✅ 所有依赖包都已安装")

def check_project_structure():
    """检查项目结构"""
    print(f"\n📁 检查项目结构")
    print("=" * 60)
    
    required_files = [
        'crawlers/__init__.py',
        'crawlers/jin10.py',
        'crawlers/crawler_factory.py',
        'utils/enhanced_ai_service.py',
        'db/sqlite_client.py',
        'scheduler.py',
        'main.py'
    ]
    
    missing_files = []
    
    for file_path in required_files:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"✅ {file_path}: {size} bytes")
        else:
            print(f"❌ {file_path}: 文件不存在")
            missing_files.append(file_path)
    
    if missing_files:
        print(f"\n⚠️ 缺少文件: {missing_files}")
    else:
        print(f"\n✅ 所有必需文件都存在")

def check_scheduler_import():
    """检查调度器导入"""
    print(f"\n⚙️ 检查调度器导入")
    print("=" * 60)
    
    try:
        # 检查scheduler.py是否可以导入
        if os.path.exists('scheduler.py'):
            print("✅ scheduler.py 文件存在")
            
            # 尝试导入
            sys.path.insert(0, os.getcwd())
            import scheduler
            print("✅ scheduler.py 导入成功")
            
            # 检查关键函数
            if hasattr(scheduler, 'setup_scheduler'):
                print("✅ setup_scheduler 函数存在")
            else:
                print("❌ setup_scheduler 函数不存在")
                
            if hasattr(scheduler, 'run_scheduler'):
                print("✅ run_scheduler 函数存在")
            else:
                print("❌ run_scheduler 函数不存在")
                
        else:
            print("❌ scheduler.py 文件不存在")
            
    except Exception as e:
        print(f"❌ 导入scheduler失败: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")

def check_crawler_import():
    """检查爬虫导入"""
    print(f"\n🕷️ 检查爬虫导入")
    print("=" * 60)
    
    try:
        # 检查爬虫工厂
        from crawlers.crawler_factory import CrawlerFactory
        print("✅ CrawlerFactory 导入成功")
        
        # 检查可用爬虫
        factory = CrawlerFactory()
        available_crawlers = factory.get_available_crawlers()
        print(f"✅ 可用爬虫: {available_crawlers}")
        
        # 测试Jin10爬虫
        jin10_crawler = factory.get_crawler('jin10')
        if jin10_crawler:
            print("✅ Jin10爬虫创建成功")
        else:
            print("❌ Jin10爬虫创建失败")
            
    except Exception as e:
        print(f"❌ 爬虫导入失败: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")

def check_database():
    """检查数据库"""
    print(f"\n🗄️ 检查数据库")
    print("=" * 60)
    
    try:
        from db.sqlite_client import SQLiteClient
        print("✅ SQLiteClient 导入成功")
        
        # 测试数据库连接
        db_client = SQLiteClient()
        print("✅ 数据库连接成功")
        
        # 检查表是否存在
        import sqlite3
        conn = sqlite3.connect('news.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"✅ 数据库表: {[table[0] for table in tables]}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 数据库检查失败: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")

def check_ai_service():
    """检查AI服务"""
    print(f"\n🤖 检查AI服务")
    print("=" * 60)
    
    try:
        from utils.enhanced_ai_service import EnhancedAIService
        print("✅ EnhancedAIService 导入成功")
        
        # 检查配置
        ai_service = EnhancedAIService()
        print("✅ AI服务初始化成功")
        
    except Exception as e:
        print(f"❌ AI服务检查失败: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")

def check_process_status():
    """检查进程状态"""
    print(f"\n🔄 检查进程状态")
    print("=" * 60)
    
    try:
        # 检查是否有Python进程在运行
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        python_processes = [line for line in result.stdout.split('\n') if 'python' in line.lower()]
        
        print(f"Python进程数量: {len(python_processes)}")
        for i, process in enumerate(python_processes[:5], 1):  # 只显示前5个
            print(f"  {i}. {process.strip()}")
            
        # 检查是否有scheduler相关进程
        scheduler_processes = [line for line in python_processes if 'scheduler' in line.lower() or 'main.py' in line]
        if scheduler_processes:
            print(f"\n📋 调度器相关进程:")
            for process in scheduler_processes:
                print(f"  {process.strip()}")
        else:
            print(f"\n⚠️ 没有找到调度器相关进程")
            
    except Exception as e:
        print(f"❌ 进程检查失败: {str(e)}")

def check_logs():
    """检查日志文件"""
    print(f"\n📝 检查日志文件")
    print("=" * 60)
    
    log_files = ['app.log', 'scheduler.log', 'crawler.log', 'logs/app.log']
    
    for log_file in log_files:
        if os.path.exists(log_file):
            size = os.path.getsize(log_file)
            print(f"✅ {log_file}: {size} bytes")
            
            # 显示最后几行日志
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    if lines:
                        print(f"   最后几行:")
                        for line in lines[-3:]:
                            print(f"     {line.strip()}")
            except Exception as e:
                print(f"   读取失败: {str(e)}")
        else:
            print(f"❌ {log_file}: 文件不存在")

def provide_solutions():
    """提供解决方案"""
    print(f"\n💡 常见问题解决方案")
    print("=" * 60)
    
    solutions = [
        {
            "问题": "依赖包缺失",
            "解决方案": [
                "pip install -r requirements.txt",
                "pip install schedule requests beautifulsoup4 lxml",
                "检查Python版本兼容性"
            ]
        },
        {
            "问题": "文件路径问题", 
            "解决方案": [
                "确保在项目根目录运行",
                "检查PYTHONPATH环境变量",
                "使用绝对路径"
            ]
        },
        {
            "问题": "权限问题",
            "解决方案": [
                "检查文件执行权限: chmod +x main.py",
                "检查数据库文件权限",
                "确保日志目录可写"
            ]
        },
        {
            "问题": "进程冲突",
            "解决方案": [
                "杀死现有进程: pkill -f python",
                "检查端口占用: netstat -tulpn",
                "使用不同的进程管理方式"
            ]
        },
        {
            "问题": "内存不足",
            "解决方案": [
                "检查系统内存: free -h",
                "优化爬虫并发数",
                "增加swap空间"
            ]
        }
    ]
    
    for solution in solutions:
        print(f"\n🔧 {solution['问题']}:")
        for step in solution['解决方案']:
            print(f"   • {step}")

def main():
    """主函数"""
    print("🚀 服务器定时任务诊断工具")
    print("=" * 60)
    
    check_environment()
    check_dependencies()
    check_project_structure()
    check_scheduler_import()
    check_crawler_import()
    check_database()
    check_ai_service()
    check_process_status()
    check_logs()
    provide_solutions()
    
    print("\n" + "=" * 60)
    print("✅ 诊断完成")
    print("\n📋 下一步建议:")
    print("   1. 根据上述检查结果修复发现的问题")
    print("   2. 确保所有依赖都已正确安装")
    print("   3. 检查服务器资源使用情况")
    print("   4. 查看详细的错误日志")
    print("   5. 考虑使用systemd或supervisor管理进程")

if __name__ == "__main__":
    main() 