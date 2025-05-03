/**
 * 创建内容版本API
 * 提供创建内容新版本的功能
 */

import { defineEventHandler, readBody } from "h3"
import { logger } from "../../../utils/logger"
import { createContentVersion } from "../../../utils/contentManager"

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

    logger.info(`创建内容新版本: ${id}`)
    
    // 创建内容新版本
    const result = await createContentVersion(id, {
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
      message: "内容新版本创建成功"
    }
  } catch (error: any) {
    logger.error(`创建内容新版本失败: ${error.message}`)
    return {
      success: false,
      error: `创建内容新版本失败: ${error.message}`
    }
  }
})
