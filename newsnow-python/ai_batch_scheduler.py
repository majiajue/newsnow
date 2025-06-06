#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI批量分析定时任务调度器
专门处理未分析的文章，确保所有文章都有AI分析内容
"""

import os
import sys
import time
import schedule
import logging
import argparse
from datetime import datetime

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from batch_ai_processor import BatchAIProcessor
from config.settings import LOG_LEVEL, LOG_DIR

def setup_logging():
    """设置日志配置"""
    os.makedirs(LOG_DIR, exist_ok=True)
    log_file = os.path.join(LOG_DIR, f"ai_batch_scheduler-{datetime.now().strftime('%Y%m%d')}.log")
    
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger(__name__)

def ai_batch_processing_job(logger, batch_size=5, max_batches=10):
    """
    AI批量处理任务
    
    Args:
        logger: 日志记录器
        batch_size (int): 每批处理的文章数量
        max_batches (int): 最大批次数量（防止单次运行时间过长）
    """
    logger.info(f"===== 开始AI批量处理任务: {datetime.now().isoformat()} =====")
    
    try:
        processor = BatchAIProcessor()
        
        # 限制单次运行的批次数量，避免运行时间过长
        total_processed = 0
        total_success = 0
        batch_count = 0
        
        while batch_count < max_batches:
            # 获取未分析的文章
            from db.sqlite_client import SQLiteClient
            db_client = SQLiteClient()
            unanalyzed_articles = db_client.get_unprocessed_articles(limit=batch_size)
            
            if not unanalyzed_articles:
                logger.info("✅ 没有需要分析的文章，任务完成")
                break
            
            batch_count += 1
            logger.info(f"📦 处理第 {batch_count} 批 ({len(unanalyzed_articles)} 篇文章)...")
            
            batch_success = 0
            for article in unanalyzed_articles:
                try:
                    article_id = article.get('id')
                    title = article.get('title', '')
                    content = article.get('content', '')
                    
                    logger.info(f"🔍 分析文章: {title[:30]}...")
                    
                    # 执行AI分析
                    analysis_result = processor.analyzer.generate_comprehensive_analysis(
                        title=title,
                        content=content,
                        search_results=[]
                    )
                    
                    if analysis_result:
                        # 更新数据库
                        success = db_client.update_article_analysis(article_id, analysis_result)
                        if success:
                            logger.info(f"✅ 分析完成: {title[:20]}...")
                            batch_success += 1
                            total_success += 1
                        else:
                            logger.warning(f"⚠️ 保存失败: {title[:20]}...")
                    else:
                        logger.warning(f"⚠️ 分析失败: {title[:20]}...")
                    
                    total_processed += 1
                    
                    # 文章间短暂延迟，避免API频率过高
                    time.sleep(3)
                    
                except Exception as e:
                    logger.error(f"❌ 处理文章异常: {e}")
                    continue
            
            logger.info(f"📊 第 {batch_count} 批完成: {batch_success}/{len(unanalyzed_articles)} 成功")
            
            # 批次间延迟
            if batch_count < max_batches and len(unanalyzed_articles) == batch_size:
                logger.info("⏰ 等待60秒后处理下一批...")
                time.sleep(60)
        
        logger.info(f"📈 本次任务完成: 处理 {total_processed} 篇, 成功 {total_success} 篇")
        
        if batch_count >= max_batches:
            logger.info(f"⏰ 达到最大批次限制 ({max_batches})，下次调度时继续处理")
            
    except Exception as e:
        logger.error(f"❌ AI批量处理任务异常: {str(e)}")
    
    logger.info(f"===== AI批量处理任务结束 =====\n")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='AI批量分析定时任务')
    parser.add_argument('--once', action='store_true', help='仅运行一次，不启动定时任务')
    parser.add_argument('--interval', type=int, default=20, help='任务间隔（分钟）')
    parser.add_argument('--batch-size', type=int, default=5, help='每批处理的文章数量')
    parser.add_argument('--max-batches', type=int, default=10, help='单次运行的最大批次数')
    args = parser.parse_args()
    
    # 手动加载环境变量
    env_file = ".env"
    if os.path.exists(env_file):
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip()
        except Exception as e:
            print(f"⚠️ 加载环境变量失败: {e}")
    
    # 设置日志
    logger = setup_logging()
    logger.info(f"AI批量分析调度器启动")
    logger.info(f"配置: 间隔={args.interval}分钟, 批量大小={args.batch_size}, 最大批次={args.max_batches}")
    
    # 立即执行一次
    ai_batch_processing_job(logger, args.batch_size, args.max_batches)
    
    # 如果只运行一次，直接退出
    if args.once:
        logger.info("按照参数要求，仅运行一次，程序退出")
        return
    
    # 设置定时任务
    schedule.every(args.interval).minutes.do(
        ai_batch_processing_job, logger, args.batch_size, args.max_batches
    )
    logger.info(f"AI批量处理任务已设置，每 {args.interval} 分钟执行一次")
    
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