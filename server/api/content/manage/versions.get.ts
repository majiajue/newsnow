/**
 * 获取内容版本列表API
 * 提供获取内容所有版本的功能
 */

import { defineEventHandler, getQuery } from "h3"
import { logger } from "../../../utils/logger"
import { getContentVersions } from "../../../utils/contentManager"

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

    logger.info(`获取内容版本列表: ${id}`)
    
    // 获取内容版本列表
    const result = await getContentVersions(id)
    
    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    logger.error(`获取内容版本列表失败: ${error.message}`)
    return {
      success: false,
      error: `获取内容版本列表失败: ${error.message}`
    }
  }
})
