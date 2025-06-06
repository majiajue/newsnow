#!/bin/bash
# NewsNow AI批量处理器 Docker 构建和部署脚本

set -e

echo "🚀 开始构建和部署 NewsNow AI批量处理器..."

# 检查必要文件
echo "📋 检查必要文件..."
required_files=(
    "ai_batch_scheduler.py"
    "batch_ai_processor.py" 
    "utils/enhanced_ai_service.py"
    "utils/api_rate_limiter.py"
    "Dockerfile.cron"
    "docker-entrypoint.sh"
    ".env"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少必要文件: $file"
        exit 1
    fi
done

echo "✅ 所有必要文件检查完成"

# 构建Docker镜像
echo "🔨 构建Docker镜像..."
docker build -f Dockerfile.cron -t newsnow-ai-processor:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker镜像构建成功"
else
    echo "❌ Docker镜像构建失败"
    exit 1
fi

# 停止现有容器（如果存在）
echo "🛑 停止现有容器..."
docker stop newsnow-ai-processor 2>/dev/null || true
docker rm newsnow-ai-processor 2>/dev/null || true

# 启动新容器
echo "🚀 启动新容器..."
docker run -d \
    --name newsnow-ai-processor \
    --restart unless-stopped \
    -v $(pwd)/data:/app/data \
    -v $(pwd)/logs:/app/logs \
    --env-file .env \
    newsnow-ai-processor:latest

if [ $? -eq 0 ]; then
    echo "✅ 容器启动成功"
else
    echo "❌ 容器启动失败"
    exit 1
fi

# 等待容器启动
echo "⏰ 等待容器初始化..."
sleep 10

# 检查容器状态
echo "📊 检查容器状态..."
docker ps | grep newsnow-ai-processor

# 显示初始日志
echo "📝 显示初始日志..."
docker logs newsnow-ai-processor --tail 20

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 容器信息:"
echo "- 容器名称: newsnow-ai-processor"
echo "- 镜像版本: newsnow-ai-processor:latest"
echo "- 重启策略: unless-stopped"
echo ""
echo "📅 定时任务配置:"
echo "- 爬虫任务: 每2小时执行一次"
echo "- 处理器任务: 每2小时15分执行一次" 
echo "- 质量增强任务: 每30分钟执行一次"
echo "- AI批量处理: 每20分钟执行一次"
echo "- 质量统计: 每天凌晨2点执行一次"
echo "- 大批量AI处理: 每天凌晨3点执行一次（清理积压）"
echo ""
echo "🔧 常用命令:"
echo "- 查看日志: docker logs -f newsnow-ai-processor"
echo "- 进入容器: docker exec -it newsnow-ai-processor bash"
echo "- 停止容器: docker stop newsnow-ai-processor"
echo "- 重启容器: docker restart newsnow-ai-processor"
echo ""
echo "📊 监控命令:"
echo "- 查看AI处理日志: docker exec newsnow-ai-processor tail -f /app/logs/ai_cron.log"
echo "- 查看所有日志: docker exec newsnow-ai-processor tail -f /app/logs/*.log"
echo "- 检查未处理文章: docker exec newsnow-ai-processor python -c \"from db.sqlite_client import SQLiteClient; db = SQLiteClient(); print(f'未处理文章: {len(db.get_unprocessed_articles(limit=1000))} 篇')\"" 