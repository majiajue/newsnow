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
                metadata TEXT
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
    
    def save_article(self, article):
        """
        保存文章到数据库
        
        Args:
            article (dict): 文章数据
            
        Returns:
            bool: 是否保存成功
        """
        try:
            article_id = article.get('id')
            source = article.get('source', '')
            
            # 检查文章是否已存在
            if self.article_exists(article_id, source):
                return self.update_article(article)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                INSERT INTO articles (
                    id, title, content, url, pub_date, source, category, 
                    summary, author, image_url, tags, created_at, processed
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    0
                ))
                
                conn.commit()
                logger.info(f"保存文章成功: [{source}] {article.get('title')} (ID: {article_id})")
                return True
                
        except Exception as e:
            logger.error(f"保存文章异常: {str(e)}")
            return False
    
    def update_article(self, article):
        """
        更新文章信息
        
        Args:
            article (dict): 文章数据
            
        Returns:
            bool: 是否更新成功
        """
        try:
            article_id = article.get('id')
            source = article.get('source', '')
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
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
                
                conn.commit()
                logger.info(f"更新文章成功: [{source}] {article.get('title')} (ID: {article_id})")
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
            article_id (str): 文章ID
            source (str, optional): 文章来源
            
        Returns:
            dict: 文章详情，失败返回None
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
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
