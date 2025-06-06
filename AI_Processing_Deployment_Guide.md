# NewsNow AI处理部署指南

## 🎯 AI处理时机说明

### 当前处理流程
1. **实时处理**: 爬虫获取文章时立即尝试AI分析
2. **失败保存**: API失败时文章保存为"未处理"状态  
3. **批量补充**: 定时任务处理积压的未分析文章

### 优化后的处理策略
- ✅ **不影响现有流程**: 爬虫仍会实时尝试AI分析
- ✅ **智能重试机制**: API限流时自动等待重试
- ✅ **批量处理器**: 定期处理积压文章，确保100%覆盖

## 📅 推荐的定时任务配置

### 方案一：保守配置（推荐）
```bash
# 每20分钟运行一次AI批量处理
*/20 * * * * cd /path/to/newsnow/newsnow-python && python3 ai_batch_scheduler.py --once --batch-size 3 --max-batches 5

# 或者使用独立调度器（后台运行）
nohup python3 ai_batch_scheduler.py --interval 20 --batch-size 3 --max-batches 5 > logs/ai_scheduler.log 2>&1 &
```

### 方案二：积极配置
```bash
# 每10分钟运行一次，处理更多文章
*/10 * * * * cd /path/to/newsnow/newsnow-python && python3 ai_batch_scheduler.py --once --batch-size 5 --max-batches 8
```

### 方案三：集成到现有调度器
修改 `newsnow-python/scheduler.py`，添加AI批量处理任务。

## 🚀 部署步骤

### 1. 测试AI批量处理器
```bash
cd newsnow-python
python3 ai_batch_scheduler.py --once --batch-size 3 --max-batches 2
```

### 2. 配置crontab定时任务
```bash
# 编辑crontab
crontab -e

# 添加以下行（每20分钟执行一次）
*/20 * * * * cd /Users/majiajue/Desktop/newsnow/newsnow-python && python3 ai_batch_scheduler.py --once --batch-size 3 --max-batches 5 >> logs/ai_cron.log 2>&1
```

### 3. 验证定时任务
```bash
# 查看crontab配置
crontab -l

# 查看执行日志
tail -f newsnow-python/logs/ai_cron.log
```

## ⚙️ 参数说明

### ai_batch_scheduler.py 参数
- `--once`: 仅运行一次（适合cron）
- `--interval 20`: 定时间隔20分钟（适合后台运行）
- `--batch-size 3`: 每批处理3篇文章
- `--max-batches 5`: 单次最多处理5批（防止运行时间过长）

### 推荐配置
```bash
# 生产环境推荐配置
python3 ai_batch_scheduler.py --once --batch-size 3 --max-batches 5
```

**说明**：
- 每批3篇文章，批次间等待60秒
- 最多5批，单次运行约15-20分钟
- 每20分钟运行一次，确保及时处理积压

## 📊 监控和维护

### 1. 日志监控
```bash
# 查看AI批量处理日志
tail -f newsnow-python/logs/ai_batch_scheduler-*.log

# 查看cron执行日志
tail -f newsnow-python/logs/ai_cron.log
```

### 2. 数据库检查
```bash
# 检查未处理文章数量
cd newsnow-python
python3 -c "
from db.sqlite_client import SQLiteClient
db = SQLiteClient()
count = len(db.get_unprocessed_articles(limit=1000))
print(f'未处理文章数量: {count}')
"
```

### 3. 性能指标
- **处理成功率**: 应保持在90%以上
- **积压文章数**: 应控制在50篇以内
- **API调用频率**: 每分钟不超过8次

## 🔧 故障排除

### 常见问题

#### 1. API密钥错误
```bash
# 检查环境变量
echo $DEEPSEEK_API_KEY

# 更新.env文件
vim newsnow-python/.env
```

#### 2. 积压文章过多
```bash
# 临时增加处理批次
python3 ai_batch_scheduler.py --once --batch-size 5 --max-batches 20
```

#### 3. 定时任务未执行
```bash
# 检查cron服务状态
sudo service cron status

# 查看cron日志
grep CRON /var/log/syslog
```

## 💡 最佳实践

### 1. 分层处理策略
- **实时处理**: 爬虫时立即尝试（主要）
- **定时补充**: 每20分钟处理积压（补充）
- **深夜清理**: 每天凌晨处理所有积压（保底）

### 2. 资源控制
- 限制单次运行时间（max-batches参数）
- 控制API调用频率（文章间延迟）
- 监控系统资源使用

### 3. 容错机制
- API失败时使用备用分析内容
- 重试机制处理临时网络问题
- 详细日志记录便于问题排查

## 🎉 部署确认清单

- [ ] ✅ 现有爬虫流程正常工作
- [ ] ✅ AI批量处理器测试成功
- [ ] ✅ 定时任务配置正确
- [ ] ✅ 日志输出正常
- [ ] ✅ 监控脚本就位
- [ ] ✅ 备份和恢复方案

**您可以放心部署！优化不会影响现有流程，只会增强AI分析的覆盖率和稳定性。** 🚀 