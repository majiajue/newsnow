# 基于 Jina AI API 的内容获取系统

## 核心概念及架构

Jina AI 提供了一套全面的 API，可以帮助我们实现从内容获取到处理的完整流程。下面是基于 Jina API 的爬虫系统架构：

```
┌─────────────────────┐          ┌──────────────────┐          ┌─────────────────────┐
│                     │          │                  │          │                     │
│  1. 内容获取层      │  ───────▶│  2. 内容处理层   │  ───────▶│  3. 内容存储/应用层  │
│                     │          │                  │          │                     │
└─────────────────────┘          └──────────────────┘          └─────────────────────┘
        │                                │                               │
        ▼                                ▼                               ▼
┌─────────────────────┐          ┌──────────────────┐          ┌─────────────────────┐
│• 搜索 API (s.reader)│          │• 分段 API         │          │• 向量数据库         │
│• 阅读 API (r.reader)│          │• 嵌入 API         │          │• 文章内容数据库     │
│• 事实检查(g.reader) │          │• 分类 API         │          │• 生成式AI应用       │
└─────────────────────┘          └──────────────────┘          └─────────────────────┘
```

## 详细功能模块

### 1. 内容获取层

#### 1.1 搜索模块 (Search Module)
- **核心API**: s.reader API
- **功能**: 根据关键词搜索网络，获取搜索结果的格式化内容
- **适用场景**: 
  - 获取某主题的最新资讯
  - 收集多来源的观点和数据
  - 不知道具体网站但知道主题时使用

```python
def search_content(query, site=None, num_results=5):
    """
    搜索获取内容并返回格式化结果
    """
    headers = {
        "Authorization": f"Bearer {os.environ.get('JINA_API_KEY')}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # 如果需要限制在特定网站内搜索
    if site:
        headers["X-Site"] = site
    
    # 配置其他参数
    headers["X-With-Links-Summary"] = "true"
    headers["X-With-Images-Summary"] = "true"
    
    payload = {
        "q": query,
        "num": num_results
    }
    
    response = requests.post("https://s.jina.ai/", headers=headers, json=payload)
    return response.json()
```

#### 1.2 网页读取模块 (Reader Module)
- **核心API**: r.reader API
- **功能**: 解析单个网页内容，提取结构化信息
- **适用场景**:
  - 已知网站URL时使用
  - 需要提取特定网页的详细内容
  - 需要高质量内容提取时

```python
def read_webpage(url, extract_links=True, extract_images=True):
    """
    读取单个网页内容并提取结构化信息
    """
    headers = {
        "Authorization": f"Bearer {os.environ.get('JINA_API_KEY')}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # 配置提取选项
    if extract_links:
        headers["X-With-Links-Summary"] = "true"
    if extract_images:
        headers["X-With-Images-Summary"] = "true"
    
    payload = {"url": url}
    
    response = requests.post("https://r.jina.ai/", headers=headers, json=payload)
    return response.json()
```

### 2. 内容处理层

#### 2.1 内容分段模块 (Segmentation Module)
- **核心API**: Segmenter API
- **功能**: 将长文本分成语义合理的段落和块
- **适用场景**:
  - 准备用于向量检索的文本块
  - 管理长文档
  - 计算令牌数量

```python
def segment_content(content, return_chunks=True, max_chunk_length=1000):
    """
    将内容分段为更小的语义块
    """
    headers = {
        "Authorization": f"Bearer {os.environ.get('JINA_API_KEY')}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    payload = {
        "content": content,
        "return_chunks": return_chunks,
        "max_chunk_length": max_chunk_length
    }
    
    response = requests.post("https://segment.jina.ai/", headers=headers, json=payload)
    return response.json()
```

#### 2.2 向量嵌入模块 (Embedding Module)
- **核心API**: Embeddings API
- **功能**: 生成文本的向量表示
- **适用场景**:
  - 为搜索系统准备向量数据
  - 构建语义检索系统
  - 内容相似度分析

```python
def embed_content(text_chunks):
    """
    将文本块转换为向量嵌入
    """
    headers = {
        "Authorization": f"Bearer {os.environ.get('JINA_API_KEY')}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    payload = {
        "model": "jina-embeddings-v3",
        "input": text_chunks
    }
    
    response = requests.post("https://api.jina.ai/v1/embeddings", headers=headers, json=payload)
    return response.json()
```

#### 2.3 内容分类模块 (Classification Module)
- **核心API**: Classification API
- **功能**: 对内容进行分类
- **适用场景**:
  - 内容主题分类
  - 情感分析
  - 内容筛选

```python
def classify_content(texts, categories):
    """
    对文本内容进行分类
    """
    headers = {
        "Authorization": f"Bearer {os.environ.get('JINA_API_KEY')}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    payload = {
        "model": "jina-embeddings-v3",
        "input": texts,
        "labels": categories
    }
    
    response = requests.post("https://api.jina.ai/v1/classify", headers=headers, json=payload)
    return response.json()
```

#### 2.4 结果重排序模块 (Reranking Module)
- **核心API**: Reranker API
- **功能**: 按照相关性对搜索结果重新排序
- **适用场景**:
  - 提高搜索结果质量
  - RAG系统优化
  - 精确查找最相关内容

```python
def rerank_results(query, documents):
    """
    根据查询对文档进行重新排序
    """
    headers = {
        "Authorization": f"Bearer {os.environ.get('JINA_API_KEY')}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    payload = {
        "model": "jina-reranker-v2-base-multilingual",
        "query": query,
        "documents": documents
    }
    
    response = requests.post("https://api.jina.ai/v1/rerank", headers=headers, json=payload)
    return response.json()
```

## 完整爬虫流程示例

以下是使用Jina AI API构建完整爬虫系统的示例流程：

### 基础爬虫实现

```python
import os
import requests
import json

# 确保设置了环境变量
# Get your Jina AI API key for free: https://jina.ai/?sui=apikey
# os.environ["JINA_API_KEY"] = "your_api_key_here"

def search_and_process(query, max_results=5):
    """
    搜索、提取和处理内容的完整流程
    """
    # 1. 搜索相关内容
    search_results = search_content(query, num_results=max_results)
    
    # 提取URL
    urls = []
    if "data" in search_results:
        for result in search_results["data"]:
            if "url" in result:
                urls.append(result["url"])
    
    # 2. 提取每个URL的详细内容
    detailed_contents = []
    for url in urls:
        try:
            # 读取网页内容
            page_content = read_webpage(url)
            
            if "data" in page_content and "content" in page_content["data"]:
                content = page_content["data"]["content"]
                
                # 3. 分段处理长文本
                segments = segment_content(content)
                
                chunks = []
                if "chunks" in segments:
                    chunks = segments["chunks"]
                
                # 4. 生成向量嵌入
                if chunks:
                    embeddings = embed_content(chunks)
                    
                    # 5. 对内容进行分类
                    categories = ["Technology", "Business", "Science", "Politics", "Entertainment"]
                    classification = classify_content(chunks[:3], categories)  # 仅对前3个块进行分类示例
                    
                    # 构建结构化结果
                    detailed_contents.append({
                        "url": url,
                        "title": page_content["data"].get("title", ""),
                        "content": content,
                        "chunks": chunks,
                        "embeddings": embeddings,
                        "classification": classification
                    })
        except Exception as e:
            print(f"Error processing {url}: {str(e)}")
    
    # 6. 根据查询对文档进行重新排序
    if detailed_contents:
        documents = [item["content"] for item in detailed_contents]
        reranked = rerank_results(query, documents)
        
        # 根据重新排序的结果调整内容顺序
        if "results" in reranked:
            reranked_indices = [item["index"] for item in reranked["results"]]
            detailed_contents = [detailed_contents[i] for i in reranked_indices]
    
    return detailed_contents

# 示例使用
if __name__ == "__main__":
    results = search_and_process("最新人工智能技术进展")
    print(f"找到 {len(results)} 个结果")
    
    # 打印每个结果的基本信息
    for i, result in enumerate(results):
        print(f"\n--- 结果 {i+1} ---")
        print(f"标题: {result['title']}")
        print(f"URL: {result['url']}")
        print(f"内容片段: {result['content'][:200]}...")
        
        # 打印分类结果
        if "classification" in result and "data" in result["classification"]:
            for pred in result["classification"]["data"]:
                print(f"分类: {pred['prediction']} (置信度: {pred['score']:.2f})")
```

## 系统优化方案

### 并行处理与异步请求

为了提高处理效率，可以使用并行处理和异步请求：

```python
import asyncio
import aiohttp

async def fetch_content(session, url):
    """异步获取单个URL的内容"""
    headers = {
        "Authorization": f"Bearer {os.environ.get('JINA_API_KEY')}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-With-Links-Summary": "true"
    }
    
    payload = {"url": url}
    
    async with session.post("https://r.jina.ai/", headers=headers, json=payload) as response:
        return await response.json()

async def process_multiple_urls(urls):
    """并行处理多个URL"""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_content(session, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 过滤出成功的结果
        valid_results = [r for r in results if isinstance(r, dict) and "data" in r]
        return valid_results
```

### 分批处理大量数据

当需要处理大量数据时，可以采用分批处理的方式：

```python
def process_in_batches(items, batch_size=10, process_func=None):
    """分批处理数据项"""
    results = []
    
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        if process_func:
            batch_results = process_func(batch)
            results.extend(batch_results)
        
        # 添加延迟以遵守API限制
        time.sleep(1)
    
    return results
```

### 错误处理与重试机制

为确保系统可靠性，添加错误处理和重试机制：

```python
def call_api_with_retry(api_func, *args, max_retries=3, **kwargs):
    """
    使用重试机制调用API函数
    """
    retries = 0
    while retries < max_retries:
        try:
            return api_func(*args, **kwargs)
        except Exception as e:
            retries += 1
            print(f"尝试 {retries}/{max_retries} 失败: {str(e)}")
            # 指数退避策略
            time.sleep(2 ** retries)
    
    # 所有重试都失败
    raise Exception(f"在 {max_retries} 次尝试后调用失败")
```

## 与现有NewNow系统集成

可以将Jina API爬虫系统与现有的NewNow项目集成：

1. **替换现有的内容获取模块**:
   - 使用s.reader API替代传统爬虫
   - 利用r.reader API提取更高质量的内容

2. **增强内容处理流程**:
   - 使用分段API优化内容结构
   - 使用分类API自动标记内容类别
   - 使用嵌入API实现相似内容发现

3. **数据存储优化**:
   - 存储原始内容和处理后的结构化数据
   - 保存向量嵌入用于相似内容检索
   - 存储分类结果用于内容组织

## API限制与优化策略

| API | 限制 (免费) | 限制 (高级) | 优化策略 |
|-----|------------|------------|---------|
| 嵌入API | 500 RPM, 1M TPM | 2k RPM, 5M TPM | 分批处理、缓存结果 |
| 重排序API | 500 RPM, 1M TPM | 2k RPM,, 5M TPM | 仅对高价值结果重排序 |
| 阅读API (r.reader) | 200 RPM | 2k RPM | 优先处理重要URL，使用缓存 |
| 搜索API (s.reader) | 40 RPM | 400 RPM | 精确查询、缓存结果 |
| 分类API | 20 RPM, 200k TPM | 60 RPM, 1M TPM | 对代表性样本分类、结果复用 |
| 分段API | 200 RPM | 1k RPM | 本地缓存常用结果 |

## 注意事项

1. **环境变量配置**: 确保设置了`JINA_API_KEY`环境变量
2. **错误处理**: 实现全面的错误处理和重试策略
3. **缓存机制**: 实施缓存以减少API调用并遵守速率限制
4. **异步处理**: 使用异步编程提高系统效率
5. **内容质量评估**: 添加AI驱动的内容质量评估机制

---

通过集成Jina AI API，我们可以构建更强大、更高效的内容获取系统，同时大幅提升内容质量和处理效率，为通过Google AdSense审核创造有利条件。
