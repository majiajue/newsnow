#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
搜索分析器 - 基于搜索结果增强文章分析
"""

import logging
import time
from datetime import datetime
# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import time
import os # Added
from datetime import datetime

from utils.search_service import SearchService
from utils.ai_service import generate_analysis
from db.sqlite_client import SQLiteClient
from crawlers.crawler_factory import CrawlerFactory # Added
from utils.text_extractor import extract_clean_content, is_content_valid # Added
from config.settings import MAX_SEARCH_RESULTS, ENABLE_DEEPSEEK # Added ENABLE_DEEPSEEK
from utils.improved_ai_service import FinanceAnalyzer # Added for consistent AI service usage

logger = logging.getLogger(__name__)

class SearchAnalyzer:
    """
    搜索分析器类 - 使用搜索结果增强文章分析
    """
    
    def __init__(self, db_path=None, search_url=None):
        """
        初始化搜索分析器
        
        Args:
            db_path (str, optional): 数据库路径
            search_url (str, optional): 搜索服务URL
        """
        self.db_client = SQLiteClient(db_path)
        self.search_service = SearchService(search_url)
        self.crawler_factory = CrawlerFactory() # Added

        # Initialize FinanceAnalyzer for consistent AI service usage
        self.use_deepseek = ENABLE_DEEPSEEK
        self.finance_analyzer = None
        if self.use_deepseek:
            api_key = os.environ.get("DEEPSEEK_API_KEY")
            if api_key:
                self.finance_analyzer = FinanceAnalyzer(api_key=api_key)
                logger.info("SearchAnalyzer initialized FinanceAnalyzer (DeepSeek AI service).")
            else:
                self.use_deepseek = False # Disable if key is missing
                logger.warning("SearchAnalyzer: DEEPSEEK_API_KEY not found. FinanceAnalyzer disabled. Will use default AI.")
        else:
            logger.info("SearchAnalyzer: DeepSeek (FinanceAnalyzer) is disabled by configuration. Will use default AI.")

        logger.info("搜索分析器初始化完成")
    
    def _extract_search_context(self, search_results):
        """辅助方法：从搜索结果中提取和格式化上下文"""
        context_parts = []
        if search_results:
            for i, res in enumerate(search_results[:3]): # Limit to top 3 for context
                context_parts.append(f"[{i+1}] {res.get('title', '')}: {res.get('content', '')[:200]}...")
        return "\n".join(context_parts)

    def _perform_search_and_analysis_fallback(self, article_id, title, text_content, source, url=None, published_at=None, searxng_results_from_crawler=None):
        """
        对提供的文章内容执行搜索、AI分析，并更新数据库。
        这是为那些不由其爬虫立即处理的文章准备的后备路径。
        """
        logger.info(f"Fallback Analysis: Processing article ID {article_id} ('{title}') from {source}.")
        try:
            search_results = searxng_results_from_crawler
            search_time = 0

            if search_results is None: # Perform search only if not provided by crawler
                search_start_time = time.time()
                search_results = self.search_service.search(query=title, max_results=MAX_SEARCH_RESULTS)
                search_time = time.time() - search_start_time
                logger.info(f"Fallback Search: Query '{title}', {len(search_results)} results, {search_time:.2f}s.")
            else:
                logger.info(f"Fallback Analysis: Using pre-fetched SearxNG results for '{title}'.")

            search_context_for_ai = self._extract_search_context(search_results)

            analysis_start_time = time.time()
            ai_analysis_result = None
            ai_service_used = "DefaultAI"

            if self.use_deepseek and self.finance_analyzer:
                logger.info(f"Fallback AI: Using FinanceAnalyzer for '{title}'.")
                ai_service_used = "FinanceAnalyzer"
                # Pass content and search results to FinanceAnalyzer
                finance_output = self.finance_analyzer.analyze_market_news(
                    text=text_content,
                    title=title,
                    searxng_results=search_results # Pass structured search results
                )
                if "error" in finance_output:
                    logger.warning(f"FinanceAnalyzer failed for '{title}': {finance_output.get('error')}. Falling back to default AI.")
                    ai_service_used = "DefaultAI_ λόγω_FinanceAnalyzer_Error"
                    enriched_content_for_default_ai = f"{text_content}\n\n### 相关资讯:\n{search_context_for_ai}"
                    ai_analysis_result = generate_analysis(title, enriched_content_for_default_ai, source)
                else:
                    # Map FinanceAnalyzer output to the standard analysis structure
                    ai_analysis_result = {
                        "summary": finance_output.get("market_summary", ""),
                        "key_points": finance_output.get("key_points", []) or [
                            f"Impact: {finance_output.get('impact_analysis', '')}",
                            f"Sentiment: {finance_output.get('sentiment', '')}"
                        ],
                        "background": finance_output.get("background_info", "Generated by FinanceAnalyzer with search context"),
                        "impact": finance_output.get("impact_analysis", ""),
                        "opinion": finance_output.get("investment_advice", ""),
                        "comment": f"Sentiment: {finance_output.get('sentiment', '')}. Tags: {', '.join(finance_output.get('tags', []))}",
                        "suggestions": finance_output.get("trading_suggestions", []) or [finance_output.get("investment_advice", "")]
                    }
            else:
                logger.info(f"Fallback AI: Using default generate_analysis for '{title}'.")
                enriched_content_for_default_ai = f"{text_content}\n\n### 相关资讯:\n{search_context_for_ai}"
                ai_analysis_result = generate_analysis(title, enriched_content_for_default_ai, source)
            
            analysis_time = time.time() - analysis_start_time
            logger.info(f"Fallback AI: Analysis for '{title}' took {analysis_time:.2f}s using {ai_service_used}.")

            content_length = len(text_content) if text_content else 0
            search_context_length = len(search_context_for_ai) if search_context_for_ai else 0
            
            final_analysis_data = {
                "summary": ai_analysis_result.get("summary", ""),
                "comment": ai_analysis_result.get("comment", ""),
                "keyPoints": ai_analysis_result.get("key_points", []),
                "background": ai_analysis_result.get("background", ""),
                "impact": ai_analysis_result.get("impact", ""),
                "opinion": ai_analysis_result.get("opinion", ""),
                "suggestions": ai_analysis_result.get("suggestions", []),
                "generatedAt": datetime.now().isoformat(),
                "processingInfo": {
                    "contentLength": content_length,
                    "searchResultCount": len(search_results) if search_results else 0,
                    "searchContextLength": search_context_length,
                    "searchTime": f"{search_time:.2f}秒",
                    "analysisTime": f"{analysis_time:.2f}秒",
                    "processor": "search-analyzer-fallback",
                    "ai_service": ai_service_used,
                    "version": "1.2.0" 
                }
            }
            if url: final_analysis_data["processingInfo"]["originalUrl"] = url
            if published_at: final_analysis_data["processingInfo"]["originalPublishedAt"] = published_at

            update_result = self.db_client.update_article_analysis(article_id, final_analysis_data, source)
            if update_result:
                logger.info(f"Fallback Analysis: Successfully updated DB for article ID: {article_id}.")
                return final_analysis_data # Return the analysis data for counting success
            else:
                logger.warning(f"Fallback Analysis: Failed to update DB for article ID: {article_id}.")
                return None
        except Exception as e:
            logger.error(f"Fallback Analysis: Error processing article ID {article_id} ('{title}'): {str(e)}", exc_info=True)
            self.db_client.add_article_log(article_id, "error", f"SearchAnalyzer fallback processing error: {str(e)}")
            return None
    
    def analyze_batch(self, batch_size=10, source=None):
        """
        批量分析文章。会尝试通过爬虫的 get_article_detail 获取详情，
        如果爬虫支持即时处理，则直接使用其结果。
        否则，使用后备的搜索和分析流程。
        """
        batch_start_time = time.time()
        
        # 获取数据库中标记为未处理的文章摘要
        unprocessed_article_summaries = self.db_client.get_unprocessed_articles(batch_size, source)
        article_count = len(unprocessed_article_summaries)
        
        if article_count == 0:
            logger.info("SearchAnalyzer: No unprocessed articles found to analyze.")
            return {"total": 0, "success": 0, "failed": 0, "time": 0}
        
        logger.info(f"SearchAnalyzer: Starting batch analysis for {article_count} articles.")
        
        success_count = 0
        fail_count = 0
        
        for index, summary in enumerate(unprocessed_article_summaries, 1):
            article_id = summary.get('id')
            article_source = summary.get('source')
            article_title = summary.get('title', 'N/A') # title for logging

            logger.info(f"SearchAnalyzer Batch [{index}/{article_count}]: Processing article ID {article_id} ('{article_title}') from {article_source}.")

            try:
                crawler_instance = self.crawler_factory.get_crawler(article_source)
                if not crawler_instance:
                    logger.error(f"SearchAnalyzer: No crawler instance for source '{article_source}' for article ID {article_id}. Skipping.")
                    fail_count += 1
                    continue

                # 调用爬虫的 get_article_detail 方法
                # 这个方法对于 Jin10Crawler 这样的即时处理爬虫，会完成所有工作并返回包含分析的数据
                # 对于旧爬虫，它可能只返回原始内容
                detailed_article_data = crawler_instance.get_article_detail(article_id)

                if detailed_article_data and detailed_article_data.get("processed_immediately") and detailed_article_data.get("analysis_data"):
                    logger.info(f"SearchAnalyzer: Article ID {article_id} ('{article_title}') was already processed immediately by {article_source} crawler. Counting as success.")
                    # 确保数据库状态一致 (虽然爬虫应该已经设置了 processed=1)
                    # 如果需要，可以再次调用 self.db_client.mark_as_processed(article_id, article_source) 但通常不必要
                    success_count += 1
                elif detailed_article_data: # 不是即时处理，或者即时处理失败但返回了原始数据
                    logger.info(f"SearchAnalyzer: Article ID {article_id} ('{article_title}') not (fully) processed immediately. Proceeding with fallback search and analysis.")
                    
                    # 从 detailed_article_data 提取所需信息
                    # Jin10Crawler 返回的 detailed_article_data 结构：
                    # {'id': ..., 'title': ..., 'content': (cleaned_text), 'htmlContent': ..., 'url': ..., 'source': ..., 
                    #  'published_at': ..., 'cover_image_url': ..., 'searxng_results': [...], 'analysis_data': {...}, 'processed_immediately': True}
                    # 其他爬虫可能只返回: {'id': ..., 'title': ..., 'content': (html_content), 'url': ..., 'source': ..., 'published_at': ...}
                    
                    raw_content_from_crawler = detailed_article_data.get('content') # Jin10Crawler返回的是clean_text, 其他可能是HTML
                    # 如果 Jin10Crawler 的 get_article_detail 失败了AI分析但保存了文章，它可能没有 analysis_data 和 processed_immediately=true
                    # 这种情况下，我们仍希望 SearchAnalyzer 来处理它
                    
                    # 尝试获取预提取的搜索结果 (如果爬虫提供了)
                    searxng_results_from_crawler = detailed_article_data.get('searxng_results')

                    # 内容清理 (如果得到的是HTML)
                    # 假设 Jin10Crawler 已经提供了 'content' 作为干净文本
                    # 对于其他爬虫，如果 'content' 是HTML，需要清理
                    # 我们需要一种方式来判断 'content' 是HTML还是纯文本，或者让爬虫明确区分
                    # 暂时假设，如果不是 Jin10 并且有 content，就尝试清理
                    cleaned_text_content = raw_content_from_crawler
                    if article_source != 'jin10' and raw_content_from_crawler: # 简化的判断，可能需要更稳健的方式
                         # 检查是否看起来像HTML，如果是，则清理
                        if "<html" in raw_content_from_crawler.lower() or "<div" in raw_content_from_crawler.lower():
                            logger.info(f"SearchAnalyzer: Content for {article_id} from {article_source} appears to be HTML, cleaning...")
                            cleaned_text_content = extract_clean_content(raw_content_from_crawler)
                        else:
                             logger.info(f"SearchAnalyzer: Content for {article_id} from {article_source} assumed to be plain text.")
                    elif not raw_content_from_crawler:
                        logger.warning(f"SearchAnalyzer: No content found in detailed_article_data for {article_id} from {article_source}. Using title.")
                        cleaned_text_content = detailed_article_data.get('title', article_title)
                    
                    if not is_content_valid(cleaned_text_content, detailed_article_data.get('title', article_title)):
                        logger.warning(f"SearchAnalyzer: Content for {article_id} ('{detailed_article_data.get('title', article_title)}') is invalid after potential cleaning. Using title as content.")
                        cleaned_text_content = detailed_article_data.get('title', article_title)

                    fallback_result = self._perform_search_and_analysis_fallback(
                        article_id=article_id,
                        title=detailed_article_data.get('title', article_title),
                        text_content=cleaned_text_content,
                        source=article_source,
                        url=detailed_article_data.get('url'),
                        published_at=detailed_article_data.get('published_at'),
                        searxng_results_from_crawler=searxng_results_from_crawler
                    )
                    if fallback_result:
                        success_count += 1
                    else:
                        fail_count += 1
                else:
                    logger.error(f"SearchAnalyzer: get_article_detail for ID {article_id} ('{article_title}') from {article_source} returned None. Skipping.")
                    self.db_client.add_article_log(article_id, "error", f"SearchAnalyzer: {crawler_instance.__class__.__name__}.get_article_detail returned None for {article_source}")
                    fail_count += 1
            except Exception as e:
                logger.error(f"SearchAnalyzer Batch: Error processing article ID {article_id} ('{article_title}'): {str(e)}", exc_info=True)
                self.db_client.add_article_log(article_id, "error", f"SearchAnalyzer batch loop error: {str(e)}")
                fail_count += 1
        
        total_time = time.time() - batch_start_time
        avg_time = total_time / article_count if article_count > 0 else 0
        
        logger.info(f"SearchAnalyzer: Batch processing finished. Total: {article_count}, Success: {success_count}, Failed: {fail_count}.")
        logger.info(f"SearchAnalyzer: Total time: {total_time:.2f}s, Average time per article: {avg_time:.2f}s.")
        
        return {
            "total": article_count,
            "success": success_count,
            "failed": fail_count,
            "time": total_time,
            "avg_time": avg_time
        }
    
    def search_related_articles(self, article_id, max_results=5):
        """
        搜索与指定文章相关的文章
        
        Args:
            article_id (str): 文章ID
            max_results (int): 最大结果数，默认5
            
        Returns:
            list: 相关文章列表
        """
        article = self.db_client.get_article_by_id(article_id)
        
        if not article:
            logger.error(f"找不到文章: {article_id}")
            return []
        
        title = article.get("title", "")
        content = article.get("content", "")
        
        return self.search_service.search_related_news(title, content, max_results)
    
    def _extract_search_context(self, search_results):
        """
        从搜索结果提取内容作为分析上下文
        
        Args:
            search_results (list): 搜索结果列表
            
        Returns:
            str: 提取的内容
        """
        if not search_results:
            return ""
        
        context_items = []
        
        for i, result in enumerate(search_results, 1):
            title = result.get("title", "").strip()
            content = result.get("content", "").strip()
            
            if title and content:
                context_items.append(f"{i}. {title}: {content}")
            elif title:
                context_items.append(f"{i}. {title}")
        
        return "\n\n".join(context_items)
