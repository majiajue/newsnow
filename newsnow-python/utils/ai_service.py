#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
AI服务封装 - 提供文章分析和内容生成功能
"""

import os
import json
import requests
from datetime import datetime
from ..config.settings import (
    ENABLE_DEEPSEEK, 
    ENABLE_LOCAL_MODEL, 
    LOCAL_MODEL_PATH,
    MAX_SUMMARY_LENGTH
)

def generate_analysis(title, content, source=""):
    """
    生成文章分析
    
    Args:
        title (str): 文章标题
        content (str): 文章内容
        source (str, optional): 文章来源
        
    Returns:
        dict: 分析结果
    """
    print(f"开始分析文章: {title[:30]}{'...' if len(title) > 30 else ''}")
    
    # 如果内容为空，使用标题作为内容
    if not content or len(content.strip()) == 0:
        content = title
        print(f"警告: 文章内容为空，使用标题作为内容: {title}")
    
    # 根据配置选择不同的分析方式
    if ENABLE_DEEPSEEK:
        try:
            return deepseek_analysis(title, content, source)
        except Exception as e:
            print(f"DeepSeek分析失败: {str(e)}，使用模板分析")
            return template_analysis(title, content, source)
    elif ENABLE_LOCAL_MODEL:
        try:
            return local_model_analysis(title, content, source)
        except Exception as e:
            print(f"本地模型分析失败: {str(e)}，使用模板分析")
            return template_analysis(title, content, source)
    else:
        return template_analysis(title, content, source)

def deepseek_analysis(title, content, source):
    """
    使用DeepSeek API生成分析
    
    Args:
        title (str): 文章标题
        content (str): 文章内容
        source (str): 文章来源
        
    Returns:
        dict: 分析结果
    """
    # 这里实现调用DeepSeek API的逻辑
    # 示例实现，实际使用时需要替换为真实API调用
    try:
        # API调用示例
        api_key = os.environ.get("DEEPSEEK_API_KEY", "")
        if not api_key:
            raise ValueError("DeepSeek API密钥未设置")
        
        # 构建请求
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        # 构建提示词
        prompt = f"""
请对以下财经文章进行专业分析：

标题：{title}
来源：{source}
内容：{content[:1000]}{'...' if len(content) > 1000 else ''}

请提供以下分析：
1. 100字以内的摘要
2. 100字以内的专业评论
3. 3-5条关键要点
4. 100字以内的分析背景
5. 100字以内的影响评估
6. 100字以内的专业意见
7. 3条建议行动

请确保分析专业、客观，并按照上述格式提供。格式为JSON。
"""
        
        payload = {
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 1000
        }
        
        # 发送请求
        response = requests.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"API请求失败: {response.status_code} - {response.text}")
        
        # 解析响应
        result = response.json()
        ai_response = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        # 尝试解析JSON响应
        try:
            # 提取JSON部分
            json_str = ai_response
            if "```json" in ai_response:
                json_str = ai_response.split("```json")[1].split("```")[0].strip()
            elif "```" in ai_response:
                json_str = ai_response.split("```")[1].strip()
            
            # 解析JSON
            analysis_data = json.loads(json_str)
            
            # 构建标准分析结果
            return {
                "summary": analysis_data.get("摘要", ""),
                "comment": analysis_data.get("专业评论", ""),
                "key_points": analysis_data.get("关键要点", []),
                "background": analysis_data.get("分析背景", ""),
                "impact": analysis_data.get("影响评估", ""),
                "opinion": analysis_data.get("专业意见", ""),
                "suggestions": analysis_data.get("建议行动", [])
            }
        except Exception as e:
            print(f"JSON解析失败: {str(e)}，尝试文本解析")
            
            # 如果JSON解析失败，尝试从文本中提取信息
            summary = extract_section(ai_response, "摘要", 100)
            comment = extract_section(ai_response, "专业评论", 100)
            key_points = extract_list(ai_response, "关键要点")
            background = extract_section(ai_response, "分析背景", 100)
            impact = extract_section(ai_response, "影响评估", 100)
            opinion = extract_section(ai_response, "专业意见", 100)
            suggestions = extract_list(ai_response, "建议行动")
            
            return {
                "summary": summary,
                "comment": comment,
                "key_points": key_points,
                "background": background,
                "impact": impact,
                "opinion": opinion,
                "suggestions": suggestions
            }
    
    except Exception as e:
        print(f"DeepSeek分析异常: {str(e)}")
        raise

def local_model_analysis(title, content, source):
    """
    使用本地模型生成分析
    
    Args:
        title (str): 文章标题
        content (str): 文章内容
        source (str): 文章来源
        
    Returns:
        dict: 分析结果
    """
    # 这里实现本地模型分析逻辑
    # 示例实现，实际使用时需要替换为真实本地模型调用
    try:
        from transformers import pipeline
        
        # 加载模型
        summarizer = pipeline("summarization", model=LOCAL_MODEL_PATH)
        
        # 截取内容以适应模型最大长度
        trimmed_content = content[:2048]  # 根据模型调整
        
        # 生成摘要
        summary_result = summarizer(trimmed_content, max_length=MAX_SUMMARY_LENGTH, min_length=50)
        summary = summary_result[0]["summary_text"]
        
        # 后续分析可以使用其他模型或规则实现
        # 这里暂时使用模板填充其他字段
        template = template_analysis(title, content, source)
        
        return {
            "summary": summary,
            "comment": template["comment"],
            "key_points": template["key_points"],
            "background": template["background"],
            "impact": template["impact"],
            "opinion": template["opinion"],
            "suggestions": template["suggestions"]
        }
    except Exception as e:
        print(f"本地模型分析异常: {str(e)}")
        raise

def template_analysis(title, content, source):
    """
    生成模板化分析（备选方案）
    
    Args:
        title (str): 文章标题
        content (str): 文章内容
        source (str): 文章来源
        
    Returns:
        dict: 分析结果
    """
    # 生成简单摘要
    summary = content[:MAX_SUMMARY_LENGTH] + "..." if len(content) > MAX_SUMMARY_LENGTH else content
    summary = summary.strip()
    
    # 如果摘要为空或过短，使用标题作为摘要
    if len(summary) < 10:
        summary = title
    
    source_text = f"「{source}」" if source else ""
    
    return {
        "summary": summary,
        "comment": f"这是关于「{title}」的{source_text}财经新闻，提供了相关行业的最新动态。建议投资者关注相关发展，评估可能的市场影响。",
        "key_points": [
            f"{title}反映了财经领域的最新发展趋势",
            "这一动态对市场参与者具有重要参考价值",
            "投资者应密切关注后续发展"
        ],
        "background": "近期财经领域发生了一系列重要变化，本文所报道的内容是这些变化的重要组成部分。从宏观角度看，这些变化将对整体经济环境产生深远影响。",
        "impact": "短期内，该消息可能引起市场波动；中长期来看，将促进相关行业的结构性调整和优化升级。投资者应当理性看待这一变化，避免盲目跟风或恐慌性决策。",
        "opinion": "从专业角度分析，这一发展符合当前经济和政策环境的整体趋势。建议投资者结合自身风险偏好和投资目标，审慎决策。",
        "suggestions": [
            "密切关注后续政策和市场反应",
            "评估对自身投资组合的潜在影响",
            "适当调整资产配置策略，分散风险"
        ]
    }

def extract_section(text, section_name, max_length=100):
    """
    从文本中提取指定章节的内容
    
    Args:
        text (str): 原始文本
        section_name (str): 章节名称
        max_length (int): 最大长度
        
    Returns:
        str: 提取的章节内容
    """
    import re
    
    # 尝试找到章节
    pattern = rf"{section_name}[:：]?\s*(.*?)(?:\n\n|\n[^\n]|$)"
    match = re.search(pattern, text, re.DOTALL)
    
    if match:
        content = match.group(1).strip()
        return content[:max_length] if len(content) > max_length else content
    
    return ""

def extract_list(text, section_name):
    """
    从文本中提取列表项
    
    Args:
        text (str): 原始文本
        section_name (str): 章节名称
        
    Returns:
        list: 提取的列表项
    """
    import re
    
    # 查找章节
    section_pattern = rf"{section_name}[:：]?\s*(.*?)(?:\n\n|\n[A-Za-z0-9一-龥]+[:：]|\Z)"
    section_match = re.search(section_pattern, text, re.DOTALL)
    
    if not section_match:
        return []
    
    section_content = section_match.group(1).strip()
    
    # 查找列表项
    items = []
    # 匹配数字、点、中文数字等开头的列表项
    item_pattern = r"(?:^|\n)(?:\d+[\.、]|[一二三四五六七八九十][\.、]|•|\*)\s*(.+?)(?=\n(?:\d+[\.、]|[一二三四五六七八九十][\.、]|•|\*)|\n\n|\Z)"
    for match in re.finditer(item_pattern, section_content, re.DOTALL):
        items.append(match.group(1).strip())
    
    # 如果没有找到格式化的列表项，尝试按行分割
    if not items:
        items = [line.strip() for line in section_content.split('\n') if line.strip()]
    
    return items[:5]  # 最多返回5个项目
