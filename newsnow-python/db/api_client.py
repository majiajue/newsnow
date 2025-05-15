#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
数据库API客户端 - 提供与主系统数据库API的交互接口
"""

import requests
import json
import time
from datetime import datetime
from ..config.settings import API_BASE_URL, API_KEY, DB_API_TIMEOUT

class APIClient:
    """数据库API客户端类"""
    
    def __init__(self):
        """初始化客户端"""
        self.base_url = API_BASE_URL
        self.headers = {
            "Content-Type": "application/json",
            "API-Key": API_KEY
        }
    
    def get_unprocessed_articles(self, limit=10, source=None):
        """
        获取未处理的文章
        
        Args:
            limit (int): 获取数量限制
            source (str, optional): 文章来源筛选
            
        Returns:
            list: 文章列表
        """
        url = f"{self.base_url}/content/unprocessed"
        params = {
            "limit": limit
        }
        
        if source:
            params["source"] = source
        
        try:
            response = requests.get(
                url, 
                headers=self.headers,
                params=params,
                timeout=DB_API_TIMEOUT
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"获取未处理文章失败: HTTP {response.status_code}")
                print(f"响应内容: {response.text[:200]}")
                return []
        except Exception as e:
            print(f"获取未处理文章异常: {str(e)}")
            return []
    
    def update_article_analysis(self, article_id, analysis_data):
        """
        更新文章分析结果
        
        Args:
            article_id (str): 文章ID
            analysis_data (dict): 分析数据
            
        Returns:
            bool: 是否更新成功
        """
        url = f"{self.base_url}/content/update-analysis"
        
        # 构建元数据对象
        metadata = {
            "analysisData": analysis_data,
            "updatedAt": datetime.now().isoformat()
        }
        
        # 构建请求体
        payload = {
            "id": article_id,
            "metadata": json.dumps(metadata)
        }
        
        try:
            response = requests.post(
                url, 
                headers=self.headers,
                json=payload,
                timeout=DB_API_TIMEOUT
            )
            
            if response.status_code == 200:
                return True
            else:
                print(f"更新文章分析失败: HTTP {response.status_code}")
                print(f"响应内容: {response.text[:200]}")
                return False
        except Exception as e:
            print(f"更新文章分析异常: {str(e)}")
            return False
    
    def get_article_by_id(self, article_id):
        """
        根据ID获取文章详情
        
        Args:
            article_id (str): 文章ID
            
        Returns:
            dict: 文章详情，失败返回None
        """
        url = f"{self.base_url}/content/{article_id}"
        
        try:
            response = requests.get(
                url, 
                headers=self.headers,
                timeout=DB_API_TIMEOUT
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"获取文章详情失败: HTTP {response.status_code}")
                return None
        except Exception as e:
            print(f"获取文章详情异常: {str(e)}")
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
        url = f"{self.base_url}/logs/add"
        
        payload = {
            "articleId": article_id,
            "type": log_type,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            response = requests.post(
                url, 
                headers=self.headers,
                json=payload,
                timeout=DB_API_TIMEOUT
            )
            
            return response.status_code == 200
        except Exception as e:
            print(f"添加日志异常: {str(e)}")
            return False
    
    def health_check(self):
        """
        检查API健康状态
        
        Returns:
            bool: API是否正常
        """
        url = f"{self.base_url}/health"
        
        try:
            response = requests.get(
                url, 
                headers=self.headers,
                timeout=5  # 健康检查使用较短的超时时间
            )
            
            return response.status_code == 200
        except Exception:
            return False
    
    def retry_request(self, func, *args, max_retries=3, **kwargs):
        """
        带重试机制的请求方法
        
        Args:
            func: 请求函数
            *args: 位置参数
            max_retries (int): 最大重试次数
            **kwargs: 关键字参数
            
        Returns:
            任何值: 请求函数的返回值
        """
        retries = 0
        last_exception = None
        
        while retries < max_retries:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                retries += 1
                sleep_time = 2 ** retries  # 指数退避
                print(f"请求失败，{sleep_time}秒后重试 ({retries}/{max_retries})")
                time.sleep(sleep_time)
        
        # 所有重试都失败
        print(f"重试{max_retries}次后仍然失败: {str(last_exception)}")
        raise last_exception
