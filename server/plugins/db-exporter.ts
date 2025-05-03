/**
 * 数据库导出插件
 * 在服务器启动时启动定时导出任务
 */
import { startScheduledExport } from '../utils/dbToJsonExporter';
import { consola } from 'consola';

export default defineNitroPlugin(() => {
  consola.info('启动数据库导出插件...');
  startScheduledExport();
});
