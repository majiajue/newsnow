#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文本提取工具 - 从HTML或富文本中提取干净的文本内容
"""

import re
from bs4 import BeautifulSoup
from ..config.settings import MIN_ARTICLE_LENGTH

def extract_clean_content(html_content):
    """
    从HTML内容中提取干净的文本
    
    Args:
        html_content (str): HTML格式的内容
        
    Returns:
        str: 清理后的纯文本内容
    """
    if not html_content or len(html_content.strip()) == 0:
        return ""
    
    # 使用BeautifulSoup解析HTML
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 移除脚本和样式内容
        for script_or_style in soup(['script', 'style', 'iframe', 'noscript']):
            script_or_style.decompose()
            
        # 获取文本内容
        text = soup.get_text()
        
        # 清理文本
        text = clean_text(text)
        
        return text
    except Exception as e:
        print(f"HTML解析错误: {str(e)}")
        # 如果解析失败，尝试直接移除HTML标签
        return clean_text(remove_html_tags(html_content))

def remove_html_tags(html_content):
    """
    使用正则表达式移除HTML标签
    
    Args:
        html_content (str): HTML内容
        
    Returns:
        str: 移除HTML标签后的内容
    """
    if not html_content:
        return ""
    
    # 移除HTML标签
    clean_text = re.sub(r'<[^>]*>', '', html_content)
    
    # 替换多个空白字符为单个空格
    clean_text = re.sub(r'\s+', ' ', clean_text)
    
    return clean_text.strip()

def clean_text(text):
    """
    清理文本内容
    
    Args:
        text (str): 原始文本
        
    Returns:
        str: 清理后的文本
    """
    if not text:
        return ""
    
    # 替换多个换行为单个换行
    text = re.sub(r'\n+', '\n', text)
    
    # 替换多个空格为单个空格
    text = re.sub(r'\s+', ' ', text)
    
    # 移除首尾空白
    text = text.strip()
    
    return text

def is_content_valid(content, title=""):
    """
    检查内容是否有效
    
    Args:
        content (str): 文本内容
        title (str, optional): 文章标题
        
    Returns:
        bool: 内容是否有效
    """
    if not content:
        return False
    
    # 清理内容
    clean_content = clean_text(content)
    
    # 内容长度检查
    if len(clean_content) < MIN_ARTICLE_LENGTH:
        # 如果内容太短且与标题相同，则可能是无效内容
        if title and (clean_content.strip() == title.strip() or 
                      title.strip() in clean_content.strip()):
            return False
    
    return True

def extract_main_content(html_content):
    """
    提取HTML中的主要内容区域
    
    Args:
        html_content (str): HTML内容
        
    Returns:
        str: 主要内容区域的HTML
    """
    if not html_content:
        return ""
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 寻找可能包含主要内容的容器
        main_containers = soup.find_all(['article', 'div', 'section'], 
                                       class_=re.compile(r'article|content|post|body|text|main', re.I))
        
        if main_containers:
            # 选择内容最多的容器
            main_container = max(main_containers, key=lambda x: len(x.get_text()))
            return str(main_container)
        
        # 如果没有找到明确的内容容器，返回原始HTML
        return html_content
    except Exception as e:
        print(f"提取主要内容错误: {str(e)}")
        return html_content
