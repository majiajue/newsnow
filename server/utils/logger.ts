import pino from 'pino';

declare module '~/utils/logger' {
  export const logger: pino.Logger;
}

// 修改为命名导出
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      destination: './logs/server.log',
      mkdir: true
    }
  },
  formatters: {
    level: (label) => ({ level: label.toUpperCase() })
  }
});
