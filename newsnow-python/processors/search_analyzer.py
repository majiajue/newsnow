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

from utils.search_service import SearchService
from utils.ai_service import generate_analysis
from db.sqlite_client import SQLiteClient
from config.settings import MAX_SEARCH_RESULTS

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
        logger.info("搜索分析器初始化完成")
    
    def analyze_article(self, article_id, source=None):
        """
        分析单篇文章，使用搜索结果增强分析能力
        
        Args:
            article_id (str): 文章ID
            source (str, optional): 文章来源
            
        Returns:
            dict: 分析结果
        """
        # 获取文章详情
        article = self.db_client.get_article_by_id(article_id, source)
        
        if not article:
            logger.error(f"找不到文章: ID={article_id}, 来源={source}")
            return None
        
        title = article.get("title", "")
        content = article.get("content", "")
        
        logger.info(f"开始分析文章: {title} (ID: {article_id})")
        
        try:
            # 使用标题搜索相关信息
            search_start_time = time.time()
            search_results = self.search_service.search(
                query=title,
                max_results=MAX_SEARCH_RESULTS
            )
            search_time = time.time() - search_start_time
            
            logger.info(f"搜索完成，获取到 {len(search_results)} 条相关结果，耗时: {search_time:.2f}秒")
            
            # 提取搜索内容
            search_context = self._extract_search_context(search_results)
            
            # 增强内容分析
            enriched_content = f"{content}\n\n### 相关资讯:\n{search_context}"
            
            # 生成分析
            analysis_start_time = time.time()
            analysis = generate_analysis(title, enriched_content, article.get("source", ""))
            analysis_time = time.time() - analysis_start_time
            
            logger.info(f"分析完成，耗时: {analysis_time:.2f}秒")
            
            # 构建分析数据
            content_length = len(content) if content else 0
            search_length = len(search_context) if search_context else 0
            
            analysis_data = {
                "summary": analysis.get("summary", ""),
                "comment": analysis.get("comment", ""),
                "keyPoints": analysis.get("key_points", []),
                "background": analysis.get("background", ""),
                "impact": analysis.get("impact", ""),
                "opinion": analysis.get("opinion", ""),
                "suggestions": analysis.get("suggestions", []),
                "generatedAt": datetime.now().isoformat(),
                "processingInfo": {
                    "contentLength": content_length,
                    "searchResultCount": len(search_results),
                    "searchContextLength": search_length,
                    "searchTime": f"{search_time:.2f}秒",
                    "analysisTime": f"{analysis_time:.2f}秒",
                    "processor": "search-enhanced-analyzer",
                    "version": "1.0.0"
                }
            }
            
            # 更新文章分析
            update_result = self.db_client.update_article_analysis(article_id, analysis_data, source)
            
            if update_result:
                logger.info(f"文章分析成功: {title}")
                return analysis_data
            else:
                logger.warning(f"更新文章分析失败: {title}")
                return None
            
        except Exception as e:
            logger.error(f"分析文章异常: {str(e)}")
            
            # 记录错误日志
            self.db_client.add_article_log(
                article_id=article_id,
                log_type="error",
                message=f"搜索增强分析异常: {str(e)}"
            )
            
            return None
    
    def analyze_batch(self, batch_size=10, source=None):
        """
        批量分析文章
        
        Args:
            batch_size (int): 批处理大小
            source (str, optional): 文章来源筛选
            
        Returns:
            dict: 处理结果统计
        """
        batch_start_time = time.time()
        
        # 获取未处理文章
        articles = self.db_client.get_unprocessed_articles(batch_size, source)
        article_count = len(articles)
        
        if article_count == 0:
            logger.info("没有找到需要处理的文章")
            return {"total": 0, "success": 0, "failed": 0, "time": 0}
        
        logger.info(f"开始批量分析 {article_count} 篇文章")
        
        # 处理统计
        success_count = 0
        fail_count = 0
        
        # 依次处理每篇文章
        for index, article in enumerate(articles, 1):
            article_id = article.get('id')
            
            logger.info(f"[{index}/{article_count}] 开始分析文章 ID: {article_id}")
            
            try:
                result = self.analyze_article(article_id, article.get('source'))
                if result:
                    success_count += 1
                else:
                    fail_count += 1
            except Exception as e:
                logger.error(f"处理异常: {str(e)}")
                fail_count += 1
        
        # 计算总耗时
        total_time = time.time() - batch_start_time
        avg_time = total_time / article_count if article_count > 0 else 0
        
        # 记录处理统计
        logger.info(f"批处理完成: 总计 {article_count} 篇文章, "
                  f"成功 {success_count} 篇, 失败 {fail_count} 篇")
        logger.info(f"总耗时: {total_time:.2f}秒, 平均每篇: {avg_time:.2f}秒")
        
        # 返回处理统计
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
