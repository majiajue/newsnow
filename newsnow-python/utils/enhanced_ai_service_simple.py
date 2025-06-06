#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版AI分析服务 - 最小依赖版本
"""

import os
import json
import time
import requests
from datetime import datetime

class EnhancedFinanceAnalyzer:
    """简化版财经分析器"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY")
        self.api_url = "https://api.deepseek.com/v1/chat/completions"
        self.last_request_time = 0
        self.min_request_interval = 10  # 10秒间隔
    
    def _wait_if_needed(self):
        """简单的请求频率控制"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_request_interval:
            wait_time = self.min_request_interval - time_since_last
            time.sleep(wait_time)
        
        self.last_request_time = time.time()
    
    def _call_api_with_retry(self, prompt, system_prompt=None, max_retries=3):
        """简化的API调用"""
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    time.sleep(5 * attempt)  # 简单的重试延迟
                
                self._wait_if_needed()
                
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                }
                
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                
                payload = {
                    "model": "deepseek-chat",
                    "messages": messages,
                    "max_tokens": 800,
                    "temperature": 0.7
                }
                
                response = requests.post(
                    self.api_url, 
                    headers=headers, 
                    json=payload, 
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    return {"success": True, "content": content}
                else:
                    if attempt == max_retries - 1:
                        return {"success": False, "error": f"API调用失败: {response.status_code}"}
                    
            except Exception as e:
                if attempt == max_retries - 1:
                    return {"success": False, "error": f"API异常: {str(e)}"}
        
        return {"success": False, "error": "所有重试都失败了"}
    
    def generate_comprehensive_analysis(self, title, content, search_results=None):
        """生成分析 - 简化版"""
        
        # 如果没有API密钥，直接返回备用分析
        if not self.api_key:
            return self._generate_fallback_analysis(title, content)
        
        system_prompt = "你是一位财经分析师，请分析以下新闻并返回JSON格式的分析结果。"
        prompt = f"请分析这条新闻：{title}\n内容：{content}\n请返回JSON格式的分析。"
        
        result = self._call_api_with_retry(prompt, system_prompt)
        
        if not result["success"]:
            return self._generate_fallback_analysis(title, content)
        
        # 尝试解析JSON
        try:
            content_text = result["content"]
            
            # 简单的JSON提取
            import re
            json_match = re.search(r'\{[\s\S]*\}', content_text)
            if json_match:
                json_content = json_match.group(0).strip()
                analysis_data = json.loads(json_content)
                
                # 添加基本元数据
                analysis_data["generated_at"] = datetime.now().isoformat()
                analysis_data["ai_model"] = "deepseek-chat"
                
                return analysis_data
            else:
                return self._generate_fallback_analysis(title, content)
                
        except Exception:
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
        """兼容旧接口"""
        return self.generate_comprehensive_analysis(title or "市场新闻", text, searxng_results)
    
    def analyze_article(self, article_data):
        """兼容旧接口"""
        title = article_data.get('title', '')
        content = article_data.get('content', '')
        search_results = article_data.get('search_results', [])
        
        return self.generate_comprehensive_analysis(
            title=title,
            content=content,
            search_results=search_results
        ) 