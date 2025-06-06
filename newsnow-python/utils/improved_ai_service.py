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
    
    def _generate_cache_key(self, text, template_type, extra_context=None):
        """生成缓存键"""
        # 使用文本的前100个字符和模板类型作为缓存键
        text_key = text[:100].replace(" ", "").lower()
        context_key = hash(extra_context) if extra_context else ""
        return f"analysis_{template_type}_{hash(text_key)}_{context_key}"
    
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
    
    def analyze_market_news(self, text, title=None, searxng_results=None):
        """分析市场新闻，可选择性整合SearxNG搜索结果"""
        def _fetch():
            content = f"标题：{title}\n\n内容：{text}" if title else text
            
            system_prompt = """
            你是一名专业的财经分析师，擅长分析市场新闻并提供深入见解。
            你可能会收到原始新闻内容以及相关的背景信息或搜索引擎结果。
            请综合所有提供的信息，以清晰、专业的语言进行分析，重点关注：
            1. 市场影响：该消息对股市、债市或商品市场的潜在影响
            2. 行业关联：受影响的特定行业或公司
            3. 宏观趋势：与更广泛的经济趋势或政策方向的关联
            4. 投资启示：基于此消息对投资者的建议
            
            你的分析应客观、中立，避免使用夸张词汇，并以数据和事实支持你的观点。
            你需要返回JSON格式的分析结果。
            """
            
            searxng_info = ""
            if searxng_results:
                # 简单地将搜索结果拼接，实际应用中可能需要更复杂的处理，比如取摘要
                searxng_summary = "\n".join([f"- {item.get('title', '')}: {item.get('content', '')[:150]}..." for item in searxng_results[:3]]) # 取前3条结果的部分内容
                searxng_info = f"""

相关背景信息（来自搜索引擎）：
{searxng_summary}
"""

            prompt = f"""
            请对以下财经新闻进行专业分析，并参考提供的相关背景信息：

新闻内容：
{content}
{searxng_info}

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
        
        cache_key = self._generate_cache_key(text, "market_news", extra_context=json.dumps(searxng_results) if searxng_results else None)
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
            
            你的文章应客观、中立，以事实为基础，避免过度臆测。
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

    def analyze_article(self, article_data):
        """
        分析文章内容，生成高质量的增值内容
        这是为了提升AdSense内容质量而设计的核心方法
        
        Args:
            article_data (dict): 包含title, content, summary等字段的文章数据
            
        Returns:
            dict: 包含分析结果的字典
        """
        def _fetch():
            title = article_data.get('title', '')
            content = article_data.get('content', '')
            summary = article_data.get('summary', '')
            source = article_data.get('source', '')
            search_results = article_data.get('search_results', [])
            
            # 构建分析文本
            analysis_text = f"标题：{title}\n"
            if summary:
                analysis_text += f"摘要：{summary}\n"
            if content:
                # 限制内容长度，避免token过多
                content_preview = content[:2000] if len(content) > 2000 else content
                analysis_text += f"内容：{content_preview}\n"
            
            # 添加搜索结果上下文
            if search_results:
                context_info = "\n相关背景信息：\n"
                for i, result in enumerate(search_results[:3]):  # 只取前3个结果
                    context_info += f"- {result.get('title', '')}: {result.get('content', '')[:200]}...\n"
                analysis_text += context_info
            
            system_prompt = """
            你是一名资深财经分析师和内容创作专家，专门为高质量财经媒体撰写深度分析内容。
            你的任务是基于提供的新闻内容，创作原创性、有深度、有价值的分析文章，以满足以下要求：

            1. **原创性分析**：提供独特的观点和深入的解读，而不是简单复述新闻
            2. **专业深度**：从多个角度分析事件的影响和意义
            3. **实用价值**：为读者提供可操作的投资建议或市场洞察
            4. **SEO友好**：使用相关关键词，结构化内容
            5. **可读性强**：语言流畅，逻辑清晰，适合不同层次的读者

            请确保你的分析是基于事实的、客观的、有建设性的。
            """
            
            prompt = f"""
            请对以下财经新闻进行深度分析，创作一篇高质量的原创分析文章：

            {analysis_text}

            请按照以下JSON格式提供完整的分析结果：

            ```json
            {{
              "enhanced_title": "优化后的SEO友好标题",
              "executive_summary": "200字以内的执行摘要，突出核心观点",
              "detailed_analysis": {{
                "market_impact": "对市场的具体影响分析（300-500字）",
                "industry_implications": "对相关行业的影响分析（300-500字）",
                "investment_perspective": "投资角度的深度解读（300-500字）",
                "risk_assessment": "风险评估和注意事项（200-300字）"
              }},
              "key_insights": [
                "核心洞察1：具体的分析要点",
                "核心洞察2：独特的观点",
                "核心洞察3：实用的建议"
              ],
              "related_opportunities": [
                {{
                  "sector": "相关板块/行业",
                  "opportunity": "具体机会描述",
                  "timeline": "时间框架",
                  "risk_level": "风险等级：低/中/高"
                }}
              ],
              "expert_opinion": {{
                "short_term_outlook": "短期展望（1-3个月）",
                "medium_term_outlook": "中期展望（3-12个月）",
                "long_term_outlook": "长期展望（1-3年）",
                "confidence_level": "信心水平：高/中/低"
              }},
              "actionable_advice": [
                "具体可执行的建议1",
                "具体可执行的建议2",
                "具体可执行的建议3"
              ],
              "seo_keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
              "content_quality_score": "内容质量评分（1-10）",
              "originality_percentage": "原创度百分比（估算）",
              "reading_time_minutes": "预估阅读时间（分钟）"
            }}
            ```

            请确保：
            1. 所有分析内容都是原创的，不是简单的新闻复述
            2. 提供具体的数据支持和逻辑推理
            3. 包含实用的投资建议和风险提示
            4. 使用专业但易懂的语言
            5. 确保JSON格式有效且完整
            """
            
            return self._call_deepseek_api(prompt, system_prompt, max_tokens=2000, json_output=True)
        
        # 生成缓存键
        cache_key = self._generate_cache_key(
            article_data.get('title', '') + article_data.get('summary', ''), 
            "article_analysis"
        )
        return self._get_with_cache(cache_key, _fetch)

    def generate_seo_content(self, article_data, target_keywords=None):
        """
        生成SEO优化的内容
        
        Args:
            article_data (dict): 文章数据
            target_keywords (list): 目标关键词列表
            
        Returns:
            dict: SEO优化的内容
        """
        def _fetch():
            title = article_data.get('title', '')
            content = article_data.get('content', '')
            
            keywords_text = ""
            if target_keywords:
                keywords_text = f"\n目标关键词：{', '.join(target_keywords)}"
            
            system_prompt = """
            你是一名SEO专家和内容营销专家，专门为财经网站优化内容以提高搜索引擎排名和用户参与度。
            你需要创建高质量、SEO友好的内容，同时保持专业性和可读性。
            """
            
            prompt = f"""
            请为以下财经内容创建SEO优化版本：

            原标题：{title}
            原内容：{content[:1000]}...{keywords_text}

            请按照以下JSON格式提供SEO优化内容：

            ```json
            {{
              "seo_title": "优化后的标题（包含主要关键词，50-60字符）",
              "meta_description": "页面描述（150-160字符，包含关键词）",
              "h1_heading": "H1标题",
              "h2_headings": ["H2子标题1", "H2子标题2", "H2子标题3"],
              "optimized_content": {{
                "introduction": "引言段落（包含主要关键词）",
                "main_sections": [
                  {{
                    "heading": "章节标题",
                    "content": "章节内容（200-300字）"
                  }}
                ],
                "conclusion": "结论段落"
              }},
              "internal_links": [
                {{
                  "anchor_text": "锚文本",
                  "suggested_url": "建议链接的相关页面类型"
                }}
              ],
              "schema_markup": {{
                "article_type": "NewsArticle/AnalysisArticle",
                "headline": "文章标题",
                "datePublished": "发布日期",
                "author": "作者信息"
              }},
              "suggested_tags": ["标签1", "标签2", "标签3"],
              "readability_score": "可读性评分（1-10）"
            }}
            ```
            """
            
            return self._call_deepseek_api(prompt, system_prompt, max_tokens=1500, json_output=True)
        
        cache_key = self._generate_cache_key(title, "seo_content")
        return self._get_with_cache(cache_key, _fetch)

    def create_content_series(self, topic, article_count=5):
        """
        创建内容系列，提高网站内容深度和用户停留时间
        
        Args:
            topic (str): 主题
            article_count (int): 文章数量
            
        Returns:
            dict: 内容系列规划
        """
        def _fetch():
            system_prompt = """
            你是一名内容策略专家，专门为财经媒体规划深度内容系列。
            你需要创建有逻辑性、有深度、能够吸引读者持续关注的内容系列。
            """
            
            prompt = f"""
            请为主题"{topic}"创建一个包含{article_count}篇文章的内容系列规划：

            ```json
            {{
              "series_title": "系列标题",
              "series_description": "系列描述和价值主张",
              "target_audience": "目标读者群体",
              "articles": [
                {{
                  "order": 1,
                  "title": "文章标题",
                  "focus": "重点内容",
                  "key_points": ["要点1", "要点2", "要点3"],
                  "estimated_length": "预估字数",
                  "seo_keywords": ["关键词1", "关键词2"]
                }}
              ],
              "cross_linking_strategy": "内链策略",
              "engagement_elements": ["互动元素1", "互动元素2"],
              "monetization_potential": "变现潜力评估"
            }}
            ```
            """
            
            return self._call_deepseek_api(prompt, system_prompt, max_tokens=1200, json_output=True)
        
        cache_key = f"content_series_{topic}_{article_count}"
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

    # 测试文章分析
    article_data = {
        "title": "美联储加息对市场的影响",
        "content": "美联储加息对市场的影响包括股市、债市和商品市场等方面。加息会导致利率上升，进而影响投资者对不同资产的配置。"
    }
    print("文章分析结果：")
    print(analyzer.analyze_article(article_data))

    # 测试SEO内容生成
    seo_data = {
        "title": "美联储加息对市场的影响",
        "content": "美联储加息对市场的影响包括股市、债市和商品市场等方面。加息会导致利率上升，进而影响投资者对不同资产的配置。"
    }
    print("SEO内容生成结果：")
    print(analyzer.generate_seo_content(seo_data))

    # 测试内容系列创建
    series_topic = "美联储加息系列"
    print("内容系列创建结果：")
    print(analyzer.create_content_series(series_topic))
