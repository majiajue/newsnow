#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
API服务器启动脚本
"""

import os
import argparse
import logging
# 修改为绝对导入路径
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.api_server import create_api_server
from config.settings import API_PORT

def setup_logging():
    """设置日志配置"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    )
    return logging.getLogger(__name__)

def main():
    """主函数"""
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='财经新闻API服务器')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='服务器主机地址')
    parser.add_argument('--port', type=int, default=API_PORT, help='服务器端口号')
    parser.add_argument('--debug', action='store_true', help='启用调试模式')
    args = parser.parse_args()
    
    # 设置日志
    logger = setup_logging()
    logger.info(f"API服务器启动中...")
    
    # 创建API服务器，使用不同端口避免冲突
    api_server = create_api_server(host=args.host, port=5001)
    
    if args.debug:
        api_server.run_debug()
    else:
        api_server.run()

if __name__ == "__main__":
    main()
