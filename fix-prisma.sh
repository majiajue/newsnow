#!/bin/bash

# 创建 ES 模块兼容性脚本
echo "创建 ES 模块兼容性脚本..."
cat > ./esm-compat.js << 'EOF'
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);
EOF

# 启动应用程序
echo "使用 ES 模块兼容性脚本启动应用程序..."
NODE_OPTIONS="--import ./esm-compat.js" npm run dev
