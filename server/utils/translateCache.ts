/**
 * 翻译缓存模块
 * 用于缓存翻译结果，减少API调用
 */

import { logger } from "./logger"

// 缓存接口
interface TranslationCacheItem {
  result: string
  timestamp: number
}

// 缓存配置
const CACHE_CONFIG = {
  // 缓存过期时间（毫秒）- 默认24小时
  EXPIRATION_TIME: 24 * 60 * 60 * 1000,
  // 最大缓存条目数
  MAX_ENTRIES: 10000,
}

// 缓存存储
class TranslationCache {
  private cache: Map<string, TranslationCacheItem> = new Map()

  // 生成缓存键
  private generateKey(text: string, fromLang: string, toLang: string): string {
    return `${fromLang}:${toLang}:${text}`
  }

  // 获取缓存
  get(text: string, fromLang: string, toLang: string): string | null {
    const key = this.generateKey(text, fromLang, toLang)
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // 检查缓存是否过期
    const now = Date.now()
    if (now - item.timestamp > CACHE_CONFIG.EXPIRATION_TIME) {
      this.cache.delete(key)
      return null
    }

    logger.debug(`[翻译缓存] 命中: ${fromLang} -> ${toLang}, 文本: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`)
    return item.result
  }

  // 设置缓存
  set(text: string, fromLang: string, toLang: string, result: string): void {
    const key = this.generateKey(text, fromLang, toLang)

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= CACHE_CONFIG.MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    })

    logger.debug(`[翻译缓存] 存储: ${fromLang} -> ${toLang}, 文本: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`)
  }

  // 清除过期缓存
  cleanExpired(): void {
    const now = Date.now()
    let expiredCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > CACHE_CONFIG.EXPIRATION_TIME) {
        this.cache.delete(key)
        expiredCount++
      }
    }

    if (expiredCount > 0) {
      logger.debug(`[翻译缓存] 清理了 ${expiredCount} 条过期缓存`)
    }
  }

  // 获取缓存统计信息
  getStats(): { size: number, memoryUsageEstimate: string } {
    // 估算内存使用量（粗略计算）
    let totalBytes = 0
    for (const [key, item] of this.cache.entries()) {
      // 键的大小 + 值的大小 + 时间戳的大小
      totalBytes += key.length * 2 + item.result.length * 2 + 8
    }

    // 转换为可读格式
    const memoryUsage = totalBytes < 1024
      ? `${totalBytes} B`
      : totalBytes < 1024 * 1024
        ? `${(totalBytes / 1024).toFixed(2)} KB`
        : `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`

    return {
      size: this.cache.size,
      memoryUsageEstimate: memoryUsage,
    }
  }
}

// 导出单例实例
export const translationCache = new TranslationCache()

// 定期清理过期缓存（每小时）
setInterval(() => {
  translationCache.cleanExpired()
}, 60 * 60 * 1000)
