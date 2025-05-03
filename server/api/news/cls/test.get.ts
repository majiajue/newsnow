/**
 * 测试API端点
 * 简单返回JSON数据，用于测试API响应是否正确
 */
import { defineEventHandler, setResponseHeader } from 'h3';
import { logger } from '#/utils/logger';

export default defineEventHandler(async (event) => {
  // 设置响应头
  setResponseHeader(event, 'Content-Type', 'application/json');
  
  logger.info('测试API端点被访问');
  
  // 返回简单的JSON数据
  return {
    code: 0,
    message: '测试成功',
    timestamp: new Date().toISOString()
  };
});
