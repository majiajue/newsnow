/**
 * 更新内容API
 * 提供内容更新功能
 */

import { defineEventHandler, readBody } from "h3"
import { logger } from "../../../utils/logger"
import { updateContent } from "../../../utils/contentManager"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id, title, content, source, sourceUrl, author, publishDate, categories, tags, status } = body

    if (!id) {
      return {
        success: false,
        error: "缺少必要参数: id"
      }
    }

    logger.info(`更新内容: ${id}`)
    
    // 更新内容
    const result = await updateContent(id, {
      title,
      content,
      source,
      sourceUrl,
      author,
      publishDate: publishDate ? new Date(publishDate) : undefined,
      categories,
      tags,
      status
    })
    
    return {
      success: true,
      data: result,
      message: "内容更新成功"
    }
  } catch (error: any) {
    logger.error(`更新内容失败: ${error.message}`)
    return {
      success: false,
      error: `更新内容失败: ${error.message}`
    }
  }
})
