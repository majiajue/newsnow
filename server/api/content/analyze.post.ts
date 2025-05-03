/**
 * 内容分析API
 * 提供全面的内容分析功能
 */

import { defineEventHandler, readBody } from "h3"
import { logger } from "../../utils/logger"
import { analyzeContent } from "../../utils/contentAnalyzer"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { content, title, options } = body

    if (!content) {
      return {
        success: false,
        error: "缺少必要参数: content"
      }
    }

    logger.info(`开始分析内容${title ? `: ${title}` : ''}`)
    
    // 分析内容
    const result = await analyzeContent(content, {
      title,
      ...options
    })
    
    // 如果分析成功，添加额外信息
    if (result.success) {
      return {
        ...result,
        timestamp: Date.now()
      }
    }
    
    return result
  } catch (error: any) {
    logger.error(`内容分析API处理错误: ${error.message}`)
    return {
      success: false,
      error: `处理请求时出错: ${error.message}`
    }
  }
})
