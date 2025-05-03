/**
 * 获取所有分类API
 * 提供获取系统中所有内容分类的功能
 */

import { defineEventHandler } from "h3"
import { logger } from "../../../utils/logger"
import { getAllCategories } from "../../../utils/contentManager"

export default defineEventHandler(async (event) => {
  try {
    logger.info('获取所有分类')
    
    // 添加超时控制机制，防止请求无限等待
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("获取分类请求超时")), 10000) // 10秒超时
    })
    
    // 实际获取操作
    const categoriesPromise = getAllCategories()
    
    // 使用Promise.race实现请求竞争
    const categories = await Promise.race([categoriesPromise, timeoutPromise]) as string[]
    
    return {
      success: true,
      data: categories
    }
  } catch (error: any) {
    logger.error(`获取所有分类失败: ${error.message}`)
    return {
      success: false,
      error: `获取所有分类失败: ${error.message}`
    }
  }
})
