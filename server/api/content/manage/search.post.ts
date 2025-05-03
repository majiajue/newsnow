/**
 * 搜索内容API
 * 提供内容搜索功能，支持关键词、分类、标签等条件
 */

import { defineEventHandler, readBody } from "h3"
import { logger } from "../../../utils/logger"
import { searchContent as searchContentFromManager } from "../../../utils/contentManager"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { keyword, category, tag, status, minQuality, page, pageSize, sortBy, sortOrder } = body

    logger.info(`搜索内容: ${JSON.stringify(body)}`)
    
    // 添加超时控制机制，防止请求无限等待
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("搜索请求超时")), 30000) // 30秒超时
    })
    
    // 实际搜索操作
    const searchPromise = searchContentFromManager({
      keyword,
      category,
      tag,
      status,
      minQuality,
      page,
      pageSize,
      sortBy,
      sortOrder
    })
    
    // 使用Promise.race实现请求竞争
    const result = await Promise.race([searchPromise, timeoutPromise]) as any
    
    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    logger.error(`搜索内容失败: ${error.message}`)
    return {
      success: false,
      error: `搜索内容失败: ${error.message}`
    }
  }
})
