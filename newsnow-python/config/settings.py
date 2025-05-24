#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
配置文件 - 统一管理系统配置
"""

import os
from datetime import datetime

# API配置
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3000/api")
API_KEY = os.environ.get("API_KEY", "your_api_key_here")  # 实际环境中应从环境变量获取

# 爬虫和处理配置
CRAWL_INTERVAL = int(os.environ.get("CRAWL_INTERVAL", "30"))  # 抓取间隔（分钟）
PROCESS_INTERVAL = int(os.environ.get("PROCESS_INTERVAL", "15"))  # 处理间隔（分钟）
SEARCH_INTERVAL = int(os.environ.get("SEARCH_INTERVAL", "60"))  # 搜索间隔（分钟）
MAX_BATCH_SIZE = int(os.environ.get("MAX_BATCH_SIZE", "20"))  # 每次处理的最大文章数量
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
REQUEST_TIMEOUT = 30  # 请求超时时间（秒）

# AI分析配置
ENABLE_DEEPSEEK = os.environ.get("ENABLE_DEEPSEEK", "True").lower() == "true"
ENABLE_LOCAL_MODEL = os.environ.get("ENABLE_LOCAL_MODEL", "False").lower() == "true"
LOCAL_MODEL_PATH = os.environ.get("LOCAL_MODEL_PATH", "./models/analysis-model")

# 数据库配置
DB_API_TIMEOUT = int(os.environ.get("DB_API_TIMEOUT", "30"))  # 秒

# 日志配置
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
LOG_DIR = os.environ.get("LOG_DIR", "./logs")
LOG_FILENAME = f"newsnow-{datetime.now().strftime('%Y%m%d')}.log"

# 内容分析配置
MIN_ARTICLE_LENGTH = 100  # 最小文章长度，小于此长度则使用标题
MAX_SUMMARY_LENGTH = 200  # 摘要最大长度

# SearXNG搜索配置
SEARXNG_URL = os.environ.get("SEARXNG_URL", "http://localhost:8080")
SEARXNG_TIMEOUT = int(os.environ.get("SEARXNG_TIMEOUT", "10"))  # 请求超时时间（秒）
SEARCH_CACHE_TTL = int(os.environ.get("SEARCH_CACHE_TTL", "3600"))  # 缓存过期时间（秒）
MAX_SEARCH_RESULTS = int(os.environ.get("MAX_SEARCH_RESULTS", "10"))  # 搜索结果数量限制

# API服务器配置
API_HOST = os.environ.get("API_HOST", "0.0.0.0")
API_PORT = int(os.environ.get("API_PORT", "5000"))
API_DEBUG = os.environ.get("API_DEBUG", "False").lower() == "true"
ENABLE_CORS = os.environ.get("ENABLE_CORS", "True").lower() == "true"

# 来源配置
SOURCES = {
    "jin10": "金十数据",
    "gelonghui": "格隆汇",
    "wallstreet": "华尔街见闻",
    "fastbull": "FastBull",
    "cls": "财联社"
}

# 模板配置
TEMPLATES = {
    "no_content": "该文章内容未能成功获取，需要进一步调查。"
}
