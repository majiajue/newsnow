# NewsNow 部署手册

本文档提供了使用 Docker 部署 NewsNow 应用的完整指南，包括 SearxNG 搜索引擎、Python 后端、前端 UI 以及定时任务的配置。

## 系统架构

NewsNow 应用由以下几个主要组件组成：

1. **SearxNG**: 元搜索引擎，用于增强文章分析
2. **NewsNow Python 后端**: 负责爬取新闻、处理文章和提供 API
3. **NewsNow UI 前端**: React/Next.js 应用，提供用户界面
4. **定时任务**: 定期爬取和处理新闻

## 前置条件

- Docker 和 Docker Compose 已安装
- Git 已安装
- 基本的命令行操作知识
- DeepSeek API 密钥（用于 AI 分析）

## 部署步骤

### 1. 克隆代码库

```bash
git clone https://github.com/yourusername/newsnow.git
cd newsnow
```

### 2. 配置环境变量

创建 `.env` 文件，包含所有必要的环境变量：

```bash
# 创建环境变量文件
cp .env.example .env
```

编辑 `.env` 文件，设置以下变量：

```
# 数据库配置
DATABASE_URL=file:/app/data/newsnow.db

# DeepSeek API 配置
DEEPSEEK_API_KEY=your_deepseek_api_key

# SearxNG 配置
SEARXNG_URL=http://searxng:8080

# 其他配置
INIT_TABLE=true
ENABLE_CACHE=true
```

### 3. 创建 Docker Compose 配置

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  # SearxNG 搜索引擎
  searxng:
    image: searxng/searxng:latest
    container_name: searxng
    ports:
      - "8080:8080"
    volumes:
      - ./searxng-data:/etc/searxng
    environment:
      - BASE_URL=http://localhost:8080/
      - INSTANCE_NAME=NewsSearxNG
    restart: unless-stopped
    networks:
      - newsnow-network

  # NewsNow Python 后端
  newsnow-python:
    build:
      context: ./newsnow-python
      dockerfile: Dockerfile
    container_name: newsnow-python
    ports:
      - "5001:5001"
    volumes:
      - ./data:/app/data
      - ./.env:/app/.env
    depends_on:
      - searxng
    environment:
      - SEARXNG_URL=http://searxng:8080
    restart: unless-stopped
    networks:
      - newsnow-network

  # NewsNow UI 前端
  newsnow-ui:
    build:
      context: ./newsnow-ui
      dockerfile: Dockerfile
    container_name: newsnow-ui
    ports:
      - "3002:3000"
    depends_on:
      - newsnow-python
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5001
    restart: unless-stopped
    networks:
      - newsnow-network

  # 定时任务容器
  newsnow-cron:
    build:
      context: ./newsnow-python
      dockerfile: Dockerfile.cron
    container_name: newsnow-cron
    volumes:
      - ./data:/app/data
      - ./.env:/app/.env
    depends_on:
      - searxng
      - newsnow-python
    environment:
      - SEARXNG_URL=http://searxng:8080
    restart: unless-stopped
    networks:
      - newsnow-network

networks:
  newsnow-network:
    driver: bridge
```

### 4. 创建 Dockerfile 文件

#### 4.1 Python 后端 Dockerfile

在 `newsnow-python` 目录中创建 `Dockerfile`：

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    libssl-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p data

# 暴露端口
EXPOSE 5001

# 启动命令
CMD ["python", "run.py", "--server"]
```

#### 4.2 定时任务 Dockerfile

在 `newsnow-python` 目录中创建 `Dockerfile.cron`：

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    libssl-dev \
    git \
    cron \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p data

# 设置定时任务
RUN echo "0 */2 * * * cd /app && python run.py --crawler --once >> /var/log/crawler.log 2>&1" > /etc/cron.d/newsnow-cron
RUN echo "30 */2 * * * cd /app && python run.py --processor --use-search --once >> /var/log/processor.log 2>&1" >> /etc/cron.d/newsnow-cron
RUN chmod 0644 /etc/cron.d/newsnow-cron
RUN crontab /etc/cron.d/newsnow-cron

# 创建日志文件
RUN touch /var/log/crawler.log /var/log/processor.log

# 启动 cron 服务
CMD ["cron", "-f"]
```

#### 4.3 UI 前端 Dockerfile

在 `newsnow-ui` 目录中创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json* ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED 1

# 构建应用
RUN npm run build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]
```

### 5. 配置 SearxNG

创建 `searxng-data` 目录并添加配置文件：

```bash
mkdir -p searxng-data
```

创建 `searxng-data/settings.yml` 文件：

```yaml
general:
  debug: false
  instance_name: "NewsSearxNG"
  
server:
  port: 8080
  bind_address: "0.0.0.0"
  secret_key: "生成一个随机密钥"
  
search:
  safe_search: 0
  autocomplete: "google"
  
ui:
  static_path: ""
  templates_path: ""
  default_theme: simple
  default_locale: zh
  
engines:
  - name: google
    engine: google
    shortcut: g
    disabled: false
  
  - name: bing
    engine: bing
    shortcut: b
    disabled: false
  
  - name: baidu
    engine: baidu
    shortcut: bd
    disabled: false
  
  - name: duckduckgo
    engine: duckduckgo
    shortcut: ddg
    disabled: false
  
  # 禁用 Reuters 以避免 401 错误
  - name: reuters
    engine: reuters
    disabled: true
```

### 6. 启动应用

```bash
# 构建并启动所有容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 7. 访问应用

- NewsNow UI: http://localhost:3002
- NewsNow API: http://localhost:5001
- SearxNG: http://localhost:8080

## 维护与故障排除

### 查看容器状态

```bash
docker-compose ps
```

### 查看容器日志

```bash
# 查看所有日志
docker-compose logs

# 查看特定服务的日志
docker-compose logs newsnow-python
docker-compose logs searxng
```

### 重启服务

```bash
docker-compose restart newsnow-python
```

### 常见问题

1. **SearxNG 搜索失败**
   - 检查 SearxNG 容器是否正常运行
   - 检查 SearxNG 配置文件中的引擎设置
   - 尝试禁用不可访问的搜索引擎

2. **AI 分析内容为空或使用模板**
   - 检查 DeepSeek API 密钥是否正确设置
   - 查看 newsnow-python 容器的日志以获取详细错误信息
   - 确保 SearxNG 能够正常工作，因为它为 AI 分析提供上下文

3. **定时任务未执行**
   - 检查 newsnow-cron 容器是否正常运行
   - 查看 cron 日志: `docker-compose exec newsnow-cron cat /var/log/crawler.log`

## 自定义配置

### 调整爬虫频率

编辑 `Dockerfile.cron` 中的 cron 表达式：

```dockerfile
# 每小时爬取一次
RUN echo "0 * * * * cd /app && python run.py --crawler --once >> /var/log/crawler.log 2>&1" > /etc/cron.d/newsnow-cron
```

### 添加新的新闻源

1. 在 `newsnow-python/sources` 目录中添加新的源文件
2. 在 `newsnow-python/run.py` 中注册新的源
3. 重新构建并重启容器：
   ```bash
   docker-compose build newsnow-python
   docker-compose up -d newsnow-python
   ```

## 备份与恢复

### 备份数据

```bash
# 备份数据库
docker-compose exec newsnow-python cp /app/data/newsnow.db /app/data/newsnow.db.backup

# 导出备份
docker cp newsnow-python:/app/data/newsnow.db.backup ./backups/
```

### 恢复数据

```bash
# 导入备份
docker cp ./backups/newsnow.db.backup newsnow-python:/app/data/

# 恢复数据库
docker-compose exec newsnow-python cp /app/data/newsnow.db.backup /app/data/newsnow.db
```

## 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动容器
docker-compose build
docker-compose up -d
```

## 安全建议

1. 不要将 `.env` 文件提交到版本控制系统
2. 定期更新 Docker 镜像以获取安全补丁
3. 如果公开部署，考虑使用 HTTPS 和反向代理（如 Nginx）
4. 限制容器的资源使用（CPU、内存）以防止资源耗尽

## 结论

按照本手册的指南，您应该能够成功部署 NewsNow 应用的完整版本，包括 SearxNG 搜索引擎、Python 后端、前端 UI 以及定时任务。如果遇到任何问题，请参考故障排除部分或查看相关服务的日志。
