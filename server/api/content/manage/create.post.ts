/**
 * 创建内容API
 * 提供内容创建功能，支持内容分析和自动分类
 */

import { defineEventHandler, readBody } from "h3"
import { logger } from "../../../utils/logger"
import { analyzeAndSaveContent } from "../../../utils/contentManager"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { title, content, source, sourceUrl, author, publishDate, categories, tags, status } = body

    if (!title || !content) {
      return {
        success: false,
        error: "缺少必要参数: title, content"
      }
    }

    logger.info(`创建内容: ${title}`)
    
    // 分析并保存内容
    const result = await analyzeAndSaveContent({
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
      message: "内容创建成功"
    }
  } catch (error: any) {
    logger.error(`创建内容失败: ${error.message}`)
    return {
      success: false,
      error: `创建内容失败: ${error.message}`
    }
  }
})
