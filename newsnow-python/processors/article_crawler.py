#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文章抓取器 - 使用爬虫工厂抓取各个来源的最新文章
"""

import time
import logging
from datetime import datetime
# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crawlers.crawler_factory import CrawlerFactory
from db.sqlite_client import SQLiteClient
from config.settings import SOURCES

logger = logging.getLogger(__name__)

class ArticleCrawler:
    """文章抓取器类，负责从各个来源抓取最新文章并保存到数据库"""
    
    def __init__(self, db_path=None):
        """
        初始化抓取器
        
        Args:
            db_path (str, optional): 数据库文件路径，默认为 None，使用默认路径
        """
        self.crawler_factory = CrawlerFactory()
        self.db_client = SQLiteClient(db_path)
        logger.info("文章抓取器初始化完成")
    
    def crawl_source(self, source, limit=20):
        """
        抓取指定来源的最新文章
        
        Args:
            source (str): 文章来源标识
            limit (int): 获取数量限制
            
        Returns:
            dict: 抓取结果统计
        """
        start_time = time.time()
        source_name = self.crawler_factory.get_source_name(source)
        
        logger.info(f"开始抓取 {source_name} 的最新文章")
        
        try:
            # 获取爬虫实例
            crawler_instance = self.crawler_factory.get_crawler(source)
            if not crawler_instance:
                logger.error(f"无法为来源 {source_name} ({source}) 获取爬虫实例")
                return {
                    "source": source,
                    "total_fetched_summaries": 0,
                    "summaries_saved_for_later": 0,
                    "immediately_processed": 0,
                    "error": f"No crawler instance for source {source}",
                    "time": time.time() - start_time
                }

            # 获取最新文章摘要 (e.g., from Jin10Crawler.get_latest_news())
            article_summaries = crawler_instance.get_latest_articles(limit=limit)
            
            if not article_summaries:
                logger.warning(f"{source_name} 未获取到文章摘要")
                return {
                    "source": source,
                    "total_fetched_summaries": 0,
                    "summaries_saved_for_later": 0,
                    "immediately_processed": 0,
                    "time": time.time() - start_time
                }
            
            logger.info(f"从 {source_name} 获取到 {len(article_summaries)} 篇文章摘要")
            
            summaries_saved_for_later_count = 0
            immediately_processed_count = 0

            for article_summary in article_summaries:
                try:
                    # 确保我们有一个有效的 article_id
                    article_id = article_summary.get("article_id") or article_summary.get("id")
                    if not article_id:
                        logger.warning(f"文章摘要缺少ID: {article_summary.get('title', 'N/A')}, 来自 {source_name}, 跳过.")
                        continue

                    # 检查文章是否已存在 (使用 article_id 和 source)
                    if self.db_client.article_exists(article_id, source):
                        logger.debug(f"文章 {article_id} ({source_name}) 已存在，跳过.")
                        continue
                    
                    # 条件处理：即时处理或保存摘要
                    if hasattr(crawler_instance, 'supports_immediate_processing') and \
                       crawler_instance.supports_immediate_processing:
                        
                        logger.info(f"{source_name} 支持即时处理。调用 get_article_detail for ID: {article_id}")
                        # crawler_instance.get_article_detail 将处理获取、搜索、AI分析和保存
                        detailed_article_data = crawler_instance.get_article_detail(article_id)
                        
                        if detailed_article_data and detailed_article_data.get("processed_immediately"):
                            logger.info(f"文章 {article_id} ({source_name}) 已通过爬虫即时处理并保存.")
                            immediately_processed_count += 1
                        elif detailed_article_data: # 可能已保存但AI分析失败或未标记
                            logger.warning(f"文章 {article_id} ({source_name}) 由爬虫处理，但未明确标记为 'processed_immediately'. 检查爬虫日志。保存状态: {detailed_article_data.get('id') is not None}")
                            # Decide if this counts towards a specific counter, e.g. if it was saved at all
                            if self.db_client.article_exists(article_id, source): # Check if it ended up saved
                                logger.info(f"文章 {article_id} ({source_name}) 确认已保存，但即时处理标志缺失或为false.")
                                # Potentially count as 'summaries_saved_for_later_count' if processed=0, or a new category
                        else:
                            logger.error(f"即时处理文章 {article_id} ({source_name}) 失败。爬虫 {crawler_instance.__class__.__name__} 返回 None.")
                            self.db_client.add_article_log(article_id, "error", f"Immediate processing by {crawler_instance.__class__.__name__} for {source_name} failed.")
                    else:
                        # 为不支持即时处理的爬虫保存摘要
                        logger.info(f"{source_name} 不支持即时处理。保存文章摘要 ID: {article_id}")
                        # article_summary 应该包含足够的信息供 save_article (如 title, url, source, published_at)
                        save_result = self.db_client.save_article(article_summary) # 这会保存 processed=0
                        if save_result:
                            summaries_saved_for_later_count += 1
                        else:
                            logger.warning(f"保存文章摘要失败: {article_summary.get('title', 'N/A')} (ID: {article_id}) from {source_name}")
                
                except Exception as e:
                    current_id_for_log = article_summary.get("article_id") or article_summary.get("id", "N/A")
                    logger.error(f"处理文章摘要 ID {current_id_for_log} ({source_name}) 时发生异常: {str(e)}", exc_info=True)
                    if current_id_for_log != "N/A":
                        self.db_client.add_article_log(current_id_for_log, "error", f"ArticleCrawler loop exception for {source_name}: {str(e)}")
                    continue
            
            # 更新统计结果
            result = {
                "source": source,
                "total_fetched_summaries": len(article_summaries),
                "summaries_saved_for_later": summaries_saved_for_later_count,
                "immediately_processed": immediately_processed_count,
                "time": time.time() - start_time
            }
            
            logger.info(f"{source_name} 抓取完成: 获取 {result['total_fetched_summaries']} 篇摘要, "
                       f"{result['summaries_saved_for_later']} 篇已保存待处理, "
                       f"{result['immediately_processed']} 篇已即时处理, "
                       f"耗时 {result['time']:.2f}秒")
            
            return result
        
        except Exception as e:
            logger.error(f"抓取 {source_name} 文章异常: {str(e)}")
            return {
                "source": source,
                "total": 0,
                "saved": 0,
                "error": str(e),
                "time": time.time() - start_time
            }
    
    def crawl_flash(self, source, limit=50):
        """
        抓取指定来源的最新快讯
        
        Args:
            source (str): 快讯来源标识
            limit (int): 获取数量限制
            
        Returns:
            dict: 抓取结果统计
        """
        start_time = time.time()
        source_name = self.crawler_factory.get_source_name(source)
        
        logger.info(f"开始抓取 {source_name} 的最新快讯")
        
        try:
            # 获取最新快讯
            news_list = self.crawler_factory.get_news_flash(source, limit=limit)
            
            if not news_list:
                logger.warning(f"{source_name} 未获取到快讯")
                return {
                    "source": source,
                    "total": 0,
                    "saved": 0,
                    "time": time.time() - start_time
                }
            
            logger.info(f"从 {source_name} 获取到 {len(news_list)} 条快讯")
            
            # 保存快讯到数据库
            saved_count = 0
            for news in news_list:
                try:
                    # 检查快讯是否已存在
                    if self.db_client.flash_exists(news.get("id"), source):
                        continue
                    
                    # 保存快讯
                    save_result = self.db_client.save_flash(news)
                    if save_result:
                        saved_count += 1
                    else:
                        logger.warning(f"保存快讯失败: {news.get('title')}")
                
                except Exception as e:
                    logger.error(f"保存快讯异常: {str(e)}")
                    continue
            
            # 统计结果
            result = {
                "source": source,
                "total": len(news_list),
                "saved": saved_count,
                "time": time.time() - start_time
            }
            
            logger.info(f"{source_name} 快讯抓取完成: 获取 {result['total']} 条, "
                       f"新增 {result['saved']} 条, 耗时 {result['time']:.2f}秒")
            
            return result
        
        except Exception as e:
            logger.error(f"抓取 {source_name} 快讯异常: {str(e)}")
            return {
                "source": source,
                "total": 0,
                "saved": 0,
                "error": str(e),
                "time": time.time() - start_time
            }
    
    def crawl_all_sources(self, article_limit=20, flash_limit=50):
        """
        抓取所有来源的最新文章和快讯
        
        Args:
            article_limit (int): 每个来源的文章数量限制
            flash_limit (int): 每个来源的快讯数量限制
            
        Returns:
            dict: 抓取结果统计
        """
        start_time = time.time()
        
        logger.info(f"===== 开始抓取所有来源 {datetime.now().isoformat()} =====")
        
        # 获取所有支持的来源
        sources = self.crawler_factory.get_all_sources()
        
        # 抓取结果统计
        results = {
            "articles": {
                "total": 0,
                "saved": 0,
                "sources": {}
            },
            "flash": {
                "total": 0,
                "saved": 0,
                "sources": {}
            }
        }
        
        # 依次抓取每个来源的文章
        for source in sources:
            # 抓取文章
            article_result = self.crawl_source(source, article_limit)
            results["articles"]["total"] += article_result.get("total", 0)
            results["articles"]["saved"] += article_result.get("saved", 0)
            results["articles"]["sources"][source] = article_result
            
            # 支持快讯的来源，抓取快讯
            if source in ["jin10", "gelonghui", "cls"]:
                flash_result = self.crawl_flash(source, flash_limit)
                results["flash"]["total"] += flash_result.get("total", 0)
                results["flash"]["saved"] += flash_result.get("saved", 0)
                results["flash"]["sources"][source] = flash_result
        
        # 计算总耗时
        total_time = time.time() - start_time
        results["time"] = total_time
        
        logger.info(f"===== 所有来源抓取完成 =====")
        logger.info(f"总计: 文章 {results['articles']['total']} 篇, "
                   f"新增 {results['articles']['saved']} 篇")
        logger.info(f"快讯 {results['flash']['total']} 条, "
                   f"新增 {results['flash']['saved']} 条")
        logger.info(f"总耗时: {total_time:.2f}秒")
        
        return results
