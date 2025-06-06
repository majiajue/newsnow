#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
爬虫修复脚本
修复各个爬虫中的已知问题
"""

import os
import sys
import re

def fix_wallstreet_crawler():
    """修复华尔街见闻爬虫的NoneType迭代问题"""
    file_path = "newsnow-python/crawlers/wallstreet.py"
    
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复asset_tags的NoneType问题
        old_pattern = r'for tag in article_data\.get\("asset_tags", \[\]\):'
        new_pattern = 'for tag in (article_data.get("asset_tags") or []):'
        
        if re.search(old_pattern, content):
            content = re.sub(old_pattern, new_pattern, content)
            print("✅ 修复了asset_tags的NoneType迭代问题")
        
        # 添加更多的空值检查
        fixes = [
            # 修复author_info的NoneType问题
            (
                r'author_info = article_data\.get\("author", \{\}\)',
                'author_info = article_data.get("author") or {}'
            ),
            # 修复source_info的NoneType问题
            (
                r'source_info = article_data\.get\("source_info", \{\}\)',
                'source_info = article_data.get("source_info") or {}'
            ),
            # 修复resource的NoneType问题
            (
                r'resource = article_data\.get\("resource", \{\}\)',
                'resource = article_data.get("resource") or {}'
            )
        ]
        
        for old, new in fixes:
            if re.search(old, content):
                content = re.sub(old, new, content)
                print(f"✅ 应用修复: {old[:30]}...")
        
        # 添加更安全的时间戳处理
        timestamp_fix = '''
            # 提取发布时间 - 安全处理
            pub_timestamp = article_data.get("display_time") or article_data.get("published_at") or 0
            try:
                if pub_timestamp and pub_timestamp > 0:
                    # 处理毫秒时间戳
                    if pub_timestamp > 1000000000000:  # 毫秒时间戳
                        pub_date = datetime.fromtimestamp(pub_timestamp/1000).isoformat()
                    else:  # 秒时间戳
                        pub_date = datetime.fromtimestamp(pub_timestamp).isoformat()
                else:
                    pub_date = datetime.now().isoformat()
            except (ValueError, OSError) as e:
                print(f"[Wallstreet Warn] Article ID: {article_id} - 时间戳解析失败: {e}")
                pub_date = datetime.now().isoformat()
'''
        
        # 替换原有的时间戳处理逻辑
        old_timestamp_pattern = r'# 提取发布时间\s+pub_timestamp = article_data\.get\("display_time", 0\).*?pub_date = datetime\.fromtimestamp\(pub_timestamp/1000\)\.isoformat\(\) if pub_timestamp else ""'
        
        if re.search(old_timestamp_pattern, content, re.DOTALL):
            content = re.sub(old_timestamp_pattern, timestamp_fix.strip(), content, flags=re.DOTALL)
            print("✅ 修复了时间戳处理逻辑")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ 华尔街见闻爬虫修复完成: {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ 修复华尔街见闻爬虫失败: {e}")
        return False

def fix_gelonghui_crawler():
    """修复格隆汇爬虫的URL问题"""
    file_path = "newsnow-python/crawlers/gelonghui.py"
    
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 添加URL验证和重试逻辑
        url_fix = '''
        # 构建文章详情URL - 支持多种格式
        possible_urls = [
            f"{self.base_url}/p/{article_id}",
            f"{self.base_url}/live/{article_id}",
            f"{self.base_url}/news/{article_id}",
            f"{self.base_url}/article/{article_id}"
        ]
        
        response = None
        url = None
        
        # 尝试不同的URL格式
        for test_url in possible_urls:
            try:
                print(f"[Gelonghui Debug] Article ID: {article_id} - Trying URL: {test_url}")
                test_response = requests.get(
                    test_url,
                    headers=self.headers,
                    timeout=REQUEST_TIMEOUT,
                    allow_redirects=True
                )
                
                if test_response.status_code == 200:
                    response = test_response
                    url = test_url
                    print(f"[Gelonghui Debug] Article ID: {article_id} - Found working URL: {url}")
                    break
                else:
                    print(f"[Gelonghui Debug] Article ID: {article_id} - URL failed with status {test_response.status_code}: {test_url}")
                    
            except Exception as e:
                print(f"[Gelonghui Debug] Article ID: {article_id} - URL request failed: {test_url} - {e}")
                continue
        
        if not response or response.status_code != 200:
            print(f"[Gelonghui Error] Article ID: {article_id} - All URL attempts failed")
            return None
'''
        
        # 查找并替换原有的URL构建逻辑
        old_url_pattern = r'url = f"\{self\.base_url\}/p/\{article_id\}".*?if response\.status_code != 200:'
        
        if re.search(old_url_pattern, content, re.DOTALL):
            # 找到匹配的部分并替换
            content = re.sub(
                r'url = f"\{self\.base_url\}/p/\{article_id\}".*?response = requests\.get\(.*?\).*?print\(f"\[Gelonghui Debug\] Article ID: \{article_id\} - HTTP Status: \{response\.status_code\}"\).*?if response\.status_code != 200:',
                url_fix.strip() + '\n\n        print(f"[Gelonghui Debug] Article ID: {article_id} - HTTP Status: {response.status_code}")\n        if response.status_code != 200:',
                content,
                flags=re.DOTALL
            )
            print("✅ 修复了格隆汇URL处理逻辑")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ 格隆汇爬虫修复完成: {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ 修复格隆汇爬虫失败: {e}")
        return False

def fix_fastbull_crawler():
    """修复FastBull爬虫的内容解析问题"""
    file_path = "newsnow-python/crawlers/fastbull.py"
    
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 改进内容选择器
        selector_fix = '''
            # 尝试多种内容选择器
            content_selectors = [
                '.news-detail-content',
                '.article-content', 
                '.content',
                '.news-content',
                '.detail-content',
                'article',
                '.main-content'
            ]
            
            content_elem = None
            for selector in content_selectors:
                content_elem = soup.select_one(selector)
                if content_elem and content_elem.get_text(strip=True):
                    print(f"[FastBull Debug] Article ID: {article_id} - Found content with selector: {selector}")
                    break
            
            if content_elem:
                # 清理内容
                for script in content_elem(["script", "style", "nav", "footer", "header"]):
                    script.decompose()
                content = content_elem.get_text(strip=True)
                html_content = str(content_elem)
            else:
                print(f"[FastBull Warn] Article ID: {article_id} - No content found with any selector")
                content = ""
                html_content = ""
'''
        
        # 查找并替换内容解析逻辑
        old_content_pattern = r'# 尝试获取新闻详情内容.*?html_content = ""'
        
        if re.search(old_content_pattern, content, re.DOTALL):
            content = re.sub(old_content_pattern, selector_fix.strip(), content, flags=re.DOTALL)
            print("✅ 修复了FastBull内容解析逻辑")
        
        # 改进标题提取
        title_fix = '''
            # 尝试多种标题选择器
            title_selectors = [
                'h1.news-title',
                'h1.article-title', 
                '.title',
                'h1',
                '.news-detail-title',
                '.detail-title'
            ]
            
            title = ""
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem and title_elem.get_text(strip=True):
                    title = title_elem.get_text(strip=True)
                    print(f"[FastBull Debug] Article ID: {article_id} - Found title with selector: {selector}")
                    break
            
            if not title:
                # 从URL或其他地方尝试获取标题
                title_elem = soup.select_one('title')
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    # 清理标题中的网站名称
                    title = re.sub(r'[-_|].*?(FastBull|快牛).*$', '', title).strip()
'''
        
        # 查找并替换标题提取逻辑
        old_title_pattern = r'# 提取标题.*?title = title_elem\.get_text\(strip=True\) if title_elem else ""'
        
        if re.search(old_title_pattern, content, re.DOTALL):
            content = re.sub(old_title_pattern, title_fix.strip(), content, flags=re.DOTALL)
            print("✅ 修复了FastBull标题提取逻辑")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ FastBull爬虫修复完成: {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ 修复FastBull爬虫失败: {e}")
        return False

def fix_api_credentials():
    """修复API凭证问题"""
    env_file = "newsnow-python/.env"
    env_example = "newsnow-python/env.example"
    
    print("\n🔑 API凭证配置检查:")
    
    if not os.path.exists(env_file):
        if os.path.exists(env_example):
            print(f"⚠️  .env文件不存在，请复制 {env_example} 到 {env_file} 并配置API密钥")
        else:
            print("⚠️  .env文件和env.example都不存在，请手动创建.env文件")
        return False
    
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            env_content = f.read()
        
        # 检查必要的API密钥
        required_keys = [
            'DEEPSEEK_API_KEY',
            'OPENAI_API_KEY',
            'SEARXNG_URL'
        ]
        
        missing_keys = []
        for key in required_keys:
            if f"{key}=" not in env_content or f"{key}=" in env_content and not re.search(f"{key}=.+", env_content):
                missing_keys.append(key)
        
        if missing_keys:
            print(f"⚠️  缺少或未配置的API密钥: {', '.join(missing_keys)}")
            print("请在.env文件中配置这些密钥以启用AI分析功能")
            return False
        else:
            print("✅ API密钥配置检查通过")
            return True
            
    except Exception as e:
        print(f"❌ 检查API凭证失败: {e}")
        return False

def main():
    """主函数"""
    print("🔧 开始修复爬虫问题...")
    print("=" * 60)
    
    # 修复各个爬虫
    fixes = [
        ("华尔街见闻爬虫", fix_wallstreet_crawler),
        ("格隆汇爬虫", fix_gelonghui_crawler), 
        ("FastBull爬虫", fix_fastbull_crawler),
    ]
    
    success_count = 0
    for name, fix_func in fixes:
        print(f"\n🔧 修复 {name}...")
        if fix_func():
            success_count += 1
        else:
            print(f"❌ {name} 修复失败")
    
    print(f"\n📊 修复结果: {success_count}/{len(fixes)} 个爬虫修复成功")
    
    # 检查API凭证
    fix_api_credentials()
    
    print("\n" + "=" * 60)
    print("🎉 爬虫修复完成！")
    print("\n💡 建议:")
    print("1. 配置.env文件中的API密钥以启用AI分析")
    print("2. 重新运行测试: python3 test_all_crawlers.py")
    print("3. 如果仍有问题，请检查网络连接和目标网站状态")

if __name__ == "__main__":
    main() 