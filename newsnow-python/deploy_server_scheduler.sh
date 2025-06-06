#!/bin/bash

# NewsNow 服务器调度器部署脚本

set -e  # 遇到错误立即退出

echo "🚀 NewsNow 服务器调度器部署脚本"
echo "=================================="

# 获取当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "项目目录: $SCRIPT_DIR"

# 检查Python版本
echo "🐍 检查Python环境..."
python3 --version || {
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
}

# 检查pip
pip3 --version || {
    echo "❌ pip3 未安装，请先安装pip3"
    exit 1
}

# 安装依赖
echo "📦 安装Python依赖..."
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt
else
    echo "⚠️ requirements.txt 不存在，手动安装关键依赖..."
    pip3 install schedule requests beautifulsoup4 lxml python-dotenv
fi

# 检查关键文件
echo "📁 检查项目文件..."
required_files=(
    "crawlers/jin10.py"
    "crawlers/crawler_factory.py"
    "db/sqlite_client.py"
    "utils/enhanced_ai_service.py"
    "start_scheduler_server.py"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file 不存在"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ 缺少关键文件: ${missing_files[*]}"
    exit 1
fi

# 设置执行权限
echo "🔧 设置文件权限..."
chmod +x start_scheduler_server.py
chmod +x diagnose_server_scheduler.py

# 创建日志目录
echo "📝 创建日志目录..."
mkdir -p logs

# 运行诊断脚本
echo "🔍 运行环境诊断..."
python3 diagnose_server_scheduler.py

# 询问启动方式
echo ""
echo "选择启动方式:"
echo "1) 直接启动 (前台运行)"
echo "2) 后台启动 (nohup)"
echo "3) 安装为systemd服务"
echo "4) 仅测试，不启动"

read -p "请选择 (1-4): " choice

case $choice in
    1)
        echo "🚀 直接启动调度器..."
        python3 start_scheduler_server.py
        ;;
    2)
        echo "🚀 后台启动调度器..."
        nohup python3 start_scheduler_server.py > scheduler_nohup.log 2>&1 &
        echo "调度器已在后台启动，PID: $!"
        echo "查看日志: tail -f scheduler_nohup.log"
        echo "停止服务: kill $!"
        ;;
    3)
        echo "🔧 安装systemd服务..."
        
        # 更新服务文件中的路径
        sed "s|/path/to/your/newsnow-python|$SCRIPT_DIR|g" newsnow-scheduler.service > /tmp/newsnow-scheduler.service
        
        # 复制服务文件
        sudo cp /tmp/newsnow-scheduler.service /etc/systemd/system/
        
        # 重新加载systemd
        sudo systemctl daemon-reload
        
        # 启用服务
        sudo systemctl enable newsnow-scheduler
        
        # 启动服务
        sudo systemctl start newsnow-scheduler
        
        echo "✅ systemd服务已安装并启动"
        echo "查看状态: sudo systemctl status newsnow-scheduler"
        echo "查看日志: sudo journalctl -u newsnow-scheduler -f"
        echo "停止服务: sudo systemctl stop newsnow-scheduler"
        ;;
    4)
        echo "✅ 环境检查完成，未启动服务"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 常用命令:"
echo "  查看进程: ps aux | grep python"
echo "  查看日志: tail -f scheduler_server.log"
echo "  测试爬虫: python3 -c \"from crawlers.crawler_factory import CrawlerFactory; print('OK')\""
echo ""
echo "🔧 故障排除:"
echo "  1. 如果启动失败，运行: python3 diagnose_server_scheduler.py"
echo "  2. 检查依赖: pip3 list | grep -E '(schedule|requests|beautifulsoup4)'"
echo "  3. 检查权限: ls -la *.py"
echo "  4. 查看详细错误: python3 start_scheduler_server.py" 