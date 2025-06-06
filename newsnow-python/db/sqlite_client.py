#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
SQLite数据库客户端 - 提供本地数据存储功能
"""

import os
import sqlite3
import json
import time
import logging
from datetime import datetime
from pathlib import Path
# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import SOURCES

logger = logging.getLogger(__name__)

class SQLiteClient:
    """SQLite数据库客户端类"""
    
    def __init__(self, db_path=None):
        """
        初始化SQLite客户端
        
        Args:
            db_path (str, optional): 数据库文件路径，默认为'data/newsnow.db'
        """
        if db_path is None:
            # 默认数据库路径
            base_dir = Path(__file__).resolve().parent.parent
            data_dir = os.path.join(base_dir, 'data')
            os.makedirs(data_dir, exist_ok=True)
            db_path = os.path.join(data_dir, 'newsnow.db')
        
        self.db_path = db_path
        self._init_db()
        logger.info(f"SQLite数据库初始化完成: {db_path}")
    
    def _init_db(self):
        """初始化数据库表结构"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # 创建文章表
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS articles (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT,
                url TEXT,
                pub_date TEXT,
                source TEXT,
                category TEXT,
                summary TEXT,
                author TEXT,
                image_url TEXT,
                tags TEXT,
                created_at TEXT,
                processed INTEGER DEFAULT 0,
                metadata TEXT,
                -- 新增内容质量相关字段
                quality_enhanced INTEGER DEFAULT 0,
                quality_score INTEGER DEFAULT 0,
                enhanced_title TEXT,
                executive_summary TEXT,
                key_insights TEXT,
                expert_opinion TEXT,
                actionable_advice TEXT,
                seo_keywords TEXT,
                originality_percentage TEXT,
                enhancement_date TEXT,
                meta_description TEXT,
                h1_heading TEXT,
                h2_headings TEXT,
                suggested_tags TEXT,
                internal_links TEXT
            )
            ''')
            
            # 创建快讯表
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS flash_news (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT,
                url TEXT,
                pub_date TEXT,
                source TEXT,
                created_at TEXT
            )
            ''')
            
            # 创建日志表
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id TEXT,
                type TEXT,
                message TEXT,
                timestamp TEXT
            )
            ''')
            
            # 创建索引
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_articles_source ON articles (source)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_articles_processed ON articles (processed)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles (pub_date)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_flash_source ON flash_news (source)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_flash_pub_date ON flash_news (pub_date)')
            
            conn.commit()
    
    def save_article(self, article, analysis_data=None):
        """
        保存文章到数据库。如果文章已存在，则更新。
        如果提供了 analysis_data，则文章将被标记为已处理并存储分析元数据。
        
        Args:
            article (dict): 文章数据
            analysis_data (dict, optional): AI分析结果
            
        Returns:
            bool: 是否保存成功
        """
        try:
            article_id = article.get('id')
            source = article.get('source', '')

            if self.article_exists(article_id, source):
                return self.update_article(article, analysis_data)

            # Article does not exist, insert new
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                processed_status = 1 if analysis_data else 0
                metadata_content = json.dumps(analysis_data, ensure_ascii=False) if analysis_data else None
                
                cursor.execute('''
                INSERT INTO articles (
                    id, title, content, url, pub_date, source, category, 
                    summary, author, image_url, tags, created_at, processed, metadata,
                    quality_enhanced, quality_score, enhanced_title, executive_summary, 
                    key_insights, expert_opinion, actionable_advice, seo_keywords, 
                    originality_percentage, enhancement_date, meta_description, h1_heading, 
                    h2_headings, suggested_tags, internal_links
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    article.get('id', ''),
                    article.get('title', ''),
                    article.get('content', ''),
                    article.get('url', ''),
                    article.get('pubDate', ''),
                    article.get('source', ''),
                    article.get('category', ''),
                    article.get('summary', ''),
                    article.get('author', ''),
                    article.get('imageUrl', ''),
                    json.dumps(article.get('tags', []), ensure_ascii=False),
                    datetime.now().isoformat(),
                    processed_status,
                    metadata_content,
                    0,  # quality_enhanced
                    0,  # quality_score
                    '',  # enhanced_title
                    '',  # executive_summary
                    '',  # key_insights
                    '',  # expert_opinion
                    '',  # actionable_advice
                    '',  # seo_keywords
                    '',  # originality_percentage
                    '',  # enhancement_date
                    '',  # meta_description
                    '',  # h1_heading
                    '',  # h2_headings
                    '',  # suggested_tags
                    ''  # internal_links
                ))
                
                conn.commit()
                logger.info(f"保存新文章成功: [{source}] {article.get('title')} (ID: {article_id}), Processed: {bool(processed_status)}")
                return True
            
        except Exception as e:
            logger.error(f"保存文章异常: {str(e)}")
            return False
    
    def update_article(self, article, analysis_data=None):
        """
        更新文章信息。
        如果提供了 analysis_data，则同时更新分析元数据并将文章标记为已处理。
        否则，仅更新文章基本信息，不改变处理状态或元数据。
        
        Args:
            article (dict): 文章数据
            analysis_data (dict, optional): AI分析结果

        Returns:
            bool: 是否更新成功
        """
        try:
            article_id = article.get('id')
            source = article.get('source', '')
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                log_message_suffix = ""

                if analysis_data:
                    processed_status = 1
                    metadata_content = json.dumps(analysis_data, ensure_ascii=False)
                    
                    cursor.execute('''
                    UPDATE articles SET
                        title = ?, content = ?, url = ?, pub_date = ?, category = ?,
                        summary = ?, author = ?, image_url = ?, tags = ?,
                        processed = ?, metadata = ?,
                        quality_enhanced = ?, quality_score = ?, enhanced_title = ?, executive_summary = ?,
                        key_insights = ?, expert_opinion = ?, actionable_advice = ?, seo_keywords = ?,
                        originality_percentage = ?, enhancement_date = ?, meta_description = ?, h1_heading = ?,
                        h2_headings = ?, suggested_tags = ?, internal_links = ?
                    WHERE id = ? AND source = ?
                    ''', (
                        article.get('title', ''),
                        article.get('content', ''),
                        article.get('url', ''),
                        article.get('pubDate', ''),
                        article.get('category', ''),
                        article.get('summary', ''),
                        article.get('author', ''),
                        article.get('imageUrl', ''),
                        json.dumps(article.get('tags', []), ensure_ascii=False),
                        processed_status,
                        metadata_content,
                        0,  # quality_enhanced
                        0,  # quality_score
                        '',  # enhanced_title
                        '',  # executive_summary
                        '',  # key_insights
                        '',  # expert_opinion
                        '',  # actionable_advice
                        '',  # seo_keywords
                        '',  # originality_percentage
                        '',  # enhancement_date
                        '',  # meta_description
                        '',  # h1_heading
                        '',  # h2_headings
                        '',  # suggested_tags
                        '',  # internal_links
                        article_id,
                        source
                    ))
                    log_message_suffix = f", Processed: True, Metadata Updated"
                else:
                    # Only update standard fields, leave processed and metadata untouched
                    cursor.execute('''
                    UPDATE articles SET
                        title = ?, content = ?, url = ?, pub_date = ?, category = ?,
                        summary = ?, author = ?, image_url = ?, tags = ?
                    WHERE id = ? AND source = ?
                    ''', (
                        article.get('title', ''),
                        article.get('content', ''),
                        article.get('url', ''),
                        article.get('pubDate', ''),
                        article.get('category', ''),
                        article.get('summary', ''),
                        article.get('author', ''),
                        article.get('imageUrl', ''),
                        json.dumps(article.get('tags', []), ensure_ascii=False),
                        article_id,
                        source
                    ))
                    log_message_suffix = ", Basic Info Updated (Processed status and Metadata unchanged)"

                conn.commit()
                logger.info(f"更新文章成功: [{source}] {article.get('title')} (ID: {article_id}){log_message_suffix}")
                return True
            
        except Exception as e:
            logger.error(f"更新文章异常: {str(e)}")
            return False
    
    def save_flash(self, news):
        """
        保存快讯到数据库
        
        Args:
            news (dict): 快讯数据
            
        Returns:
            bool: 是否保存成功
        """
        try:
            news_id = news.get('id')
            source = news.get('source', '')
            
            # 检查快讯是否已存在
            if self.flash_exists(news_id, source):
                return True  # 快讯已存在，无需重复保存
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                INSERT INTO flash_news (
                    id, title, content, url, pub_date, source, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    news.get('id', ''),
                    news.get('title', ''),
                    news.get('content', ''),
                    news.get('url', ''),
                    news.get('pubDate', ''),
                    news.get('source', ''),
                    datetime.now().isoformat()
                ))
                
                conn.commit()
                logger.info(f"保存快讯成功: [{source}] {news.get('title')} (ID: {news_id})")
                return True
                
        except Exception as e:
            logger.error(f"保存快讯异常: {str(e)}")
            return False
    
    def article_exists(self, article_id, source):
        """
        检查文章是否已存在
        
        Args:
            article_id (str): 文章ID
            source (str): 文章来源
            
        Returns:
            bool: 文章是否存在
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute(
                    'SELECT COUNT(*) FROM articles WHERE id = ? AND source = ?',
                    (article_id, source)
                )
                
                count = cursor.fetchone()[0]
                return count > 0
                
        except Exception as e:
            logger.error(f"检查文章是否存在异常: {str(e)}")
            return False
            
    def check_article_exists(self, url):
        """
        通过URL检查文章是否已存在
        
        Args:
            url (str): 文章URL
            
        Returns:
            bool: 文章是否存在
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute(
                    'SELECT COUNT(*) FROM articles WHERE url = ?',
                    (url,)
                )
                
                count = cursor.fetchone()[0]
                return count > 0
                
        except Exception as e:
            logger.error(f"通过URL检查文章是否存在异常: {str(e)}")
            return False
    
    def flash_exists(self, news_id, source):
        """
        检查快讯是否已存在
        
        Args:
            news_id (str): 快讯ID
            source (str): 快讯来源
            
        Returns:
            bool: 快讯是否存在
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute(
                    'SELECT COUNT(*) FROM flash_news WHERE id = ? AND source = ?',
                    (news_id, source)
                )
                
                count = cursor.fetchone()[0]
                return count > 0
                
        except Exception as e:
            logger.error(f"检查快讯是否存在异常: {str(e)}")
            return False
    
    def get_unprocessed_articles(self, limit=10, source=None):
        """
        获取未处理的文章
        
        Args:
            limit (int): 获取数量限制
            source (str, optional): 文章来源筛选
            
        Returns:
            list: 文章列表
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                if source:
                    query = '''
                    SELECT * FROM articles 
                    WHERE processed = 0 AND source = ? 
                    ORDER BY pub_date DESC LIMIT ?
                    '''
                    cursor.execute(query, (source, limit))
                else:
                    query = '''
                    SELECT * FROM articles 
                    WHERE processed = 0 
                    ORDER BY pub_date DESC LIMIT ?
                    '''
                    cursor.execute(query, (limit,))
                
                articles = []
                for row in cursor.fetchall():
                    article = dict(row)
                    if 'tags' in article and article['tags']:
                        try:
                            article['tags'] = json.loads(article['tags'])
                        except:
                            article['tags'] = []
                    
                    # 转换字段名
                    if 'pub_date' in article:
                        article['pubDate'] = article.pop('pub_date')
                    if 'image_url' in article:
                        article['imageUrl'] = article.pop('image_url')
                    
                    articles.append(article)
                
                logger.info(f"获取到 {len(articles)} 篇未处理的文章")
                return articles
                
        except Exception as e:
            logger.error(f"获取未处理文章异常: {str(e)}")
            return []
    
    def update_article_analysis(self, article_id, analysis_data, source=None):
        """
        更新文章分析结果
        
        Args:
            article_id (str): 文章ID
            analysis_data (dict): 分析数据
            source (str, optional): 文章来源
            
        Returns:
            bool: 是否更新成功
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 构建元数据对象
                metadata = {
                    "analysisData": analysis_data,
                    "updatedAt": datetime.now().isoformat()
                }
                
                # 构建查询条件
                if source:
                    query = '''
                    UPDATE articles 
                    SET metadata = ?, processed = 1
                    WHERE id = ? AND source = ?
                    '''
                    cursor.execute(query, (json.dumps(metadata, ensure_ascii=False), article_id, source))
                else:
                    query = '''
                    UPDATE articles 
                    SET metadata = ?, processed = 1
                    WHERE id = ?
                    '''
                    cursor.execute(query, (json.dumps(metadata, ensure_ascii=False), article_id))
                
                conn.commit()
                
                if cursor.rowcount > 0:
                    logger.info(f"更新文章分析结果成功: ID={article_id}")
                    return True
                else:
                    logger.warning(f"未找到要更新的文章: ID={article_id}")
                    return False
                
        except Exception as e:
            logger.error(f"更新文章分析结果异常: {str(e)}")
            return False
    
    def get_article_by_id(self, article_id, source=None):
        """
        根据ID获取文章详情
        
        Args:
            article_id (str): 文章ID，可以是完整路径或简单ID
            source (str, optional): 文章来源
            
        Returns:
            dict: 文章详情，失败返回None
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # 处理简单ID和完整路径ID
                # 如果是简单ID（不包含'/'），尝试匹配完整路径中的任何部分
                if '/' not in article_id:
                    logger.info(f"使用简单ID查询: {article_id}")
                    if source:
                        query = "SELECT * FROM articles WHERE id LIKE ? AND source = ?"
                        cursor.execute(query, (f'%{article_id}%', source))
                    else:
                        query = "SELECT * FROM articles WHERE id LIKE ?"
                        cursor.execute(query, (f'%{article_id}%',))
                else:
                    # 完整路径ID的处理方式不变
                    logger.info(f"使用完整路径ID查询: {article_id}")
                    if source:
                        query = 'SELECT * FROM articles WHERE id = ? AND source = ?'
                        cursor.execute(query, (article_id, source))
                    else:
                        query = 'SELECT * FROM articles WHERE id = ?'
                        cursor.execute(query, (article_id,))
                
                row = cursor.fetchone()
                
                if row:
                    article = dict(row)
                    if 'tags' in article and article['tags']:
                        try:
                            article['tags'] = json.loads(article['tags'])
                        except:
                            article['tags'] = []
                    
                    if 'metadata' in article and article['metadata']:
                        try:
                            article['metadata'] = json.loads(article['metadata'])
                        except:
                            article['metadata'] = {}
                    
                    # 转换字段名
                    if 'pub_date' in article:
                        article['pubDate'] = article.pop('pub_date')
                    if 'image_url' in article:
                        article['imageUrl'] = article.pop('image_url')
                    
                    return article
                else:
                    logger.warning(f"未找到文章: {article_id}")
                    return None
            
        except Exception as e:
            logger.error(f"获取文章详情异常: {str(e)}")
            return None
    
    def add_article_log(self, article_id, log_type, message):
        """
        添加文章处理日志
        
        Args:
            article_id (str): 文章ID
            log_type (str): 日志类型，如'info', 'error', 'warning'
            message (str): 日志消息
            
        Returns:
            bool: 是否记录成功
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                INSERT INTO logs (article_id, type, message, timestamp)
                VALUES (?, ?, ?, ?)
                ''', (
                    article_id,
                    log_type,
                    message,
                    datetime.now().isoformat()
                ))
                
                conn.commit()
                return True
                
        except Exception as e:
            logger.error(f"添加日志异常: {str(e)}")
            return False
    
    def get_article_count(self, source=None, processed=None):
        """
        获取文章数量
        
        Args:
            source (str, optional): 文章来源筛选
            processed (bool, optional): 处理状态筛选
            
        Returns:
            int: 文章数量
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                query = 'SELECT COUNT(*) FROM articles WHERE 1=1'
                params = []
                
                if source:
                    query += ' AND source = ?'
                    params.append(source)
                
                if processed is not None:
                    query += ' AND processed = ?'
                    params.append(1 if processed else 0)
                
                cursor.execute(query, params)
                count = cursor.fetchone()[0]
                return count
                
        except Exception as e:
            logger.error(f"获取文章数量异常: {str(e)}")
            return 0
    
    def get_flash_count(self, source=None):
        """
        获取快讯数量
        
        Args:
            source (str, optional): 快讯来源筛选
            
        Returns:
            int: 快讯数量
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                if source:
                    query = 'SELECT COUNT(*) FROM flash_news WHERE source = ?'
                    cursor.execute(query, (source,))
                else:
                    query = 'SELECT COUNT(*) FROM flash_news'
                    cursor.execute(query)
                
                count = cursor.fetchone()[0]
                return count
                
        except Exception as e:
            logger.error(f"获取快讯数量异常: {str(e)}")
            return 0
    
    def get_latest_articles(self, limit=10, source=None):
        """
        获取最新文章
        
        Args:
            limit (int): 获取数量限制
            source (str, optional): 文章来源筛选
            
        Returns:
            list: 文章列表
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                if source:
                    query = '''
                    SELECT * FROM articles 
                    WHERE source = ? 
                    ORDER BY pub_date DESC LIMIT ?
                    '''
                    cursor.execute(query, (source, limit))
                else:
                    query = '''
                    SELECT * FROM articles 
                    ORDER BY pub_date DESC LIMIT ?
                    '''
                    cursor.execute(query, (limit,))
                
                articles = []
                for row in cursor.fetchall():
                    article = dict(row)
                    if 'tags' in article and article['tags']:
                        try:
                            article['tags'] = json.loads(article['tags'])
                        except:
                            article['tags'] = []
                    
                    # 处理AI分析数据
                    if 'metadata' in article and article['metadata']:
                        try:
                            article['analysis_data'] = json.loads(article['metadata'])
                        except:
                            article['analysis_data'] = {}
                    else:
                        article['analysis_data'] = {}
                    
                    # 转换字段名
                    if 'pub_date' in article:
                        article['pubDate'] = article.pop('pub_date')
                    if 'image_url' in article:
                        article['imageUrl'] = article.pop('image_url')
                    
                    articles.append(article)
                
                return articles
                
        except Exception as e:
            logger.error(f"获取最新文章异常: {str(e)}")
            return []
    
    def get_latest_flash(self, limit=10, source=None):
        """
        获取最新快讯
        
        Args:
            limit (int): 获取数量限制
            source (str, optional): 快讯来源筛选
            
        Returns:
            list: 快讯列表
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                if source:
                    query = '''
                    SELECT * FROM flash_news 
                    WHERE source = ? 
                    ORDER BY pub_date DESC LIMIT ?
                    '''
                    cursor.execute(query, (source, limit))
                else:
                    query = '''
                    SELECT * FROM flash_news 
                    ORDER BY pub_date DESC LIMIT ?
                    '''
                    cursor.execute(query, (limit,))
                
                news_list = []
                for row in cursor.fetchall():
                    news = dict(row)
                    
                    # 转换字段名
                    if 'pub_date' in news:
                        news['pubDate'] = news.pop('pub_date')
                    
                    news_list.append(news)
                
                return news_list
                
        except Exception as e:
            logger.error(f"获取最新快讯异常: {str(e)}")
            return []
    
    def search_articles(self, keyword, limit=20, source=None):
        """
        搜索文章
        
        Args:
            keyword (str): 搜索关键词
            limit (int): 获取数量限制
            source (str, optional): 文章来源筛选
            
        Returns:
            list: 文章列表
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                search_term = f"%{keyword}%"
                
                if source:
                    query = '''
                    SELECT * FROM articles 
                    WHERE (title LIKE ? OR content LIKE ? OR summary LIKE ?) AND source = ?
                    ORDER BY pub_date DESC LIMIT ?
                    '''
                    cursor.execute(query, (search_term, search_term, search_term, source, limit))
                else:
                    query = '''
                    SELECT * FROM articles 
                    WHERE title LIKE ? OR content LIKE ? OR summary LIKE ?
                    ORDER BY pub_date DESC LIMIT ?
                    '''
                    cursor.execute(query, (search_term, search_term, search_term, limit))
                
                articles = []
                for row in cursor.fetchall():
                    article = dict(row)
                    if 'tags' in article and article['tags']:
                        try:
                            article['tags'] = json.loads(article['tags'])
                        except:
                            article['tags'] = []
                    
                    # 处理AI分析数据
                    if 'metadata' in article and article['metadata']:
                        try:
                            article['analysis_data'] = json.loads(article['metadata'])
                        except:
                            article['analysis_data'] = {}
                    else:
                        article['analysis_data'] = {}
                    
                    # 转换字段名
                    if 'pub_date' in article:
                        article['pubDate'] = article.pop('pub_date')
                    if 'image_url' in article:
                        article['imageUrl'] = article.pop('image_url')
                    
                    articles.append(article)
                
                return articles
                
        except Exception as e:
            logger.error(f"搜索文章异常: {str(e)}")
            return []
    
    def clear_database(self):
        """
        清空数据库（仅用于测试）
        
        Returns:
            bool: 是否清空成功
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('DELETE FROM articles')
                cursor.execute('DELETE FROM flash_news')
                cursor.execute('DELETE FROM logs')
                
                conn.commit()
                logger.warning("数据库已清空")
                return True
                
        except Exception as e:
            logger.error(f"清空数据库异常: {str(e)}")
            return False
    
    def backup_database(self, backup_path=None):
        """
        备份数据库
        
        Args:
            backup_path (str, optional): 备份文件路径
            
        Returns:
            str: 备份文件路径，失败返回None
        """
        try:
            if backup_path is None:
                base_dir = Path(__file__).resolve().parent.parent
                backup_dir = os.path.join(base_dir, 'backup')
                os.makedirs(backup_dir, exist_ok=True)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_path = os.path.join(backup_dir, f'newsnow_backup_{timestamp}.db')
            
            # 连接源数据库
            with sqlite3.connect(self.db_path) as conn:
                # 创建备份数据库
                with sqlite3.connect(backup_path) as backup_conn:
                    conn.backup(backup_conn)
            
            logger.info(f"数据库备份成功: {backup_path}")
            return backup_path
            
        except Exception as e:
            logger.error(f"备份数据库异常: {str(e)}")
            return None

    def update_article_quality(self, enhanced_article):
        """
        更新文章的质量增强数据
        
        Args:
            enhanced_article (dict): 增强后的文章数据
            
        Returns:
            bool: 是否更新成功
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                article_id = enhanced_article.get('id')
                source = enhanced_article.get('source')
                
                # 准备质量增强数据
                quality_analysis = enhanced_article.get('quality_analysis', {})
                seo_optimization = enhanced_article.get('seo_optimization', {})
                
                cursor.execute('''
                UPDATE articles SET
                    quality_enhanced = 1,
                    quality_score = ?,
                    enhanced_title = ?,
                    executive_summary = ?,
                    key_insights = ?,
                    expert_opinion = ?,
                    actionable_advice = ?,
                    seo_keywords = ?,
                    originality_percentage = ?,
                    enhancement_date = ?,
                    meta_description = ?,
                    h1_heading = ?,
                    h2_headings = ?,
                    suggested_tags = ?,
                    internal_links = ?
                WHERE id = ? AND source = ?
                ''', (
                    enhanced_article.get('quality_score', 0),
                    enhanced_article.get('enhanced_title', ''),
                    enhanced_article.get('executive_summary', ''),
                    json.dumps(enhanced_article.get('key_insights', []), ensure_ascii=False),
                    json.dumps(enhanced_article.get('expert_opinion', {}), ensure_ascii=False),
                    json.dumps(enhanced_article.get('actionable_advice', []), ensure_ascii=False),
                    json.dumps(enhanced_article.get('seo_keywords', []), ensure_ascii=False),
                    enhanced_article.get('originality_percentage', ''),
                    enhanced_article.get('enhancement_date', ''),
                    enhanced_article.get('meta_description', ''),
                    enhanced_article.get('h1_heading', ''),
                    json.dumps(enhanced_article.get('h2_headings', []), ensure_ascii=False),
                    json.dumps(enhanced_article.get('suggested_tags', []), ensure_ascii=False),
                    json.dumps(enhanced_article.get('internal_links', []), ensure_ascii=False),
                    article_id,
                    source
                ))
                
                conn.commit()
                
                if cursor.rowcount > 0:
                    logger.info(f"文章质量数据更新成功: {article_id}")
                    return True
                else:
                    logger.warning(f"未找到要更新的文章: {article_id}")
                    return False
                    
        except Exception as e:
            logger.error(f"更新文章质量数据异常: {str(e)}")
            return False

    def get_articles_for_enhancement(self, limit=10, source=None):
        """
        获取需要质量增强的文章（优先选择未增强的）
        
        Args:
            limit (int): 获取数量限制
            source (str, optional): 文章来源筛选
            
        Returns:
            list: 文章列表
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                if source:
                    query = '''
                    SELECT * FROM articles 
                    WHERE quality_enhanced = 0 AND source = ? 
                    ORDER BY pub_date DESC LIMIT ?
                    '''
                    cursor.execute(query, (source, limit))
                else:
                    query = '''
                    SELECT * FROM articles 
                    WHERE quality_enhanced = 0 
                    ORDER BY pub_date DESC LIMIT ?
                    '''
                    cursor.execute(query, (limit,))
                
                articles = []
                for row in cursor.fetchall():
                    article = dict(row)
                    if 'tags' in article and article['tags']:
                        try:
                            article['tags'] = json.loads(article['tags'])
                        except:
                            article['tags'] = []
                    
                    # 转换字段名
                    if 'pub_date' in article:
                        article['pubDate'] = article.pop('pub_date')
                    if 'image_url' in article:
                        article['imageUrl'] = article.pop('image_url')
                    
                    articles.append(article)
                
                return articles
                
        except Exception as e:
            logger.error(f"获取待增强文章异常: {str(e)}")
            return []

    def get_recent_articles(self, days=30):
        """
        获取最近指定天数的文章
        
        Args:
            days (int): 天数
            
        Returns:
            list: 文章列表
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # 计算日期范围
                from datetime import datetime, timedelta
                start_date = (datetime.now() - timedelta(days=days)).isoformat()
                
                query = '''
                SELECT * FROM articles 
                WHERE created_at >= ? 
                ORDER BY created_at DESC
                '''
                cursor.execute(query, (start_date,))
                
                articles = []
                for row in cursor.fetchall():
                    article = dict(row)
                    
                    # 解析JSON字段
                    json_fields = ['tags', 'key_insights', 'expert_opinion', 'actionable_advice', 
                                  'seo_keywords', 'h2_headings', 'suggested_tags', 'internal_links']
                    
                    for field in json_fields:
                        if field in article and article[field]:
                            try:
                                article[field] = json.loads(article[field])
                            except:
                                article[field] = [] if field.endswith('s') else {}
                    
                    # 转换字段名
                    if 'pub_date' in article:
                        article['pubDate'] = article.pop('pub_date')
                    if 'image_url' in article:
                        article['imageUrl'] = article.pop('image_url')
                    
                    articles.append(article)
                
                return articles
                
        except Exception as e:
            logger.error(f"获取最近文章异常: {str(e)}")
            return []

    def get_quality_statistics(self):
        """
        获取内容质量统计信息
        
        Returns:
            dict: 质量统计数据
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 总文章数
                cursor.execute('SELECT COUNT(*) FROM articles')
                total_articles = cursor.fetchone()[0]
                
                # 已增强文章数
                cursor.execute('SELECT COUNT(*) FROM articles WHERE quality_enhanced = 1')
                enhanced_articles = cursor.fetchone()[0]
                
                # 平均质量评分
                cursor.execute('SELECT AVG(quality_score) FROM articles WHERE quality_enhanced = 1')
                avg_quality_score = cursor.fetchone()[0] or 0
                
                # 按来源统计
                cursor.execute('''
                SELECT source, 
                       COUNT(*) as total,
                       SUM(quality_enhanced) as enhanced,
                       AVG(CASE WHEN quality_enhanced = 1 THEN quality_score ELSE NULL END) as avg_score
                FROM articles 
                GROUP BY source
                ''')
                
                source_stats = {}
                for row in cursor.fetchall():
                    source, total, enhanced, avg_score = row
                    source_stats[source] = {
                        'total': total,
                        'enhanced': enhanced or 0,
                        'enhancement_rate': (enhanced or 0) / total if total > 0 else 0,
                        'avg_quality_score': avg_score or 0
                    }
                
                return {
                    'total_articles': total_articles,
                    'enhanced_articles': enhanced_articles,
                    'enhancement_rate': enhanced_articles / total_articles if total_articles > 0 else 0,
                    'average_quality_score': avg_quality_score,
                    'source_statistics': source_stats
                }
                
        except Exception as e:
            logger.error(f"获取质量统计异常: {str(e)}")
            return {}

    def get_high_quality_articles(self, min_score=8, limit=20):
        """
        获取高质量文章
        
        Args:
            min_score (int): 最低质量评分
            limit (int): 获取数量限制
            
        Returns:
            list: 高质量文章列表
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                query = '''
                SELECT * FROM articles 
                WHERE quality_enhanced = 1 AND quality_score >= ? 
                ORDER BY quality_score DESC, pub_date DESC 
                LIMIT ?
                '''
                cursor.execute(query, (min_score, limit))
                
                articles = []
                for row in cursor.fetchall():
                    article = dict(row)
                    
                    # 解析JSON字段
                    json_fields = ['tags', 'key_insights', 'expert_opinion', 'actionable_advice', 
                                  'seo_keywords', 'h2_headings', 'suggested_tags', 'internal_links']
                    
                    for field in json_fields:
                        if field in article and article[field]:
                            try:
                                article[field] = json.loads(article[field])
                            except:
                                article[field] = [] if field.endswith('s') else {}
                    
                    # 转换字段名
                    if 'pub_date' in article:
                        article['pubDate'] = article.pop('pub_date')
                    if 'image_url' in article:
                        article['imageUrl'] = article.pop('image_url')
                    
                    articles.append(article)
                
                return articles
                
        except Exception as e:
            logger.error(f"获取高质量文章异常: {str(e)}")
            return []
