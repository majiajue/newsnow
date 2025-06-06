#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复DeepSeek API限流问题
解决429错误和401认证错误
"""

import os
import sys
import time
import json
import requests
from datetime import datetime, timedelta

def test_api_status():
    """测试API状态和配额"""
    print("🔍 检查DeepSeek API状态...")
    
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        print("❌ 未找到DEEPSEEK_API_KEY环境变量")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # 测试简单请求
        response = requests.get(
            "https://api.deepseek.com/v1/models",
            headers=headers,
            timeout=10
        )
        
        print(f"📡 API状态码: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ API连接正常")
            return True
        elif response.status_code == 401:
            print("❌ API密钥认证失败")
            print("💡 建议: 检查API密钥是否正确或已过期")
            return False
        elif response.status_code == 429:
            print("⚠️ API请求频率过高")
            print("💡 建议: 等待1-2分钟后重试")
            return False
        else:
            print(f"⚠️ API返回异常状态: {response.status_code}")
            print(f"响应内容: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API测试异常: {e}")
        return False

def update_enhanced_ai_service():
    """更新增强版AI服务，添加更好的限流处理"""
    print("\n🔧 更新AI服务限流处理...")
    
    service_file = "newsnow-python/utils/enhanced_ai_service.py"
    
    try:
        with open(service_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 查找并替换_call_api_with_retry方法
        new_method = '''    def _call_api_with_retry(self, prompt, system_prompt=None, max_retries=5):
        """带智能重试机制的API调用 - 优化限流处理"""
        base_delay = 2  # 基础延迟时间（秒）
        
        for attempt in range(max_retries):
            try:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                    "User-Agent": "NewsNow-AI-Analyzer/1.0"
                }
                
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                
                payload = {
                    "model": "deepseek-chat",
                    "messages": messages,
                    "max_tokens": 1200,
                    "temperature": 0.7,
                    "top_p": 0.9
                }
                
                # 在请求前添加延迟，避免频率过高
                if attempt > 0:
                    delay = base_delay * (2 ** (attempt - 1))  # 指数退避
                    print(f"[AI] 等待 {delay} 秒后重试 (尝试 {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                
                response = requests.post(
                    self.api_url, 
                    headers=headers, 
                    json=payload, 
                    timeout=60  # 增加超时时间
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    print(f"[AI] ✅ API调用成功 (尝试 {attempt + 1}/{max_retries})")
                    return {"success": True, "content": content}
                    
                elif response.status_code == 401:
                    error_msg = response.text
                    print(f"[AI] ❌ API认证失败: {error_msg}")
                    
                    # 检查是否是多次401错误导致的临时锁定
                    if "Multiple 401 errors detected" in error_msg:
                        if attempt < max_retries - 1:
                            wait_time = 70  # 等待70秒，比要求的60秒多一点
                            print(f"[AI] 🕐 检测到认证锁定，等待 {wait_time} 秒...")
                            time.sleep(wait_time)
                            continue
                    
                    return {"success": False, "error": f"API认证失败: {error_msg}"}
                    
                elif response.status_code == 429:
                    error_msg = response.text
                    print(f"[AI] ⚠️ API请求频率过高 (尝试 {attempt + 1}/{max_retries}): {error_msg}")
                    
                    if attempt < max_retries - 1:
                        # 对于429错误，使用更长的等待时间
                        wait_time = 60 + (attempt * 30)  # 60, 90, 120, 150秒
                        print(f"[AI] 🕐 等待 {wait_time} 秒后重试...")
                        time.sleep(wait_time)
                        continue
                    else:
                        return {"success": False, "error": f"API请求频率限制: {error_msg}"}
                        
                else:
                    print(f"[AI] ⚠️ API调用失败 (尝试 {attempt + 1}/{max_retries}): {response.status_code}")
                    if attempt == max_retries - 1:
                        return {"success": False, "error": f"API调用失败: {response.status_code} - {response.text}"}
                    
                    # 对于其他错误，使用较短的等待时间
                    time.sleep(base_delay * (attempt + 1))
                    
            except requests.exceptions.Timeout:
                print(f"[AI] ⏰ API请求超时 (尝试 {attempt + 1}/{max_retries})")
                if attempt == max_retries - 1:
                    return {"success": False, "error": "API请求超时"}
                time.sleep(base_delay * (attempt + 1))
                
            except Exception as e:
                print(f"[AI] ❌ API调用异常 (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    return {"success": False, "error": f"API调用异常: {str(e)}"}
                time.sleep(base_delay * (attempt + 1))
        
        return {"success": False, "error": "所有重试都失败了"}'''
        
        # 替换原有方法
        import re
        pattern = r'def _call_api_with_retry\(self, prompt, system_prompt=None, max_retries=3\):.*?return \{"success": False, "error": "所有重试都失败了"\}'
        
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, new_method.strip(), content, flags=re.DOTALL)
            
            with open(service_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ 已更新API重试机制: {service_file}")
        else:
            print(f"⚠️ 未找到目标方法，请手动更新: {service_file}")
            
    except Exception as e:
        print(f"❌ 更新AI服务失败: {e}")

def add_request_limiter():
    """添加全局请求限制器"""
    print("\n🚦 创建API请求限制器...")
    
    limiter_code = '''#!/usr/bin/env python3
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
'''
    
    limiter_file = "newsnow-python/utils/api_rate_limiter.py"
    with open(limiter_file, 'w', encoding='utf-8') as f:
        f.write(limiter_code)
    
    print(f"✅ 已创建请求限制器: {limiter_file}")

def update_ai_service_with_limiter():
    """更新AI服务以使用请求限制器"""
    print("\n🔗 集成请求限制器到AI服务...")
    
    service_file = "newsnow-python/utils/enhanced_ai_service.py"
    
    try:
        with open(service_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 添加导入
        if "from utils.api_rate_limiter import api_limiter" not in content:
            import_line = "from utils.api_rate_limiter import api_limiter"
            content = content.replace(
                "import hashlib",
                f"import hashlib\n{import_line}"
            )
        
        # 在API调用前添加限流检查
        if "api_limiter.wait_if_needed()" not in content:
            content = content.replace(
                "response = requests.post(",
                "# 使用请求限制器\n                api_limiter.wait_if_needed()\n                \n                response = requests.post("
            )
        
        with open(service_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ 已集成请求限制器到AI服务")
        
    except Exception as e:
        print(f"❌ 集成请求限制器失败: {e}")

def create_batch_processor():
    """创建批量处理器，处理未分析的文章"""
    print("\n📦 创建批量AI分析处理器...")
    
    processor_code = '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量AI分析处理器
处理数据库中未分析的文章
"""

import os
import sys
import time
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.enhanced_ai_service import EnhancedFinanceAnalyzer
from db.sqlite_client import SQLiteClient

class BatchAIProcessor:
    """批量AI分析处理器"""
    
    def __init__(self):
        self.analyzer = EnhancedFinanceAnalyzer()
        self.db_client = SQLiteClient()
    
    def process_unanalyzed_articles(self, batch_size=5, delay_between_batches=120):
        """
        批量处理未分析的文章
        
        Args:
            batch_size (int): 每批处理的文章数量
            delay_between_batches (int): 批次间延迟时间（秒）
        """
        print(f"🚀 开始批量AI分析处理...")
        print(f"📊 批次大小: {batch_size}, 批次间延迟: {delay_between_batches}秒")
        
        try:
            # 获取未分析的文章
            unanalyzed_articles = self.db_client.get_unprocessed_articles(limit=100)
            
            if not unanalyzed_articles:
                print("✅ 没有需要分析的文章")
                return
            
            print(f"📝 找到 {len(unanalyzed_articles)} 篇未分析的文章")
            
            # 分批处理
            total_processed = 0
            total_success = 0
            
            for i in range(0, len(unanalyzed_articles), batch_size):
                batch = unanalyzed_articles[i:i + batch_size]
                batch_num = (i // batch_size) + 1
                
                print(f"\\n📦 处理第 {batch_num} 批 ({len(batch)} 篇文章)...")
                
                batch_success = 0
                for article in batch:
                    try:
                        article_id = article.get('id')
                        title = article.get('title', '')
                        content = article.get('content', '')
                        
                        print(f"🔍 分析文章: {title[:50]}...")
                        
                        # 执行AI分析
                        analysis_result = self.analyzer.generate_comprehensive_analysis(
                            title=title,
                            content=content,
                            search_results=[]
                        )
                        
                        if analysis_result:
                            # 更新数据库
                            success = self.db_client.update_article_analysis(article_id, analysis_result)
                            if success:
                                print(f"✅ 分析完成: {title[:30]}...")
                                batch_success += 1
                                total_success += 1
                            else:
                                print(f"❌ 保存失败: {title[:30]}...")
                        else:
                            print(f"⚠️ 分析失败: {title[:30]}...")
                        
                        total_processed += 1
                        
                        # 文章间短暂延迟
                        time.sleep(5)
                        
                    except Exception as e:
                        print(f"❌ 处理文章异常: {e}")
                        continue
                
                print(f"📊 第 {batch_num} 批完成: {batch_success}/{len(batch)} 成功")
                
                # 批次间延迟（除了最后一批）
                if i + batch_size < len(unanalyzed_articles):
                    print(f"⏰ 等待 {delay_between_batches} 秒后处理下一批...")
                    time.sleep(delay_between_batches)
            
            print(f"\\n🎉 批量处理完成!")
            print(f"📊 总计处理: {total_processed} 篇")
            print(f"✅ 成功分析: {total_success} 篇")
            print(f"📈 成功率: {(total_success/total_processed*100):.1f}%")
            
        except Exception as e:
            print(f"❌ 批量处理异常: {e}")

def main():
    """主函数"""
    processor = BatchAIProcessor()
    processor.process_unanalyzed_articles(
        batch_size=3,  # 每批3篇文章
        delay_between_batches=90  # 批次间等待90秒
    )

if __name__ == "__main__":
    # 手动加载环境变量
    env_file = ".env"
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    
    main()
'''
    
    processor_file = "newsnow-python/batch_ai_processor.py"
    with open(processor_file, 'w', encoding='utf-8') as f:
        f.write(processor_code)
    
    print(f"✅ 已创建批量处理器: {processor_file}")

def main():
    """主函数"""
    print("🔧 修复DeepSeek API限流问题...")
    print("=" * 60)
    
    # 手动加载环境变量
    env_file = "newsnow-python/.env"
    if os.path.exists(env_file):
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip()
            print("✅ 已加载环境变量")
        except Exception as e:
            print(f"⚠️ 加载环境变量失败: {e}")
    
    # 1. 测试API状态
    api_ok = test_api_status()
    
    # 2. 更新AI服务的重试机制
    update_enhanced_ai_service()
    
    # 3. 添加请求限制器
    add_request_limiter()
    
    # 4. 集成请求限制器
    update_ai_service_with_limiter()
    
    # 5. 创建批量处理器
    create_batch_processor()
    
    print("\n" + "=" * 60)
    print("🎉 API限流修复完成！")
    
    if api_ok:
        print("\n✅ API连接正常")
        print("💡 建议:")
        print("1. 重新测试爬虫: python3 test_all_crawlers.py")
        print("2. 运行批量处理: cd newsnow-python && python3 batch_ai_processor.py")
    else:
        print("\n⚠️ API连接有问题")
        print("💡 建议:")
        print("1. 等待1-2分钟后重试")
        print("2. 检查API密钥和账户状态")
        print("3. 使用批量处理器处理积压文章")
        print("4. 运行: cd newsnow-python && python3 batch_ai_processor.py")

if __name__ == "__main__":
    main() 