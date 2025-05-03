/**
 * 内容质量评估API
 * 提供自动化的内容质量评估功能
 */

import { defineEventHandler, readBody } from "h3"
import { logger } from "../../utils/logger"
import { assessContentQuality } from "../../utils/contentQuality"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { content, title, url } = body

    if (!content) {
      return {
        success: false,
        error: "缺少必要参数: content"
      }
    }

    logger.info(`开始评估内容质量${title ? `: ${title}` : ''}${url ? ` (${url})` : ''}`)
    
    // 评估内容质量
    const qualityResult = assessContentQuality(content)
    
    // 如果评估成功，添加额外信息
    if (qualityResult.success) {
      return {
        ...qualityResult,
        title,
        url,
        timestamp: Date.now()
      }
    }
    
    return qualityResult
  } catch (error: any) {
    logger.error(`内容质量评估API处理错误: ${error.message}`)
    return {
      success: false,
      error: `处理请求时出错: ${error.message}`
    }
  }
})
