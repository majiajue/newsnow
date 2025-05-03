/**
 * 获取所有标签API
 * 提供获取系统中所有内容标签的功能
 */

import { defineEventHandler } from "h3"
import { logger } from "../../../utils/logger"
import { getAllTags } from "../../../utils/contentManager"

export default defineEventHandler(async (event) => {
  try {
    logger.info('获取所有标签')
    
    // 添加超时控制机制，防止请求无限等待
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("获取标签请求超时")), 10000) // 10秒超时
    })
    
    // 实际获取操作
    const tagsPromise = getAllTags()
    
    // 使用Promise.race实现请求竞争
    const tags = await Promise.race([tagsPromise, timeoutPromise]) as string[]
    
    return {
      success: true,
      data: tags
    }
  } catch (error: any) {
    logger.error(`获取所有标签失败: ${error.message}`)
    return {
      success: false,
      error: `获取所有标签失败: ${error.message}`
    }
  }
})
