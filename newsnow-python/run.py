#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
主启动文件 - 启动整个系统（爬虫、处理器和API服务器）
"""

import os
import sys
import time
import logging
import argparse
import threading
import subprocess
from datetime import datetime

# 设置Python路径，确保可以正确导入模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.settings import (
    API_HOST, API_PORT, API_DEBUG, 
    CRAWL_INTERVAL, PROCESS_INTERVAL
)
from api.api_server import create_api_server
from processors.article_crawler import ArticleCrawler
from processors.article_analyzer import ArticleProcessor
from processors.search_analyzer import SearchAnalyzer

logger = logging.getLogger(__name__)

def setup_logging():
    """设置日志配置"""
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    log_file = os.path.join(log_dir, f"newsnow-{datetime.now().strftime('%Y%m%d')}.log")
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger(__name__)

def start_searxng():
    """
    启动SearXNG服务
    """
    docker_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'docker/searxng')
    
    if not os.path.exists(os.path.join(docker_dir, 'docker-compose.yml')):
        logger.error(f"无法找到SearXNG配置文件: {docker_dir}/docker-compose.yml")
        return False
    
    try:
        logger.info("正在启动SearXNG服务...")
        
        # 启动Docker容器
        subprocess.run(
            ['docker-compose', 'up', '-d'],
            cwd=docker_dir,
            check=True
        )
        
        logger.info("SearXNG服务启动成功")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"启动SearXNG服务失败: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"启动SearXNG服务异常: {str(e)}")
        return False

def stop_searxng():
    """
    停止SearXNG服务
    """
    docker_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'docker/searxng')
    
    try:
        logger.info("正在停止SearXNG服务...")
        
        # 停止Docker容器
        subprocess.run(
            ['docker-compose', 'down'],
            cwd=docker_dir,
            check=True
        )
        
        logger.info("SearXNG服务已停止")
        return True
    except Exception as e:
        logger.error(f"停止SearXNG服务异常: {str(e)}")
        return False

def run_crawler_task(interval=CRAWL_INTERVAL, article_limit=20, flash_limit=50, source=None, once=False):
    """
    运行爬虫任务
    
    Args:
        interval (int): 任务间隔时间（分钟）
        article_limit (int): 每个来源的文章数量限制
        flash_limit (int): 每个来源的快讯数量限制
        source (str, optional): 文章来源筛选
        once (bool): 是否只运行一次
    """
    crawler = ArticleCrawler()
    
    def _task():
        while True:
            try:
                logger.info("开始执行爬虫任务...")
                
                if source:
                    # 爬取指定来源
                    crawler.crawl_source(source, limit=article_limit)
                    
                    # 如果支持快讯，也爬取快讯
                    if source in ["jin10", "gelonghui", "cls"]:
                        crawler.crawl_flash(source, limit=flash_limit)
                else:
                    # 爬取所有来源
                    crawler.crawl_all_sources(article_limit=article_limit, flash_limit=flash_limit)
                
                logger.info("爬虫任务执行完成")
                
                if once:
                    break
                
                # 等待下一次执行
                logger.info(f"等待 {interval} 分钟后再次执行爬虫任务...")
                time.sleep(interval * 60)
                
            except Exception as e:
                logger.error(f"爬虫任务异常: {str(e)}")
                time.sleep(60)  # 发生异常时等待1分钟后重试
    
    # 创建并启动线程
    thread = threading.Thread(target=_task)
    thread.daemon = True
    thread.start()
    
    return thread

def run_processor_task(interval=PROCESS_INTERVAL, batch_size=20, source=None, once=False, use_search=True):
    """
    运行处理器任务
    
    Args:
        interval (int): 任务间隔时间（分钟）
        batch_size (int): 每批处理的文章数量
        source (str, optional): 文章来源筛选
        once (bool): 是否只运行一次
        use_search (bool): 是否使用搜索增强分析
    """
    processor = ArticleProcessor()
    search_analyzer = SearchAnalyzer() if use_search else None
    
    def _task():
        while True:
            try:
                logger.info("开始执行处理器任务...")
                
                if use_search and search_analyzer:
                    # 使用搜索增强分析
                    logger.info("使用搜索增强分析...")
                    result = search_analyzer.analyze_batch(batch_size, source)
                else:
                    # 使用标准处理器
                    result = processor.process_batch(batch_size, source)
                
                if result["total"] > 0:
                    logger.info(f"处理完成: 总计 {result['total']} 篇文章, "
                               f"成功 {result['success']} 篇, 失败 {result['failed']} 篇")
                else:
                    logger.info("没有找到需要处理的文章")
                
                if once:
                    break
                
                # 等待下一次执行
                logger.info(f"等待 {interval} 分钟后再次执行处理器任务...")
                time.sleep(interval * 60)
                
            except Exception as e:
                logger.error(f"处理器任务异常: {str(e)}")
                time.sleep(60)  # 发生异常时等待1分钟后重试
    
    # 创建并启动线程
    thread = threading.Thread(target=_task)
    thread.daemon = True
    thread.start()
    
    return thread

def run_api_server(host=API_HOST, port=API_PORT, debug=API_DEBUG):
    """
    运行API服务器
    
    Args:
        host (str): 服务器主机地址
        port (int): 服务器端口号
        debug (bool): 是否启用调试模式
    """
    logger.info(f"正在启动API服务器: {host}:{port}...")
    
    api_server = create_api_server(host=host, port=port)
    
    def _run_server():
        if debug:
            api_server.run_debug()
        else:
            api_server.run()
    
    # 创建并启动线程
    thread = threading.Thread(target=_run_server)
    thread.daemon = True
    thread.start()
    
    logger.info(f"API服务器已启动: http://{host}:{port}/")
    
    return thread

def main():
    """主函数"""
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='财经新闻处理系统')
    
    # 系统组件选项
    parser.add_argument('--all', action='store_true', help='启动所有组件（爬虫、处理器、API服务器和SearXNG）')
    parser.add_argument('--crawler', action='store_true', help='启动爬虫')
    parser.add_argument('--processor', action='store_true', help='启动处理器')
    parser.add_argument('--api', action='store_true', help='启动API服务器')
    parser.add_argument('--searx', action='store_true', help='启动SearXNG服务')
    
    # 运行选项
    parser.add_argument('--once', action='store_true', help='仅运行一次，不启动定时任务')
    parser.add_argument('--crawl-interval', type=int, default=CRAWL_INTERVAL, help='爬取间隔（分钟）')
    parser.add_argument('--process-interval', type=int, default=PROCESS_INTERVAL, help='处理间隔（分钟）')
    parser.add_argument('--article-limit', type=int, default=20, help='每个来源抓取的文章数量')
    parser.add_argument('--flash-limit', type=int, default=50, help='每个来源抓取的快讯数量')
    parser.add_argument('--batch', type=int, default=20, help='每批处理的文章数量')
    parser.add_argument('--source', type=str, help='文章来源筛选')
    parser.add_argument('--use-search', action='store_true', help='使用搜索增强分析')
    
    args = parser.parse_args()
    
    # 设置日志
    logger = setup_logging()
    logger.info("财经新闻处理系统启动中...")
    
    # 如果没有指定任何组件，则默认启动所有组件
    if not (args.crawler or args.processor or args.api or args.searx):
        args.all = True
    
    # 启动SearXNG服务
    if args.all or args.searx:
        start_searxng()
    
    active_threads = []
    
    try:
        # 启动爬虫
        if args.all or args.crawler:
            logger.info("正在启动爬虫...")
            crawler_thread = run_crawler_task(
                interval=args.crawl_interval,
                article_limit=args.article_limit,
                flash_limit=args.flash_limit,
                source=args.source,
                once=args.once
            )
            active_threads.append(crawler_thread)
        
        # 启动处理器
        if args.all or args.processor:
            logger.info("正在启动处理器...")
            processor_thread = run_processor_task(
                interval=args.process_interval,
                batch_size=args.batch,
                source=args.source,
                once=args.once,
                use_search=args.use_search
            )
            active_threads.append(processor_thread)
        
        # 启动API服务器
        if args.all or args.api:
            logger.info("正在启动API服务器...")
            api_thread = run_api_server()
            active_threads.append(api_thread)
        
        # 等待任务完成或者用户中断
        if args.once:
            # 如果只运行一次，等待任务完成
            for thread in active_threads:
                thread.join()
            logger.info("所有任务已完成")
        else:
            # 如果是持续运行，等待用户中断
            logger.info("系统已启动，按Ctrl+C中断...")
            while True:
                time.sleep(1)
                
    except KeyboardInterrupt:
        logger.info("收到中断信号，正在关闭系统...")
        
        # 停止SearXNG服务
        if args.all or args.searx:
            stop_searxng()
        
        logger.info("系统已关闭")
    
    except Exception as e:
        logger.error(f"系统运行异常: {str(e)}")
        
        # 停止SearXNG服务
        if args.all or args.searx:
            stop_searxng()

if __name__ == "__main__":
    main()
