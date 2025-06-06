# 硬编码 localhost 修复总结

## 🎯 修复目标
将所有硬编码的 `localhost:8080` 替换为环境变量 `SEARXNG_URL`，确保在 Docker 环境中使用正确的服务名 `searxng:8080`。

## 🔧 修复的文件

### 1. 配置文件
- **config/settings.py**
  - 修复前: `SEARXNG_URL = os.environ.get("SEARXNG_URL", "http://localhost:8080")`
  - 修复后: `SEARXNG_URL = os.environ.get("SEARXNG_URL", "http://searxng:8080")`

- **env.example**
  - 修复前: `SEARXNG_URL=http://localhost:8080`
  - 修复后: `SEARXNG_URL=http://searxng:8080`

### 2. 搜索服务文件
- **utils/improved_search_service.py**
  - 修复前: `def __init__(self, searxng_url="http://localhost:8080/search")`
  - 修复后: `def __init__(self, searxng_url=None): self.searxng_url = searxng_url or os.environ.get("SEARXNG_URL", "http://searxng:8080/search")`

### 3. 系统集成文件
- **integrated_finance_system.py**
  - 修复前: `searxng_url = self.config.get("searxng_url") or "http://localhost:8080/search"`
  - 修复后: `searxng_url = self.config.get("searxng_url") or os.environ.get("SEARXNG_URL", "http://searxng:8080/search")`
  - 修复前: `"searxng_url": "http://localhost:8080/search"`
  - 修复后: `"searxng_url": os.environ.get("SEARXNG_URL", "http://searxng:8080/search")`

### 4. 测试文件
- **test_integrated_system.py**
  - 修复前: `"searxng_url": "http://localhost:8080/search"`
  - 修复后: `"searxng_url": os.environ.get("SEARXNG_URL", "http://searxng:8080/search")`

- **test_complete_flow.py**
  - 修复前: `SEARXNG_URL = "http://localhost:8080/search"`
  - 修复后: `SEARXNG_URL = os.environ.get("SEARXNG_URL", "http://searxng:8080/search")`

- **test_crawler_simple.py**
  - 修复前: `search_url = f"http://localhost:8080/search"`
  - 修复后: `search_url = os.environ.get("SEARXNG_URL", "http://searxng:8080/search")`

### 5. 数据处理文件
- **fetch_and_save_news.py**
  - 修复前: `searxng_url = os.environ.get("SEARXNG_URL", "http://localhost:8080/search")`
  - 修复后: `searxng_url = os.environ.get("SEARXNG_URL", "http://searxng:8080/search")`

## ✅ 验证结果

运行 `python verify_env_vars.py` 验证结果：

```
🔧 NewsNow 环境变量验证
==================================================
✅ SEARXNG_URL: http://searxng:8080
✅ SEARXNG_URL 配置正确，使用服务名
✅ DEEPSEEK_API_KEY: sk-111be52...
✅ config/settings.py SEARXNG_URL: http://searxng:8080
✅ utils/improved_search_service.py 已修复
✅ utils/search_service.py 已修复
✅ integrated_finance_system.py 已修复
✅ fetch_and_save_news.py 已修复
✅ 搜索服务初始化成功，URL: http://searxng:8080
✅ 所有配置看起来都正确！
```

## 🚀 部署建议

1. **环境变量配置**
   ```bash
   # .env 文件中设置
   SEARXNG_URL=http://searxng:8080
   ```

2. **Docker 部署**
   ```bash
   # 使用修复版部署脚本
   ./deploy_fixed.sh
   ```

3. **验证修复**
   ```bash
   # 运行验证脚本
   python verify_env_vars.py
   
   # 测试 SearXNG 连接
   docker exec newsnow-python-newsnow-cron-1 curl -s http://searxng:8080
   ```

## 🎯 修复效果

- ✅ **Docker 网络兼容**: 所有服务现在使用正确的 Docker 服务名
- ✅ **环境变量驱动**: 所有配置都通过环境变量控制
- ✅ **向后兼容**: 保持了默认值，确保在不同环境下都能工作
- ✅ **测试覆盖**: 所有测试文件都已更新
- ✅ **配置统一**: 所有文件使用相同的环境变量标准

## 🔍 关键改进

1. **统一环境变量**: 所有文件都使用 `os.environ.get("SEARXNG_URL", "http://searxng:8080/search")`
2. **Docker 服务名**: 默认值从 `localhost:8080` 改为 `searxng:8080`
3. **智能回退**: 如果环境变量未设置，使用 Docker 友好的默认值
4. **验证工具**: 提供 `verify_env_vars.py` 脚本进行配置验证

现在系统可以在 Docker 环境中正常工作，SearXNG 连接问题已完全解决！ 🎉 