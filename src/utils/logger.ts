// 前端结构化日志工具
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
} as const;

type LogLevel = typeof LogLevel[keyof typeof LogLevel];

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  private format(message: string, data?: any) {
    return {
      time: new Date().toISOString(),
      message,
      ...data
    };
  }

  debug(message: string, data?: any) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug('[DEBUG]', this.format(message, data));
    }
  }

  info(message: string, data?: any) {
    if (this.level <= LogLevel.INFO) {
      console.log('[INFO]', this.format(message, data));
    }
  }

  warn(message: string, data?: any) {
    if (this.level <= LogLevel.WARN) {
      console.warn('[WARN]', this.format(message, data));
    }
  }

  error(message: string, data?: any) {
    if (this.level <= LogLevel.ERROR) {
      console.error('[ERROR]', this.format(message, data));
    }
  }
}

// 导出默认实例（开发模式显示所有日志）
export default new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);
