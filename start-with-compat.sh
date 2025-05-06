#!/bin/bash

# 输出信息
echo "启动应用程序，使用 ES 模块兼容层..."

# 使用 Node.js 的 --require 选项预加载兼容层
NODE_OPTIONS="--experimental-specifier-resolution=node --experimental-modules --import=./es-module-fix.js" npm run dev
