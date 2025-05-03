/**
 * 定时任务调度器
 * 用于管理和执行定时任务
 */
import { logger } from './logger';

// 任务类型定义
export interface Task {
  id: string;
  name: string;
  interval: number; // 间隔时间（毫秒）
  lastRun?: number; // 上次运行时间戳
  fn: () => Promise<void>; // 任务执行函数
  isRunning?: boolean; // 是否正在运行
}

// 任务列表
const tasks: Map<string, Task> = new Map();
// 定时器ID
let schedulerTimer: NodeJS.Timeout | null = null;
// 调度间隔（毫秒）
const SCHEDULER_INTERVAL = 60 * 1000; // 1分钟

/**
 * 注册任务
 * @param task 任务对象
 */
export function registerTask(task: Task): void {
  if (tasks.has(task.id)) {
    logger.warn(`任务 ${task.id} 已存在，将被覆盖`);
  }
  tasks.set(task.id, task);
  logger.info(`已注册任务: ${task.name} (${task.id}), 间隔: ${task.interval / 1000}秒`);
}

/**
 * 取消注册任务
 * @param taskId 任务ID
 */
export function unregisterTask(taskId: string): void {
  if (tasks.has(taskId)) {
    tasks.delete(taskId);
    logger.info(`已取消注册任务: ${taskId}`);
  }
}

/**
 * 执行任务
 * @param taskId 任务ID
 */
export async function runTask(taskId: string): Promise<void> {
  const task = tasks.get(taskId);
  if (!task) {
    logger.error(`任务不存在: ${taskId}`);
    return;
  }

  if (task.isRunning) {
    logger.warn(`任务 ${task.name} (${task.id}) 正在运行，跳过本次执行`);
    return;
  }

  try {
    task.isRunning = true;
    logger.info(`开始执行任务: ${task.name} (${task.id})`);
    const startTime = Date.now();
    await task.fn();
    const duration = Date.now() - startTime;
    task.lastRun = Date.now();
    logger.info(`任务执行完成: ${task.name} (${task.id}), 耗时: ${duration}ms`);
  } catch (error) {
    logger.error(`任务执行失败: ${task.name} (${task.id})`, { error });
  } finally {
    task.isRunning = false;
  }
}

/**
 * 调度器主循环
 */
async function schedulerLoop(): Promise<void> {
  const now = Date.now();
  
  for (const [taskId, task] of tasks.entries()) {
    // 如果任务从未运行过，或者已经到达下次运行时间
    if (!task.lastRun || (now - task.lastRun >= task.interval)) {
      runTask(taskId).catch(error => {
        logger.error(`调度器执行任务失败: ${taskId}`, { error });
      });
    }
  }
}

/**
 * 启动调度器
 */
export function startScheduler(): void {
  if (schedulerTimer) {
    logger.warn('调度器已经在运行中');
    return;
  }

  // 立即执行一次调度
  schedulerLoop().catch(error => {
    logger.error('调度器初始循环失败', { error });
  });

  // 设置定时调度
  schedulerTimer = setInterval(() => {
    schedulerLoop().catch(error => {
      logger.error('调度器循环失败', { error });
    });
  }, SCHEDULER_INTERVAL);

  logger.info(`调度器已启动，调度间隔: ${SCHEDULER_INTERVAL / 1000}秒`);
}

/**
 * 停止调度器
 */
export function stopScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    logger.info('调度器已停止');
  }
}
