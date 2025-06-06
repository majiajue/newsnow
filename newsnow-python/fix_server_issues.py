#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
服务器问题快速修复脚本
"""

import os
import sys
import subprocess
import shutil
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def fix_permissions():
    """修复文件权限"""
    logger.info("🔧 修复文件权限...")
    
    try:
        # 设置Python文件执行权限
        python_files = ['main.py', 'scheduler.py', 'start_scheduler_server.py', 'diagnose_server_scheduler.py']
        for file in python_files:
            if os.path.exists(file):
                os.chmod(file, 0o755)
                logger.info(f"✅ 设置 {file} 执行权限")
        
        # 设置目录权限
        directories = ['crawlers', 'db', 'utils', 'logs']
        for dir_name in directories:
            if os.path.exists(dir_name):
                os.chmod(dir_name, 0o755)
                logger.info(f"✅ 设置 {dir_name} 目录权限")
        
        # 设置数据库文件权限
        if os.path.exists('news.db'):
            os.chmod('news.db', 0o666)
            logger.info("✅ 设置数据库文件权限")
            
    except Exception as e:
        logger.error(f"❌ 权限修复失败: {str(e)}")

def fix_python_path():
    """修复Python路径问题"""
    logger.info("🐍 修复Python路径...")
    
    try:
        current_dir = os.getcwd()
        
        # 创建或更新 __init__.py 文件
        init_files = [
            'crawlers/__init__.py',
            'db/__init__.py', 
            'utils/__init__.py'
        ]
        
        for init_file in init_files:
            dir_name = os.path.dirname(init_file)
            if not os.path.exists(dir_name):
                os.makedirs(dir_name)
                logger.info(f"✅ 创建目录 {dir_name}")
            
            if not os.path.exists(init_file):
                with open(init_file, 'w') as f:
                    f.write('# -*- coding: utf-8 -*-\n')
                logger.info(f"✅ 创建 {init_file}")
        
        # 检查PYTHONPATH
        if current_dir not in sys.path:
            sys.path.insert(0, current_dir)
            logger.info(f"✅ 添加 {current_dir} 到Python路径")
            
    except Exception as e:
        logger.error(f"❌ Python路径修复失败: {str(e)}")

def fix_dependencies():
    """修复依赖问题"""
    logger.info("📦 修复依赖问题...")
    
    required_packages = [
        'schedule',
        'requests',
        'beautifulsoup4',
        'lxml',
        'python-dotenv'
    ]
    
    try:
        for package in required_packages:
            try:
                if package == 'beautifulsoup4':
                    import bs4
                else:
                    __import__(package)
                logger.info(f"✅ {package} 已安装")
            except ImportError:
                logger.info(f"⚠️ 安装 {package}...")
                subprocess.run([sys.executable, '-m', 'pip', 'install', package], check=True)
                logger.info(f"✅ {package} 安装成功")
                
    except Exception as e:
        logger.error(f"❌ 依赖修复失败: {str(e)}")

def fix_database():
    """修复数据库问题"""
    logger.info("🗄️ 修复数据库问题...")
    
    try:
        import sqlite3
        
        # 检查数据库文件
        if not os.path.exists('news.db'):
            logger.info("创建新的数据库文件...")
            conn = sqlite3.connect('news.db')
            
            # 创建基本表结构
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS articles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT,
                    url TEXT UNIQUE,
                    source TEXT,
                    published_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    processed BOOLEAN DEFAULT FALSE,
                    metadata TEXT
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("✅ 数据库初始化完成")
        else:
            logger.info("✅ 数据库文件已存在")
            
    except Exception as e:
        logger.error(f"❌ 数据库修复失败: {str(e)}")

def fix_logs():
    """修复日志问题"""
    logger.info("📝 修复日志问题...")
    
    try:
        # 创建日志目录
        if not os.path.exists('logs'):
            os.makedirs('logs')
            logger.info("✅ 创建logs目录")
        
        # 设置日志目录权限
        os.chmod('logs', 0o755)
        
        # 清理过大的日志文件
        log_files = ['app.log', 'scheduler.log', 'scheduler_server.log']
        for log_file in log_files:
            if os.path.exists(log_file):
                size = os.path.getsize(log_file)
                if size > 100 * 1024 * 1024:  # 100MB
                    # 备份并清空
                    shutil.move(log_file, f"{log_file}.backup")
                    with open(log_file, 'w') as f:
                        f.write('')
                    logger.info(f"✅ 清理大日志文件 {log_file}")
                    
    except Exception as e:
        logger.error(f"❌ 日志修复失败: {str(e)}")

def kill_existing_processes():
    """杀死现有的Python进程"""
    logger.info("🔄 检查并清理现有进程...")
    
    try:
        # 查找相关进程
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        lines = result.stdout.split('\n')
        
        scheduler_processes = []
        for line in lines:
            if 'python' in line.lower() and ('scheduler' in line or 'main.py' in line):
                parts = line.split()
                if len(parts) > 1:
                    pid = parts[1]
                    scheduler_processes.append(pid)
        
        if scheduler_processes:
            logger.info(f"发现 {len(scheduler_processes)} 个相关进程")
            for pid in scheduler_processes:
                try:
                    subprocess.run(['kill', pid], check=True)
                    logger.info(f"✅ 终止进程 {pid}")
                except:
                    logger.warning(f"⚠️ 无法终止进程 {pid}")
        else:
            logger.info("✅ 没有发现相关进程")
            
    except Exception as e:
        logger.error(f"❌ 进程清理失败: {str(e)}")

def create_simple_test():
    """创建简单测试脚本"""
    logger.info("🧪 创建测试脚本...")
    
    test_script = '''#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""简单测试脚本"""

import sys
import os

def test_imports():
    """测试导入"""
    try:
        from crawlers.crawler_factory import CrawlerFactory
        print("✅ CrawlerFactory 导入成功")
        
        from db.sqlite_client import SQLiteClient
        print("✅ SQLiteClient 导入成功")
        
        from utils.enhanced_ai_service import EnhancedAIService
        print("✅ EnhancedAIService 导入成功")
        
        return True
    except Exception as e:
        print(f"❌ 导入失败: {str(e)}")
        return False

def test_crawler():
    """测试爬虫"""
    try:
        from crawlers.crawler_factory import CrawlerFactory
        factory = CrawlerFactory()
        crawlers = factory.get_available_crawlers()
        print(f"✅ 可用爬虫: {crawlers}")
        return True
    except Exception as e:
        print(f"❌ 爬虫测试失败: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 运行简单测试...")
    
    if test_imports() and test_crawler():
        print("✅ 所有测试通过")
        sys.exit(0)
    else:
        print("❌ 测试失败")
        sys.exit(1)
'''
    
    try:
        with open('simple_test.py', 'w', encoding='utf-8') as f:
            f.write(test_script)
        os.chmod('simple_test.py', 0o755)
        logger.info("✅ 创建测试脚本 simple_test.py")
    except Exception as e:
        logger.error(f"❌ 创建测试脚本失败: {str(e)}")

def main():
    """主函数"""
    logger.info("🚀 服务器问题快速修复工具")
    logger.info("=" * 50)
    
    # 执行修复步骤
    kill_existing_processes()
    fix_permissions()
    fix_python_path()
    fix_dependencies()
    fix_database()
    fix_logs()
    create_simple_test()
    
    logger.info("=" * 50)
    logger.info("✅ 修复完成")
    
    # 运行测试
    logger.info("🧪 运行测试...")
    try:
        result = subprocess.run([sys.executable, 'simple_test.py'], capture_output=True, text=True)
        if result.returncode == 0:
            logger.info("✅ 测试通过")
            logger.info("🚀 现在可以尝试启动调度器:")
            logger.info("   python3 start_scheduler_server.py")
        else:
            logger.error("❌ 测试失败")
            logger.error(result.stdout)
            logger.error(result.stderr)
    except Exception as e:
        logger.error(f"❌ 测试执行失败: {str(e)}")

if __name__ == "__main__":
    main() 