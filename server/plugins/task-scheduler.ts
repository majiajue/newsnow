/**
 * 任务调度器插件
 * 在服务器启动时初始化任务调度器并注册定时任务
 */
import { startScheduler } from '../utils/taskScheduler';
import { registerArticleProcessorTask } from '../tasks/articleProcessor';
import { logger } from '../utils/logger';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';

export default defineNitroPlugin(() => {
  logger.info('正在初始化任务调度器...');
  
  try {
    // 注册文章处理任务
    registerArticleProcessorTask();
    
    // 启动任务调度器
    startScheduler();
    
    logger.info('任务调度器初始化完成');
  } catch (error) {
    logger.error('任务调度器初始化失败', { error: error.message });
  }
});
