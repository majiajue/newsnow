/**
 * 删除内容API
 * 提供内容删除功能，会删除所有相关版本
 */

import { defineEventHandler, readBody } from "h3"
import { logger } from "../../../utils/logger"
import { deleteContent } from "../../../utils/contentManager"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id } = body

    if (!id) {
      return {
        success: false,
        error: "缺少必要参数: id"
      }
    }

    logger.info(`删除内容: ${id}`)
    
    // 删除内容
    const result = await deleteContent(id)
    
    return {
      success: true,
      data: result,
      message: "内容删除成功"
    }
  } catch (error: any) {
    logger.error(`删除内容失败: ${error.message}`)
    return {
      success: false,
      error: `删除内容失败: ${error.message}`
    }
  }
})
