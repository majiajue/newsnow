import { defineEventHandler, getQuery } from "h3"
import { getCacheTable } from "../database/cache"
import { logger } from "../utils/logger"

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const key = query.key as string
    const all = query.all === "true"

    // 获取缓存表
    const cacheTable = await getCacheTable()

    if (!cacheTable) {
      return { success: false, message: "缓存表初始化失败" }
    }

    // 清除指定的缓存或所有缓存
    if (all) {
      // 获取所有缓存键
      const keys = await cacheTable.keys()
      if (keys.length > 0) {
        for (const cacheKey of keys) {
          await cacheTable.delete(cacheKey)
        }
        logger.success(`已清除所有缓存，共 ${keys.length} 项`)
        return { success: true, message: `已清除所有缓存，共 ${keys.length} 项` }
      } else {
        return { success: true, message: "没有缓存需要清除" }
      }
    } else if (key) {
      // 清除指定的缓存
      await cacheTable.delete(key)
      logger.success(`已清除缓存: ${key}`)
      return { success: true, message: `已清除缓存: ${key}` }
    } else {
      return { success: false, message: "请提供 key 参数或设置 all=true" }
    }
  } catch (error) {
    logger.error(`清除缓存出错: ${error}`)
    return { success: false, message: `清除缓存出错: ${error}` }
  }
})
