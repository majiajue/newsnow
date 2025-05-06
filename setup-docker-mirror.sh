#!/bin/bash

# 创建 Docker 配置目录
mkdir -p ~/.docker

# 创建或修改 Docker 配置文件
cat > ~/.docker/config.json << EOF
{
  "registry-mirrors": [
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF

echo "Docker 镜像源已配置，请重启 Docker 服务以应用更改"
echo "在 macOS 上，可以通过点击 Docker Desktop 菜单栏图标，选择 Restart 来重启 Docker"
