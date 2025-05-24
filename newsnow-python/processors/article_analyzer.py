#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文章分析处理器 - 处理和分析新闻文章
"""

import time
import json
import logging
import os
import sys
from datetime import datetime

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.text_extractor import extract_clean_content, is_content_valid
from utils.ai_service import generate_analysis
from utils.improved_ai_service import FinanceAnalyzer
from db.sqlite_client import SQLiteClient
from config.settings import MAX_BATCH_SIZE, ENABLE_DEEPSEEK

logger = logging.getLogger(__name__)

class ArticleProcessor:
    """文章处理器类"""
    
    def __init__(self, db_path=None, use_deepseek=None):
        """
        初始化处理器
        
        Args:
            db_path (str, optional): 数据库文件路径，默认为 None，使用默认路径
            use_deepseek (bool, optional): 是否使用 DeepSeek AI 服务，默认使用配置文件中的设置
        """
        self.db_client = SQLiteClient(db_path)
        
        # 确定是否使用 DeepSeek
        self.use_deepseek = ENABLE_DEEPSEEK if use_deepseek is None else use_deepseek
        
        # 初始化 DeepSeek AI 服务
        if self.use_deepseek:
            api_key = os.environ.get("DEEPSEEK_API_KEY")
            if api_key:
                self.finance_analyzer = FinanceAnalyzer(api_key=api_key)
                logger.info("初始化 DeepSeek AI 服务成功")
            else:
                self.use_deepseek = False
                logger.warning("未找到 DeepSeek API 密钥，将使用默认分析服务")
        
        logger.info(f"文章处理器初始化完成，使用 DeepSeek: {self.use_deepseek}")
    
    def get_unprocessed_articles(self, limit=MAX_BATCH_SIZE, source=None):
        """
        获取未处理的文章
        
        Args:
            limit (int): 获取数量限制
            source (str, optional): 文章来源筛选
            
        Returns:
            list: 文章列表
        """
        logger.info(f"获取未处理文章: limit={limit}, source={source or '全部'}")
        return self.db_client.get_unprocessed_articles(limit, source)
    
    def process_article(self, article):
        """
        处理单篇文章
        
        Args:
            article (dict): 文章数据
            
        Returns:
            bool: 处理是否成功
        """
        article_id = article.get('id')
        title = article.get('title', '')
        source = article.get('source', '')
        
        logger.info(f"开始处理文章: [{source}] {title} (ID: {article_id})")
        
        # 提取原始内容
        raw_content = article.get('content', '')
        
        # 提取干净的文本内容
        clean_content = extract_clean_content(raw_content)
        
        # 文章内容有效性检查
        if not is_content_valid(clean_content, title):
            logger.warning(f"文章内容无效或过短: {title}")
            # 尝试处理无效内容的情况
            if raw_content and len(raw_content.strip()) > 0:
                # 如果有原始内容，尝试直接从原始内容提取
                clean_content = extract_clean_content(raw_content)
            else:
                # 如果仍然无效，使用标题作为内容
                clean_content = title
                logger.warning(f"使用标题作为内容: {title}")
        
        # 记录内容长度
        content_length = len(clean_content)
        logger.info(f"提取到干净内容，长度: {content_length} 字符")
        
        try:
            # 生成分析
            analysis_start_time = time.time()
            
            # 使用 DeepSeek 或默认分析服务
            if self.use_deepseek:
                logger.info(f"使用 DeepSeek AI 服务分析文章: {title}")
                
                # 调用金融分析器
                finance_analysis = self.finance_analyzer.analyze_finance_article(
                    title=title,
                    content=clean_content,
                    source=source,
                    json_output=True
                )
                
                # 如果 DeepSeek 分析失败，回退到默认分析
                if "error" in finance_analysis:
                    logger.warning(f"DeepSeek 分析失败: {finance_analysis.get('error')}，使用默认分析")
                    analysis = generate_analysis(title, clean_content, source)
                else:
                    # 使用 DeepSeek 分析结果
                    analysis = {
                        "summary": finance_analysis.get("summary", ""),
                        "key_points": finance_analysis.get("key_points", []),
                        "background": finance_analysis.get("background", ""),
                        "impact": finance_analysis.get("impact", ""),
                        "opinion": finance_analysis.get("opinion", ""),
                        "comment": finance_analysis.get("comment", ""),
                        "suggestions": finance_analysis.get("suggestions", []),
                    }
            else:
                # 使用默认分析服务
                analysis = generate_analysis(title, clean_content, source)
            
            analysis_time = time.time() - analysis_start_time
            logger.info(f"分析完成，耗时: {analysis_time:.2f}秒")
            
            # 构建分析数据
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
                    "processingTime": f"{analysis_time:.2f}秒",
                    "processor": "newsnow-python",
                    "version": "1.0.0"
                }
            }
            
            # 打印分析结果摘要
            logger.info(f"分析结果: 摘要({len(analysis_data['summary'])}字符), "
                  f"关键要点({len(analysis_data['keyPoints'])}条), "
                  f"建议行动({len(analysis_data['suggestions'])}条)")
            
            # 更新文章分析
            update_result = self.db_client.update_article_analysis(article_id, analysis_data, source)
            
            if update_result:
                logger.info(f"文章处理成功: {title}")
                return True
            else:
                logger.warning(f"更新文章分析失败: {title}")
                return False
                
        except Exception as e:
            logger.error(f"处理文章异常: {str(e)}")
            
            # 记录错误日志
            self.db_client.add_article_log(
                article_id=article_id,
                log_type="error",
                message=f"文章处理异常: {str(e)}"
            )
            
            return False
    
    def process_batch(self, batch_size=MAX_BATCH_SIZE, source=None):
        """
        批量处理文章
        
        Args:
            batch_size (int): 批处理大小
            source (str, optional): 文章来源筛选
            
        Returns:
            dict: 处理结果统计
        """
        batch_start_time = time.time()
        
        # 获取未处理文章
        articles = self.get_unprocessed_articles(batch_size, source)
        article_count = len(articles)
        
        if article_count == 0:
            logger.info("没有找到需要处理的文章")
            return {"total": 0, "success": 0, "failed": 0, "time": 0}
        
        logger.info(f"开始批量处理 {article_count} 篇文章")
        
        # 处理统计
        success_count = 0
        fail_count = 0
        
        # 依次处理每篇文章
        for index, article in enumerate(articles, 1):
            logger.info(f"[{index}/{article_count}] 开始处理文章 ID: {article.get('id')}")
            
            try:
                result = self.process_article(article)
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
