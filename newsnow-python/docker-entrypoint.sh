#!/bin/bash
set -e

# 打印调试信息
echo "============ 启动定时任务容器（包含AI批量处理器）============"
echo "当前时间: $(date)"

# 检查环境变量
echo "检查关键环境变量:"
if [ -n "$DEEPSEEK_API_KEY" ]; then
  echo "DEEPSEEK_API_KEY: 已设置"
else
  echo "DEEPSEEK_API_KEY: 未设置，将以有限模式运行"
fi

if [ -n "$SEARXNG_URL" ]; then
  echo "SEARXNG_URL: $SEARXNG_URL"
else
  echo "SEARXNG_URL: 未设置，使用默认值"
fi

# 确保日志文件存在并有正确的权限
echo "确保日志文件存在并有正确的权限..."
mkdir -p /app/logs
touch /app/logs/crawler.log /app/logs/processor.log /app/logs/scheduler.log /app/logs/quality_enhancement.log /app/logs/ai_batch_scheduler.log /app/logs/ai_cron.log
chmod 666 /app/logs/crawler.log /app/logs/processor.log /app/logs/scheduler.log /app/logs/quality_enhancement.log /app/logs/ai_batch_scheduler.log /app/logs/ai_cron.log

# 立即执行一次爬虫任务
echo "首次运行爬虫任务..."
cd /app && python run.py --crawler --once >> /app/logs/crawler.log 2>&1

# 等待一段时间后执行处理器任务
echo "等待30秒后运行处理器任务..."
sleep 30
cd /app && python run.py --processor --use-search --once >> /app/logs/processor.log 2>&1

# 等待一段时间后执行质量增强任务
echo "等待30秒后运行质量增强任务..."
sleep 30
cd /app && python quality_enhancement_scheduler.py --once >> /app/logs/quality_enhancement.log 2>&1

# 等待一段时间后执行AI批量处理任务
echo "等待30秒后运行AI批量处理任务..."
sleep 30
cd /app && python ai_batch_scheduler.py --once --batch-size 3 --max-batches 5 >> /app/logs/ai_batch_scheduler.log 2>&1

# 设置cron任务
echo "设置cron定时任务..."
cat > /etc/cron.d/newsnow << EOF
# NewsNow 定时任务配置
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY
SEARXNG_URL=$SEARXNG_URL

# 每2小时执行一次爬虫任务
0 */2 * * * root cd /app && python run.py --crawler --once >> /app/logs/crawler.log 2>&1

# 每2小时15分执行一次处理器任务
15 */2 * * * root cd /app && python run.py --processor --use-search --once >> /app/logs/processor.log 2>&1

# 每30分钟执行一次质量增强任务
*/30 * * * * root cd /app && python quality_enhancement_scheduler.py --once --batch 10 >> /app/logs/quality_enhancement.log 2>&1

# 每20分钟执行一次AI批量处理任务
*/20 * * * * root cd /app && python ai_batch_scheduler.py --once --batch-size 3 --max-batches 5 >> /app/logs/ai_cron.log 2>&1

# 每天凌晨2点执行质量统计任务
0 2 * * * root cd /app && python quality_enhancement_scheduler.py --once --task stats >> /app/logs/quality_enhancement.log 2>&1

# 每天凌晨3点执行大批量AI处理任务（清理积压）
0 3 * * * root cd /app && python ai_batch_scheduler.py --once --batch-size 5 --max-batches 20 >> /app/logs/ai_cron.log 2>&1

EOF

# 设置cron文件权限
chmod 0644 /etc/cron.d/newsnow

# 启动cron服务
echo "启动cron服务..."
service cron start

# 显示cron任务
echo "已设置的cron任务:"
crontab -l 2>/dev/null || echo "无用户级cron任务"
cat /etc/cron.d/newsnow

# 保持容器运行并显示日志
echo "定时任务已设置，容器将持续运行..."
echo "任务调度:"
echo "- 爬虫任务: 每2小时执行一次"
echo "- 处理器任务: 每2小时15分执行一次"
echo "- 质量增强任务: 每30分钟执行一次"
echo "- AI批量处理任务: 每20分钟执行一次"
echo "- 质量统计任务: 每天凌晨2点执行一次"
echo "- 大批量AI处理: 每天凌晨3点执行一次（清理积压）"
echo ""
echo "环境变量配置:"
echo "- DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY:0:10}..."
echo "- SEARXNG_URL: $SEARXNG_URL"
echo ""
echo "实时日志输出:"

# 实时显示所有日志
tail -f /app/logs/crawler.log /app/logs/processor.log /app/logs/scheduler.log /app/logs/quality_enhancement.log /app/logs/ai_batch_scheduler.log /app/logs/ai_cron.log
