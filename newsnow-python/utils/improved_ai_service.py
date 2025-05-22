#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
改进版AI内容分析服务 - 使用DeepSeek API进行高质量财经分析
"""

import os
import json
import time
import requests
from datetime import datetime

class FinanceAnalyzer:
    """财经内容分析器"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY")
        self.api_url = "https://api.deepseek.com/v1/chat/completions"
        # 添加缓存
        self._cache = {}
        self._cache_time = {}
        self._cache_ttl = 3600  # 缓存1小时
    
    def _get_with_cache(self, cache_key, fetch_func):
        """带缓存的获取数据"""
        current_time = time.time()
        if cache_key in self._cache and current_time - self._cache_time.get(cache_key, 0) < self._cache_ttl:
            return self._cache[cache_key]
        
        data = fetch_func()
        if data:
            self._cache[cache_key] = data
            self._cache_time[cache_key] = current_time
        return data
    
    def _generate_cache_key(self, text, template_type):
        """生成缓存键"""
        # 使用文本的前100个字符和模板类型作为缓存键
        text_key = text[:100].replace(" ", "").lower()
        return f"analysis_{template_type}_{hash(text_key)}"
    
    def _call_deepseek_api(self, prompt, system_prompt=None, model="deepseek-chat", max_tokens=800, json_output=False):
        """调用DeepSeek API"""
        if not self.api_key:
            return {"error": "未提供DeepSeek API密钥"} if json_output else "错误: 未提供DeepSeek API密钥"
        
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            messages = []
            if system_prompt:
                messages.append({
                    "role": "system",
                    "content": system_prompt
                })
            
            messages.append({
                "role": "user",
                "content": prompt
            })
            
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # 如果需要JSON输出，尝试解析内容
            if json_output:
                try:
                    # 首先尝试直接解析整个内容为JSON
                    import json
                    try:
                        return json.loads(content)
                    except:
                        # 如果直接解析失败，尝试查找内容中的JSON部分
                        json_pattern = r'```json\s*([\s\S]*?)\s*```'
                        import re
                        json_match = re.search(json_pattern, content)
                        if json_match:
                            json_content = json_match.group(1).strip()
                            return json.loads(json_content)
                        else:
                            # 如果找不到JSON块，返回格式化的结果
                            return {"raw_content": content, "error": "无法解析为JSON格式"}
                except Exception as e:
                    return {"raw_content": content, "error": f"JSON解析错误: {str(e)}"}
            
            return content
        except Exception as e:
            error_msg = f"API调用错误: {str(e)}"
            return {"error": error_msg} if json_output else error_msg
    
    def analyze_market_news(self, text, title=None):
        """分析市场新闻"""
        def _fetch():
            content = f"标题：{title}\n\n内容：{text}" if title else text
            
            system_prompt = """
            你是一名专业的财经分析师，擅长分析市场新闻并提供深入见解。
            请以清晰、专业的语言分析提供的财经内容，重点关注：
            1. 市场影响：该消息对股市、债市或商品市场的潜在影响
            2. 行业关联：受影响的特定行业或公司
            3. 宏观趋势：与更广泛的经济趋势或政策方向的关联
            4. 投资启示：基于此消息对投资者的建议
            
            你的分析应客观、中立，避免使用夸张词汇，并以数据和事实支持你的观点。
            你需要返回JSON格式的分析结果。
            """
            
            prompt = f"""
            请对以下财经新闻进行专业分析：
            
            {content}
            
            请按照以下JSON格式提供分析结果，确保返回有效的JSON结构：
            
            ```json
            {{
              "market_summary": "100字以内简明扼要的摘要",
              "impact_analysis": "200-300字深入分析",
              "affected_industries": [
                {{
                  "industry": "受影响的行业名称",
                  "companies": ["相关公司1", "相关公司2"],
                  "impact_level": "高/中/低"
                }}
              ],
              "investment_advice": "基于消息的客观投资建议",
              "sentiment": "积极/中性/消极"
            }}
            ```
            
            请务必按照以上JSON格式返回，不要添加其他内容，确保JSON格式有效。
            """
            
            return self._call_deepseek_api(prompt, system_prompt, json_output=True)
        
        cache_key = self._generate_cache_key(text, "market_news")
        return self._get_with_cache(cache_key, _fetch)
    
    def analyze_economic_data(self, data_text, data_type=None):
        """分析经济数据"""
        def _fetch():
            system_prompt = """
            你是一名专业的经济数据分析师，擅长解读经济指标并预测趋势。
            请以清晰、专业的语言分析提供的经济数据，包括：
            1. 数据解读：关键数据点的含义和重要性
            2. 历史对比：与历史数据的比较及趋势
            3. 预测分析：基于数据可能的未来走势
            4. 政策含义：对央行或政府政策的潜在影响
            
            你的分析应客观、中立，避免使用夸张词汇，并以数据和事实支持你的观点。
            你需要返回JSON格式的分析结果。
            """
            
            data_type_str = f"（数据类型：{data_type}）" if data_type else ""
            
            prompt = f"""
            请对以下经济数据{data_type_str}进行专业分析：
            
            {data_text}
            
            请按照以下JSON格式提供分析结果，确保返回有效的JSON结构：
            
            ```json
            {{
              "data_summary": "100字以内的数据解读摘要",
              "trend_analysis": "包括历史对比和趋势预测",
              "economic_impact": "对宏观经济的影响分析",
              "policy_implications": "可能的政策响应或调整",
              "key_indicators": [
                {{
                  "indicator_name": "指标名称",
                  "current_value": "当前值",
                  "previous_value": "前值",
                  "change": "变化比例",
                  "significance": "高/中/低"
                }}
              ],
              "overall_sentiment": "积极/中性/消极"
            }}
            ```
            
            请务必按照以上JSON格式返回，不要添加其他内容，确保JSON格式有效。
            """
            
            return self._call_deepseek_api(prompt, system_prompt, json_output=True)
        
        cache_key = self._generate_cache_key(data_text, "economic_data")
        return self._get_with_cache(cache_key, _fetch)
    
    def analyze_company_report(self, report_text, company_name=None):
        """分析公司财报"""
        def _fetch():
            company_info = f"（公司名称：{company_name}）" if company_name else ""
            
            system_prompt = """
            你是一名专业的财务分析师，擅长解读公司财报并评估公司财务健康度。
            请以清晰、专业的语言分析提供的财报内容，包括：
            1. 业绩概览：关键财务指标及其同比、环比变化
            2. 盈利能力：毛利率、净利率等指标分析
            3. 增长动力：收入增长的主要来源和可持续性
            4. 风险因素：财务报表中的潜在风险信号
            5. 估值分析：基于财报数据的合理估值区间
            
            你的分析应客观、中立，避免使用夸张词汇，并以数据和事实支持你的观点。
            你需要返回JSON格式的分析结果。
            """
            
            prompt = f"""
            请对以下公司财报内容{company_info}进行专业分析：
            
            {report_text}
            
            请按照以下JSON格式提供分析结果，确保返回有效的JSON结构：
            
            ```json
            {{
              "company_name": "{company_name if company_name else '未提供公司名称'}",
              "performance_summary": "100字以内的业绩摘要",
              "financial_analysis": {{
                "revenue": {{
                  "value": "收入数值",
                  "yoy_change": "同比变化",
                  "analysis": "简要分析"
                }},
                "profit": {{
                  "value": "利润数值",
                  "yoy_change": "同比变化",
                  "analysis": "简要分析"
                }},
                "margins": {{
                  "gross_margin": "毛利率",
                  "net_margin": "净利率",
                  "analysis": "简要分析"
                }}
              }},
              "growth_assessment": "对公司增长来源及可持续性的评估",
              "risk_factors": ["风险因1", "风险因2"],
              "investment_advice": "基于财报的投资建议",
              "valuation": {{
                "current_pe": "当前PE值",
                "industry_avg_pe": "行业平均PE",
                "target_price_range": "目标价格区间"
              }},
              "overall_rating": "强烈推荐/推荐/中性/谨慎/不推荐"
            }}
            ```
            
            请务必按照以上JSON格式返回，不要添加其他内容，确保JSON格式有效。
            """
            
            return self._call_deepseek_api(prompt, system_prompt, json_output=True)
        
        cache_key = self._generate_cache_key(report_text, "company_report")
        return self._get_with_cache(cache_key, _fetch)
    
    def generate_market_summary(self, news_list, market_type="股市"):
        """生成市场综述"""
        def _fetch():
            if not news_list:
                return {"error": "无足够信息生成市场综述"}
            
            # 将新闻列表整合为文本
            news_text = "\n\n".join([
                f"- {news.get('title', '')}" + 
                (f" ({news.get('pubDate', '')})" if news.get('pubDate') else "")
                for news in news_list
            ])
            
            system_prompt = """
            你是一名资深财经编辑，负责撰写每日市场综述。
            请根据提供的财经新闻列表，生成一篇简洁、专业的市场综述，包括：
            1. 市场概览：主要指数表现和关键事件
            2. 热点分析：当日市场热点和资金流向
            3. 国际联动：国际市场的影响和关联
            4. 明日展望：对次日市场的合理预期
            
            你的文章应客观、中立，以事实为基础，避免过度臭测。
            你需要返回JSON格式的分析结果。
            """
            
            prompt = f"""
            请根据以下财经新闻，撰写一篇关于{market_type}的市场综述：
            
            {news_text}
            
            请按照以下JSON格式提供市场综述，确保返回有效的JSON结构：
            
            ```json
            {{
              "market_type": "{market_type}",
              "summary_date": "分析日期",
              "market_overview": "市场总体表现概述",
              "industry_highlights": [
                {{
                  "industry": "行业名称",
                  "performance": "表现描述",
                  "key_stocks": ["典型股种1", "典型股种2"]
                }}
              ],
              "key_events": [
                {{
                  "title": "事件标题",
                  "description": "事件描述",
                  "impact": "影响分析"
                }}
              ],
              "outlook": {{
                "short_term": "短期展望",
                "factors_to_watch": ["需关注因素1", "需关注因素2"]
              }},
              "overall_sentiment": "看多/中性/看空"
            }}
            ```
            
            请务必按照以上JSON格式返回，不要添加其他内容，确保JSON格式有效。
            """
            
            return self._call_deepseek_api(prompt, system_prompt, max_tokens=1000, json_output=True)
        
        # 生成一个唯一的缓存键
        news_ids = "_".join([str(news.get("id", hash(news.get("title", "")))) for news in news_list[:3]])
        cache_key = f"market_summary_{market_type}_{news_ids}"
        
        return self._get_with_cache(cache_key, _fetch)

# 测试代码
if __name__ == "__main__":
    analyzer = FinanceAnalyzer()
    
    # 测试市场新闻分析
    test_news = "美联储主席鲍威尔表示，通胀压力持续，可能需要维持更长时间的高利率。市场对此反应强烈，道琼斯指数下跌0.8%，纳斯达克指数下跌1.2%。"
    print("市场新闻分析结果：")
    print(analyzer.analyze_market_news(test_news, "鲍威尔暗示可能继续维持高利率"))
    print("\n" + "="*50 + "\n")
    
    # 测试经济数据分析
    test_data = "美国4月CPI同比上涨3.4%，环比上涨0.3%，核心CPI同比上涨3.6%，环比上涨0.3%，均高于市场预期。"
    print("经济数据分析结果：")
    print(analyzer.analyze_economic_data(test_data, "通胀数据"))
