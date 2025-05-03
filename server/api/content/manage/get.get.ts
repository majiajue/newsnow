/**
 * 获取内容API
 * 提供获取单个内容的功能
 */

import { defineEventHandler, getQuery } from "h3"
import { logger } from "../../../utils/logger"
import { getContent } from "../../../utils/contentManager"

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const id = query.id as string

    if (!id) {
      return {
        success: false,
        error: "缺少必要参数: id"
      }
    }

    logger.info(`获取内容: ${id}`)
    
    // 获取内容
    const result = await getContent(id)
    
    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    logger.error(`获取内容失败: ${error.message}`)
    return {
      success: false,
      error: `获取内容失败: ${error.message}`
    }
  }
})
