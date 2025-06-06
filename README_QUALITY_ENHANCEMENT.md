# NewsNow 内容质量增强功能部署指南

## 🎯 功能概述

NewsNow系统现已完全集成内容质量增强功能，通过AI驱动的内容分析和优化，提升文章质量和SEO表现。

## 🚀 快速启动

### 1. 环境准备

确保你有以下环境变量配置（在`.env`文件中）：

```bash
# 必需 - DeepSeek AI API密钥（用于内容质量增强）
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 可选 - 其他配置
SEARXNG_URL=http://searxng:8080
API_PORT=5001
API_HOST=0.0.0.0
```

### 2. 启动完整系统

```bash
# 启动所有服务（包含内容质量增强）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f newsnow-cron
```

### 3. 服务访问地址

- **API服务器**: http://localhost:5001
- **前端界面**: http://localhost:3002  
- **搜索服务**: http://localhost:8080
- **质量增强API**: http://localhost:5001/api/quality/

## 📊 定时任务调度

系统会自动执行以下定时任务：

| 任务类型 | 执行频率 | 说明 |
|---------|---------|------|
| 文章爬取 | 每2小时 | 从各新闻源获取最新文章 |
| 文章处理 | 每2小时15分 | 搜索增强和AI分析 |
| **质量增强** | **每30分钟** | **批量增强文章质量（10篇/次）**|
| **质量统计** | **每天凌晨2点** | **生成质量统计报告** |

## 🔧 内容质量增强API

### 可用端点

1. **单篇文章增强**
   ```bash
   POST /api/quality/enhance
   Content-Type: application/json
   
   {
     "article_id": 123,
     "source": "jin10"
   }
   ```

2. **批量文章增强**
   ```bash
   POST /api/quality/batch-enhance
   Content-Type: application/json
   
   {
     "limit": 10,
     "source": "jin10"
   }
   ```

3. **质量统计**
   ```bash
   GET /api/quality/statistics
   ```

4. **高质量文章**
   ```bash
   GET /api/quality/high-quality?limit=20&min_score=8.0
   ```

5. **内容策略生成**
   ```bash
   POST /api/quality/strategy
   Content-Type: application/json
   
   {
     "topic": "人工智能",
     "days": 7
   }
   ```

6. **待增强文章列表**
   ```bash
   GET /api/quality/articles-to-enhance?limit=50
   ```

7. **内容表现分析**
   ```bash
   GET /api/quality/performance?days=30
   ```

## 📁 日志文件

所有日志文件位于 `./logs/` 目录：

- `crawler.log` - 爬虫任务日志
- `processor.log` - 文章处理日志  
- `scheduler.log` - 调度器日志
- `quality_enhancement.log` - **内容质量增强日志**

## 🔍 监控和调试

### 查看实时日志
```bash
# 查看质量增强日志
tail -f logs/quality_enhancement.log

# 查看所有日志
tail -f logs/*.log
```

### 手动执行质量增强
```bash
# 进入容器
docker exec -it newsnow-cron bash

# 手动执行质量增强（处理10篇文章）
python quality_enhancement_scheduler.py --once --batch 10

# 生成质量统计报告
python quality_enhancement_scheduler.py --once --task stats
```

## 🎛️ 配置选项

### 环境变量

- `DEEPSEEK_API_KEY`: DeepSeek AI API密钥（必需，用于AI增强）
- `SEARXNG_URL`: 搜索服务URL
- `API_PORT`: API服务器端口（默认5001）
- `API_HOST`: API服务器主机（默认0.0.0.0）

### 无API密钥模式

如果未设置`DEEPSEEK_API_KEY`，系统将以有限模式运行：
- 爬虫和基础处理功能正常
- 质量增强功能提供基础策略
- 数据库操作正常
- API端点返回基础响应

## 🚨 故障排除

### 常见问题

1. **质量增强任务失败**
   - 检查`DEEPSEEK_API_KEY`是否正确设置
   - 查看`logs/quality_enhancement.log`获取详细错误信息

2. **API端点无响应**
   - 确认API服务器在端口5001运行
   - 检查`logs/api_server.log`

3. **定时任务未执行**
   - 检查cron服务状态：`docker exec newsnow-cron service cron status`
   - 查看cron任务：`docker exec newsnow-cron cat /etc/cron.d/newsnow`

### 重启服务
```bash
# 重启特定服务
docker-compose restart newsnow-cron

# 重启所有服务
docker-compose restart
```

## 📈 性能优化建议

1. **批量大小调整**: 根据系统性能调整每次处理的文章数量
2. **执行频率**: 根据需要调整质量增强任务的执行频率
3. **API限制**: 注意DeepSeek API的调用限制，避免过于频繁的请求
4. **日志管理**: 定期清理日志文件，避免磁盘空间不足

## 🎉 功能特点

- ✅ **自动化质量增强**: 定时批量处理文章
- ✅ **AI驱动分析**: 使用DeepSeek进行内容分析
- ✅ **SEO优化**: 自动生成SEO友好的标题和描述
- ✅ **质量评分**: 为每篇文章提供质量评分
- ✅ **统计报告**: 定期生成质量统计报告
- ✅ **API接口**: 完整的REST API支持
- ✅ **容器化部署**: Docker和Docker Compose支持
- ✅ **日志监控**: 详细的日志记录和监控

现在你的NewsNow系统已经完全集成了内容质量增强功能！🎊
