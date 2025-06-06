#!/bin/bash

# NewsNow 完整系统启动脚本（包含内容质量增强）

echo "🚀 启动 NewsNow 完整系统..."

# 检查环境变量
if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "⚠️  警告: DEEPSEEK_API_KEY 未设置，将以有限模式运行"
    echo "   设置方法: export DEEPSEEK_API_KEY=your_api_key"
fi

# 创建日志目录
mkdir -p logs

echo "📊 启动API服务器..."
# 启动API服务器（后台运行）
python api/api_server.py &
API_PID=$!
echo "API服务器已启动 (PID: $API_PID) - http://localhost:8088"

sleep 3

echo "🔄 启动主调度器（包含质量增强）..."
# 启动主调度器，包含所有任务
python scheduler.py --task all --quality-interval 30 --crawl-interval 60 --process-interval 30 --search-interval 120

# 清理函数
cleanup() {
    echo "🛑 正在停止服务..."
    kill $API_PID 2>/dev/null
    echo "✅ 所有服务已停止"
    exit 0
}

# 捕获中断信号
trap cleanup SIGINT SIGTERM

# 等待
wait
