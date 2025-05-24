#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
定时任务调度器 - 定时执行文章抓取和处理任务
"""

import os
import time
import json
import schedule
import logging
import argparse
import sys
from datetime import datetime

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from processors.article_analyzer import ArticleProcessor
from processors.article_crawler import ArticleCrawler
from utils.search_service import SearchService
from utils.improved_ai_service import FinanceAnalyzer
from db.sqlite_client import SQLiteClient
from config.settings import CRAWL_INTERVAL, PROCESS_INTERVAL, SEARCH_INTERVAL, LOG_LEVEL, LOG_DIR, LOG_FILENAME

# 配置日志
def setup_logging():
    """设置日志配置"""
    os.makedirs(LOG_DIR, exist_ok=True)
    log_file = os.path.join(LOG_DIR, LOG_FILENAME)
    
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger(__name__)

# 文章抓取任务
def crawl_articles_job(logger, article_limit=20, flash_limit=50, source=None):
    """
    定时抓取文章任务
    
    Args:
        logger: 日志记录器
        article_limit (int): 每个来源的文章数量限制
        flash_limit (int): 每个来源的快讯数量限制
        source (str, optional): 来源筛选
    """
    logger.info(f"===== 开始文章抓取任务: {datetime.now().isoformat()} =====")
    
    try:
        crawler = ArticleCrawler()
        
        if source:
            # 抓取指定来源
            article_result = crawler.crawl_source(source, limit=article_limit)
            logger.info(f"抓取完成: {source} - 总计 {article_result.get('total', 0)} 篇, "
                       f"新增 {article_result.get('saved', 0)} 篇, "
                       f"耗时 {article_result.get('time', 0):.2f}秒")
            
            # 如果支持快讯，也抓取快讯
            if source in ["jin10", "gelonghui", "cls"]:
                flash_result = crawler.crawl_flash(source, limit=flash_limit)
                logger.info(f"快讯抓取完成: {source} - 总计 {flash_result.get('total', 0)} 条, "
                           f"新增 {flash_result.get('saved', 0)} 条, "
                           f"耗时 {flash_result.get('time', 0):.2f}秒")
        else:
            # 抓取所有来源
            results = crawler.crawl_all_sources(article_limit=article_limit, flash_limit=flash_limit)
            logger.info(f"抓取完成: 文章总计 {results['articles']['total']} 篇, "
                       f"新增 {results['articles']['saved']} 篇; "
                       f"快讯总计 {results['flash']['total']} 条, "
                       f"新增 {results['flash']['saved']} 条; "
                       f"总耗时 {results.get('time', 0):.2f}秒")
    except Exception as e:
        logger.error(f"抓取任务异常: {str(e)}")
    
    logger.info(f"===== 文章抓取任务结束 =====\n")

# 文章处理任务
def process_articles_job(logger, batch_size=20, source=None):
    """
    定时处理文章任务
    
    Args:
        logger: 日志记录器
        batch_size (int): 每批处理的文章数量
        source (str, optional): 文章来源筛选
    """
    logger.info(f"===== 开始文章处理任务: {datetime.now().isoformat()} =====")
    
    try:
        processor = ArticleProcessor()
        result = processor.process_batch(batch_size=batch_size, source=source)
        
        logger.info(f"处理完成: 总计 {result['total']} 篇文章, "
                   f"成功 {result['success']} 篇, 失败 {result['failed']} 篇, "
                   f"耗时 {result['time']:.2f}秒")
    except Exception as e:
        logger.error(f"处理任务异常: {str(e)}")
    
    logger.info(f"===== 文章处理任务结束 =====\n")

# 搜索热门财经话题任务
def search_finance_topics_job(logger, max_topics=5, max_results_per_topic=10):
    """
    定时搜索热门财经话题任务
    
    Args:
        logger: 日志记录器
        max_topics (int): 搜索的热门话题数量
        max_results_per_topic (int): 每个话题的最大结果数
    """
    logger.info(f"===== 开始搜索热门财经话题任务: {datetime.now().isoformat()} =====")
    
    try:
        # 初始化搜索服务和数据库客户端
        search_service = SearchService()
        db_client = SQLiteClient()
        
        # 检查SearXNG服务是否可用
        if not search_service.health_check():
            logger.error("SearXNG服务不可用，跳过搜索任务")
            return
        
        # 热门财经话题列表
        finance_topics = [
            "最新经济政策",
            "股市行情分析",
            "央行利率决议",
            "科技股最新动态",
            "全球金融市场"
        ]
        
        total_results = 0
        saved_results = 0
        start_time = time.time()
        
        # 对每个热门话题进行搜索
        for topic in finance_topics[:max_topics]:
            logger.info(f"搜索话题: {topic}")
            
            # 调用SearXNG搜索服务
            results = search_service.search(
                query=topic,
                category="finance,news",
                language="zh-CN",
                time_range="day",
                max_results=max_results_per_topic
            )
            
            if not results:
                logger.warning(f"话题 '{topic}' 没有搜索结果")
                continue
            
            logger.info(f"话题 '{topic}' 获取到 {len(results)} 条结果")
            total_results += len(results)
            
            # 将搜索结果保存到数据库
            for item in results:
                try:
                    # 检查URL是否已存在
                    if db_client.check_article_exists(item["url"]):
                        continue
                    
                    # 准备文章数据
                    article_data = {
                        "title": item["title"],
                        "content": item.get("content", ""),
                        "url": item["url"],
                        "source": item.get("source", "searxng"),
                        "category": "财经",
                        "pubDate": item.get("pubDate", datetime.now().isoformat()),
                        "author": item.get("source", "搜索发现"),
                        "tags": json.dumps([topic]),
                        "created_at": datetime.now().isoformat(),
                        "processed": 0
                    }
                    
                    # 保存到数据库
                    db_client.save_article(article_data)
                    saved_results += 1
                    
                except Exception as e:
                    logger.error(f"保存搜索结果异常: {str(e)}")
        
        elapsed_time = time.time() - start_time
        logger.info(f"搜索完成: 总计 {total_results} 条结果, 新增 {saved_results} 条, 耗时 {elapsed_time:.2f}秒")
        
    except Exception as e:
        logger.error(f"搜索任务异常: {str(e)}")
    
    logger.info(f"===== 搜索热门财经话题任务结束 =====\n")

def main():
    """主函数"""
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='新闻文章处理系统')
    parser.add_argument('--once', action='store_true', help='仅运行一次，不启动定时任务')
    parser.add_argument('--task', type=str, choices=['crawl', 'process', 'search', 'all'], default='all',
                        help='执行的任务类型：crawl(抓取), process(处理), search(搜索), all(全部)')
    parser.add_argument('--crawl-interval', type=int, default=CRAWL_INTERVAL, help='抓取任务间隔（分钟）')
    parser.add_argument('--process-interval', type=int, default=PROCESS_INTERVAL, help='处理任务间隔（分钟）')
    parser.add_argument('--search-interval', type=int, default=SEARCH_INTERVAL, help='搜索任务间隔（分钟）')
    parser.add_argument('--article-limit', type=int, default=20, help='每个来源抓取的文章数量')
    parser.add_argument('--flash-limit', type=int, default=50, help='每个来源抓取的快讯数量')
    parser.add_argument('--batch', type=int, default=20, help='每批处理的文章数量')
    parser.add_argument('--max-topics', type=int, default=5, help='搜索的热门话题数量')
    parser.add_argument('--max-results', type=int, default=10, help='每个话题的最大结果数')
    parser.add_argument('--source', type=str, help='文章来源筛选')
    args = parser.parse_args()
    
    # 设置日志
    logger = setup_logging()
    logger.info(f"新闻文章处理系统启动")
    logger.info(f"配置: 任务类型={args.task}, 抓取间隔={args.crawl_interval}分钟, "
               f"处理间隔={args.process_interval}分钟, 搜索间隔={args.search_interval}分钟, "
               f"来源={args.source or '全部'}")
    
    # 立即执行一次
    if args.task in ['crawl', 'all']:
        crawl_articles_job(logger, args.article_limit, args.flash_limit, args.source)
    
    if args.task in ['process', 'all']:
        process_articles_job(logger, args.batch, args.source)
    
    if args.task in ['search', 'all']:
        search_finance_topics_job(logger, args.max_topics, args.max_results)
    
    # 如果只运行一次，直接退出
    if args.once:
        logger.info("按照参数要求，仅运行一次，程序退出")
        return
    
    # 设置定时任务
    if args.task in ['crawl', 'all']:
        schedule.every(args.crawl_interval).minutes.do(
            crawl_articles_job, logger, args.article_limit, args.flash_limit, args.source
        )
        logger.info(f"文章抓取任务已设置，每 {args.crawl_interval} 分钟执行一次")
    
    if args.task in ['process', 'all']:
        schedule.every(args.process_interval).minutes.do(
            process_articles_job, logger, args.batch, args.source
        )
        logger.info(f"文章处理任务已设置，每 {args.process_interval} 分钟执行一次")
    
    if args.task in ['search', 'all']:
        schedule.every(args.search_interval).minutes.do(
            search_finance_topics_job, logger, args.max_topics, args.max_results
        )
        logger.info(f"搜索热门财经话题任务已设置，每 {args.search_interval} 分钟执行一次")
    
    # 运行定时任务
    logger.info(f"定时任务已启动")
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("收到终止信号，程序退出")
    except Exception as e:
        logger.error(f"程序异常: {str(e)}")
        raise

if __name__ == "__main__":
    main()
