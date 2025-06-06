#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
服务器环境定时任务启动脚本
专门针对服务器环境优化
"""

import os
import sys
import time
import signal
import logging
import threading
from datetime import datetime
import traceback

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scheduler_server.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class ServerScheduler:
    """服务器调度器"""
    
    def __init__(self):
        self.running = False
        self.crawler_factory = None
        self.last_run_time = None
        self.run_interval = 300  # 5分钟间隔
        
    def setup(self):
        """初始化设置"""
        try:
            logger.info("🚀 初始化服务器调度器...")
            
            # 设置工作目录
            script_dir = os.path.dirname(os.path.abspath(__file__))
            os.chdir(script_dir)
            logger.info(f"工作目录: {os.getcwd()}")
            
            # 添加项目路径到Python路径
            if script_dir not in sys.path:
                sys.path.insert(0, script_dir)
            
            # 导入爬虫工厂
            from crawlers.crawler_factory import CrawlerFactory
            self.crawler_factory = CrawlerFactory()
            logger.info("✅ 爬虫工厂初始化成功")
            
            # 测试数据库连接
            from db.sqlite_client import SQLiteClient
            db_client = SQLiteClient()
            logger.info("✅ 数据库连接成功")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ 初始化失败: {str(e)}")
            logger.error(f"错误详情: {traceback.format_exc()}")
            return False
    
    def run_crawlers(self):
        """运行爬虫任务"""
        try:
            logger.info("🕷️ 开始执行爬虫任务...")
            
            # 获取可用爬虫
            available_crawlers = self.crawler_factory.get_available_crawlers()
            logger.info(f"可用爬虫: {available_crawlers}")
            
            # 执行Jin10爬虫
            if 'jin10' in available_crawlers:
                logger.info("执行Jin10爬虫...")
                jin10_crawler = self.crawler_factory.get_crawler('jin10')
                
                if jin10_crawler:
                    # 运行爬虫
                    articles = jin10_crawler.crawl()
                    logger.info(f"Jin10爬虫完成，获取 {len(articles)} 篇文章")
                else:
                    logger.error("Jin10爬虫创建失败")
            else:
                logger.warning("Jin10爬虫不可用")
            
            self.last_run_time = datetime.now()
            logger.info(f"✅ 爬虫任务完成，下次运行时间: {self.last_run_time}")
            
        except Exception as e:
            logger.error(f"❌ 爬虫任务执行失败: {str(e)}")
            logger.error(f"错误详情: {traceback.format_exc()}")
    
    def should_run(self):
        """检查是否应该运行"""
        if self.last_run_time is None:
            return True
        
        elapsed = (datetime.now() - self.last_run_time).total_seconds()
        return elapsed >= self.run_interval
    
    def run_loop(self):
        """主运行循环"""
        logger.info("🔄 启动调度循环...")
        self.running = True
        
        while self.running:
            try:
                if self.should_run():
                    self.run_crawlers()
                
                # 等待10秒后再检查
                time.sleep(10)
                
            except KeyboardInterrupt:
                logger.info("收到中断信号，正在停止...")
                self.stop()
                break
            except Exception as e:
                logger.error(f"调度循环错误: {str(e)}")
                time.sleep(30)  # 出错后等待30秒
    
    def stop(self):
        """停止调度器"""
        logger.info("🛑 停止调度器...")
        self.running = False
    
    def start(self):
        """启动调度器"""
        if not self.setup():
            logger.error("初始化失败，无法启动")
            return False
        
        logger.info("🚀 启动服务器调度器...")
        
        # 设置信号处理
        signal.signal(signal.SIGINT, lambda s, f: self.stop())
        signal.signal(signal.SIGTERM, lambda s, f: self.stop())
        
        # 启动调度循环
        self.run_loop()
        
        logger.info("调度器已停止")
        return True

def check_server_environment():
    """检查服务器环境"""
    logger.info("🔍 检查服务器环境...")
    
    # 检查Python版本
    logger.info(f"Python版本: {sys.version}")
    
    # 检查工作目录
    logger.info(f"当前目录: {os.getcwd()}")
    
    # 检查关键文件
    required_files = [
        'crawlers/jin10.py',
        'crawlers/crawler_factory.py',
        'db/sqlite_client.py',
        'utils/enhanced_ai_service.py'
    ]
    
    missing_files = []
    for file_path in required_files:
        if os.path.exists(file_path):
            logger.info(f"✅ {file_path}")
        else:
            logger.error(f"❌ {file_path} 不存在")
            missing_files.append(file_path)
    
    if missing_files:
        logger.error(f"缺少关键文件: {missing_files}")
        return False
    
    # 检查依赖包
    try:
        import schedule
        import requests
        import bs4
        logger.info("✅ 关键依赖包检查通过")
    except ImportError as e:
        logger.error(f"❌ 依赖包缺失: {str(e)}")
        return False
    
    return True

def main():
    """主函数"""
    logger.info("=" * 60)
    logger.info("🚀 NewsNow 服务器调度器启动")
    logger.info("=" * 60)
    
    # 检查环境
    if not check_server_environment():
        logger.error("环境检查失败，退出")
        sys.exit(1)
    
    # 创建并启动调度器
    scheduler = ServerScheduler()
    
    try:
        scheduler.start()
    except Exception as e:
        logger.error(f"调度器启动失败: {str(e)}")
        logger.error(f"错误详情: {traceback.format_exc()}")
        sys.exit(1)

if __name__ == "__main__":
    main() 