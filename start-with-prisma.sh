#!/bin/bash

echo "启动应用程序，使用真实的 Prisma 客户端..."
NODE_OPTIONS="--import ./esm-compat.js" npm run dev
