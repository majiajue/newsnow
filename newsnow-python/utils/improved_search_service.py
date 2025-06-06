#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
改进版搜索服务 - 增强SearXNG的财经搜索能力
"""

import os
import re
import json
import time
import requests
from urllib.parse import quote_plus
from datetime import datetime, timedelta

class FinanceSearchService:
    """财经搜索服务"""
    
    def __init__(self, searxng_url=None):
        self.searxng_url = searxng_url or os.environ.get("SEARXNG_URL", "http://searxng:8080/search")
        self.timeout = 15
        # 搜索结果缓存
        self._cache = {}
        self._cache_time = {}
        self._cache_ttl = 1800  # 默认缓存30分钟
        # 相关词权重
        self.finance_keywords = {
            "高级": ["股市", "证券", "股票", "基金", "债券", "期货", "外汇", "汇率", "央行", "货币政策", 
                  "加息", "降息", "通胀", "GDP", "经济增长", "财报", "财政", "税收", "A股", "港股", "美股"],
            "中级": ["投资", "资产", "银行", "保险", "金融", "交易", "市值", "收益", "风险", "波动", 
                  "趋势", "分析", "预期", "财经", "政策", "监管", "流动性", "评级", "估值", "指数"],
            "一般": ["涨跌", "上涨", "下跌", "回调", "反弹", "突破", "支撑", "压力", "成交量", "换手率", 
                  "技术面", "基本面", "消息面", "题材", "热点", "龙头", "板块", "行业", "概念", "利好", "利空"]
        }
    
    def _get_with_cache(self, cache_key, fetch_func, ttl=None):
        """带缓存的获取数据"""
        current_time = time.time()
        cache_ttl = ttl if ttl is not None else self._cache_ttl
        
        if cache_key in self._cache and current_time - self._cache_time.get(cache_key, 0) < cache_ttl:
            return self._cache[cache_key]
        
        data = fetch_func()
        if data:
            self._cache[cache_key] = data
            self._cache_time[cache_key] = current_time
        return data
    
    def _extract_finance_keywords(self, text):
        """从文本中提取财经关键词"""
        keywords = []
        
        # 检查各级关键词
        for level, words in self.finance_keywords.items():
            for word in words:
                if word in text:
                    keywords.append({"keyword": word, "level": level})
        
        # 提取数字和百分比
        # 匹配百分比模式
        percent_pattern = r'([-+]?\d+(?:\.\d+)?%)'
        percents = re.findall(percent_pattern, text)
        for p in percents:
            keywords.append({"keyword": p, "level": "数据"})
        
        # 匹配金额模式
        amount_pattern = r'((?:[\$￥€£]|\b人民币|\b美元|\b欧元|\b英镑)\s*\d+(?:\.\d+)?(?:\s*(?:亿|万|千|百|兆))?)'
        amounts = re.findall(amount_pattern, text)
        for a in amounts:
            keywords.append({"keyword": a, "level": "数据"})
        
        return keywords
    
    def _enhance_query(self, query, category=None):
        """增强搜索查询"""
        # 提取关键词
        keywords = self._extract_finance_keywords(query)
        
        # 根据类别添加特定词汇
        category_terms = {
            "stock": "股市 股票",
            "forex": "外汇 汇率",
            "commodity": "商品 原油 黄金",
            "economy": "经济 GDP 通胀",
            "company": "公司 企业 财报",
            "policy": "政策 央行 监管"
        }
        
        # 构建增强查询
        enhanced_query = query
        if category and category in category_terms:
            enhanced_query = f"{query} {category_terms[category]}"
        
        # 如果查询中没有高级财经关键词，可以适当添加
        has_finance_term = any(k["level"] == "高级" for k in keywords)
        if not has_finance_term and len(keywords) < 2:
            enhanced_query = f"{query} 财经 金融"
        
        return enhanced_query
    
    def _filter_results(self, results, min_score=0.5):
        """过滤和排序搜索结果"""
        if not results:
            return []
        
        filtered_results = []
        for result in results:
            # 计算相关性得分
            score = result.get("score", 0)
            
            # 如果标题或内容包含财经关键词，提高得分
            title = result.get("title", "")
            content = result.get("content", "")
            full_text = f"{title} {content}"
            
            # 提取财经关键词
            keywords = self._extract_finance_keywords(full_text)
            
            # 根据关键词调整得分
            keyword_bonus = 0
            for keyword in keywords:
                if keyword["level"] == "高级":
                    keyword_bonus += 0.2
                elif keyword["level"] == "中级":
                    keyword_bonus += 0.1
                elif keyword["level"] == "一般":
                    keyword_bonus += 0.05
                elif keyword["level"] == "数据":
                    keyword_bonus += 0.15
            
            # 更新得分
            adjusted_score = score + keyword_bonus
            result["adjusted_score"] = adjusted_score
            
            # 筛选得分高于阈值的结果
            if adjusted_score >= min_score:
                filtered_results.append(result)
        
        # 按调整后的得分排序
        filtered_results.sort(key=lambda x: x.get("adjusted_score", 0), reverse=True)
        
        return filtered_results
    
    def search(self, query, categories=None, time_range=None, language="all", limit=10, min_score=0.5, enhance_query=True):
        """执行财经搜索"""
        def _fetch():
            if not query:
                return {"error": "搜索查询不能为空"}
            
            # 增强查询
            search_query = self._enhance_query(query) if enhance_query else query
            
            # 设置搜索参数
            params = {
                "q": search_query,
                "format": "json",
                "language": language
            }
            
            # 添加类别
            if categories:
                if isinstance(categories, list):
                    params["categories"] = ",".join(categories)
                else:
                    params["categories"] = categories
            else:
                params["categories"] = "finance,news"
            
            # 添加时间范围
            if time_range:
                params["time_range"] = time_range
            
            try:
                # 发送搜索请求
                response = requests.get(self.searxng_url, params=params, timeout=self.timeout)
                if response.status_code != 200:
                    return {"error": f"搜索请求失败，状态码: {response.status_code}"}
                
                data = response.json()
                
                # 过滤和排序结果
                results = data.get("results", [])
                filtered_results = self._filter_results(results, min_score)
                
                # 限制结果数量
                if limit > 0 and len(filtered_results) > limit:
                    filtered_results = filtered_results[:limit]
                
                return {
                    "query": query,
                    "enhanced_query": search_query,
                    "total_results": len(results),
                    "filtered_results": len(filtered_results),
                    "results": filtered_results,
                    "search_time": data.get("search_time", 0)
                }
            except Exception as e:
                return {"error": f"搜索过程发生错误: {str(e)}"}
        
        # 生成缓存键
        cache_key = f"search_{query}_{categories}_{time_range}_{language}_{min_score}"
        
        # 设置缓存时间（最新的时间范围使用较短的缓存时间）
        ttl = self._cache_ttl
        if time_range in ["day", "week"]:
            ttl = 1800  # 30分钟
        elif time_range in ["month"]:
            ttl = 3600  # 1小时
        else:
            ttl = 7200  # 2小时
        
        return self._get_with_cache(cache_key, _fetch, ttl)
    
    def get_trending_topics(self, categories=None, limit=5):
        """获取热门财经话题"""
        # 使用预定义的热门财经搜索词
        trending_queries = [
            "股市行情",
            "美联储利率",
            "通胀数据",
            "GDP增长",
            "原油价格",
            "黄金走势",
            "科技股",
            "中国经济",
            "美元指数",
            "新能源"
        ]
        
        results = []
        for query in trending_queries[:limit]:
            # 使用短的缓存时间搜索热门话题
            search_result = self.search(
                query=query,
                categories=categories or "finance,news",
                time_range="week",
                limit=3,
                min_score=0.6
            )
            
            if "error" not in search_result and search_result.get("results"):
                results.append({
                    "topic": query,
                    "top_result": search_result["results"][0] if search_result["results"] else None,
                    "result_count": len(search_result["results"])
                })
        
        return results
    
    def search_related_news(self, article, limit=5):
        """搜索文章相关新闻"""
        if not article:
            return []
        
        # 提取文章标题和内容
        title = article.get("title", "")
        content = article.get("content", "") or article.get("summary", "")
        
        # 提取关键词
        title_keywords = self._extract_finance_keywords(title)
        
        # 构建查询语句
        if title_keywords:
            # 使用提取的关键词构建查询
            keyword_terms = " ".join([k["keyword"] for k in title_keywords[:3]])
            query = f"{keyword_terms}"
        else:
            # 直接使用标题作为查询
            query = title
        
        # 搜索相关新闻
        search_result = self.search(
            query=query,
            time_range="month",
            limit=limit,
            min_score=0.5
        )
        
        if "error" in search_result:
            return []
        
        # 过滤掉相同URL的结果
        article_url = article.get("url", "")
        filtered_results = [
            r for r in search_result.get("results", [])
            if r.get("url") != article_url
        ]
        
        return filtered_results[:limit]

# 测试代码
if __name__ == "__main__":
    search_service = FinanceSearchService()
    
    # 测试财经搜索
    test_query = "美联储加息影响"
    print(f"搜索查询: {test_query}")
    result = search_service.search(test_query, time_range="month", limit=3)
    
    if "error" in result:
        print(f"搜索错误: {result['error']}")
    else:
        print(f"增强后的查询: {result['enhanced_query']}")
        print(f"找到 {result['filtered_results']} 条结果（共 {result['total_results']} 条）")
        
        for i, item in enumerate(result.get("results", [])):
            print(f"\n结果 {i+1}:")
            print(f"标题: {item.get('title', '')}")
            print(f"链接: {item.get('url', '')}")
            print(f"摘要: {item.get('content', '')[:100]}...")
            print(f"得分: {item.get('adjusted_score', 0):.2f}")
    
    # 测试热门话题
    print("\n热门财经话题:")
    topics = search_service.get_trending_topics(limit=3)
    for i, topic in enumerate(topics):
        print(f"\n话题 {i+1}: {topic['topic']}")
        if topic.get("top_result"):
            print(f"热门文章: {topic['top_result'].get('title', '')}")
            print(f"链接: {topic['top_result'].get('url', '')}")
