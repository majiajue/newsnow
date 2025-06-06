#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API请求限制器 - 防止频率过高
"""

import time
import threading
from datetime import datetime, timedelta

class APIRateLimiter:
    """API请求频率限制器"""
    
    def __init__(self, max_requests_per_minute=10):
        self.max_requests = max_requests_per_minute
        self.requests = []
        self.lock = threading.Lock()
    
    def wait_if_needed(self):
        """如果需要，等待直到可以发送请求"""
        with self.lock:
            now = datetime.now()
            
            # 清理1分钟前的请求记录
            self.requests = [req_time for req_time in self.requests 
                           if now - req_time < timedelta(minutes=1)]
            
            # 如果请求数量达到限制，等待
            if len(self.requests) >= self.max_requests:
                oldest_request = min(self.requests)
                wait_time = 60 - (now - oldest_request).total_seconds()
                
                if wait_time > 0:
                    print(f"[限流器] 🕐 等待 {wait_time:.1f} 秒以避免频率限制...")
                    time.sleep(wait_time)
            
            # 记录当前请求
            self.requests.append(now)

# 全局限制器实例
api_limiter = APIRateLimiter(max_requests_per_minute=8)  # 保守设置为8次/分钟
