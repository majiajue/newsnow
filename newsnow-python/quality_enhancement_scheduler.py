#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
内容质量增强定时任务调度器
"""

import os
import time
import schedule
import logging
import argparse
import sys
from datetime import datetime

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from processors.content_quality_enhancer import ContentQualityEnhancer
from db.sqlite_client import SQLiteClient
from config.settings import LOG_LEVEL, LOG_DIR, LOG_FILENAME

def setup_logging():
    """设置日志配置"""
    os.makedirs(LOG_DIR, exist_ok=True)
    log_file = os.path.join(LOG_DIR, f"quality_enhancement_{LOG_FILENAME}")
    
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger(__name__)

def quality_enhancement_job(logger, batch_size=10, source=None):
    """
    定时内容质量增强任务
    
    Args:
        logger: 日志记录器
        batch_size (int): 每批处理的文章数量
        source (str, optional): 文章来源筛选
    """
    logger.info(f"===== 开始内容质量增强任务: {datetime.now().isoformat()} =====")
    
    try:
        enhancer = ContentQualityEnhancer()
        db_client = SQLiteClient()
        
        # 获取待增强的文章
        articles = db_client.get_articles_for_enhancement(limit=batch_size, source=source)
        
        if not articles:
            logger.info("没有找到待增强的文章")
            return
        
        logger.info(f"找到 {len(articles)} 篇待增强文章")
        
        success_count = 0
        failed_count = 0
        
        for article in articles:
            try:
                article_id = article.get('id')
                article_source = article.get('source')
                title = article.get('title', '无标题')
                
                logger.info(f"正在增强文章: {title} (ID: {article_id})")
                
                # 增强文章质量
                enhanced = enhancer.enhance_article_quality(article_id, article_source)
                
                if enhanced:
                    success_count += 1
                    logger.info(f"✓ 文章增强成功: {title}")
                else:
                    failed_count += 1
                    logger.warning(f"✗ 文章增强失败: {title}")
                
                # 添加延迟避免过于频繁的请求
                time.sleep(1)
                
            except Exception as e:
                failed_count += 1
                logger.error(f"增强文章异常: {title} - {str(e)}")
        
        logger.info(f"批量增强完成: 成功 {success_count} 篇, 失败 {failed_count} 篇")
        
    except Exception as e:
        logger.error(f"质量增强任务异常: {str(e)}")
    
    logger.info(f"===== 内容质量增强任务结束 =====\n")

def quality_statistics_job(logger):
    """
    定时生成质量统计报告
    """
    logger.info(f"===== 开始质量统计任务: {datetime.now().isoformat()} =====")
    
    try:
        enhancer = ContentQualityEnhancer()
        stats = enhancer.get_quality_statistics()
        
        if stats:
            logger.info("=== 内容质量统计报告 ===")
            logger.info(f"总文章数: {stats.get('total_articles', 0)}")
            logger.info(f"已增强文章数: {stats.get('enhanced_articles', 0)}")
            logger.info(f"平均质量评分: {stats.get('average_quality_score', 0):.2f}")
            logger.info(f"增强率: {stats.get('enhancement_rate', 0)*100:.1f}%")
            
            # 各来源统计
            source_stats = stats.get('source_statistics', {})
            for source, source_data in source_stats.items():
                logger.info(f"{source}: 总数 {source_data.get('total', 0)}, "
                           f"已增强 {source_data.get('enhanced', 0)}, "
                           f"平均评分 {source_data.get('avg_quality_score', 0):.2f}")
        else:
            logger.warning("无法获取质量统计数据")
            
    except Exception as e:
        logger.error(f"质量统计任务异常: {str(e)}")
    
    logger.info(f"===== 质量统计任务结束 =====\n")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='内容质量增强定时任务')
    parser.add_argument('--once', action='store_true', help='仅运行一次，不启动定时任务')
    parser.add_argument('--task', type=str, choices=['enhance', 'stats', 'all'], default='all',
                        help='执行的任务类型：enhance(增强), stats(统计), all(全部)')
    parser.add_argument('--enhance-interval', type=int, default=30, help='增强任务间隔（分钟）')
    parser.add_argument('--stats-interval', type=int, default=60, help='统计任务间隔（分钟）')
    parser.add_argument('--batch', type=int, default=10, help='每批处理的文章数量')
    parser.add_argument('--source', type=str, help='文章来源筛选')
    args = parser.parse_args()
    
    # 设置日志
    logger = setup_logging()
    logger.info(f"内容质量增强系统启动")
    logger.info(f"配置: 任务类型={args.task}, 增强间隔={args.enhance_interval}分钟, "
               f"统计间隔={args.stats_interval}分钟, 批量大小={args.batch}, "
               f"来源={args.source or '全部'}")
    
    # 立即执行一次
    if args.task in ['enhance', 'all']:
        quality_enhancement_job(logger, args.batch, args.source)
    
    if args.task in ['stats', 'all']:
        quality_statistics_job(logger)
    
    # 如果只运行一次，直接退出
    if args.once:
        logger.info("按照参数要求，仅运行一次，程序退出")
        return
    
    # 设置定时任务
    if args.task in ['enhance', 'all']:
        schedule.every(args.enhance_interval).minutes.do(
            quality_enhancement_job, logger, args.batch, args.source
        )
        logger.info(f"质量增强任务已设置，每 {args.enhance_interval} 分钟执行一次")
    
    if args.task in ['stats', 'all']:
        schedule.every(args.stats_interval).minutes.do(
            quality_statistics_job, logger
        )
        logger.info(f"质量统计任务已设置，每 {args.stats_interval} 分钟执行一次")
    
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
