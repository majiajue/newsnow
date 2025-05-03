import { defineEventHandler } from 'h3';
import requestValidator from './requestValidator';

// 导出中间件处理函数
export default defineEventHandler(async (event) => {
  // 按顺序执行中间件
  return await requestValidator(event);
});
