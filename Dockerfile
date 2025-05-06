FROM node:20-alpine AS builder
WORKDIR /usr/src
COPY . .
RUN corepack enable
# 使用淘宝镜像源安装依赖
RUN npm install
# 安装 Sequelize 和 SQLite3
RUN npm install sequelize sqlite3 --save
# 构建应用
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/app
# 复制构建产物
COPY --from=builder /usr/src/dist/output/server ./server
COPY --from=builder /usr/src/dist/output/public ./public
COPY --from=builder /usr/src/dist/output/nitro.json ./nitro.json
# 复制 Sequelize 客户端实现
COPY --from=builder /usr/src/server/utils/sequelizeClient.js ./server/utils/sequelizeClient.js
# 复制整个node_modules目录以确保所有依赖都可用
COPY --from=builder /usr/src/node_modules ./node_modules
# 创建数据库目录并设置权限
RUN mkdir -p database && chmod 777 database
# 创建默认的环境变量文件（如果没有从外部挂载）
RUN echo "# 默认环境变量配置" > .env.server
RUN echo "DATABASE_URL=file:/usr/app/database/newsnow.db" >> .env.server
# 创建一个兼容性脚本，解决ES模块中的require问题
RUN echo "import { createRequire } from 'module'; global.require = createRequire(import.meta.url);" > esm-compat.js
# 创建一个空的数据库文件以确保权限正确
RUN touch database/newsnow.db && chmod 666 database/newsnow.db

ENV HOST=0.0.0.0 PORT=4444 NODE_ENV=production DATABASE_URL=file:/usr/app/database/newsnow.db PRISMA_CLIENT_PATH=./server/utils/sequelizeClient.js 
EXPOSE $PORT

# 创建启动脚本
COPY <<EOF /usr/app/entrypoint.sh
#!/bin/sh
# 确保数据库目录存在并有正确权限
mkdir -p /usr/app/database
chmod 777 /usr/app/database
touch /usr/app/database/newsnow.db
chmod 666 /usr/app/database/newsnow.db

# 启动应用
exec node --env-file .env.server --import ./esm-compat.js ./server/index.mjs
EOF

RUN chmod +x /usr/app/entrypoint.sh

# 使用初始化脚本启动应用
CMD ["/usr/app/entrypoint.sh"]
