#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
定时任务调度器 - 定时执行文章处理任务
"""

import os
import time
import schedule
import logging
import argparse
from datetime import datetime
from processors.article_analyzer import ArticleProcessor
from config.settings import CRAWL_INTERVAL, LOG_LEVEL, LOG_DIR, LOG_FILENAME

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

def main():
    """主函数"""
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='新闻文章处理系统')
    parser.add_argument('--once', action='store_true', help='仅运行一次，不启动定时任务')
    parser.add_argument('--interval', type=int, default=CRAWL_INTERVAL, help='运行间隔（分钟）')
    parser.add_argument('--batch', type=int, default=20, help='每批处理的文章数量')
    parser.add_argument('--source', type=str, help='文章来源筛选')
    args = parser.parse_args()
    
    # 设置日志
    logger = setup_logging()
    logger.info(f"新闻文章处理系统启动")
    logger.info(f"配置: 间隔={args.interval}分钟, 批量={args.batch}篇, 来源={args.source or '全部'}")
    
    # 立即执行一次
    process_articles_job(logger, args.batch, args.source)
    
    # 如果只运行一次，直接退出
    if args.once:
        logger.info("按照参数要求，仅运行一次，程序退出")
        return
    
    # 设置定时任务
    schedule.every(args.interval).minutes.do(
        process_articles_job, logger, args.batch, args.source
    )
    
    # 运行定时任务
    logger.info(f"定时任务已启动，每 {args.interval} 分钟执行一次")
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
