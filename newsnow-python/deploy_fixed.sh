#!/bin/bash
# NewsNow 修复版部署脚本 - 解决SearXNG连接问题

set -e

echo "🔧 NewsNow 修复版部署 - 解决Docker网络连接问题"
echo "=================================================="

# 检查必要文件
echo "📋 检查必要文件..."
required_files=(
    "docker-compose.quality.yml"
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

# 检查环境变量
echo "🔍 检查环境变量配置..."
if grep -q "SEARXNG_URL=http://searxng:8080" .env; then
    echo "✅ SearXNG URL 已正确配置为 Docker 服务名"
else
    echo "⚠️  SearXNG URL 配置可能有问题，当前配置:"
    grep SEARXNG_URL .env || echo "未找到 SEARXNG_URL 配置"
fi

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose -f docker-compose.quality.yml down 2>/dev/null || true

# 清理旧容器和网络
echo "🧹 清理旧容器和网络..."
docker system prune -f

# 构建镜像
echo "🔨 构建Docker镜像..."
docker-compose -f docker-compose.quality.yml build

# 启动服务
echo "🚀 启动服务..."
docker-compose -f docker-compose.quality.yml up -d

# 等待服务启动
echo "⏰ 等待服务启动..."
sleep 15

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose -f docker-compose.quality.yml ps

# 检查SearXNG连接
echo "🔍 测试SearXNG连接..."
sleep 10
if docker exec newsnow-python-newsnow-cron-1 curl -s http://searxng:8080 > /dev/null 2>&1; then
    echo "✅ SearXNG 服务连接正常"
else
    echo "❌ SearXNG 服务连接失败，检查网络配置"
fi

# 显示日志
echo "📝 显示初始日志..."
docker-compose -f docker-compose.quality.yml logs --tail 20

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 服务信息:"
echo "- API服务: http://localhost:8088"
echo "- SearXNG搜索: http://localhost:8080"
echo "- 定时任务: 已启动"
echo ""
echo "🔧 常用命令:"
echo "- 查看日志: docker-compose -f docker-compose.quality.yml logs -f"
echo "- 重启服务: docker-compose -f docker-compose.quality.yml restart"
echo "- 停止服务: docker-compose -f docker-compose.quality.yml down"
echo ""
echo "🔍 测试命令:"
echo "- 测试SearXNG: curl http://localhost:8080"
echo "- 检查AI处理: docker exec newsnow-python-newsnow-cron-1 python check_ai_content.py"
echo "- 手动AI处理: docker exec newsnow-python-newsnow-cron-1 python ai_batch_scheduler.py --once --batch-size 3" 