/**
 * 任务调度器插件
 * 在服务器启动时初始化任务调度器并注册定时任务
 */
import { startScheduler } from '../utils/taskScheduler';
import { registerArticleProcessorTask } from '../tasks/articleProcessor';
import { registerFastBullProcessorTask } from '../tasks/fastbullProcessor';
import { registerWallStreetProcessorTask } from '../tasks/wallstreetProcessor';
import { registerJin10ProcessorTask } from '../tasks/jin10Processor';
import { registerGelonghuiProcessorTask } from '../tasks/gelonghuiProcessor';
import { logger } from '../utils/logger';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';

export default defineNitroPlugin(() => {
  logger.info('正在初始化任务调度器...');
  
  try {
    // 注册财联社文章处理任务
    registerArticleProcessorTask();
    
    // 注册FastBull文章处理任务
    registerFastBullProcessorTask();
    
    // 注册华尔街见闻文章处理任务
    registerWallStreetProcessorTask();
    
    // 注册金十数据文章处理任务
    registerJin10ProcessorTask();
    
    // 注册格隆汇文章处理任务
    registerGelonghuiProcessorTask();
    
    // 启动任务调度器
    startScheduler();
    
    logger.info('任务调度器初始化完成');
  } catch (error) {
    logger.error('任务调度器初始化失败', { error: error.message });
  }
});
