#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增强版AI分析服务 - 专为AdSense审查优化
提供高质量的原创财经分析内容
"""

import os
import json
import time
import requests
from datetime import datetime
import hashlib
import logging

logger = logging.getLogger(__name__)

class EnhancedFinanceAnalyzer:
    """增强版财经分析器 - 专为内容质量优化"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY")
        self.api_url = "https://api.deepseek.com/v1/chat/completions"
        self.cache = {}
        self.cache_ttl = 1800  # 30分钟缓存
        self.last_request_time = 0
        self.min_request_interval = 8  # 最小请求间隔（秒）
    
    def _wait_if_needed(self):
        """简单的请求频率控制"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_request_interval:
            wait_time = self.min_request_interval - time_since_last
            logger.info(f"[AI] 🕐 等待 {wait_time:.1f} 秒以避免频率限制...")
            time.sleep(wait_time)
        
        self.last_request_time = time.time()
    
    def _call_api_with_retry(self, prompt, system_prompt=None, max_retries=5):
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
                    logger.info(f"[AI] 等待 {delay} 秒后重试 (尝试 {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                
                # 使用简单的请求限制器
                self._wait_if_needed()
                
                response = requests.post(
                    self.api_url, 
                    headers=headers, 
                    json=payload, 
                    timeout=60  # 增加超时时间
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    logger.info(f"[AI] ✅ API调用成功 (尝试 {attempt + 1}/{max_retries})")
                    return {"success": True, "content": content}
                    
                elif response.status_code == 401:
                    error_msg = response.text
                    logger.error(f"[AI] ❌ API认证失败: {error_msg}")
                    
                    # 检查是否是多次401错误导致的临时锁定
                    if "Multiple 401 errors detected" in error_msg:
                        if attempt < max_retries - 1:
                            wait_time = 70  # 等待70秒，比要求的60秒多一点
                            logger.warning(f"[AI] 🕐 检测到认证锁定，等待 {wait_time} 秒...")
                            time.sleep(wait_time)
                            continue
                    
                    return {"success": False, "error": f"API认证失败: {error_msg}"}
                    
                elif response.status_code == 429:
                    error_msg = response.text
                    logger.warning(f"[AI] ⚠️ API请求频率过高 (尝试 {attempt + 1}/{max_retries}): {error_msg}")
                    
                    if attempt < max_retries - 1:
                        # 对于429错误，使用更长的等待时间
                        wait_time = 60 + (attempt * 30)  # 60, 90, 120, 150秒
                        logger.info(f"[AI] 🕐 等待 {wait_time} 秒后重试...")
                        time.sleep(wait_time)
                        continue
                    else:
                        return {"success": False, "error": f"API请求频率限制: {error_msg}"}
                        
                else:
                    logger.warning(f"[AI] ⚠️ API调用失败 (尝试 {attempt + 1}/{max_retries}): {response.status_code}")
                    if attempt == max_retries - 1:
                        return {"success": False, "error": f"API调用失败: {response.status_code} - {response.text}"}
                    
                    # 对于其他错误，使用较短的等待时间
                    time.sleep(base_delay * (attempt + 1))
                    
            except requests.exceptions.Timeout:
                logger.warning(f"[AI] ⏰ API请求超时 (尝试 {attempt + 1}/{max_retries})")
                if attempt == max_retries - 1:
                    return {"success": False, "error": "API请求超时"}
                time.sleep(base_delay * (attempt + 1))
                
            except Exception as e:
                logger.error(f"[AI] ❌ API调用异常 (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    return {"success": False, "error": f"API调用异常: {str(e)}"}
                time.sleep(base_delay * (attempt + 1))
        
        return {"success": False, "error": "所有重试都失败了"}
    
    def generate_comprehensive_analysis(self, title, content, search_results=None):
        """生成全面的财经分析 - AdSense友好"""
        
        # 生成缓存键
        cache_key = hashlib.md5(f"{title}_{content[:100]}".encode()).hexdigest()
        current_time = time.time()
        
        # 检查缓存
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if current_time - cached_time < self.cache_ttl:
                logger.info("[AI] 使用缓存的分析结果")
                return cached_data
        
        system_prompt = """你是一位资深的财经分析师和内容创作专家，专门为新闻网站创作高质量的原创分析内容。

你的任务是基于提供的新闻内容，创作一篇深度分析文章，要求：

1. 内容原创性：完全原创，不得抄袭或简单改写
2. 专业深度：提供专业的财经分析和见解
3. 结构清晰：包含多个分析维度
4. 价值导向：为读者提供实用的投资参考
5. SEO友好：包含相关关键词和标签

请确保内容符合以下标准：
- 字数充足（500-800字）
- 观点独特且有价值
- 数据支撑的分析
- 风险提示和免责声明
- 适合搜索引擎收录"""

        # 构建搜索结果上下文
        search_context = ""
        if search_results and len(search_results) > 0:
            search_context = "\n\n相关市场信息：\n"
            for i, result in enumerate(search_results[:3], 1):
                search_context += f"{i}. {result.get('title', '')}: {result.get('content', '')[:100]}...\n"

        prompt = f"""请基于以下新闻内容创作一篇专业的财经分析文章：

标题：{title}

新闻内容：
{content}
{search_context}

请按照以下JSON格式返回分析结果：

```json
{{
  "analysis_title": "分析文章标题（与原标题不同的原创标题）",
  "executive_summary": "执行摘要（100-150字）",
  "market_analysis": {{
    "immediate_impact": "即时市场影响分析（150-200字）",
    "long_term_implications": "长期影响分析（150-200字）",
    "affected_sectors": [
      {{
        "sector": "受影响行业",
        "impact_level": "高/中/低",
        "key_companies": ["公司1", "公司2"],
        "analysis": "具体影响分析"
      }}
    ]
  }},
  "investment_perspective": {{
    "opportunities": "投资机会分析（100-150字）",
    "risks": "风险提示（100-150字）",
    "strategy_suggestions": "策略建议（100-150字）"
  }},
  "technical_analysis": {{
    "key_indicators": "关键技术指标分析",
    "price_targets": "价格目标预测",
    "support_resistance": "支撑阻力位分析"
  }},
  "conclusion": "结论和展望（100-150字）",
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
  "seo_keywords": ["关键词1", "关键词2", "关键词3"],
  "risk_disclaimer": "投资风险提示和免责声明",
  "content_quality_score": 95,
  "originality_score": 98
}}
```

请确保返回的内容完全原创，具有独特的分析视角和价值。"""

        # 调用API
        result = self._call_api_with_retry(prompt, system_prompt)
        
        if not result["success"]:
            logger.error(f"[AI] 分析失败: {result['error']}")
            return self._generate_fallback_analysis(title, content)
        
        # 解析JSON响应
        try:
            content_text = result["content"]
            logger.info(f"[AI] 收到API响应，长度: {len(content_text)} 字符")
            
            # 多种方式提取JSON部分
            import re
            analysis_data = None
            
            # 方式1: 标准的 ```json``` 格式
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content_text)
            if json_match:
                json_content = json_match.group(1).strip()
                logger.info("[AI] 找到标准JSON格式")
                try:
                    analysis_data = json.loads(json_content)
                except json.JSONDecodeError as e:
                    logger.warning(f"[AI] 标准JSON解析失败: {e}")
            
            # 方式2: 尝试找到任何 { } 包围的JSON
            if not analysis_data:
                json_match = re.search(r'\{[\s\S]*\}', content_text)
                if json_match:
                    json_content = json_match.group(0).strip()
                    logger.info("[AI] 找到大括号JSON格式")
                    try:
                        analysis_data = json.loads(json_content)
                    except json.JSONDecodeError as e:
                        logger.warning(f"[AI] 大括号JSON解析失败: {e}")
            
            # 方式3: 尝试直接解析整个响应
            if not analysis_data:
                logger.info("[AI] 尝试直接解析整个响应")
                try:
                    analysis_data = json.loads(content_text.strip())
                except json.JSONDecodeError as e:
                    logger.warning(f"[AI] 直接解析失败: {e}")
            
            if analysis_data:
                # 添加元数据
                analysis_data["generated_at"] = datetime.now().isoformat()
                analysis_data["ai_model"] = "deepseek-chat"
                analysis_data["analysis_version"] = "2.0"
                
                # 缓存结果
                self.cache[cache_key] = (analysis_data, current_time)
                
                logger.info("[AI] ✅ 成功生成AI分析内容")
                return analysis_data
            else:
                logger.warning("[AI] ⚠️ 所有JSON解析方式都失败，使用备用方案")
                # 记录前200个字符用于调试
                logger.debug(f"[AI] 响应内容前200字符: {content_text[:200]}...")
                return self._generate_fallback_analysis(title, content)
                
        except Exception as e:
            logger.error(f"[AI] JSON解析异常: {e}")
            return self._generate_fallback_analysis(title, content)
    
    def _generate_fallback_analysis(self, title, content):
        """生成备用分析内容"""
        return {
            "analysis_title": f"深度解读：{title}",
            "executive_summary": f"本文深入分析了{title}的市场影响和投资含义，为投资者提供专业的决策参考。",
            "market_analysis": {
                "immediate_impact": "该消息对市场产生了即时影响，投资者需要密切关注相关板块的表现。",
                "long_term_implications": "从长期来看，这一事件可能会改变行业格局，影响相关公司的基本面。",
                "affected_sectors": [
                    {
                        "sector": "相关行业",
                        "impact_level": "中",
                        "key_companies": ["待分析"],
                        "analysis": "需要进一步观察市场反应"
                    }
                ]
            },
            "investment_perspective": {
                "opportunities": "市场波动中往往蕴含投资机会，建议关注基本面良好的优质标的。",
                "risks": "投资者应注意市场风险，做好风险管理和资产配置。",
                "strategy_suggestions": "建议采用分散投资策略，关注长期价值投资机会。"
            },
            "technical_analysis": {
                "key_indicators": "关注成交量和价格走势的配合情况",
                "price_targets": "根据技术分析确定合理的价格目标",
                "support_resistance": "识别关键的支撑和阻力位"
            },
            "conclusion": "综合分析显示，投资者应保持理性，基于基本面分析做出投资决策。",
            "tags": ["财经分析", "市场解读", "投资策略", "风险管理", "价值投资"],
            "seo_keywords": ["财经", "投资", "市场分析"],
            "risk_disclaimer": "本分析仅供参考，不构成投资建议。投资有风险，入市需谨慎。",
            "content_quality_score": 85,
            "originality_score": 90,
            "generated_at": datetime.now().isoformat(),
            "ai_model": "fallback",
            "analysis_version": "2.0"
        }
    
    def analyze_market_news(self, text, title=None, searxng_results=None):
        """兼容旧接口的市场新闻分析"""
        return self.generate_comprehensive_analysis(title or "市场新闻", text, searxng_results)
    
    def analyze_article(self, article_data):
        """兼容旧接口的文章分析方法"""
        title = article_data.get('title', '')
        content = article_data.get('content', '')
        search_results = article_data.get('search_results', [])
        
        return self.generate_comprehensive_analysis(
            title=title,
            content=content,
            search_results=search_results
        )
